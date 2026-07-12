using System.Net;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();

var app = builder.Build();
var root = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, ".."));
var staticFiles = new PhysicalFileProvider(root);

app.MapPost("/api/gemini", async (
    HttpRequest request,
    IHttpClientFactory httpClientFactory,
    CancellationToken cancellationToken) =>
{
    try
    {
        var body = await new StreamReader(request.Body).ReadToEndAsync(cancellationToken);
        return await CallGemini(body, httpClientFactory, cancellationToken);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { error = $"Local proxy failed: {ex.Message}" },
            statusCode: StatusCodes.Status500InternalServerError);
    }
});

static async Task<IResult> CallGemini(
    string body,
    IHttpClientFactory httpClientFactory,
    CancellationToken cancellationToken)
{
    var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim()
        ?? Environment.GetEnvironmentVariable("GOOGLE_API_KEY")?.Trim();
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        return Results.Json(
            new { error = "GEMINI_API_KEY is not set. Create a key in Google AI Studio and set it before starting the local server." },
            statusCode: StatusCodes.Status500InternalServerError);
    }

    var keyError = ValidateGeminiApiKey(apiKey);
    if (keyError is not null)
    {
        return Results.Json(new { error = keyError }, statusCode: StatusCodes.Status400BadRequest);
    }

    var referenceText = await FetchReferenceTextAsync(httpClientFactory, cancellationToken);

    JsonObject geminiBody;
    IReadOnlyList<string> models;
    try
    {
        (models, geminiBody) = ConvertRoadmapRequestToGemini(body, referenceText);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { error = $"Could not convert request for Gemini: {ex.Message}" },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var client = httpClientFactory.CreateClient();
    var requestBody = geminiBody.ToJsonString();
    string? lastErrorBody = null;
    int lastStatusCode = 0;

    foreach (var model in models)
    {
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";
            using var outbound = new HttpRequestMessage(HttpMethod.Post, url);
            outbound.Content = new StringContent(requestBody);
            outbound.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            using var response = await client.SendAsync(outbound, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var text = ExtractGeminiText(responseBody);
                return Results.Json(new
                {
                    content = new[] { new { type = "text", text } }
                });
            }

            lastStatusCode = (int)response.StatusCode;
            lastErrorBody = responseBody;

            if ((int)response.StatusCode is not (503 or 429)) break;
            await Task.Delay(TimeSpan.FromSeconds(attempt * 2), cancellationToken);
        }
    }

    if (string.IsNullOrWhiteSpace(lastErrorBody))
    {
        return Results.Json(
            new { error = $"Gemini returned HTTP {lastStatusCode} with an empty response body after retries." },
            statusCode: lastStatusCode == 0 ? StatusCodes.Status503ServiceUnavailable : lastStatusCode);
    }

    return Results.Content(lastErrorBody, "application/json", statusCode: lastStatusCode);
}

static string? ValidateGeminiApiKey(string apiKey)
{
    if (apiKey.Any(ch => ch > 127))
    {
        return "GEMINI_API_KEY contains non-ASCII characters. Replace the placeholder with a real key from Google AI Studio.";
    }

    return null;
}

const string ReferenceUrl = "https://abigworld1.github.io/grad_exam.html";

static (IReadOnlyList<string> models, JsonObject request) ConvertRoadmapRequestToGemini(string body, string? referenceText)
{
    var source = JsonNode.Parse(body)?.AsObject()
        ?? throw new InvalidOperationException("request body is not JSON");

    var parts = new JsonArray();
    var messages = source["messages"]?.AsArray()
        ?? throw new InvalidOperationException("messages is missing");

    foreach (var messageNode in messages)
    {
        var message = messageNode?.AsObject()
            ?? throw new InvalidOperationException("message item is not an object");
        AddContentParts(parts, message["content"]);
    }

    var request = new JsonObject
    {
        ["contents"] = new JsonArray
        {
            new JsonObject
            {
                ["role"] = "user",
                ["parts"] = parts
            }
        }
    };

    var systemParts = new JsonArray();

    var system = source["system"]?.GetValue<string>();
    if (!string.IsNullOrWhiteSpace(system))
    {
        systemParts.Add(new JsonObject { ["text"] = system });
    }

    if (!string.IsNullOrWhiteSpace(referenceText))
    {
        systemParts.Add(new JsonObject
        {
            ["text"] = $"【必ず参照すべき外部資料 ({ReferenceUrl}) の内容】\n{referenceText}"
        });
    }

    if (systemParts.Count > 0)
    {
        request["systemInstruction"] = new JsonObject { ["parts"] = systemParts };
    }

    var generationConfig = new JsonObject
    {
        ["responseMimeType"] = "application/json"
    };

    if (TryReadInt(source, "max_output_tokens", out var maxOutputTokens)
        || TryReadInt(source, "max_tokens", out maxOutputTokens))
    {
        generationConfig["maxOutputTokens"] = maxOutputTokens;
    }

    request["generationConfig"] = generationConfig;

    var models = ResolveGeminiModels(source);
    return (models, request);
}

