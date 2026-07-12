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
      <div class="brandbar">${PEAK_SVG}<span>登山届 — 北大院 情報理工学コース 専用ロードマップ</span></div>
      <div class="permit-card">
        <div class="permit-head">
          <div class="permit-title">${isEditing ? '入力・条件を編集する' : '北大院合格への最短ルートを。'}</div>
          <div class="permit-sub">${isEditing
            ? '入力内容を更新して、ロードマップを再生成します。<br>完了済みのタスクは可能な限り引き継がれます。'
            : '北海道大学 大学院情報科学研究院 情報理工学コースの院試に特化したロードマップを作成します。<br>選択予定の科目と、今のあなたの状態を教えてください。'}</div>
        </div>
        <div class="permit-body">
          
          <div class="row2">
            <div class="field">
              <label>目標点数・順位 <span class="opt">任意</span></label>
              <input id="f-target" type="text" placeholder="例：専門で8割確保" value="${esc(f.target)}"/>
            </div>
            <div class="field">
              <label>試験日 <span class="req">必須</span></label>
              <input id="f-examdate" type="date" value="${esc(f.examDate)}"/>
            </div>
          </div>

          <div class="field">
            <label>専門科目1 <span class="req">必須</span></label>
            <div class="checkbox-group">
              <label><input type="checkbox" checked disabled> 基礎数学 (必須)</label>
              <label><input type="checkbox" checked disabled> 情報数学 (必須)</label>
            </div>
            <div class="hint-small" style="margin-top:8px;">以下から1科目選択してください</div>
            <div class="checkbox-group">
              <label><input type="checkbox" class="sub1-checkbox" value="確率・統計" ${f.subject1Elective === '確率・統計' ? 'checked' : ''}> 確率・統計</label>
              <label><input type="checkbox" class="sub1-checkbox" value="情報理論" ${f.subject1Elective === '情報理論' ? 'checked' : ''}> 情報理論</label>
            </div>
          </div>

          <div class="field">
            <label>専門科目2 <span class="req">2科目必須</span></label>
            <div class="hint-small" style="margin-bottom:8px;">以下から2科目選択してください</div>
            <div class="checkbox-group sub2-group">
              ${['アルゴリズムとデータ構造', '人工知能', 'コンピュータシステム', '応用数学'].map(sub => `
                <label>
                  <input type="checkbox" class="sub2-checkbox" value="${sub}" ${(f.subject2 || []).includes(sub) ? 'checked' : ''}> ${sub}
                </label>
              `).join('')}
            </div>
          </div>

          <div class="field">
            <label>過去問の傾向・特徴 <span class="opt">任意</span></label>
            <textarea id="f-pastexam" placeholder="例：アルゴリズムはグラフ理論が頻出、など">${esc(f.pastExam)}</textarea>
          </div>
          <div class="field">
            <label>作問者・研究室の情報 <span class="opt">任意</span></label>
            <textarea id="f-examiner" placeholder="例：〇〇研究室志望。教授の専門は機械学習 など">${esc(f.examiner)}</textarea>
          </div>
          <div class="field">
            <label>自由記述（現在の実力・得意不得意・使える時間など） <span class="opt">任意</span></label>
            <textarea id="f-freenote" placeholder="例：線形代数は得意だが、確率・統計を忘れている。平日は3時間勉強できる など">${esc(f.freeNote)}</textarea>
          </div>

          <details class="advanced-section" ${f.customInstructions ? 'open' : ''}>
            <summary>🎛 AIへの追加指示（プロンプト調整）<span class="opt">任意</span></summary>
            <div class="advanced-body">
              <div class="hint-small" style="margin-bottom:8px;">AIの動作をカスタマイズできます。ここに書いた内容は最優先で反映されます。</div>
              <textarea id="f-custom" placeholder="例：過去5年分の過去問演習を毎フェーズに入れて / 週1回は休息日を設けて">${esc(f.customInstructions || '')}</textarea>
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
            <span class="hint-small">情報を整理し、AIが学習タスクを分割します</span>
          </div>
          ${state.error ? `<div class="error-box">${esc(state.error)}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-generate').addEventListener('click', actions.onSubmit);
  const cancelBtn = document.getElementById('btn-cancel-edit');
  if(cancelBtn) cancelBtn.addEventListener('click', actions.onCancelEdit);
  
  // -----------------------------------------------------
  // 【追加】専門科目1のバリデーション (最大1つまで)
  // -----------------------------------------------------
  const sub1Checkboxes = document.querySelectorAll('.sub1-checkbox');
  const updateSub1Validation = () => {
    const checkedCount = document.querySelectorAll('.sub1-checkbox:checked').length;
    sub1Checkboxes.forEach(box => {
      // 1つチェックされている場合、チェックされていないものを無効化
      if (checkedCount >= 1) {
        if (!box.checked) box.disabled = true;
      } else {
        box.disabled = false;
      }
    });
  };
  
  sub1Checkboxes.forEach(cb => cb.addEventListener('change', updateSub1Validation));
  updateSub1Validation(); 

  // -----------------------------------------------------
  // (既存の)専門科目2のバリデーション (最大2つまで) ...

  // -----------------------------------------------------
  // 【追加】専門科目2のバリデーション (最大2つまで)
  // -----------------------------------------------------
  const sub2Checkboxes = document.querySelectorAll('.sub2-checkbox');
  const updateSub2Validation = () => {
    const checkedCount = document.querySelectorAll('.sub2-checkbox:checked').length;
    sub2Checkboxes.forEach(box => {
      // 2つチェックされている場合、チェックされていないものを無効化
      if (checkedCount >= 2) {
        if (!box.checked) box.disabled = true;
      } else {
        box.disabled = false;
      }
    });
  };
  
  // イベントリスナーの設定と初期化
  sub2Checkboxes.forEach(cb => cb.addEventListener('change', updateSub2Validation));
  updateSub2Validation(); 
  // -----------------------------------------------------

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