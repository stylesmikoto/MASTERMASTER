// 進捗レビュー画面

import { esc } from '../utils.js';
import { PEAK_SVG } from '../config.js';
import { diagnose, diagnosisText, computeProgress } from '../progress.js';

export function renderReview(app, state, actions){
  const rm = state.roadmap;
  const diag = diagnose(rm);
  const prog = computeProgress(rm);

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
