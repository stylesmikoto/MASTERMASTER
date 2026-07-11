// ストレージ抽象化。
// 優先順: window.storage（Anthropicアーティファクト環境） → localStorage（通常ブラウザ）
// 非同期APIに統一。

const hasWindowStorage = () =>
  typeof window !== 'undefined' &&
  window.storage &&
  typeof window.storage.get === 'function';

export async function loadJSON(key){
  try {
    if(hasWindowStorage()){
      const res = await window.storage.get(key, false);
      if(res && res.value){
        return JSON.parse(res.value);
      }
      return null;
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch(e){
    console.warn('[storage] load failed:', key, e);
    return null;
  }
}

export async function saveJSON(key, value){
  try {
    const json = JSON.stringify(value);
    if(hasWindowStorage()){
      await window.storage.set(key, json, false);
      return true;
    }
    localStorage.setItem(key, json);
    return true;
  } catch(e){
    console.warn('[storage] save failed:', key, e);
    return false;
  }
}

export async function removeKey(key){
  try {
    if(hasWindowStorage()){
      await window.storage.delete(key, false);
      return true;
    }
    localStorage.removeItem(key);
    return true;
  } catch(e){
    return false;
  }
}
