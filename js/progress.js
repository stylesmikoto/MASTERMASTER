// 進捗計算 & 診断ロジック

import { daysUntil, daysBetween, todayStr } from './utils.js';
import { REVIEW_THRESHOLD_PCT, REVIEW_INTERVAL_DAYS } from './config.js';

// 完了タスク数と進捗率
export function computeProgress(rm){
  let total = 0, done = 0;
  rm.phases.forEach(p => p.tasks.forEach(t => {
    total++; if(t.done) done++;
  }));
  return {
    total,
    done,
    pct: total ? Math.round((done / total) * 100) : 0
  };
}

// 想定進捗率 = 経過日数 / 全期間
export function computeExpectedProgress(rm){
  if(!rm.createdAt || !rm.examDate) return null;
  const total = daysBetween(rm.createdAt, rm.examDate);
  const elapsed = daysBetween(rm.createdAt, todayStr());
  if(total == null || total <= 0) return null;
  const pct = Math.round((elapsed / total) * 100);
  return Math.max(0, Math.min(100, pct));
}

// 診断: 想定進捗 vs 実進捗
// 戻り値: { expectedPct, actualPct, delta, status: 'behind'|'ahead'|'on_track', daysLeft }
export function diagnose(rm){
  const actual = computeProgress(rm).pct;
  const expected = computeExpectedProgress(rm);
  const daysLeft = daysUntil(rm.examDate);

  if(expected == null){
    return { expectedPct: null, actualPct: actual, delta: 0, status: 'on_track', daysLeft };
  }

  const delta = actual - expected; // 正なら先行、負なら遅れ
  let status = 'on_track';
  if(delta <= -REVIEW_THRESHOLD_PCT) status = 'behind';
  else if(delta >= REVIEW_THRESHOLD_PCT) status = 'ahead';

  return { expectedPct: expected, actualPct: actual, delta, status, daysLeft };
}

const SUBJECT_PATTERNS = [
  ['情報理論', /(情報理論|情報量|エントロピー|相互情報量|通信路|符号)/u],
  ['アルゴリズムとデータ構造', /(アルゴリズム|データ構造|グラフ|整列|探索|計算量|リスト|キュー|スタック|ヒープ|ハッシュ)/u],
  ['基礎数学', /(基礎数学|線形代数|微分積分|行列|極限|微分|積分|固有値)/u],
  ['情報数学', /(情報数学|論理|言語理論|オートマトン|集合|関係|写像|ブール)/u],
  ['確率・統計', /(確率|統計|分散|期待値|独立|標本分布|仮説検定)/u],
  ['人工知能', /(人工知能|機械学習|ニューラル|Q学習|探索と推論|ゲーム理論)/u],
  ['コンピュータシステム', /(コンピュータシステム|OS|ネットワーク|アーキテクチャ|ページング|キャッシュ|DNS|C言語|論理回路)/u],
  ['応用数学', /(応用数学|微分方程式|ベクトル解析|ラプラス|フーリエ|複素解析)/u]
];

function inferSubjectFromText(text){
  const normalized = String(text || '').trim();
  if(!normalized) return 'その他';
  for(const [subject, pattern] of SUBJECT_PATTERNS){
    if(pattern.test(normalized)) return subject;
  }
  return 'その他';
}

export function computeSubjectProgress(rm){
  const stats = new Map();
  const add = (subject, done) => {
    if(!subject || subject === 'その他') return;
    const current = stats.get(subject) || { subject, total: 0, done: 0 };
    current.total += 1;
    if(done) current.done += 1;
    stats.set(subject, current);
  };

  (rm?.phases || []).forEach(phase => {
    (phase.tasks || []).forEach(task => {
      const subject = String(task?.subject || '').trim() || inferSubjectFromText(task?.text || task);
      add(subject || 'その他', Boolean(task?.done));
    });
  });

  return Array.from(stats.values())
    .map(entry => ({
      subject: entry.subject,
      progress: entry.total ? Math.round((entry.done / entry.total) * 100) : 0,
      note: `${entry.done}/${entry.total} タスク完了`
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'ja'));
}

// レビューを提案すべきかどうか
// - 定期タイミング（前回レビューから REVIEW_INTERVAL_DAYS 経過）
// - または進捗差が閾値を超えている
export function shouldSuggestReview(rm){
  if(!rm) return false;
  const diag = diagnose(rm);
  if(diag.status !== 'on_track') return true;

  if(!rm.lastReviewedAt) return true;
  const sinceReview = daysBetween(rm.lastReviewedAt, todayStr());
  return sinceReview != null && sinceReview >= REVIEW_INTERVAL_DAYS;
}

// 診断メッセージ生成
export function diagnosisText(diag){
  if(diag.expectedPct == null){
    return `現在の達成率は ${diag.actualPct}% です。`;
  }
  const abs = Math.abs(diag.delta);
  if(diag.status === 'behind'){
    return `想定より約 ${abs}% 遅れています（想定 ${diag.expectedPct}% / 実際 ${diag.actualPct}%）。試験日まで残り ${diag.daysLeft ?? '—'} 日です。`;
  }
  if(diag.status === 'ahead'){
    return `想定より約 ${abs}% 先行しています（想定 ${diag.expectedPct}% / 実際 ${diag.actualPct}%）。余裕を活かして応用や過去問演習を強化する余地があります。`;
  }
  return `想定進捗に沿っています（想定 ${diag.expectedPct}% / 実際 ${diag.actualPct}%）。`;
}

// 今日おすすめの未完了タスク（各フェーズの先頭から少しずつ）
export function pickTodaysTasks(rm, max = 3){
  const undone = [];
  for(const p of rm.phases){
    for(const t of p.tasks){
      if(!t.done){
        undone.push({ phase: p.name, text: t.text });
        if(undone.length >= max) return undone;
      }
    }
  }
  return undone;
}
