// エントリポイント: 状態管理 / ルーティング / アクション定義

import { STORAGE_KEY, SETTINGS_KEY } from './config.js';
import { loadJSON, saveJSON } from './storage.js';
import { showToast, todayStr } from './utils.js';
import { generateRoadmap, adjustRoadmap, verifyInformation } from './api.js';
import {
  scheduleReminder,
  checkStartupReminder,
  requestPermission
} from './reminders.js';

import { renderForm } from './screens/form.js';
import { renderLoading, renderInit } from './screens/loading.js';
import { renderRoadmap } from './screens/roadmap.js';
import { renderReview } from './screens/review.js';

const app = document.getElementById('app');

const state = {
  screen: 'loadingInit',
  form: {
    university: '', target: '', examDate: '', subjects: '',
    pastExam: '', examiner: '', freeNote: '',
    customInstructions: '',
    attachments: []
  },
  editingInputs: false,    // 既存ロードマップの入力を編集中か
  editMode: false,         // タスク編集モード
  roadmap: null,
  settings: {
    reminder: { enabled: false, time: '09:00', lastFiredDate: null }
  },
  error: null,
  openPhase: 0
};

// ---------- Router ----------

function render(){
  if(state.screen === 'loadingInit') return renderInit(app);
  if(state.screen === 'form') return renderForm(app, state, formActions);
  if(state.screen === 'generating') return renderLoading(app, {
    title: state.editingInputs ? 'ロードマップを再生成中…' : 'ルートを設計しています…',
    msg: 'Web検索と過去問資料を確認しながらフェーズを組み立て中です'
  });
  if(state.screen === 'adjusting') return renderLoading(app, {
    title: 'ロードマップを再構築しています…',
    msg: '現在の進捗をもとに残り期間のタスクを再構成しています'
  });
  if(state.screen === 'verifying') return renderLoading(app, {
    title: 'Web情報を確認しています…',
    msg: '公式サイトを参照して最新情報を照合中です'
  });
  if(state.screen === 'roadmap') return renderRoadmap(app, state, roadmapActions);
  if(state.screen === 'review') return renderReview(app, state, reviewActions);
}

async function persist(){
  await saveJSON(STORAGE_KEY, state.roadmap);
}
async function persistSettings(){
  await saveJSON(SETTINGS_KEY, state.settings);
}

function readFormValues(){
  state.form.university = document.getElementById('f-university').value.trim();
  state.form.target = document.getElementById('f-target').value.trim();
  state.form.examDate = document.getElementById('f-examdate').value;
  state.form.subjects = document.getElementById('f-subjects').value.trim();
  state.form.pastExam = document.getElementById('f-pastexam').value.trim();
  state.form.examiner = document.getElementById('f-examiner').value.trim();
  state.form.freeNote = document.getElementById('f-freenote').value.trim();
  const customEl = document.getElementById('f-custom');
  if(customEl) state.form.customInstructions = customEl.value.trim();
}

// 完了状態を保持したまま新しいロードマップにマージ
function mergeDoneState(newRoadmap, oldRoadmap){
  if(!oldRoadmap) return newRoadmap;
  const doneTexts = new Set();
  oldRoadmap.phases.forEach(p => p.tasks.forEach(t => { if(t.done) doneTexts.add(t.text); }));
  newRoadmap.phases = newRoadmap.phases.map(p => ({
    ...p,
    tasks: p.tasks.map(t => ({ ...t, done: doneTexts.has(t.text) }))
  }));
  return newRoadmap;
}

// ---------- Form Actions ----------

