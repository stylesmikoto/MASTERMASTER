// Gemini API 呼び出し / プロンプト

import { GEMINI_MODEL } from './config.js';
import { todayStr } from './utils.js';

const API_URL = '/api/gemini';

const HOKUDAI_EXAM_REFERENCE = `
【対象】北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）
【方針】このプロンプトでは他大学を一切考慮しない。北大の公開情報だけを前提に、試験範囲・傾向・選択科目・学習順序を決める。

【公開ページから反映する要点】
- 試験は専門科目1と専門科目2で構成される
- 専門科目1は基礎数学、情報数学、確率・統計、情報理論の4問のうち、基礎数学と情報数学を含む3問を解答する
- 専門科目2はアルゴリズムとデータ構造、人工知能、コンピュータシステム、応用数学の4問のうち2問を選択して解答する
- 専門科目1と専門科目2はいずれも試験時間2時間である
- 選択科目の難易度差があるため、科目選択は事前に吟味する必要がある
- 10年分の過去問を解く価値が高く、2013年以前は最近の問題と大きく異なるため優先度が低い
- 2023年のコンピュータシステムと2015年のコンピュータ基礎工学、2022年の情報数学と2014年の情報数学のように、大問単位で類似や使い回しがある
- 基礎数学では、行列、固有値分解、線形部分空間、基底、集合の証明、停留点、極座標変換、マクローリン展開、逆三角関数、双曲線関数が重点として整理されている
- 情報数学では、正規言語、文脈自由言語、文脈依存文法、ポンピング定理、命題論理、述語論理、距離関数、同値関係が重点として整理されている
- 確率・統計では、一致性、不偏性、期待値、分散、共分散、独立と無相関、各種分布が重点として整理されている
- 情報理論では、エントロピー、相互情報量、条件付きエントロピー、通信路容量、(7,4)ハミング符号、巡回符号、正規マルコフ情報源のエントロピーが重点として整理されている
- アルゴリズムとデータ構造では、計算量、隣接リスト、全域木、グラフの種類、ユークリッドの互除法が重点として整理されている
- 人工知能では、Q学習とニューラルネットワークが重点として整理されている
- コンピュータシステムでは、補数表現、固定小数点方式と浮動小数点方式、キャッシュメモリ、IPアドレス、OSスケジューラ、ページング方式、C言語、ノイマン型コンピュータ、OSI参照モデル、DNSが重点として整理されている
- 選択科目は、難易度だけでなく、自分の研究関心と時間配分を踏まえて決める

【出題範囲（公式シラバス）】
■専門科目1
・基礎数学
　線形代数：行列、連立一次方程式、行列式、逆行列、ベクトル空間、線形写像、固有値、固有ベクトルなど
　微分積分：極限、微分、偏微分、テイラーの定理、積分、重積分、変数変換、常微分方程式など
・情報数学
　集合と関係、写像、命題論理、順列・組合せ、ブール代数、言語理論、オートマトン理論など
・（選択）確率・統計
　データの整理と記述、確率、確率変数と確率分布、標本分布、母数の推定、仮説検定など
・（選択）情報理論
　情報量、エントロピー、相互情報量、情報源、マルコフ情報源、情報源符号化、通信路、通信路符号化など
■専門科目2（4問のうち2問を選択して解答）
・アルゴリズムとデータ構造
　漸近的評価、時間・空間計算量、リスト、キュー、スタック、ヒープ、探索木、ハッシュ表、整列、探索、再帰、動的計画法、分割統治法、グラフアルゴリズムなど
・人工知能
　機械学習、データマイニング、ニューラルネットワーク、進化型計算、探索と推論、ヒューマン・マシンインタラクション、マルチエージェントシステム、ゲーム理論など
・コンピュータシステム
　コンピュータアーキテクチャ、オペレーティングシステム、コンピュータネットワーク、クラウドコンピューティング、論理回路、データ表現、C言語プログラミングなど
・応用数学
　ベクトル解析、微分方程式（多変数）、ラプラス変換、フーリエ解析、複素解析など

【分野別 出題傾向・重点単元（詳細メモ）】
このセクションは、各科目で実際に問題になりやすい単元・観点をまとめたものである。タスク生成・優先順位付けの際、該当科目のタスクはここに挙げた単元・観点を具体的に反映すること。

■情報理論
- 情報量やエントロピーの定義から、情報源・通信路符号化の理論的限界と具体的手法（ハフマン符号、ハミング符号等）を網羅している
- 情報源符号化分野では、瞬時符号の条件（クラフトの不等式）やハフマン符号による平均符号長の最小化プロセスに注視が必要である
- 情報源モデルでは、マルコフ情報源の状態遷移図および遷移確率行列から定常分布や情報源エントロピーを導出する計算問題が重要である
- 通信路符号化分野では、相互情報量を用いた通信路容量の算出や、ハミング符号・巡回符号における生成多項式とシンドロームを用いた誤り訂正法を重視すべきである
- 主要な問題内容は、エントロピー関数を用いた数値計算、ブロック符号化の効率評価、およびCRC方式による誤り検出の具体的手順の把握である

■アルゴリズムとデータ構造
- アルゴリズムの定義と計算量（O記法）を習得する
- スタック、キュー、連結リスト、二分探索木、ヒープ、ハッシュ表の各構造と操作を習得する
- 各種ソート（クイック、ヒープ等）の仕組みと最悪・平均時間計算量の評価方法を注視する
- グラフの探索（BFS/DFS）、最小全域木（クラスカル/プリム）、最短路（ダイクストラ）の解法を学ぶ
- 再帰的設計、データ構造の実装、および入力サイズに対する漸近的な時間計算量の解析を重点的に学習する

■コンピュータシステム
- CPU内部動作と命令セット: 機械語命令のフェッチから実行までのステップと、CISC/RISCの特性を理解する
- 並列処理とパイプライン: スループット向上のためのパイプライン設計、ハザード対策、SIMD/MIMDの分類を整理する
- メモリ階層とキャッシュ: 参照の局所性を利用したキャッシュの配置方式（直接、完全、部分連想）と書き込み法を比較する
- プロセス管理と同期: OSのスケジューリング（ラウンドロビン等）と、セマフォ等を用いた相互排除の仕組みを詳述する
- 仮想化と保護: 仮想メモリのページング機構（TLB、ページフォールト）と、特権モードによるカーネル保護を論じる
- 数値表現と計算誤差: IEEE754形式(32/64bit)の理解と、情報落ち・桁落ち等の誤差要因、および絶対・相対誤差限界の理論的評価

■情報数学
- 順列・組合せでは、重複組合せ（nHr）や二項定理を用いた数え上げの計算手順を習得する
- 基数変換、2の補数による減算、浮動小数点演算における丸め誤差・桁落ち・情報落ちなど、数値表現上の留意点を整理する
- 論理代数式の簡略化に加え、述語論理（∀・∃）を用いた命題の数式化と推論の妥当性評価の手法を身につける
- ド・モルガンの法則等の基本定理を用いた式変形・証明のパターンを反復して習得する

■応用数学
- 勾配ベクトル、線積分、微分方程式の挙動や完全微分形式の証明を含む解析学・微分方程式を整理する
- フーリエ級数展開の定義と具体的関数への適用、およびその結果を用いた級数の和の算出を習得する
- ラプラス方程式、ラプラス変換の導出と収束条件、複素べき級数の収束円と収束半径の決定を重点的に学習する

■人工知能
- ディープラーニング（CNN, RNN, LLM）の基本構造、歴史、および社会的背景（ハルシネーション、セキュリティ、倫理ガイドライン）を整理する
- ニューラルネットワークの数学的基礎（活性化関数の定義、誤差関数の偏微分と勾配降下法、過学習の発生原因と対策）を習得する
- 代表的な機械学習アルゴリズム（SVMのマージン最大化とカーネル法、K近傍法の計算特性、DQNなどの強化学習の定式化）を整理する

■基礎数学
- 線形代数（計算）: 行列の固有値・固有ベクトル、対角化（直交行列による同時対角化含む）、および行列の累乗計算とベクトルの一般項導出を習得する
- 線形代数（証明）: 関数空間や部分空間の判定、基底や線形独立性の証明、線形写像の行列表示、および内積に基づく関数の直交性の証明を習得する
- 解析学（微分）: 多変数関数の2次のテイラー展開やマクローリン展開、および偏微分方程式を用いた調和関数の証明を習得する
- 解析学（極値・解法）: 停留点の抽出と極大・極小・鞍点の判定、および定数係数をもつ高階微分方程式の一般解の導出を習得する
- 総合・記述: 行列を用いた図形の面積の収束判定や、関数空間における固有値問題など、定義に基づいた論理的な導出過程を正確に記述する

■確率・統計
- 確率分布の特性: 離散・連続型確率変数の累積分布・密度関数の特定、期待値・分散の導出、および全確率が1であることの証明を習得する
- 変数の変換と母関数: 対数変換等を含む変数変換による新たな分布の導出、および確率母関数を用いた統計的性質の計算を習得する
- 統計的推定の理論: 標本平均や標本統計量（不偏分散等）の不偏性に関する数学的証明と、正規分布に従う標本の理論的性質を理解する
- 仮説検定の体系: 有意水準、棄却域、検出力、最強力検定の定義を正確に把握し、具体的な検定統計量を用いた棄却域の導出を習得する
- モデルの応用と記述: 試行回数や期待値に基づくゲーム戦略の有利性判定など、事象を数理モデル化し導出過程を論理的に記述する力を養う
`.trim();

