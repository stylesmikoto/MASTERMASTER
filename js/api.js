// Gemini API 呼び出し / プロンプト

import { GEMINI_MODEL } from './config.js';
import { todayStr } from './utils.js';

const API_URL = '/api/gemini';
const ALLOWED_REFERENCE_URL = 'https://abigworld1.github.io/grad_exam.html';

// -------- プロンプト生成 --------

function buildUserContent(f){
  const base = `
【今日の日付】${todayStr()}
【志望大学院・専攻】${f.university}
【目標点数・順位】${f.target || '未記入'}
【試験日】${f.examDate}
【試験科目・形式】${f.subjects || '未記入'}
【過去問の傾向・特徴】${f.pastExam || '未記入'}
【作問者・研究室の情報】${f.examiner || '未記入'}
【自由記述】${f.freeNote || '未記入'}
`.trim();

  if(f.customInstructions && f.customInstructions.trim()){
    return `${base}

【ユーザからの追加指示 — これを最優先で反映してください】
${f.customInstructions.trim()}`;
  }
  return base;
}

// 新規作成用のシステムプロンプト。参照先を限定してトークン消費を抑える。
const SYSTEM_GENERATE = `あなたは大学院入試（院試）対策に精通した学習コーチです。学生から与えられた情報をもとに、今日から試験日までの現実的な学習ロードマップを作成してください。

【参照ルール】
- web_searchなどの広範なWeb検索は行わないこと。
- 参照してよい情報源は、ユーザーが入力・添付した過去問や資料、および次のサイトだけです: ${ALLOWED_REFERENCE_URL}
- 上記以外の大学公式サイト、募集要項、個人ブログ、検索結果、推測上のURLは参照しないこと。
- 指定サイトや添付資料から確認できない事項は、断定せず「入力情報からは不明」として扱うこと。
- sourcesには、ユーザーが入力した過去問URL、添付資料名、または ${ALLOWED_REFERENCE_URL} のみを含めること。

出力は必ず以下のJSON形式のみとし、前置きや後置きの文章、Markdownのコードブロック記号（\`\`\`）は一切含めないでください。JSON以外の文字を1文字も出力しないこと。
値が不明でも説明文をJSONの外に書かず、必ずJSON内の文字列として表現してください。
phasesは必ず1件以上含めてください。

{
  "overview": "全体の学習方針を2〜3文で要約した文章。入力資料と指定サイトの範囲で確認できる情報を反映する",
  "sources": ["参照した過去問URL・添付資料名・指定サイトURL（あれば）"],
  "phases": [
    {
      "name": "フェーズ名（例：基礎固め期）",
      "period": "期間の目安（例：7月中旬〜8月末）",
      "goal": "このフェーズで達成すべきことを1文で",
      "tasks": ["具体的なタスク1", "具体的なタスク2", "具体的なタスク3"]
    }
  ]
}

条件:
- フェーズは今日から試験日までを3〜6個程度に分割し、時系列順に並べる
- 各フェーズのタスクは3〜7個、具体的で今日から着手できる粒度にする
- 過去問の傾向・作問者の情報・目標点数があれば優先順位に反映する
- 苦手科目や使える時間などの自由記述があれば配分に反映する
- 最後のフェーズは試験直前期（総仕上げ・過去問演習・体調管理など）にする
- 添付資料（過去問PDF等）があれば内容を精読し、タスクに具体的に反映する
- 参照先を広げず、少ない根拠で過度に詳しい制度情報を作らない`;

// ロードマップ調整用のシステムプロンプト
const SYSTEM_ADJUST = `あなたは大学院入試（院試）対策に精通した学習コーチです。既存のロードマップと現在の進捗状況をもとに、残り期間のロードマップを再調整してください。

【入力される情報】
- 元のロードマップ（フェーズとタスク）
- 各タスクの完了状況（done: true/false）
- 現在の日付と試験日
- 想定進捗と実際の進捗の差

出力は必ず以下のJSON形式のみとし、前置きや後置きの文章、Markdownのコードブロック記号（\`\`\`）は一切含めないでください。

{
  "overview": "調整後の学習方針を2〜3文で要約",
  "diagnosis": "現状分析を2〜3文（何が遅れているか / 順調な点 / リスク）",
  "phases": [
    {
      "name": "フェーズ名",
      "period": "期間の目安",
      "goal": "このフェーズの到達目標",
      "tasks": ["タスク1", "タスク2"]
    }
  ]
}

条件:
- 既に完了したタスクは尊重し、繰り返させない
- 遅れている場合は残タスクを削って優先度の高いものに絞る
- 進んでいる場合は補強タスクや過去問演習を追加してもよい
- フェーズの期間は今日〜試験日で再割り当てする
- 過度に非現実的なペースを課さない`;