const formActions = {
  rerender: render,
  onSubmit: async () => {
    readFormValues();
    state.error = null;
    if(!state.form.university){ state.error = '志望大学院・専攻を入力してください。'; render(); return; }
    if(!state.form.examDate){ state.error = '試験日を入力してください。'; render(); return; }

    const wasEditing = state.editingInputs;
    const oldRoadmap = wasEditing ? state.roadmap : null;

    state.screen = 'generating';
    render();

    try {
      let roadmap = await generateRoadmap(state.form);
      // 入力編集からの再生成なら完了状態をマージ
      if(wasEditing && oldRoadmap){
        roadmap = mergeDoneState(roadmap, oldRoadmap);
      }
      state.roadmap = roadmap;
      state.screen = 'roadmap';
      state.openPhase = 0;
      state.editingInputs = false;
      state.form.attachments = [];
      await persist();
      render();
      if(wasEditing){
        showToast({ title: '再生成しました', body: '完了済みタスクは可能な限り引き継ぎました。', type: 'info' });
      }
    } catch(e){
      state.error = '作成に失敗しました。（' + (e?.message || 'エラー') + '）';
      state.screen = 'form';
      render();
    }
  },
  onCancelEdit: () => {
    state.editingInputs = false;
    state.error = null;
    state.screen = 'roadmap';
    // フォームをクリア
    state.form = {
      university: '', target: '', examDate: '', subjects: '',
      pastExam: '', examiner: '', freeNote: '',
      customInstructions: '', attachments: []
    };
    render();
  }
};

// ---------- Roadmap Actions ----------

const roadmapActions = {
  rerender: render,
  persist,
  onRestart: () => {
    if(!confirm('現在のロードマップを破棄して最初から作り直しますか？')) return;
    state.roadmap = null;
    state.editingInputs = false;
    state.editMode = false;
    state.form = {
      university: '', target: '', examDate: '', subjects: '',
      pastExam: '', examiner: '', freeNote: '',
      customInstructions: '', attachments: []
    };
    state.screen = 'form';
    state.error = null;
    render();
  },
  onOpenReview: () => {
    state.screen = 'review';
    state.error = null;
    render();
  },
  onToggleEditMode: () => {
    state.editMode = !state.editMode;
    render();
    if(state.editMode){
      showToast({ title: '編集モード', body: 'タスクの追加・削除ができます。', type: 'info', duration: 3000 });
    }
  },
  onEditInputs: () => {
    // 既存の入力を復元
    const orig = state.roadmap?.originalInputs || {};
    state.form = {
      university: orig.university || state.roadmap.university || '',
      target: orig.target || state.roadmap.target || '',
      examDate: orig.examDate || state.roadmap.examDate || '',
      subjects: orig.subjects || '',
      pastExam: orig.pastExam || '',
      examiner: orig.examiner || '',
      freeNote: orig.freeNote || '',
      customInstructions: orig.customInstructions || '',
      attachments: []
    };
    state.editingInputs = true;
    state.editMode = false;
    state.screen = 'form';
    state.error = null;
    render();
  },
  onVerifyInfo: async () => {
    state.screen = 'verifying';
    state.error = null;
    render();
    try {
      const result = await verifyInformation(state.roadmap);
      state.roadmap.verifiedAt = result.verified_at || todayStr();
      state.roadmap.verifyFindings = result.findings || [];
      // ソースを更新（見つかったものを追加）
      if(result.sources && result.sources.length){
        const existing = new Set(state.roadmap.sources || []);
        result.sources.forEach(s => existing.add(s));
        state.roadmap.sources = Array.from(existing);
      }
      await persist();
      state.screen = 'roadmap';
      render();
      const changed = (result.findings || []).filter(f => f.status === 'changed').length;
      showToast({
        title: 'Web情報の確認が完了',
        body: changed > 0 ? `${changed}件の変更を検出しました` : (result.summary || '大きな変更はありません'),
        type: changed > 0 ? 'warn' : 'info',
        duration: 8000
      });
    } catch(e){
      state.screen = 'roadmap';
      render();
      showToast({ title: '再確認に失敗しました', body: e?.message || 'エラー', type: 'warn' });
    }
  },
  onDeleteTask: async (phaseIdx, taskId) => {
    const phase = state.roadmap.phases[phaseIdx];
    if(!phase) return;
    phase.tasks = phase.tasks.filter(t => t.id !== taskId);
    await persist();
    render();
  },
  onAddTask: async (phaseIdx, text) => {
    const phase = state.roadmap.phases[phaseIdx];
    if(!phase) return;
    const id = `p${phaseIdx}-t${phase.tasks.length}-${Date.now().toString(36)}`;
    phase.tasks.push({ id, text, done: false, userAdded: true });
    await persist();
    render();
    showToast({ title: 'タスクを追加しました', body: text, type: 'info', duration: 2500 });
  },
  onReminderChange: async ({ enabled, time }) => {
    if(enabled && (!state.settings.reminder.enabled || state.settings.reminder.time !== time)){
      const perm = await requestPermission();
      if(perm === 'denied'){
        showToast({ title: 'ブラウザ通知が拒否されています', body: 'トーストで代替します。', type: 'warn' });
      }
    }
    state.settings.reminder.enabled = enabled;
    state.settings.reminder.time = time;
    await persistSettings();
    scheduleReminder(state.roadmap, state.settings);
    showToast({
      title: enabled ? 'リマインダーを設定しました' : 'リマインダーをオフにしました',
      body: enabled ? `毎日 ${time} に通知します` : '',
      type: 'info', duration: 3000
    });
  },
  onReminderTest: async () => {
    const perm = await requestPermission();
    const tasks = state.roadmap.phases
      .flatMap(p => p.tasks.filter(t => !t.done).map(t => t.text))
      .slice(0, 3);
    const body = tasks.length ? '今日のタスク:\n' + tasks.map((t, i) => `${i + 1}. ${t}`).join('\n') : '今日のタスクは完了済みです。';
    if(perm === 'granted' && typeof Notification !== 'undefined'){
      new Notification('院試ロードマップ - テスト通知', { body });
    } else {
      showToast({ title: 'テスト通知', body, type: 'info', duration: 7000 });
    }
  }
};

