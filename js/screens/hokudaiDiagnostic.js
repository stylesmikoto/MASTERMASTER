// 北海道大学 情報理工学コース向けの単元選択・診断テスト・結果画面

import { esc } from '../utils.js';
import { PEAK_SVG } from '../config.js';
import {
  HOKUDAI_UNIT_GROUPS,
  buildHokudaiSelectionSummary,
  getHokudaiExamUnits,
  getHokudaiUnitById,
  validateHokudaiUnitSelection
} from '../features/hokudaiUnits.js';
import {
  buildHokudaiDiagnosticTest,
  scoreHokudaiDiagnosticTest
} from '../features/hokudaiDiagnosticTest.js';
import {
  buildHokudaiRadarChartData,
  drawHokudaiRadarChart
} from '../features/hokudaiRadarChart.js';

export function renderHokudaiUnitSelection(app, state, actions){
  const selected = new Set(state.hokudai.selectedUnitIds || []);
  const validation = validateHokudaiUnitSelection([...selected]);

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>北大 情報理工学コース診断</span></div>
      <div class="permit-card">
        <div class="permit-head">
          <div class="permit-title">受験する単元を選ぶ</div>
          <div class="permit-sub">
            専門科目1の必須単元に加えて、選択単元と専門科目2で対策する単元を選びます。
          </div>
        </div>
        <div class="permit-body">
          <div class="hokudai-stepbar">
            <span class="active">1 単元選択</span>
            <span>2 診断テスト</span>
            <span>3 結果</span>
          </div>

          ${HOKUDAI_UNIT_GROUPS.map(group => renderUnitGroup(group, selected)).join('')}

          ${validation.warnings.map(w => `<div class="hokudai-warning">${esc(w)}</div>`).join('')}
          ${state.error ? `<div class="error-box">${esc(state.error)}</div>` : ''}

          <div class="submit-row">
            <button class="btn-primary" id="btn-start-hokudai-test">診断テストを始める</button>
            <button class="btn-secondary-light" id="btn-back-form">フォームに戻る</button>
            <span class="hint-small">選択した各単元から3問ずつ出題します</span>
          </div>
        </div>
      </div>
    </div>
  `;

  app.querySelectorAll('[data-unit-toggle]').forEach(input => {
    input.addEventListener('change', () => {
      const unitId = input.getAttribute('data-unit-toggle');
      const mode = input.getAttribute('data-mode');
      actions.onToggleUnit(unitId, input.checked, mode);
    });
  });
  document.getElementById('btn-start-hokudai-test').addEventListener('click', actions.onStartTest);
  document.getElementById('btn-back-form').addEventListener('click', actions.onBackToForm);
}

export function renderHokudaiDiagnosticTestScreen(app, state, actions){
  const test = state.hokudai.test || buildHokudaiDiagnosticTest(state.hokudai.selectedUnitIds);
  const answers = state.hokudai.answers || {};
  const answeredCount = test.questions.filter(q => answers[q.id]).length;

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>北大 情報理工学コース診断</span></div>
      <div class="review-screen">
        <div class="hokudai-stepbar">
          <span>1 単元選択</span>
          <span class="active">2 診断テスト</span>
          <span>3 結果</span>
        </div>
        <div class="review-h">${esc(test.title)}</div>
        <div class="review-sub">${answeredCount} / ${test.totalQuestions} 問回答済み。APIは使わず、この画面内で採点します。</div>

        <div class="hokudai-question-list">
          ${test.questions.map((question, index) => renderQuestion(question, index, answers[question.id])).join('')}
        </div>

        ${state.error ? `<div class="error-box">${esc(state.error)}</div>` : ''}

        <div class="review-actions">
          <button class="btn-primary-light" id="btn-score-hokudai-test">採点して結果を見る</button>
          <button class="btn-secondary-light" id="btn-back-units">単元選択に戻る</button>
        </div>
      </div>
    </div>
  `;

  app.querySelectorAll('[data-answer]').forEach(input => {
    input.addEventListener('change', () => {
      actions.onAnswer(input.getAttribute('data-question'), input.value);
    });
  });
  document.getElementById('btn-score-hokudai-test').addEventListener('click', actions.onScoreTest);
  document.getElementById('btn-back-units').addEventListener('click', actions.onBackToUnits);
}