// -------- プロンプト生成 --------

function buildUserContent(f){
  const base = `
【今日の日付】${todayStr()}
【目標点数・順位】${f.target || '未記入'}
【試験日】${f.examDate}
【試験科目・形式】${f.subjects || '未記入'}
【過去問の傾向・特徴】${f.pastExam || '未記入'}
【作問者・研究室の情報】${f.examiner || '未記入'}
【自由記述】${f.freeNote || '未記入'}
`.trim();

  const reference = HOKUDAI_EXAM_REFERENCE;

  if(f.customInstructions && f.customInstructions.trim()){
    return `${base}

${reference}

【ユーザからの追加指示 — これを最優先で反映してください】
${f.customInstructions.trim()}`;
  }
  return `${base}

${reference}`;
}

const TASK_GRANULARITY_RULES = `
【タスクの粒度】
- 1タスクは、学習者が追加の判断をせず1回の学習セッション（目安30〜90分）で実行・完了判定できる大きさにする
- 各タスクの文面には原則として「対象（科目・単元）」「行動」「量または時間」「完了条件」の4要素を含める
- 「基礎を固める」「過去問を進める」「復習する」「理解する」のような抽象的な表現だけで終わらせない
- 複数単元や複数回分を一つのタスクに詰め込まない。演習・採点・誤答直しを含めて90分を超える場合は別タスクに分ける
- 教材が指定されている場合は章・節・問題番号まで示す。指定されていない教材名、ページ番号、過去問の設問内容は捏造しない
- 教材が未指定の場合は、出典を限定せず「対象単元の標準問題を5問」のように、扱う論点と問題数を明示する
- 過去問演習は、資料から確認できる範囲で「年度・科目・大問」「制限時間」「採点・見直し方法」を明示する
- 完了条件は「例題を見ずに解法を説明できる」「5問中4問以上正解」「誤答原因と正しい解法を各1行で記録」のように観察可能な基準にする

悪い例: 「線形代数の基礎を固める」
良い例: 「行列の階数と連立一次方程式の標準問題を45分で5問解き、4問以上正解する。誤答は原因と正しい解法を各1行で記録する」
悪い例: 「過去問を解いて復習する」
良い例: 「確認できた直近年度の基礎数学の大問1題を40分で解き、採点後に誤答した小問を解答を見ずにもう一度解く」
`.trim();

