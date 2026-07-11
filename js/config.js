// 定数 / SVGアイコン / 設定
export const STORAGE_KEY = 'roadmap_v3';
export const SETTINGS_KEY = 'roadmap_settings_v3';

// 進捗レビュー閾値
export const REVIEW_THRESHOLD_PCT = 5;      // 想定進捗との差がこれ以上なら通知
export const REVIEW_INTERVAL_DAYS = 30;     // 定期レビュー間隔（1ヶ月）

// アップロード制限
export const MAX_UPLOAD_SIZE_MB = 8;
export const MAX_UPLOAD_FILES = 3;
export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

// Claude APIモデル
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export const PEAK_SVG = `<svg class="peak" viewBox="0 0 24 24" fill="none"><path d="M2 19L9 7L12.5 12.5L15 9L22 19H2Z" fill="#D9A441"/></svg>`;
export const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 12L9 17L20 6" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
