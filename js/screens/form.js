// 入力フォーム画面
// - 新規作成モード: 空フォーム
// - 編集モード: 既存のロードマップの入力条件を編集して再生成

import { esc, formatBytes } from '../utils.js';
import { PEAK_SVG } from '../config.js';
import { processFiles } from '../uploads.js';

export function renderForm(app, state, actions){
  const f = state.form;
  const attachments = f.attachments || [];
  const isEditing = !!state.editingInputs;

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>登山届 — 院試ロードマップ</span></div>
      <div class="permit-card">
        <div class="permit-head">
          <div class="permit-title">${isEditing ? '入力・条件を編集する' : '大きな目標を、小さな一歩に。'}</div>
          <div class="permit-sub">${isEditing
            ? '入力内容を更新して、ロードマップを再生成します。<br>完了済みのタスクは可能な限り引き継がれます。'
            : '院試という山の"登山届"です。行き先とルート、今の自分の状態を教えてください。<br>AIが入力資料と指定サイトの範囲で情報を確認し、専用の合格までのロードマップを作成します。'}</div>
        </div>
        <div class="permit-body">
          ${!isEditing ? `
            <div class="hokudai-entry">
              <div>
                <div class="hokudai-entry-title">北海道大学 情報科学院 情報理工学コース向け</div>
                <div class="hokudai-entry-sub">受験単元を選び、各単元3問の診断テストで習熟度を確認できます。結果はロードマップ入力に反映できます。</div>
              </div>
              <button class="btn-primary-light" id="btn-hokudai-diagnostic">診断を始める</button>
            </div>
          ` : ''}

          <div class="field">
            <label>志望大学院・専攻 <span class="req">必須</span></label>
            <input id="f-university" type="text" placeholder="例：〇〇大学大学院 情報理工学系研究科" value="${esc(f.university)}"/>
          </div>
          <div class="row2">
            <div class="field">
              <label>目標点数・順位 <span class="opt">任意</span></label>
              <input id="f-target" type="text" placeholder="例：筆記8割、上位30%以内" value="${esc(f.target)}"/>
            </div>
            <div class="field">
              <label>試験日 <span class="req">必須</span></label>
              <input id="f-examdate" type="date" value="${esc(f.examDate)}"/>
            </div>
          </div>
          <div class="field">
            <label>試験科目・形式 <span class="opt">任意</span></label>
            <input id="f-subjects" type="text" placeholder="例：専門科目（数学・専門）、英語（TOEIC提出）、口述試験" value="${esc(f.subjects)}"/>
          </div>
          <div class="field">
            <label>過去問の傾向・特徴 <span class="opt">任意</span></label>
            <textarea id="f-pastexam" placeholder="例：毎年アルゴリズムと線形代数から出題、記述式が中心 など">${esc(f.pastExam)}</textarea>
          </div>
          <div class="field">
            <label>作問者・研究室の情報 <span class="opt">任意</span></label>
            <textarea id="f-examiner" placeholder="例：〇〇研究室の教授が出題担当、機械学習が専門 など">${esc(f.examiner)}</textarea>
          </div>
          <div class="field">
            <label>自由記述（現在の実力・得意不得意・使える時間など） <span class="opt">任意</span></label>
            <textarea id="f-freenote" placeholder="例：線形代数は得意、英語が苦手。平日は3時間、休日は8時間勉強できる など">${esc(f.freeNote)}</textarea>
          </div>

          <details class="advanced-section" ${f.customInstructions ? 'open' : ''}>
            <summary>🎛 AIへの追加指示（プロンプト調整）<span class="opt">任意</span></summary>
            <div class="advanced-body">
              <div class="hint-small" style="margin-bottom:8px;">AIの動作をカスタマイズできます。ここに書いた内容は最優先で反映されます。</div>
              <textarea id="f-custom" placeholder="例：数学に70%の時間を割いてほしい / 英語対策は含めなくてよい / 過去5年分の過去問演習を毎フェーズに入れて / 週1回は休息日を設けて">${esc(f.customInstructions || '')}</textarea>
            </div>
          </details>

          <div class="field" style="margin-top:20px;">
            <label>参考資料 <span class="opt">任意</span></label>
            <div class="upload-zone" id="upload-zone">
              <div class="up-title">クリックまたはドラッグ&ドロップでアップロード</div>
              <div class="up-hint">過去問・シラバス・募集要項など（PDF/PNG/JPEG、最大3件・各8MBまで）</div>
              <input type="file" id="f-files" multiple accept=".pdf,.png,.jpg,.jpeg,.webp"/>
            </div>
            <div class="file-list" id="file-list">
              ${attachments.map((a, i) => `
                <div class="file-chip">
                  <span class="fname">📄 ${esc(a.name)}</span>
                  <span class="fsize">${formatBytes(a.size)}</span>
                  <button class="fdel" data-remove="${i}" title="削除">✕</button>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="submit-row">
            <button class="btn-primary" id="btn-generate">${isEditing ? '再生成する →' : 'ロードマップを作成する →'}</button>
            ${isEditing ? '<button class="btn-secondary-light" id="btn-cancel-edit">キャンセル</button>' : ''}
            <span class="hint-small">入力資料と指定サイトをもとにAIがタスクを分割します</span>
          </div>
          ${state.error ? `<div class="error-box">${esc(state.error)}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-generate').addEventListener('click', actions.onSubmit);
  const hokudaiBtn = document.getElementById('btn-hokudai-diagnostic');
  if(hokudaiBtn) hokudaiBtn.addEventListener('click', actions.onStartHokudaiDiagnostic);
  const cancelBtn = document.getElementById('btn-cancel-edit');
  if(cancelBtn) cancelBtn.addEventListener('click', actions.onCancelEdit);

  // ファイル選択
  const fileInput = document.getElementById('f-files');
  const zone = document.getElementById('upload-zone');
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (ev) => {
    await handleFiles(ev.target.files, state, actions);
  });
  zone.addEventListener('dragover', (ev) => { ev.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', async (ev) => {
    ev.preventDefault();
    zone.classList.remove('dragging');
    await handleFiles(ev.dataTransfer.files, state, actions);
  });

  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-remove'), 10);
      state.form.attachments = (state.form.attachments || []).filter((_, i) => i !== idx);
      actions.rerender();
    });
  });
}

async function handleFiles(fileList, state, actions){
  if(!fileList || !fileList.length) return;
  const current = state.form.attachments || [];
  const { added, errors } = await processFiles(fileList, current);
  state.form.attachments = [...current, ...added];
  if(errors.length){
    state.error = errors.join(' / ');
  }
  actions.rerender();
}