const SUBJECT_PRIORITY_RULES = `
【科目・単元の優先順位】
フェーズの並び順、および各フェーズ内のタスクの順序は、以下の優先順位を反映すること（優先度が高いものほど早いフェーズ・早いタスク順に配置する）。

1. 最優先: 情報理論（専門科目1の選択科目として選ばれている場合）、コンピュータネットワーク（コンピュータシステム科目内の一単元。同科目の他単元より先に配置する）、アルゴリズムとデータ構造（専門科目2の科目）
2. 次点: 上記1に該当しない専門科目2の科目・単元（人工知能、コンピュータシステムのネットワーク以外の単元、応用数学）
3. その次: 上記1に該当しない専門科目1の科目・単元（情報数学、確率・統計。情報理論が選択されていない場合はここに含めない）
4. 最も優先度を下げる: 基礎数学（他の科目のタスクが一巡した後、後半のフェーズに重点的に配置する）

- ユーザーが選択していない科目（専門科目1・2で選ばれていない選択科目）は登場させない
- 直前期（最終フェーズ）は総仕上げ・過去問演習が中心のため、この優先順位より過去問演習・弱点補強を優先してよい
`.trim();

// 新規作成用のシステムプロンプト。Web検索の使用を明示的に指示。
const SYSTEM_GENERATE = `あなたは大学院入試（院試）対策に精通した学習コーチです。学生から与えられた情報をもとに、今日から試験日までの現実的な学習ロードマップを作成してください。

【重要】まず必要に応じてweb_searchツールを使い、以下を確認してから設計してください:
- 志望大学院・専攻の公式サイトや募集要項（試験科目・配点・過去問公開状況）
- 過去に公開されている過去問や対策情報
- 指定された研究室・作問者の研究分野
- ユーザーが提示した情報が古くないか、現在も有効か

検索は必須ではありませんが、大学名・研究室名が明示されている場合は原則1〜3回の検索で裏取りしてください。

${TASK_GRANULARITY_RULES}

${SUBJECT_PRIORITY_RULES}

出力は必ず以下のJSON形式のみとし、前置きや後置きの文章、Markdownのコードブロック記号（\`\`\`）は一切含めないでください。JSON以外の文字を1文字も出力しないこと。

{
  "overview": "全体の学習方針を2〜3文で要約した文章。Web検索で得た情報があればそれを反映する",
  "sources": ["参照した公式サイト等のURL（あれば）"],
  "subjectProgress": [
    {"subject": "情報理論", "progress": 30, "note": "今は基礎概念の理解が進んでいる状態"}
  ],
  "phases": [
    {
      "name": "フェーズ名（例：Week1 基礎固め）",
      "period": "期間（例：7/14(月)〜7/20(日)）",
      "goal": "このフェーズで達成すべきことを1文で",
      "tasks": ["具体的なタスク1", "具体的なタスク2", "具体的なタスク3"]
    }
  ]
}

条件:
- フェーズは今日から試験日までを1週間（7日間）ごとに区切り、時系列順に並べる。試験日までの週数だけフェーズを作る（最終フェーズは7日未満になっても構わない）
- 各フェーズのタスクは必ず7個とする（1週間の7日それぞれに対応する1タスクとして扱う）。すべて上記の「タスクの粒度」を満たす
- 上記の「科目・単元の優先順位」に沿ってフェーズ・タスクの順序を決める
- 過去問の傾向・作問者の情報・目標点数があれば優先順位に反映する
- 苦手科目や使える時間などの自由記述があれば配分に反映する
- 最後のフェーズは試験直前期（総仕上げ・過去問演習・体調管理など）にする
- 添付資料（過去問PDF等）があれば内容を精読し、タスクに具体的に反映する`;

