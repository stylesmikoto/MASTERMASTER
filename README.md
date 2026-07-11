# 院試ロードマップ (登山届)

大学院入試の学習ロードマップをAIが生成し、進捗を管理するアプリ。

## 実装機能一覧

### 進捗管理システム（ユーザ操作可能）
| 機能 | 実装場所 | 操作方法 |
|------|---------|---------|
| 入力・条件の編集 | 🖉 `📝 入力を編集して再生成` ボタン | 元の入力が復元された編集フォームで再生成。完了済みタスクは可能な限り引き継がれる |
| プロンプトの調整（追加指示） | フォーム内 `🎛 AIへの追加指示` セクション | 「数学に70%の時間を」等の指示を追記でき、`system prompt`に「最優先で反映」として渡される |
| Web情報の確認 | `🔍 Web情報を再確認` ボタン | Claudeが`web_search`ツールで公式サイトを再照会し、`confirmed / changed / unclear` の3段階で報告 |
| 参照ソース表示 | ロードマップ上部の`📎 Web参照情報` | 生成時に参照したURLと最終確認日を常時表示 |

### 進捗修正機能

**Case1: ユーザーが更新を望んだ場合**
- `✏️ タスクを編集` ボタンで編集モードON
- 各タスクに `✕` 削除ボタン、各フェーズ末尾に `+ タスクを追加` 入力欄
- Enterキーまたは追加ボタンで即反映・永続化

**Case2: 定期的な妥当性検証とシステム側からの提案**
- 想定進捗 (経過日数比) と実進捗の差が±5%を超える、または前回レビューから30日経過で
  ロードマップ画面上部に自動でバナー表示（`⚠️ 想定より X% 遅れています` 等）
- `再構築を検討` ボタン → 進捗レビュー画面 → `🔄 AIでロードマップを調整` で
  残り期間のフェーズを再構築（完了済みタスクは維持）

### 補助機能
- 参考資料のアップロード (PDF/画像・最大3件)
- リマインダー (毎日指定時刻のブラウザ通知 / トーストフォールバック)

## ファイル構成

```
inshi-roadmap/
├── index.html
├── css/styles.css
└── js/
    ├── main.js              起動・状態管理・全アクション
    ├── config.js            定数
    ├── utils.js             エスケープ / 日付 / トースト
    ├── storage.js           永続化 (window.storage / localStorage)
    ├── api.js               Claude API + プロンプト
    │                        - generateRoadmap    新規生成 (web_search有効)
    │                        - adjustRoadmap      Case2の再構築
    │                        - verifyInformation  Web情報の再検証
    ├── progress.js          進捗計算・診断
    │                        - computeExpectedProgress: 経過日数ベースの想定
    │                        - diagnose:             behind / on_track / ahead
    │                        - shouldSuggestReview:  自動バナー判定
    ├── uploads.js           ファイル→base64変換
    ├── reminders.js         Notification API + スケジューラ
    └── screens/
        ├── form.js          フォーム (新規/編集の2モード)
        ├── loading.js       各種ローディング
        ├── roadmap.js       ロードマップ (通常/編集モード)
        └── review.js        進捗レビュー
```

## 状態モデル

`state.roadmap`:
```js
{
  overview, sources: [url],
  university, target, examDate,
  createdAt, lastReviewedAt,
  verifiedAt, verifyFindings: [{item, status, note}],
  originalInputs: { ...form values, customInstructions },
  phases: [
    { name, period, goal,
      tasks: [{ id, text, done, userAdded? }] }
  ]
}
```

## 実行方法

ES modulesを使用しているため、ローカルサーバー経由で起動:

```bash
python3 -m http.server 8000
# または
npx serve .
```

`http://localhost:8000` を開いてください。

## Case1 と Case2 の使い分け

- **Case1 (タスク追加/削除)**: 気になる小さな調整。手動で即反映、APIコール不要
- **Case1 (入力編集)**: 状況が大きく変わった (試験日変更、目標変更、追加科目) 時
- **Case2 (AIで調整)**: 進捗が遅れていて全体戦略を再組立てしたい時
- **Web情報を再確認**: 大学院公式の情報更新を疑ったとき

## 注意事項

- ストレージキーは `roadmap_v3` / `roadmap_settings_v3`
- 添付ファイルは生成後にstateから消去され、保存されません
- 通知API使用にはHTTPSまたはlocalhost必須
