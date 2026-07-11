// ローディング画面

import { PEAK_SVG } from '../config.js';

export function renderLoading(app, opts = {}){
  const title = opts.title || 'ルートを設計しています…';
  const msg = opts.msg || '試験日から逆算して、フェーズとタスクに分割中です';
  app.innerHTML = `
    <div class="loading-wrap">
      ${PEAK_SVG.replace('width="22" height="22"','width="46" height="46"')}
      <div class="loading-title">${title}</div>
      <div class="loading-msg">${msg}</div>
      <div class="spinner"></div>
    </div>
  `;
}

export function renderInit(app){
  app.innerHTML = `<div class="loading-wrap"><div class="loading-title">読み込み中…</div><div class="spinner"></div></div>`;
}