// ロードマップ調整用のシステムプロンプト
const SYSTEM_ADJUST = `あなたは大学院入試（院試）対策に精通した学習コーチです。既存のロードマップと現在の進捗状況をもとに、残り期間のロードマップを再調整してください。

【入力される情報】
- 元のロードマップ（フェーズとタスク）
- 各タスクの完了状況（done: true/false）
- 現在の日付と試験日
- 想定進捗と実際の進捗の差

${TASK_GRANULARITY_RULES}

${SUBJECT_PRIORITY_RULES}

出力は必ず以下のJSON形式のみとし、前置きや後置きの文章、Markdownのコードブロック記号（\`\`\`）は一切含めないでください。

{
  "overview": "調整後の学習方針を2〜3文で要約",
  "diagnosis": "現状分析を2〜3文（何が遅れているか / 順調な点 / リスク）",
  "subjectProgress": [
    {"subject": "科目", "progress": 進捗率, "note": "基礎理解は進んでいる"}
  ],
  "phases": [
    {
      "name": "フェーズ名",
      "period": "期間（例：7/14(月)〜7/20(日)）",
      "goal": "このフェーズの到達目標",
      "tasks": ["タスク1", "タスク2"]
    }
  ]
}

条件:
- 既に完了したタスクは尊重し、繰り返させない
- 上記の「科目・単元の優先順位」に沿って残タスク・追加タスクの順序を決める
- 遅れている場合は残タスクを削って優先度の高いものに絞る
- 進んでいる場合は補強タスクや過去問演習を追加してもよい
- フェーズは今日から試験日までを1週間（7日間）ごとに区切って再割り当てする（最終フェーズは7日未満でもよい）
- 各フェーズのタスクは必ず7個とする（1週間の7日それぞれに対応する1タスクとして扱う）
- 過度に非現実的なペースを課さない
- 新規・継続を問わず、未完了タスクはすべて上記の「タスクの粒度」を満たすよう必要に応じて分割・具体化する
- subjectProgress も現状の学習状態に合わせて更新する
- どの科目にも当てはまらないタスクは「その他」にまとめる`;

