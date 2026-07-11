// 共通ユーティリティ

export function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

export function todayStr(){
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(dateStr){
  if(!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export function daysBetween(fromStr, toStr){
  if(!fromStr || !toStr) return null;
  const a = new Date(fromStr + 'T00:00:00');
  const b = new Date(toStr + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function formatBytes(bytes){
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ---------- Toast ----------
export function showToast({ title, body, type = 'default', duration = 5000 }){
  const root = document.getElementById('toast-root');
  if(!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    ${title ? `<div class="toast-title">${esc(title)}</div>` : ''}
    <div>${esc(body || '')}</div>
  `;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}
