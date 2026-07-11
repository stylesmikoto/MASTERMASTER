// ファイルアップロード処理

import { MAX_UPLOAD_SIZE_MB, MAX_UPLOAD_FILES, ACCEPTED_FILE_TYPES } from './config.js';

export function validateFile(file){
  if(!ACCEPTED_FILE_TYPES.includes(file.type)){
    return `対応していない形式です: ${file.name}（PDF/PNG/JPEG/WEBPのみ）`;
  }
  if(file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024){
    return `ファイルサイズが上限 ${MAX_UPLOAD_SIZE_MB}MB を超えています: ${file.name}`;
  }
  return null;
}

// File -> { name, mediaType, size, base64 }
export function readFileAsBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // dataURL -> base64本体のみ抜き出し
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1] || '';
      resolve({
        name: file.name,
        mediaType: file.type,
        size: file.size,
        base64
      });
    };
    reader.onerror = () => reject(new Error(`読み込み失敗: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// 複数ファイルを検証・変換
export async function processFiles(fileList, currentAttachments = []){
  const errors = [];
  const added = [];

  for(const file of fileList){
    if(currentAttachments.length + added.length >= MAX_UPLOAD_FILES){
      errors.push(`アップロード可能なファイル数の上限（${MAX_UPLOAD_FILES}件）を超えるため、以降はスキップしました。`);
      break;
    }
    const err = validateFile(file);
    if(err){ errors.push(err); continue; }
    try {
      const att = await readFileAsBase64(file);
      added.push(att);
    } catch(e){
      errors.push(e.message);
    }
  }

  return { added, errors };
}