// -------- 添付ファイルをmessages contentに変換 --------

function attachmentsToBlocks(attachments){
  if(!attachments || !attachments.length) return [];
  return attachments.map(a => {
    if(a.mediaType === 'application/pdf'){
      return {
        type: 'document',
        source: { type: 'base64', media_type: a.mediaType, data: a.base64 }
      };
    }
    if(a.mediaType.startsWith('image/')){
      return {
        type: 'image',
        source: { type: 'base64', media_type: a.mediaType, data: a.base64 }
      };
    }
    return null;
  }).filter(Boolean);
}

// -------- ロードマップ生成（新規） --------

export async function generateRoadmap(form){
  const userContent = buildUserContent(form);
  const attachmentBlocks = attachmentsToBlocks(form.attachments);

  const messages = [{
    role: 'user',
    content: attachmentBlocks.length
      ? [...attachmentBlocks, { type: 'text', text: userContent }]
      : userContent
  }];

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 4000,
    system: SYSTEM_GENERATE,
    messages,
    tools: []
  };

  const parsed = await callAiAndParse(body);
  const phases = normalizePhases(parsed.phases);
  const subjectProgress = normalizeSubjectProgress(parsed.subjectProgress, phases);
  if(!phases.length){
    throw new Error('AIの応答にロードマップのphasesが含まれていませんでした。もう一度作成してください。');
  }

  return {
    overview: parsed.overview || '',
    sources: parsed.sources || [],
    subjectProgress,
    university: form.university,
    target: form.target,
    examDate: form.examDate,
    createdAt: todayStr(),
    lastReviewedAt: todayStr(),
    // 再編集用に元の入力を保持（添付ファイルは除外）
    originalInputs: {
      university: form.university,
      target: form.target,
      examDate: form.examDate,
      subjects: form.subjects,
      subject1Elective: form.subject1Elective || '',
      subject2: form.subject2 || [],
      pastExam: form.pastExam,
      examiner: form.examiner,
      freeNote: form.freeNote,
      customInstructions: form.customInstructions || ''
    },
    phases
  };
}

// -------- Web情報の再検証 (既存Webサイト・情報の確認) --------

export async function verifyInformation(rm){
  const userContent = `北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）について、最新の公式情報を確認してください。web_searchを使い、以下を調査してください:
- 記録されている試験日: ${rm.examDate}
- 記録されている試験科目: ${rm.originalInputs?.subjects || '未記入'}
- 記録されている研究室情報: ${rm.originalInputs?.examiner || '未記入'}

${HOKUDAI_EXAM_REFERENCE}

各項目について、現時点の公式情報と一致しているか、または更新があるかを確認してください。

出力は必ず以下のJSON形式のみ:

{
  "verified_at": "確認日 (YYYY-MM-DD)",
  "findings": [
    { "item": "確認した項目", "status": "confirmed" | "changed" | "unclear", "note": "確認結果や変更点" }
  ],
  "sources": ["参照URL1", "参照URL2"],
  "summary": "全体所見を2〜3文で"
}`;

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 2500,
    system: 'あなたは大学院入試情報の調査エージェントです。web_searchで公式サイトを確認し、事実ベースで報告してください。推測は避け、確認できないものはunclearとしてください。',
    messages: [{ role: 'user', content: userContent }],
    tools: []
  };

  return await callAiAndParse(body);
}

