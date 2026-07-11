// リマインダー機能
// - Notification APIを使ってブラウザ通知
// - 対応していない環境ではトースト表示にフォールバック
// - 設定は state.settings.reminder に保存

import { showToast } from './utils.js';
import { pickTodaysTasks } from './progress.js';

let reminderTimer = null;

export function isNotificationSupported(){
  return typeof Notification !== 'undefined';
}

export async function requestPermission(){
  if(!isNotificationSupported()) return 'unsupported';
  if(Notification.permission === 'granted') return 'granted';
  if(Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch(e){
    return 'denied';
  }
}

// "HH:MM" 形式の時刻から、次に発火すべきミリ秒までの遅延を計算
function millisUntilNext(hhmm){
  if(!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if(Number.isNaN(h) || Number.isNaN(m)) return null;
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if(target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

function fireReminder(rm){
  const tasks = pickTodaysTasks(rm, 3);
  const body = tasks.length
    ? '今日のおすすめタスク:\n' + tasks.map((t, i) => `${i + 1}. ${t.text}`).join('\n')
    : 'すべてのタスクが完了しています。次のフェーズに進みましょう。';

  if(isNotificationSupported() && Notification.permission === 'granted'){
    try {
      new Notification('院試ロードマップ - 今日の一歩', {
        body,
        icon: undefined
      });
      return;
    } catch(e){ /* fallthrough to toast */ }
  }

  // フォールバック: トースト
  showToast({
    title: '今日の一歩',
    body,
    type: 'info',
    duration: 10000
  });
}

// スケジュール開始（既存のタイマーはクリア）
export function scheduleReminder(rm, settings){
  clearReminder();
  if(!settings || !settings.reminder || !settings.reminder.enabled || !settings.reminder.time) return;

  const delay = millisUntilNext(settings.reminder.time);
  if(delay == null) return;

  reminderTimer = setTimeout(function tick(){
    fireReminder(rm);
    // 翌日以降も同じ時刻に発火
    reminderTimer = setTimeout(tick, 24 * 60 * 60 * 1000);
  }, delay);
}

export function clearReminder(){
  if(reminderTimer){
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}

// 前回起動から時間が経っている場合、起動時にトーストで気づかせる
export function checkStartupReminder(rm, settings){
  if(!settings || !settings.reminder || !settings.reminder.enabled) return;
  const now = new Date();
  const [h, m] = (settings.reminder.time || '09:00').split(':').map(Number);
  // 今日のリマインド時刻を過ぎているか
  const targetToday = new Date();
  targetToday.setHours(h, m, 0, 0);

  // lastFiredDate と比較
  const lastFired = settings.reminder.lastFiredDate;
  const todayStrNow = now.toISOString().slice(0, 10);
  if(now >= targetToday && lastFired !== todayStrNow){
    fireReminder(rm);
    settings.reminder.lastFiredDate = todayStrNow;
    // 呼び出し側で settings を保存する想定
    return true;
  }
  return false;
}
