// ロードマップ表示画面 (編集モード対応版)

import { esc, daysUntil } from '../utils.js';
import { PEAK_SVG, CHECK_SVG } from '../config.js';
import { computeProgress, diagnose, shouldSuggestReview } from '../progress.js';
import { isNotificationSupported } from '../reminders.js';

function pickTodayRecommendation(rm){
  if(!rm?.phases?.length) return null;

  for(const phase of rm.phases){
    const undoneTask = (phase.tasks || []).find(t => !t.done);
    if(undoneTask){
      return {
        text: undoneTask.text,
        phaseName: phase.name || 'フェーズ'
      };
    }
  }

  return null;
}

export function renderRoadmap(app, state, actions){
  const rm = state.roadmap;
  const prog = computeProgress(rm);
  const diag = diagnose(rm);
  const dleft = daysUntil(rm.examDate);
  const editMode = !!state.editMode;

  let firstUndonePhase = rm.phases.findIndex(p => p.tasks.some(t => !t.done));
  if(firstUndonePhase === -1) firstUndonePhase = rm.phases.length - 1;

  const phasesHtml = rm.phases.map((p, pi) => {
    const allDone = p.tasks.length > 0 && p.tasks.every(t => t.done);
    const isActive = pi === firstUndonePhase && !allDone;
    const isOpen = pi === state.openPhase || editMode;  // 編集モード中は全展開
    const doneCount = p.tasks.filter(t => t.done).length;

    const tasksHtml = p.tasks.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}" data-task="${esc(t.id)}" data-phase="${pi}">
        <div class="box">${CHECK_SVG}</div>
        <div class="txt">${esc(t.text)}</div>
        ${editMode ? `<button class="task-del" data-del-task="${esc(t.id)}" data-del-phase="${pi}" title="削除">✕</button>` : ''}
      </div>
    `).join('');

    const addTaskHtml = editMode ? `
      <div class="task-add">
        <input type="text" id="add-input-${pi}" placeholder="新しいタスクを入力してEnter" data-add-phase="${pi}"/>
        <button class="btn-mini" data-add-btn="${pi}">＋ 追加</button>
      </div>
    ` : '';

    return `
      <div class="checkpoint ${allDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}" data-phase-toggle="${pi}">
        <div class="cp-dot">${pi + 1}</div>
        <div class="phase-card">
          <div class="phase-top">
            <div class="phase-name">${esc(p.name)}</div>
            <div class="phase-period">${esc(p.period)}</div>
          </div>
          <div class="phase-goal">${esc(p.goal)}</div>
          <div class="phase-count">${doneCount} / ${p.tasks.length} タスク完了</div>
          <div class="task-list">${tasksHtml}${addTaskHtml}</div>
        </div>
      </div>
    `;
  }).join('');

  const suggestReview = shouldSuggestReview(rm) && !editMode;
  const reviewBannerHtml = suggestReview ? renderReviewBanner(diag) : '';
  const todayRecommendation = pickTodayRecommendation(rm);
  const todayRecommendationHtml = renderTodayRecommendation(todayRecommendation);
  const subjectProgressHtml = renderSubjectProgress(rm.subjectProgress);

  const reminderPanelHtml = editMode ? '' : renderReminderPanel(state.settings);
  const sourcesHtml = renderSourcesBlock(rm);
  const editModeBar = editMode ? renderEditModeBar() : '';

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>登山届 — 院試ロードマップ</span></div>

      ${editModeBar}

      <div class="rm-header">
        <div>
          <div class="eyebrow">YOUR ROUTE</div>
          <div class="rm-title">${esc(rm.university || '合格')}への道のり</div>
          <div class="rm-overview">${esc(rm.overview)}</div>
          ${sourcesHtml}
        </div>
      </div>

      <div class="rm-meta">
        <div class="meta-chip"><div class="k">試験日</div><div class="v">${esc(rm.examDate)}</div></div>
        <div class="meta-chip"><div class="k">残り日数</div><div class="v">${dleft !== null ? dleft + '日' : '—'}</div></div>
        <div class="meta-chip"><div class="k">進捗</div><div class="v">${prog.pct}%</div></div>
        <div class="meta-chip"><div class="k">達成タスク</div><div class="v">${prog.done}/${prog.total}</div></div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${prog.pct}%"></div>
        ${diag.expectedPct != null ? `<div class="progress-expected" style="left:${diag.expectedPct}%" title="想定進捗 ${diag.expectedPct}%"></div>` : ''}
      </div>

      ${reviewBannerHtml}
      ${todayRecommendationHtml}
      ${subjectProgressHtml}

      <div class="trail">
        <div class="trail-line"></div>
        ${phasesHtml}
        <div class="checkpoint summit">
          <div class="cp-dot">${PEAK_SVG.replace('width="22" height="22"','width="16" height="16"')}</div>
          <div style="color:var(--amber); font-family:'Shippori Mincho',serif; font-weight:700; font-size:15px;">合格 — Summit</div>
        </div>
      </div>

      ${reminderPanelHtml}

      <div class="rm-actions">
        ${editMode
          ? `<button class="btn-accent" id="btn-toggle-edit">✓ 編集を終了</button>`
          : `<button class="btn-ghost" id="btn-toggle-edit">✏️ タスクを編集</button>
             <button class="btn-ghost" id="btn-edit-inputs">📝 入力を編集して再生成</button>
             <button class="btn-ghost" id="btn-verify">🔍 参照情報を再確認</button>
             <button class="btn-ghost" id="btn-review">📊 進捗レビュー</button>
             <button class="btn-ghost" id="btn-restart">最初から作り直す</button>`}
      </div>
    </div>
  `;

  bindEvents(app, state, actions, rm);
}

function renderTodayRecommendation(rec){
  if(!rec) return '';
  return `
    <div style="margin:16px 0 8px; padding:14px 16px; border:1px solid #f2c66d; border-left:4px solid #f2c66d; background:#fff8e8; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; color:#8a4b00; margin-bottom:6px;">TODAY'S RECOMMENDATION</div>
      <div style="font-size:15px; font-weight:700; color:#1f2937;">今日やるなら：${esc(rec.text)}</div>
      <div style="font-size:12px; color:#4b5563; margin-top:4px;">おすすめの場所：${esc(rec.phaseName)}</div>
    </div>
  `;
}

function renderSubjectProgress(subjectProgress){
  if(!Array.isArray(subjectProgress) || !subjectProgress.length) return '';

  const items = subjectProgress.map(item => {
    const pct = Math.max(0, Math.min(100, Number(item?.progress) || 0));
    const note = item?.note ? `<div style="font-size:11px; color:var(--slate); margin-top:2px;">${esc(item.note)}</div>` : '';
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
          <div style="font-weight:700; color:var(--ink);">${esc(item.subject || '科目')}</div>
          <div style="font-size:12px; color:var(--slate);">${pct}%</div>
        </div>
        <div style="height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, #4f46e5, #7c3aed); border-radius:999px;"></div>
        </div>
        ${note}
      </div>
    `;
  }).join('');

  return `
    <div style="margin:16px 0 8px; padding:14px 16px; border:1px solid #dbeafe; background:#f8fbff; border-radius:12px;">
      <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; color:#2563eb; margin-bottom:8px;">SUBJECT PROGRESS</div>
      ${items}
    </div>
  `;
}

function renderEditModeBar(){
  return `
    <div class="edit-mode-bar">
      <div>
        <strong>✏️ 編集モード</strong>
        <span>タスクの追加・削除ができます。完了状態はチェックボックスで変更してください。</span>
      </div>
    </div>
  `;
}

function renderReviewBanner(diag){
  const cls = diag.status === 'behind' ? 'behind' : diag.status === 'ahead' ? 'ahead' : '';
  const emoji = diag.status === 'behind' ? '⚠️' : diag.status === 'ahead' ? '🚀' : '📅';
  const abs = Math.abs(diag.delta);
  let msg = '';
  if(diag.status === 'behind'){
    msg = `${emoji} 想定より <strong>${abs}%</strong> 遅れています。残り期間で無理なく合格ラインに届くようロードマップを再構築します。`;
  } else if(diag.status === 'ahead'){
    msg = `${emoji} 想定より <strong>${abs}%</strong> 先行しています！余力を活かして応用や過去問演習を追加できます。`;
  } else {
    msg = `${emoji} 前回のレビューから1ヶ月経ちました。現状に合わせてロードマップを再構築・提案します。`;
  }
  return `
    <div class="review-banner ${cls}">
      <div class="rb-text">${msg}</div>
      <div class="rb-actions">
        <button class="btn-accent" data-action="review">再構築を検討</button>
        <button class="btn-ghost" data-action="dismiss-review">後で</button>
      </div>
    </div>
  `;
}

function renderReminderPanel(settings){
  const s = settings?.reminder || { enabled: false, time: '09:00' };
  const supported = isNotificationSupported();
  return `
    <div class="reminder-panel">
      <h3>🔔 リマインダー</h3>
      <div class="reminder-row">
        <label class="toggle">
          <input type="checkbox" id="rem-enabled" ${s.enabled ? 'checked' : ''}/>
          <span>毎日リマインド</span>
        </label>
        <label>
          時刻:
          <input type="time" id="rem-time" value="${esc(s.time || '09:00')}"/>
        </label>
        <button class="btn-ghost" id="rem-test">テスト通知</button>
      </div>
      <div class="hint-small" style="color:var(--slate); margin-top:8px; font-size:11.5px;">
        ${supported
          ? 'ブラウザ通知の許可が必要です。初回オン時に許可を求められます。'
          : 'この環境ではブラウザ通知非対応のため、画面内トーストで通知します。'}
      </div>
    </div>
  `;
}

function renderSourcesBlock(rm){
  if(!rm.sources || !rm.sources.length){
    return `<div class="sources-block empty">参照情報なし</div>`;
  }
  const verifiedAt = rm.verifiedAt ? `<span class="verified-at">最終確認: ${esc(rm.verifiedAt)}</span>` : '';
  return `
    <div class="sources-block">
      <div class="sources-label">📎 参照情報 ${verifiedAt}</div>
      <ul class="sources-list">
        ${rm.sources.slice(0, 5).map(s => `
          <li><a href="${esc(s)}" target="_blank" rel="noopener">${esc(shortUrl(s))}</a></li>
        `).join('')}
      </ul>
      ${rm.verifyFindings ? renderFindings(rm.verifyFindings) : ''}
    </div>
  `;
}

function renderFindings(findings){
  if(!Array.isArray(findings) || !findings.length) return '';
  return `
    <div class="findings">
      <div class="findings-label">再確認の結果:</div>
      <ul>
        ${findings.map(f => {
          const icon = f.status === 'confirmed' ? '✅' : f.status === 'changed' ? '🔄' : '❓';
          return `<li>${icon} <strong>${esc(f.item)}</strong>: ${esc(f.note || '')}</li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function shortUrl(u){
  try { return new URL(u).hostname.replace(/^www\./, ''); }
  catch(_){ return u.slice(0, 30); }
}

function bindEvents(app, state, actions, rm){
  // フェーズ開閉 (編集モード外のみ)
  if(!state.editMode){
    app.querySelectorAll('[data-phase-toggle]').forEach(el => {
      el.addEventListener('click', (ev) => {
        if(ev.target.closest('.task-item')) return;
        if(ev.target.closest('.review-banner')) return;
        if(ev.target.closest('.task-add')) return;
        const idx = parseInt(el.getAttribute('data-phase-toggle'), 10);
        state.openPhase = (state.openPhase === idx) ? -1 : idx;
        actions.rerender();
      });
    });
  }

  // タスク完了トグル
  app.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('click', async (ev) => {
      // 削除ボタンや編集モードのXは別で処理
      if(ev.target.closest('[data-del-task]')) return;
      ev.stopPropagation();
      const phaseIdx = parseInt(el.getAttribute('data-phase'), 10);
      const taskId = el.getAttribute('data-task');
      const task = rm.phases[phaseIdx].tasks.find(t => t.id === taskId);
      if(task){
        task.done = !task.done;
        actions.rerender();
        await actions.persist();
      }
    });
  });

  // タスク削除
  app.querySelectorAll('[data-del-task]').forEach(el => {
    el.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const phaseIdx = parseInt(el.getAttribute('data-del-phase'), 10);
      const taskId = el.getAttribute('data-del-task');
      await actions.onDeleteTask(phaseIdx, taskId);
    });
  });

  // タスク追加
  app.querySelectorAll('[data-add-btn]').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const phaseIdx = parseInt(btn.getAttribute('data-add-btn'), 10);
      const input = document.getElementById(`add-input-${phaseIdx}`);
      const text = input.value.trim();
      if(text){
        await actions.onAddTask(phaseIdx, text);
      }
    });
  });
  app.querySelectorAll('[data-add-phase]').forEach(input => {
    input.addEventListener('keydown', async (ev) => {
      if(ev.key === 'Enter'){
        ev.preventDefault();
        const phaseIdx = parseInt(input.getAttribute('data-add-phase'), 10);
        const text = input.value.trim();
        if(text){
          await actions.onAddTask(phaseIdx, text);
        }
      }
    });
    input.addEventListener('click', (ev) => ev.stopPropagation());
  });

  // ヘッダー系ボタン
  const bind = (id, handler) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', handler);
  };
  bind('btn-toggle-edit', actions.onToggleEditMode);
  bind('btn-edit-inputs', actions.onEditInputs);
  bind('btn-verify', actions.onVerifyInfo);
  bind('btn-review', actions.onOpenReview);
  bind('btn-restart', actions.onRestart);

  // レビューバナー
  app.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const act = el.getAttribute('data-action');
      if(act === 'review'){
        actions.onOpenReview();
      } else if(act === 'dismiss-review'){
        rm.lastReviewedAt = new Date().toISOString().slice(0, 10);
        await actions.persist();
        actions.rerender();
      }
    });
  });

  // リマインダー
  const remEnabled = document.getElementById('rem-enabled');
  const remTime = document.getElementById('rem-time');
  const remTest = document.getElementById('rem-test');
  if(remEnabled) remEnabled.addEventListener('change', () => actions.onReminderChange({ enabled: remEnabled.checked, time: remTime.value }));
  if(remTime) remTime.addEventListener('change', () => actions.onReminderChange({ enabled: remEnabled.checked, time: remTime.value }));
  if(remTest) remTest.addEventListener('click', actions.onReminderTest);
}