export async function explainTask(rm, taskText){
  const userContent = `以下のタスクについて、北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）向けに、初心者にも分かるよう具体化してください。

タスク: ${taskText}
試験日: ${rm?.examDate || '未設定'}
現在の目標: ${rm?.target || '未設定'}

${HOKUDAI_EXAM_REFERENCE}

出力は必ず次のJSON形式のみとし、前置きや説明文は一切含めないでください。
{
  "purpose": "このタスクの目的を1〜2文で説明",
  "steps": ["実行手順1", "実行手順2", "実行手順3"],
  "completion": ["完了条件1", "完了条件2"],
  "mistakes": ["よくある失敗1", "よくある失敗2"]
}

制約:
- steps は 3〜6 個
- completion と mistakes は 1〜3 個
- 抽象語だけで終わらせず、すぐ実行できる粒度で書く
- 北海道大学の文脈に沿わせるが、タスク本文にない固有情報は捏造しない`;
  const body = {
    model: GEMINI_MODEL,
    max_tokens: 1800,
    system: 'あなたは北海道大学大学院情報科学院修士課程入試の学習コーチです。抽象表現を避け、実行可能な手順に具体化してください。',
    messages: [{ role: 'user', content: userContent }],
    tools: []
  };

  const rawResponse = await callAiText(body);
  return formatTaskExplanation(rawResponse);
}

// -------- ロードマップ調整 --------

export async function adjustRoadmap(roadmap, diagnosis){
  // 既存タスク状態を含めて渡す
  const context = {
    university: '北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）',
    target: roadmap.target,
    examDate: roadmap.examDate,
    today: todayStr(),
    expectedPct: diagnosis.expectedPct,
    actualPct: diagnosis.actualPct,
    delta: diagnosis.delta,
    phases: roadmap.phases.map(p => ({
      name: p.name,
      period: p.period,
      goal: p.goal,
      tasks: p.tasks.map(t => ({ text: t.text, done: t.done }))
    }))
  };

  const userContent = `以下のJSONは北海道大学大学院情報科学院修士課程入学試験（情報理工学コース）の現在のロードマップと進捗です。残り期間で無理なく合格ラインに到達できるよう調整してください。

${HOKUDAI_EXAM_REFERENCE}

${JSON.stringify(context, null, 2)}`;

  const body = {
    model: GEMINI_MODEL,
    max_tokens: 4000,
    system: SYSTEM_ADJUST,
    messages: [{ role: 'user', content: userContent }]
  };

  const parsed = await callAiAndParse(body);

  // 完了済みタスクは可能な限り維持（テキスト一致で紐付け）
  const doneTexts = new Set();
  const existingSubjects = new Map();
  roadmap.phases.forEach(p => p.tasks.forEach(t => {
    if(t.done) doneTexts.add(t.text);
    if(t?.text) existingSubjects.set(t.text, t.subject || '');
  }));

  const newPhases = normalizePhases(parsed.phases).map(p => ({
    ...p,
    tasks: p.tasks.map(t => ({
      ...t,
      done: doneTexts.has(t.text),
      subject: t.subject || existingSubjects.get(t.text) || ''
    }))
  }));
  const subjectProgress = normalizeSubjectProgress(parsed.subjectProgress || roadmap.subjectProgress, newPhases);

  return {
    ...roadmap,
    overview: parsed.overview || roadmap.overview,
    diagnosis: parsed.diagnosis || '',
    subjectProgress,
    phases: newPhases,
    lastReviewedAt: todayStr()
  };
}

// -------- 内部ヘルパー --------

async function callAiAndParse(body){
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e){
    throw new Error('API proxy is not reachable. Start the local server with GEMINI_API_KEY set.');
  }

  if(!response.ok){
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = formatApiError(errorBody);
    } catch(_) {
      detail = await response.text().catch(() => '');
    }
    throw new Error(`API call failed (${response.status})${detail ? ': ' + detail : ''}`);
  }

  const data = await response.json();
  // content配列からテキストのみ抽出（tool_use/tool_resultは無視）
  const textBlocks = (data.content || []).filter(b => b.type === 'text');
  if(!textBlocks.length) throw new Error('応答が空でした');

  const fullText = textBlocks.map(b => b.text).join('\n').trim();
  const raw = cleanJsonLikeText(fullText);

  try {
    return normalizeParsedResponse(JSON.parse(raw));
  } catch(e){
    const repaired = tryRepairJsonText(raw);
    if(repaired){
      try {
        return normalizeParsedResponse(JSON.parse(repaired));
      } catch(_){
        // 次の候補を試す
      }
    }

    const candidates = extractJsonCandidates(raw);
    for(const candidate of candidates){
      try {
        return normalizeParsedResponse(JSON.parse(candidate));
      } catch(_){
        // 次の候補を試す
      }
    }

    try {
      const corrected = await repairJsonWithModel(raw);
      if(corrected){
        return normalizeParsedResponse(corrected);
      }
    } catch(_){
      // 追加の修復も失敗した場合はそのまま下へ
    }

    throw new Error('応答の解析に失敗しました。AIの返答がJSON形式ではありませんでした: ' + raw.slice(0, 160));
  }
}

