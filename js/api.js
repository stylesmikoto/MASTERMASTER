// Gemini API 呼び出し / プロンプト

import { GEMINI_MODEL } from './config.js';
import { todayStr } from './utils.js';

const API_URL = '/api/gemini';

const HOKUDAI_EXAM_REFERENCE = `
【対象】北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）
【方針】このプロンプトでは他大学を一切考慮しない。北大の公開情報だけを前提に、試験範囲・傾向・選択科目・学習順序を決める。

【公開ページから反映する要点】
- 試験は専門科目1と専門科目2で構成される
- 専門科目1は基礎数学、情報数学、確率・統計、情報理論の4問のうち、基礎数学と情報数学を含む3問を解答する
- 専門科目2はアルゴリズムとデータ構造、人工知能、コンピュータシステム、応用数学の4問のうち2問を選択して解答する
- 専門科目1と専門科目2はいずれも試験時間2時間である
- 選択科目の難易度差があるため、科目選択は事前に吟味する必要がある
- 10年分の過去問を解く価値が高く、2013年以前は最近の問題と大きく異なるため優先度が低い
- 2023年のコンピュータシステムと2015年のコンピュータ基礎工学、2022年の情報数学と2014年の情報数学のように、大問単位で類似や使い回しがある
- 基礎数学では、行列、固有値分解、線形部分空間、基底、集合の証明、停留点、極座標変換、マクローリン展開、逆三角関数、双曲線関数が重点として整理されている
- 情報数学では、正規言語、文脈自由言語、文脈依存文法、ポンピング定理、命題論理、述語論理、距離関数、同値関係が重点として整理されている
- 確率・統計では、一致性、不偏性、期待値、分散、共分散、独立と無相関、各種分布が重点として整理されている
- 情報理論では、エントロピー、相互情報量、条件付きエントロピー、通信路容量、(7,4)ハミング符号、巡回符号、正規マルコフ情報源のエントロピーが重点として整理されている
- アルゴリズムとデータ構造では、計算量、隣接リスト、全域木、グラフの種類、ユークリッドの互除法が重点として整理されている
- 人工知能では、Q学習とニューラルネットワークが重点として整理されている
- コンピュータシステムでは、補数表現、固定小数点方式と浮動小数点方式、キャッシュメモリ、IPアドレス、OSスケジューラ、ページング方式、C言語、ノイマン型コンピュータ、OSI参照モデル、DNSが重点として整理されている
- 選択科目は、難易度だけでなく、自分の研究関心と時間配分を踏まえて決める
`.trim();

// -------- プロンプト生成 --------

function buildUserContent(f){
  const base = `
【今日の日付】${todayStr()}
【目標点数・順位】${f.target || '未記入'}
【試験日】${f.examDate}
【試験科目・形式】${f.subjects || '未記入'}
【過去問の傾向・特徴】${f.pastExam || '未記入'}
【作問者・研究室の情報】${f.examiner || '未記入'}
【自由記述】${f.freeNote || '未記入'}
`.trim();

  const reference = HOKUDAI_EXAM_REFERENCE;

  if(f.customInstructions && f.customInstructions.trim()){
    return `${base}

${reference}

【ユーザからの追加指示 — これを最優先で反映してください】
${f.customInstructions.trim()}`;
  }
  return `${base}

${reference}`;
}

// 新規作成用のシステムプロンプト。Web検索の使用を明示的に指示。
const SYSTEM_GENERATE = `あなたは大学院入試（院試）対策に精通した学習コーチです。学生から与えられた情報をもとに、今日から試験日までの現実的な学習ロードマップを作成してください。

【重要】まず必要に応じてweb_searchツールを使い、以下を確認してから設計してください:
- 志望大学院・専攻の公式サイトや募集要項（試験科目・配点・過去問公開状況）
- 過去に公開されている過去問や対策情報
- 指定された研究室・作問者の研究分野
- ユーザーが提示した情報が古くないか、現在も有効か

検索は必須ではありませんが、大学名・研究室名が明示されている場合は原則1〜3回の検索で裏取りしてください。

出力は必ず以下のJSON形式のみとし、前置きや後置きの文章、Markdownのコードブロック記号（\`\`\`）は一切含めないでください。JSON以外の文字を1文字も出力しないこと。

{
  "overview": "全体の学習方針を2〜3文で要約した文章。Web検索で得た情報があればそれを反映する",
  "sources": ["参照した公式サイト等のURL（あれば）"],
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
- 添付資料（過去問PDF等）があれば内容を精読し、タスクに具体的に反映する`;

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
    phases: normalizePhases(parsed.phases)
  };
}

// -------- Web情報の再検証 (既存Webサイト・情報の確認) --------

export async function verifyInformation(rm){
  const userContent = `北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）について、最新の公式情報を確認してください。web_searchを使い、以下を調査してください:
- 記録されている試験日: ${rm.examDate}
- 記録されている試験科目: ${rm.originalInputs?.subjects || '未記入'}
- 記録されている研究室情報: ${rm.originalInputs?.examiner || '未記入'}

${HOKUDAI_EXAM_REFERENCE}

各項目について、現時点の公式情報と一致しているか、または更新があるかを確認してください。

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
    system: 'あなたは大学院入試情報の調査エージェントです。web_searchで公式サイトを確認し、事実ベースで報告してください。推測は避け、確認できないものはunclearとしてください。',
    messages: [{ role: 'user', content: userContent }],
    tools: []
  };

  return await callAiAndParse(body);
}

// -------- ロードマップ調整 --------

export async function adjustRoadmap(roadmap, diagnosis){
  // 既存タスク状態を含めて渡す
  const context = {
    university: '北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）',
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

  const userContent = `以下のJSONは北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）の現在のロードマップと進捗です。残り期間で無理なく合格ラインに到達できるよう調整してください。

${HOKUDAI_EXAM_REFERENCE}

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
  const raw = fullText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '');

  try {
    return JSON.parse(raw);
  } catch(e){
    // JSON前後にテキストが混ざっている場合、最初の { から最後の } を抽出
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if(start >= 0 && end > start){
      try { return JSON.parse(raw.slice(start, end + 1)); }
      catch(_){ /* fallthrough */ }
    }
    throw new Error('応答の解析に失敗しました');
  }
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