static void AddContentParts(JsonArray parts, JsonNode? content)
{
    if (content is null) return;

    if (content is JsonValue value && value.TryGetValue<string>(out var text))
    {
        parts.Add(new JsonObject { ["text"] = text });
        return;
    }

    foreach (var blockNode in content.AsArray())
    {
        var block = blockNode?.AsObject();
        var type = block?["type"]?.GetValue<string>();

        if (type == "text")
        {
            parts.Add(new JsonObject { ["text"] = block?["text"]?.GetValue<string>() ?? "" });
        }
        else if (type is "image" or "document")
        {
            var source = block?["source"]?.AsObject();
            var mediaType = source?["media_type"]?.GetValue<string>() ?? "application/octet-stream";
            var data = source?["data"]?.GetValue<string>() ?? "";
            parts.Add(new JsonObject
            {
                ["inline_data"] = new JsonObject
                {
                    ["mime_type"] = mediaType,
                    ["data"] = data
                }
            });
        }
    }
}

static IReadOnlyList<string> ResolveGeminiModels(JsonObject source)
{
    var configured = new List<string>();

    var envModel = Environment.GetEnvironmentVariable("GEMINI_MODEL");
    if (!string.IsNullOrWhiteSpace(envModel)) configured.Add(envModel.Trim());

    var envFallbacks = Environment.GetEnvironmentVariable("GEMINI_FALLBACK_MODELS");
    if (!string.IsNullOrWhiteSpace(envFallbacks))
    {
        configured.AddRange(envFallbacks
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    var requestModel = source["model"]?.GetValue<string>();
    if (!string.IsNullOrWhiteSpace(requestModel)) configured.Add(requestModel.Trim());

    configured.Add("gemini-3.1-flash-lite");
    configured.Add("gemini-3.5-flash");

    return configured.Distinct(StringComparer.Ordinal).ToArray();
}

static bool TryReadInt(JsonObject source, string name, out int value)
{
    value = 0;
    return source[name] is JsonValue node && node.TryGetValue<int>(out value);
}

static async Task<string?> FetchReferenceTextAsync(IHttpClientFactory httpClientFactory, CancellationToken cancellationToken)
{
    try
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);
        var html = await client.GetStringAsync(ReferenceUrl, cancellationToken);
        var text = StripHtml(html);
        const int maxLength = 20000;
        return text.Length > maxLength ? text[..maxLength] : text;
    }
    catch
    {
        // 参照ページが取得できなくても本来のロードマップ生成は継続する
        return null;
    }
}

static string StripHtml(string html)
{
    var noScripts = Regex.Replace(html, "<script[^>]*>[\\s\\S]*?</script>", " ", RegexOptions.IgnoreCase);
    var noStyles = Regex.Replace(noScripts, "<style[^>]*>[\\s\\S]*?</style>", " ", RegexOptions.IgnoreCase);
    var noTags = Regex.Replace(noStyles, "<[^>]+>", " ");
    var decoded = WebUtility.HtmlDecode(noTags);
    return Regex.Replace(decoded, "\\s+", " ").Trim();
}

static string ExtractGeminiText(string responseBody)
{
    var response = JsonNode.Parse(responseBody)?.AsObject();
    var parts = new List<string>();

    foreach (var candidate in response?["candidates"]?.AsArray() ?? [])
    {
        foreach (var part in candidate?["content"]?["parts"]?.AsArray() ?? [])
        {
            var text = part?["text"]?.GetValue<string>();
            if (!string.IsNullOrWhiteSpace(text)) parts.Add(text);
        }
    }

    return string.Join("\n", parts);
}

app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = staticFiles });
app.UseStaticFiles(new StaticFileOptions { FileProvider = staticFiles });

app.Run("http://127.0.0.1:8000");