async function callAiText(body){
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e){
    throw new Error('API proxy is not reachable. Start the local server with GEMINI_API_KEY set.');
  }

  if(!response.ok){
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = formatApiError(errorBody);
    } catch(_) {
      detail = await response.text().catch(() => '');
    }
    throw new Error(`API call failed (${response.status})${detail ? ': ' + detail : ''}`);
  }

  const data = await response.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text');
  if(!textBlocks.length) throw new Error('応答が空でした');

  return textBlocks.map(b => b.text).join('\n').trim();
}

function formatTaskExplanation(rawResponse){
  const cleaned = cleanJsonLikeText(rawResponse);
  if(!cleaned) return rawResponse?.trim() || '';

  try {
    const parsed = JSON.parse(cleaned);
    if(parsed && typeof parsed === 'object' && !Array.isArray(parsed)){
      const sections = [];
      const purpose = parsed.purpose || parsed.目的;
      const steps = parsed.steps || parsed.実行手順;
      const completion = parsed.completion || parsed.完了条件;
      const mistakes = parsed.mistakes || parsed.よくある失敗;

      if(purpose) sections.push(`■ 目的\n${purpose}`);
      if(Array.isArray(steps) && steps.length){
        sections.push(`■ 実行手順\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`);
      } else if(steps){
        sections.push(`■ 実行手順\n${steps}`);
      }
      if(Array.isArray(completion) && completion.length){
        sections.push(`■ 完了条件\n${completion.map((item, index) => `${index + 1}. ${item}`).join('\n')}`);
      } else if(completion){
        sections.push(`■ 完了条件\n${completion}`);
      }
      if(Array.isArray(mistakes) && mistakes.length){
        sections.push(`■ よくある失敗\n${mistakes.map((item, index) => `${index + 1}. ${item}`).join('\n')}`);
      } else if(mistakes){
        sections.push(`■ よくある失敗\n${mistakes}`);
      }

      const text = sections.join('\n\n').trim();
      return text || rawResponse.trim();
    }
  } catch(_){
    // JSONでなければそのまま返す
  }

  return cleaned || rawResponse.trim();
}

function cleanJsonLikeText(text){
  return String(text || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
    .replace(/^json\s*/i, '')
    .trim();
}

function tryRepairJsonText(text){
  const candidate = String(text || '')
    .trim()
    .replace(/,\s*([}\]])/g, '$1');

  const openBrace = (candidate.match(/\{/g) || []).length;
  const closeBrace = (candidate.match(/}/g) || []).length;
  const openBracket = (candidate.match(/\[/g) || []).length;
  const closeBracket = (candidate.match(/]/g) || []).length;

  let repaired = candidate;
  if(openBrace > closeBrace) repaired += '}'.repeat(openBrace - closeBrace);
  if(openBracket > closeBracket) repaired += ']'.repeat(openBracket - closeBracket);

  return repaired.trim() && repaired !== candidate ? repaired : null;
}

