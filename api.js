// Claude API 呼び出し / プロンプト

import { CLAUDE_MODEL } from './config.js';
import { todayStr } from './utils.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

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
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: SYSTEM_GENERATE,
    messages,
    tools: [
      { type: 'web_search_20250305', name: 'web_search' }
    ]
  };

  const parsed = await callClaudeAndParse(body);

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
  const target = rm.university;
  const userContent = `以下の大学院入試について、最新の公式情報を確認してください。web_searchツールを2〜3回使い、以下を調査してください:
- 志望大学院・専攻: ${target}
- 記録されている試験日: ${rm.examDate}
- 記録されている試験科目: ${rm.originalInputs?.subjects || '未記入'}
- 記録されている研究室情報: ${rm.originalInputs?.examiner || '未記入'}

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
    model: CLAUDE_MODEL,
    max_tokens: 2500,
    system: 'あなたは大学院入試情報の調査エージェントです。web_searchで公式サイトを確認し、事実ベースで報告してください。推測は避け、確認できないものはunclearとしてください。',
    messages: [{ role: 'user', content: userContent }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }]
  };

  return await callClaudeAndParse(body);
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
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: SYSTEM_ADJUST,
    messages: [{ role: 'user', content: userContent }]
  };

  const parsed = await callClaudeAndParse(body);

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

async function callClaudeAndParse(body){
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if(!response.ok){
    throw new Error(`API呼び出しに失敗しました (${response.status})`);
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