// ---------- Review Actions ----------

const reviewActions = {
  rerender: render,
  onBackToRoadmap: () => {
    state.screen = 'roadmap';
    state.error = null;
    render();
  },
  onMarkReviewed: async () => {
    state.roadmap.lastReviewedAt = todayStr();
    await persist();
    state.screen = 'roadmap';
    render();
    showToast({ title: 'レビュー済みとして記録しました', body: '', type: 'info', duration: 2500 });
  },
  onAdjust: async (diag) => {
    state.screen = 'adjusting';
    state.error = null;
    render();
    try {
      const adjusted = await adjustRoadmap(state.roadmap, diag);
      state.roadmap = adjusted;
      await persist();
      state.screen = 'roadmap';
      state.openPhase = 0;
      render();
      showToast({ title: 'ロードマップを再構築しました', body: '残り期間に合わせてタスクを再構成しました。', type: 'info' });
    } catch(e){
      state.error = '再構築に失敗しました。（' + (e?.message || 'エラー') + '）';
      state.screen = 'review';
      render();
    }
  }
};

// ---------- 起動 ----------

async function init(){
  try {
    const [rm, settings] = await Promise.all([
      loadJSON(STORAGE_KEY),
      loadJSON(SETTINGS_KEY)
    ]);
    if(rm){
      state.roadmap = rm;
      state.screen = 'roadmap';
    } else {
      state.screen = 'form';
    }
    if(settings){
      state.settings = { ...state.settings, ...settings };
      state.settings.reminder = { enabled: false, time: '09:00', lastFiredDate: null, ...(settings.reminder || {}) };
    }
  } catch(e){
    state.screen = 'form';
  }

  render();

  if(state.roadmap){
    const fired = checkStartupReminder(state.roadmap, state.settings);
    if(fired) await persistSettings();
    scheduleReminder(state.roadmap, state.settings);
  }
}

init();