async function repairJsonWithModel(rawText){
  const repairBody = {
    model: GEMINI_MODEL,
    max_tokens: 2500,
    system: 'あなたは JSON 修復エージェントです。与えられた不正な JSON を、元の意図を保ったまま正しい JSON のみで返してください。前置きや説明は絶対に不要です。',
    messages: [{ role: 'user', content: `以下の応答は JSON として不正です。元の意図を保ちつつ、正しい JSON のみを返してください。\n\n${rawText}` }],
    tools: []
  };

  const repairedText = await callAiText(repairBody);
  const cleaned = cleanJsonLikeText(repairedText);
  if(!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch(_){
    return null;
  }
}

function extractJsonCandidates(text){
  const candidates = [];
  addCandidateBetween(text, '{', '}', candidates);
  addCandidateBetween(text, '[', ']', candidates);
  return candidates;
}

function addCandidateBetween(text, open, close, candidates){
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if(start >= 0 && end > start){
    candidates.push(text.slice(start, end + 1));
  }
}

function normalizeParsedResponse(parsed){
  if(Array.isArray(parsed)){
    return { overview: '', sources: [], phases: parsed };
  }
  if(parsed?.roadmap && typeof parsed.roadmap === 'object'){
    return parsed.roadmap;
  }
  return parsed;
}

function formatApiError(errorBody){
  if(!errorBody) return '';
  if(typeof errorBody === 'string') return errorBody;
  if(typeof errorBody.message === 'string') return errorBody.message;
  if(errorBody.error){
    if(typeof errorBody.error === 'string') return errorBody.error;
    if(typeof errorBody.error.message === 'string') return errorBody.error.message;
    try { return JSON.stringify(errorBody.error); }
    catch(_) { return String(errorBody.error); }
  }
  try { return JSON.stringify(errorBody); }
  catch(_) { return String(errorBody); }
}

function normalizePhases(phases){
  return (phases || []).map((p, pi) => ({
    name: p.name || `フェーズ${pi + 1}`,
    period: p.period || '',
    goal: p.goal || '',
    tasks: (p.tasks || []).map((t, ti) => normalizeTask(t, pi, ti))
  }));
}

function normalizeTask(task, phaseIdx, taskIdx){
  const text = typeof task === 'string' ? task : (task?.text || '');
  const subject = normalizeTaskSubject(task);
  return {
    id: `p${phaseIdx}-t${taskIdx}-${Date.now().toString(36)}`,
    text,
    done: Boolean(task?.done),
    subject,
    userAdded: Boolean(task?.userAdded)
  };
}

function normalizeTaskSubject(task){
  if(!task || typeof task === 'string') return 'その他';
  const raw = String(task?.subject || task?.subjectName || '').trim();
  if(raw) return raw;
  const inferred = inferSubjectFromText(String(task?.text || ''));
  return inferred || 'その他';
}

function normalizeSubjectProgress(subjectProgress, phases){
  if(Array.isArray(subjectProgress) && subjectProgress.length){
    const normalized = subjectProgress
      .map(item => {
        const subject = String(item?.subject || item?.name || '').trim();
        if(!subject) return null;
        const progressValue = Number(item?.progress);
        const progress = Number.isFinite(progressValue)
          ? Math.max(0, Math.min(100, Math.round(progressValue)))
          : 0;
        return {
          subject,
          progress,
          note: String(item?.note || '').trim()
        };
      })
      .filter(Boolean);
    if(normalized.length) return normalized;
  }

  return inferSubjectProgressFromTasks(phases);
}

function inferSubjectProgressFromTasks(phases){
  const stats = new Map();
  const add = (subject, done) => {
    if(!subject) return;
    const entry = stats.get(subject) || { total: 0, done: 0 };
    entry.total += 1;
    if(done) entry.done += 1;
    stats.set(subject, entry);
  };

  for(const phase of phases || []){
    for(const task of phase.tasks || []){
      const subject = normalizeTaskSubject(task) || inferSubjectFromText(String(task?.text || ''));
      add(subject, Boolean(task?.done));
    }
  }

  return Array.from(stats.entries())
    .map(([subject, entry]) => ({
      subject,
      progress: entry.total ? Math.round((entry.done / entry.total) * 100) : 0,
      note: `${entry.done}/${entry.total} タスク完了`
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'ja'));
}

function inferSubjectFromText(text){
  const source = String(text || '').trim();
  if(!source) return '';
  const patterns = [
    ['情報理論', /(情報理論|情報量|エントロピー|相互情報量|通信路|符号)/u],
    ['アルゴリズムとデータ構造', /(アルゴリズム|データ構造|グラフ|整列|探索|計算量|リスト|キュー|スタック|ヒープ|ハッシュ)/u],
    ['基礎数学', /(基礎数学|線形代数|微分積分|行列|極限|微分|積分|固有値)/u],
    ['情報数学', /(情報数学|論理|言語理論|オートマトン|集合|関係|写像|ブール)/u],
    ['確率・統計', /(確率|統計|分散|期待値|独立|標本分布|仮説検定)/u],
    ['人工知能', /(人工知能|機械学習|ニューラル|Q学習|探索と推論|ゲーム理論)/u],
    ['コンピュータシステム', /(コンピュータシステム|OS|ネットワーク|アーキテクチャ|ページング|キャッシュ|DNS|C言語|論理回路)/u],
    ['応用数学', /(応用数学|微分方程式|ベクトル解析|ラプラス|フーリエ|複素解析)/u]
  ];
  for(const [subject, pattern] of patterns){
    if(pattern.test(source)) return subject;
  }
  return 'その他';
}