// -------- 添付ファイルをmessages contentに変換 --------

function attachmentsToBlocks(attachments){
  if(!attachments || !attachments.length) return [];
  return attachments.map(a => {
    if(a.mediaType === 'application/pdf'){
      return {
        type: 'document',
        source: { type: 'base64', media_type: a.mediaType, data: a.base64 }
      };
    }
    if(a.mediaType.startsWith('image/')){
      return {
        type: 'image',
        source: { type: 'base64', media_type: a.mediaType, data: a.base64 }
      };
    }
    return null;
  }).filter(Boolean);
}

// -------- ロードマップ生成（新規） --------

export async function generateRoadmap(form){
  const userContent = buildUserContent(form);
  const attachmentBlocks = attachmentsToBlocks(form.attachments);

  const messages = [{
    role: 'user',
    content: attachmentBlocks.length
      ? [...attachmentBlocks, { type: 'text', text: userContent }]
      : userContent
  }];

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 4000,
    system: SYSTEM_GENERATE,
    messages,
    tools: []
  };

  const parsed = await callAiAndParse(body);
  const phases = normalizePhases(parsed.phases);
  if(!phases.length){
    throw new Error('AIの応答にロードマップのphasesが含まれていませんでした。もう一度作成してください。');
  }

  return {
    overview: parsed.overview || '',
    sources: parsed.sources || [],
    university: form.university,
    target: form.target,
    examDate: form.examDate,
    createdAt: todayStr(),
    lastReviewedAt: todayStr(),
    // 再編集用に元の入力を保持（添付ファイルは除外）
    originalInputs: {
      university: form.university,
      target: form.target,
      examDate: form.examDate,
      subjects: form.subjects,
      pastExam: form.pastExam,
      examiner: form.examiner,
      freeNote: form.freeNote,
      customInstructions: form.customInstructions || ''
    },
    phases
  };
}

// -------- 参照情報の再確認 (参照先限定) --------

export async function verifyInformation(rm){
  const target = rm.university;
  const userContent = `以下の大学院入試について、入力済み情報と指定サイトの範囲だけで再確認してください。広範なWeb検索は行わないでください。
- 志望大学院・専攻: ${target}
- 記録されている試験日: ${rm.examDate}
- 記録されている試験科目: ${rm.originalInputs?.subjects || '未記入'}
- 記録されている研究室情報: ${rm.originalInputs?.examiner || '未記入'}
- 参照してよい指定サイト: ${ALLOWED_REFERENCE_URL}
- 記録されている参照URL: ${(rm.sources || []).join(', ') || 'なし'}

各項目について、入力済み情報・過去問URL・指定サイトの範囲で一致しているか確認してください。
確認できない項目は推測せず unclear にしてください。

出力は必ず以下のJSON形式のみ:

{
  "verified_at": "確認日 (YYYY-MM-DD)",
  "findings": [
    { "item": "確認した項目", "status": "confirmed" | "changed" | "unclear", "note": "確認結果や変更点" }
  ],
  "sources": ["参照URL1", "参照URL2"],
  "summary": "全体所見を2〜3文で"
}`;

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 2500,
    system: `あなたは大学院入試情報の確認エージェントです。web_searchなどの広範なWeb検索は行わず、ユーザー入力、記録済み参照URL、添付資料、指定サイト ${ALLOWED_REFERENCE_URL} の範囲だけで確認してください。指定範囲で確認できないものはunclearとし、推測で補完しないでください。sourcesには指定範囲内のURLだけを含めてください。`,
    messages: [{ role: 'user', content: userContent }],
    tools: []
  };

  return await callAiAndParse(body);
}

// -------- ロードマップ調整 --------

