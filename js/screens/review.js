// 進捗レビュー画面

import { esc } from '../utils.js';
import { PEAK_SVG } from '../config.js';
import { diagnose, diagnosisText, computeProgress, computeSubjectProgress } from '../progress.js';

export function renderReview(app, state, actions){
  const rm = state.roadmap;
  const diag = diagnose(rm);
  const prog = computeProgress(rm);
  const subjectProgress = computeSubjectProgress(rm);
  const slowestSubject = [...subjectProgress].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0] || null;

  const diagCls = diag.status === 'behind' ? 'behind' : diag.status === 'ahead' ? 'ahead' : '';

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>進捗レビュー</span></div>
      <div class="review-screen">
        <div class="review-h">📊 現状の分析</div>
        <div class="review-sub">これまでの進捗を、想定ペースと比較します。必要ならAIがロードマップを調整します。</div>

        <div class="review-grid">
          <div class="review-tile">
            <div class="rt-k">実際の進捗</div>
            <div class="rt-v">${prog.pct}%</div>
            <div class="rt-sub">${prog.done} / ${prog.total} タスク完了</div>
          </div>
          <div class="review-tile">
            <div class="rt-k">想定進捗</div>
            <div class="rt-v">${diag.expectedPct != null ? diag.expectedPct + '%' : '—'}</div>
            <div class="rt-sub">試験日まで残り ${diag.daysLeft ?? '—'} 日</div>
          </div>
          <div class="review-tile">
            <div class="rt-k">差分</div>
            <div class="rt-v" style="color:${diag.status === 'behind' ? 'var(--clay)' : diag.status === 'ahead' ? 'var(--moss-deep)' : 'var(--ink)'};">
              ${diag.delta > 0 ? '+' : ''}${diag.delta}%
            </div>
            <div class="rt-sub">${diag.status === 'behind' ? '遅れ気味' : diag.status === 'ahead' ? '先行中' : '順調'}</div>
          </div>
          <div class="review-tile">
            <div class="rt-k">前回レビュー</div>
            <div class="rt-v" style="font-size:16px;">${esc(rm.lastReviewedAt || '未実施')}</div>
            <div class="rt-sub">${rm.createdAt ? '作成: ' + esc(rm.createdAt) : ''}</div>
          </div>
        </div>

        <div class="review-diagnosis ${diagCls}">
          ${esc(diagnosisText(diag))}
        </div>

        ${subjectProgress.length ? `
          <div style="margin-top:18px; padding:16px; border:1px solid #dbeafe; background:#f8fbff; border-radius:12px;">
            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; color:#2563eb; margin-bottom:8px;">SUBJECT PROGRESS</div>
            ${slowestSubject ? `
              <div style="margin-bottom:12px; padding:10px 12px; border:1px solid #fecaca; background:#fff7ed; border-radius:10px;">
                <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; color:#c2410c; margin-bottom:4px;">最も遅れている科目</div>
                <div style="font-weight:800; color:#7c2d12;">${esc(slowestSubject.subject || '科目')} — ${slowestSubject.progress}%</div>
                <div style="font-size:12px; color:#9a2c0f; margin-top:2px;">${esc(slowestSubject.note || '')}</div>
              </div>
            ` : ''}
            ${subjectProgress.map(item => {
              const pct = Math.max(0, Math.min(100, Number(item?.progress) || 0));
              const accent = item.subject === slowestSubject?.subject ? '#f97316' : getSubjectColor(item.subject);
              const accentSoft = item.subject === slowestSubject?.subject ? '#fff7ed' : '#f9fafb';
              const border = item.subject === slowestSubject?.subject ? '#fdba74' : '#e5e7eb';
              return `
                <div style="margin-bottom:10px; padding:10px 12px; border:1px solid ${border}; background:${accentSoft}; border-radius:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
                    <div style="font-weight:700; color:var(--ink);">${esc(item.subject || '科目')}</div>
                    <div style="font-size:12px; color:var(--slate);">${pct}%</div>
                  </div>
                  <div style="height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${accent}; border-radius:999px;"></div>
                  </div>
                  ${item.note ? `<div style="font-size:11px; color:var(--slate); margin-top:2px;">${esc(item.note)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${rm.diagnosis ? `
          <div class="review-diagnosis">
            <strong>前回の調整メモ:</strong> ${esc(rm.diagnosis)}
          </div>
        ` : ''}

        <div class="review-actions">
          <button class="btn-primary-light" id="btn-adjust">🔄 AIでロードマップを調整</button>
          <button class="btn-secondary-light" id="btn-mark-reviewed">レビュー済みにして戻る</button>
          <button class="btn-secondary-light" id="btn-back">戻る</button>
        </div>

        ${state.error ? `<div class="error-box" style="margin-top:16px;">${esc(state.error)}</div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('btn-adjust').addEventListener('click', () => actions.onAdjust(diag));
  document.getElementById('btn-mark-reviewed').addEventListener('click', actions.onMarkReviewed);
  document.getElementById('btn-back').addEventListener('click', actions.onBackToRoadmap);
}

function getSubjectColor(subject){
  const name = String(subject || '').trim();
  const palette = [
    ['情報理論', 'linear-gradient(90deg, #2563eb, #3b82f6)'],
    ['アルゴリズムとデータ構造', 'linear-gradient(90deg, #7c3aed, #8b5cf6)'],
    ['基礎数学', 'linear-gradient(90deg, #0f766e, #14b8a6)'],
    ['情報数学', 'linear-gradient(90deg, #b45309, #f59e0b)'],
    ['確率・統計', 'linear-gradient(90deg, #be185d, #ec4899)'],
    ['人工知能', 'linear-gradient(90deg, #15803d, #22c55e)'],
    ['コンピュータシステム', 'linear-gradient(90deg, #1d4ed8, #60a5fa)'],
    ['応用数学', 'linear-gradient(90deg, #7f1d1d, #dc2626)']
  ];
  const match = palette.find(([key]) => name.includes(key));
  return match ? match[1] : 'linear-gradient(90deg, #4b5563, #6b7280)';
}