export function renderHokudaiDiagnosticResult(app, state, actions){
  const result = state.hokudai.result;
  const test = state.hokudai.test;
  const chartData = buildHokudaiRadarChartData(result?.unitResults || []);
  const focusHtml = (result?.focusAreas || []).map(area => `
    <div class="hokudai-focus-item">
      <strong>${esc(area.label)}</strong>
      <span>${area.scorePct}%</span>
      <p>${esc(area.suggestion)}</p>
    </div>
  `).join('');

  app.innerHTML = `
    <div class="shell">
      <div class="brandbar">${PEAK_SVG}<span>北大 情報理工学コース診断</span></div>
      <div class="review-screen">
        <div class="hokudai-stepbar">
          <span>1 単元選択</span>
          <span>2 診断テスト</span>
          <span class="active">3 結果</span>
        </div>
        <div class="review-h">習熟度の可視化</div>
        <div class="review-sub">
          総合 ${result.correct} / ${result.total} 問正解、${result.scorePct}%。
          判定は「${esc(result.mastery.label)}」です。
        </div>

        <div class="hokudai-result-layout">
          <div class="hokudai-radar-wrap">
            <canvas id="hokudai-radar" aria-label="単元別習熟度レーダーチャート"></canvas>
          </div>
          <div class="hokudai-score-list">
            ${result.unitResults.map(unit => `
              <div class="hokudai-score-row">
                <div>
                  <strong>${esc(unit.label)}</strong>
                  <span>${esc(unit.mastery.label)} - ${unit.correct}/${unit.total}問</span>
                </div>
                <b>${unit.scorePct}%</b>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="hokudai-focus">
          <div class="hokudai-section-title">優先して補強する単元</div>
          ${focusHtml}
        </div>

        <details class="hokudai-answer-review">
          <summary>解答と解説を見る</summary>
          ${test.questions.map(q => renderAnswerReview(q, state.hokudai.answers[q.id])).join('')}
        </details>

        <div class="review-actions">
          <button class="btn-primary-light" id="btn-apply-hokudai-result">結果をロードマップ入力に反映</button>
          <button class="btn-secondary-light" id="btn-retake-hokudai-test">もう一度テストする</button>
          <button class="btn-secondary-light" id="btn-back-form">フォームに戻る</button>
        </div>
      </div>
    </div>
  `;

  drawHokudaiRadarChart(document.getElementById('hokudai-radar'), chartData, {
    size: Math.min(360, Math.max(280, app.clientWidth - 80)),
    fillColor: 'rgba(110, 140, 92, 0.24)',
    strokeColor: '#4F6942',
    pointColor: '#B8811F',
    labelColor: '#1C2B3A'
  });

  document.getElementById('btn-apply-hokudai-result').addEventListener('click', actions.onApplyToForm);
  document.getElementById('btn-retake-hokudai-test').addEventListener('click', actions.onRetake);
  document.getElementById('btn-back-form').addEventListener('click', actions.onBackToForm);
}

export function createHokudaiDiagnosticState(selectedUnitIds){
  const test = buildHokudaiDiagnosticTest(selectedUnitIds, { questionsPerUnit: 3 });
  return {
    test,
    answers: Object.fromEntries(test.questions.map(question => [question.id, null])),
    result: null
  };
}

export function buildHokudaiDiagnosticFormPatch(hokudaiState, currentForm){
  const summary = buildHokudaiSelectionSummary(hokudaiState.selectedUnitIds);
  const result = hokudaiState.result;
  const unitLines = result.unitResults
    .map(unit => `- ${unit.label}: ${unit.scorePct}%（${unit.mastery.label}、${unit.correct}/${unit.total}問）`)
    .join('\n');
  const focusLines = result.focusAreas
    .map(area => `- ${area.label}: ${area.suggestion}`)
    .join('\n');

  const diagnosticNote = [
    '【北大情報理工学コース診断結果】',
    `総合: ${result.scorePct}%（${result.correct}/${result.total}問正解、${result.mastery.label}）`,
    `選択単元: ${summary.labels.join('、')}`,
    '単元別:',
    unitLines,
    '優先補強:',
    focusLines
  ].join('\n');

  const presetSubjects = '専門科目1（基礎数学・情報数学を含む3問選択）/ 専門科目2 / 英語スコア提出 / 口述試験';
  const pastExam = summary.sources.join('\n');
  const priorNote = currentForm.freeNote ? `${currentForm.freeNote}\n\n` : '';
  const priorCustom = currentForm.customInstructions ? `${currentForm.customInstructions}\n\n` : '';

  return {
    university: '北海道大学大学院情報科学院 情報科学専攻 情報理工学コース',
    subjects: presetSubjects,
    pastExam,
    freeNote: `${priorNote}${diagnosticNote}`,
    customInstructions: `${priorCustom}北大情報理工学コース向けに、上記の診断結果で低かった単元を優先して学習ロードマップへ反映してください。`
  };
}

function renderUnitGroup(group, selected){
  const mode = group.id === 'subject1_choice' ? 'single' : 'multi';
  const units = getHokudaiExamUnits({ groupId: group.id });
  return `
    <section class="hokudai-unit-group">
      <div class="hokudai-section-title">${esc(group.label)}</div>
      <div class="review-sub">${esc(group.description)}</div>
      <div class="hokudai-unit-grid">
        ${units.map(unit => {
          const checked = selected.has(unit.id);
          const disabled = unit.required ? 'disabled' : '';
          return `
            <label class="hokudai-unit-card ${checked ? 'selected' : ''} ${unit.required ? 'required' : ''}">
              <input
                type="${mode === 'single' ? 'radio' : 'checkbox'}"
                name="${esc(group.id)}"
                data-unit-toggle="${esc(unit.id)}"
                data-mode="${mode}"
                ${checked ? 'checked' : ''}
                ${disabled}
              />
              <span>
                <strong>${esc(unit.label)}</strong>
                <small>${esc(unit.description)}</small>
              </span>
            </label>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderQuestion(question, index, selectedAnswer){
  const unit = getHokudaiUnitById(question.unitId);
  return `
    <section class="hokudai-question">
      <div class="hokudai-question-meta">Q${index + 1} / ${esc(unit?.label || question.unitId)}</div>
      <div class="hokudai-question-prompt">${esc(question.prompt)}</div>
      <div class="hokudai-options">
        ${question.options.map(option => `
          <label class="hokudai-option ${selectedAnswer === option.id ? 'selected' : ''}">
            <input
              type="radio"
              name="${esc(question.id)}"
              value="${esc(option.id)}"
              data-question="${esc(question.id)}"
              data-answer
              ${selectedAnswer === option.id ? 'checked' : ''}
            />
            <span>${esc(option.text)}</span>
          </label>
        `).join('')}
      </div>
    </section>
  `;
}

function renderAnswerReview(question, selectedAnswer){
  const unit = getHokudaiUnitById(question.unitId);
  const selected = question.options.find(option => option.id === selectedAnswer);
  const answer = question.options.find(option => option.id === question.answer);
  const correct = selectedAnswer === question.answer;
  return `
    <div class="hokudai-answer-row ${correct ? 'correct' : 'wrong'}">
      <div><strong>${esc(unit?.label || question.unitId)}</strong> ${esc(question.prompt)}</div>
      <div>あなたの解答: ${esc(selected?.text || '未回答')}</div>
      <div>正答: ${esc(answer?.text || '')}</div>
      <p>${esc(question.explanation)}</p>
    </div>
  `;
}