export async function adjustRoadmap(roadmap, diagnosis){
  // 既存タスク状態を含めて渡す
  const context = {
    university: roadmap.university,
    target: roadmap.target,
    examDate: roadmap.examDate,
    today: todayStr(),
    expectedPct: diagnosis.expectedPct,
    actualPct: diagnosis.actualPct,
    delta: diagnosis.delta,
    phases: roadmap.phases.map(p => ({
      name: p.name,
      period: p.period,
      goal: p.goal,
      tasks: p.tasks.map(t => ({ text: t.text, done: t.done }))
    }))
  };

  const userContent = `以下のJSONは現在のロードマップと進捗です。残り期間で無理なく合格ラインに到達できるよう調整してください。

${JSON.stringify(context, null, 2)}`;

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 4000,
    system: SYSTEM_ADJUST,
    messages: [{ role: 'user', content: userContent }]
  };

  const parsed = await callAiAndParse(body);

  // 完了済みタスクは可能な限り維持（テキスト一致で紐付け）
  const doneTexts = new Set();
  roadmap.phases.forEach(p => p.tasks.forEach(t => { if(t.done) doneTexts.add(t.text); }));

  const newPhases = normalizePhases(parsed.phases).map(p => ({
    ...p,
    tasks: p.tasks.map(t => ({ ...t, done: doneTexts.has(t.text) }))
  }));

  return {
    ...roadmap,
    overview: parsed.overview || roadmap.overview,
    diagnosis: parsed.diagnosis || '',
    phases: newPhases,
    lastReviewedAt: todayStr()
  };
}

// -------- 内部ヘルパー --------

async function callAiAndParse(body){
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e){
    throw new Error('API proxy is not reachable. Start the local server with GEMINI_API_KEY set.');
  }

  if(!response.ok){
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = formatApiError(errorBody);
    } catch(_) {
      detail = await response.text().catch(() => '');
    }
    throw new Error(`API call failed (${response.status})${detail ? ': ' + detail : ''}`);
  }

  const data = await response.json();
  // content配列からテキストのみ抽出（tool_use/tool_resultは無視）
  const textBlocks = (data.content || []).filter(b => b.type === 'text');
  if(!textBlocks.length) throw new Error('応答が空でした');

  const fullText = textBlocks.map(b => b.text).join('\n').trim();
  const raw = cleanJsonLikeText(fullText);

  try {
    return normalizeParsedResponse(JSON.parse(raw));
  } catch(e){
    const candidates = extractJsonCandidates(raw);
    for(const candidate of candidates){
      try {
        return normalizeParsedResponse(JSON.parse(candidate));
      } catch(_){
        // 次の候補を試す
      }
    }
    throw new Error('応答の解析に失敗しました。AIの返答がJSON形式ではありませんでした: ' + raw.slice(0, 160));
  }
}

function cleanJsonLikeText(text){
  return String(text || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
    .replace(/^json\s*/i, '')
    .trim();
}

function extractJsonCandidates(text){
  const candidates = [];
  addCandidateBetween(text, '{', '}', candidates);
  addCandidateBetween(text, '[', ']', candidates);
  return candidates;
}

function addCandidateBetween(text, open, close, candidates){
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if(start >= 0 && end > start){
    candidates.push(text.slice(start, end + 1));
  }
}

function normalizeParsedResponse(parsed){
  if(Array.isArray(parsed)){
    return { overview: '', sources: [], phases: parsed };
  }
  if(parsed?.roadmap && typeof parsed.roadmap === 'object'){
    return parsed.roadmap;
  }
  return parsed;
}

function formatApiError(errorBody){
  if(!errorBody) return '';
  if(typeof errorBody === 'string') return errorBody;
  if(typeof errorBody.message === 'string') return errorBody.message;
  if(errorBody.error){
    if(typeof errorBody.error === 'string') return errorBody.error;
    if(typeof errorBody.error.message === 'string') return errorBody.error.message;
    try { return JSON.stringify(errorBody.error); }
    catch(_) { return String(errorBody.error); }
  }
  try { return JSON.stringify(errorBody); }
  catch(_) { return String(errorBody); }
}

function normalizePhases(phases){
  return (phases || []).map((p, pi) => ({
    name: p.name || `フェーズ${pi + 1}`,
    period: p.period || '',
    goal: p.goal || '',
    tasks: (p.tasks || []).map((t, ti) => ({
      id: `p${pi}-t${ti}-${Date.now().toString(36)}`,
      text: typeof t === 'string' ? t : (t.text || ''),
      done: false
    }))
  }));
}
