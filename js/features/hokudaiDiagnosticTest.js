import {
  getHokudaiUnitById,
  normalizeHokudaiUnitSelection,
  validateHokudaiUnitSelection
} from './hokudaiUnits.js';

export const HOKUDAI_DIAGNOSTIC_QUESTIONS = Object.freeze({
  basic_math: [
    {
      id: 'basic_math_1',
      skill: 'linear_algebra',
      prompt: '実対称行列を直交行列で対角化できる理由として最も適切なものはどれですか。',
      options: [
        { id: 'a', text: '実対称行列の固有値はすべて0になるから' },
        { id: 'b', text: '実対称行列は互いに直交する固有ベクトルからなる正規直交基底を持つから' },
        { id: 'c', text: 'すべての正方行列は必ず直交行列で対角化できるから' },
        { id: 'd', text: '行列式が1なら常に対角行列だから' }
      ],
      answer: 'b',
      explanation: '実対称行列はスペクトル定理により直交対角化できます。'
    },
    {
      id: 'basic_math_2',
      skill: 'calculus',
      prompt: '2変数関数の停留点でヘッセ行列が正定値なら、その点は何と判定できますか。',
      options: [
        { id: 'a', text: '極小点' },
        { id: 'b', text: '極大点' },
        { id: 'c', text: '鞍点' },
        { id: 'd', text: '判定不能' }
      ],
      answer: 'a',
      explanation: '停留点でヘッセ行列が正定値なら局所極小です。'
    },
    {
      id: 'basic_math_3',
      skill: 'matrix_computation',
      prompt: '行列AとBが同じ正規直交基底で対角化できるとき、一般に成り立つ関係はどれですか。',
      options: [
        { id: 'a', text: 'AB = BA' },
        { id: 'b', text: 'A + B = 0' },
        { id: 'c', text: 'AとBは必ず逆行列を持つ' },
        { id: 'd', text: 'AとBの固有値はすべて等しい' }
      ],
      answer: 'a',
      explanation: '同時対角化できる行列は可換です。'
    }
  ],
  information_math: [
    {
      id: 'information_math_1',
      skill: 'logic',
      prompt: '命題 P -> Q と論理的に同値なものはどれですか。',
      options: [
        { id: 'a', text: 'P and Q' },
        { id: 'b', text: 'not P or Q' },
        { id: 'c', text: 'P or not Q' },
        { id: 'd', text: 'not P and not Q' }
      ],
      answer: 'b',
      explanation: '含意 P -> Q は not P or Q と同値です。'
    },
    {
      id: 'information_math_2',
      skill: 'functions',
      prompt: '写像 f: Z -> Z, f(n)=2n について正しい説明はどれですか。',
      options: [
        { id: 'a', text: '全単射である' },
        { id: 'b', text: '単射だが全射ではない' },
        { id: 'c', text: '全射だが単射ではない' },
        { id: 'd', text: '単射でも全射でもない' }
      ],
      answer: 'b',
      explanation: '異なる整数は異なる偶数へ写りますが、奇数には到達しません。'
    },
    {
      id: 'information_math_3',
      skill: 'formal_language',
      prompt: '文脈自由文法で主に表現できる対象として最も自然なものはどれですか。',
      options: [
        { id: 'a', text: 'プログラム言語の括弧構造のような再帰的構造' },
        { id: 'b', text: '任意の自然言語文の意味理解' },
        { id: 'c', text: 'すべての計算可能関数' },
        { id: 'd', text: 'CPUの命令実行時間' }
      ],
      answer: 'a',
      explanation: '文脈自由文法は入れ子や再帰的な構文構造の記述に向いています。'
    }
  ],
  probability_statistics: [
    {
      id: 'probability_statistics_1',
      skill: 'conditional_probability',
      prompt: 'P(A)=0.5, P(B)=0.4, P(A and B)=0.2 のとき P(A|B) はどれですか。',
      options: [
        { id: 'a', text: '0.1' },
        { id: 'b', text: '0.2' },
        { id: 'c', text: '0.5' },
        { id: 'd', text: '0.8' }
      ],
      answer: 'c',
      explanation: 'P(A|B)=P(A and B)/P(B)=0.2/0.4=0.5です。'
    },
    {
      id: 'probability_statistics_2',
      skill: 'expectation',
      prompt: '確率変数Xの分散 Var(X) の式として正しいものはどれですか。',
      options: [
        { id: 'a', text: 'E[X] - E[X^2]' },
        { id: 'b', text: 'E[X^2] - E[X]^2' },
        { id: 'c', text: 'E[X]^2 - E[X^2]' },
        { id: 'd', text: 'E[X^2] + E[X]^2' }
      ],
      answer: 'b',
      explanation: '分散は Var(X)=E[X^2]-E[X]^2 です。'
    },
    {
      id: 'probability_statistics_3',
      skill: 'hypothesis_test',
      prompt: '有意水準5%の検定で p値が0.03 のときの判断として適切なものはどれですか。',
      options: [
        { id: 'a', text: '帰無仮説を棄却する' },
        { id: 'b', text: '帰無仮説を必ず真とする' },
        { id: 'c', text: '対立仮説を棄却する' },
        { id: 'd', text: '標本数を0にする' }
      ],
      answer: 'a',
      explanation: 'p値が有意水準より小さいため、帰無仮説を棄却します。'
    }
  ],
  information_theory: [
    {
      id: 'information_theory_1',
      skill: 'entropy',
      prompt: '公平なコイン1回のエントロピーは何ビットですか。',
      options: [
        { id: 'a', text: '0 bit' },
        { id: 'b', text: '0.5 bit' },
        { id: 'c', text: '1 bit' },
        { id: 'd', text: '2 bit' }
      ],
      answer: 'c',
      explanation: '2通りが等確率なのでエントロピーは log2 2 = 1 bit です。'
    },
    {
      id: 'information_theory_2',
      skill: 'mutual_information',
      prompt: '独立な確率変数X,Yの相互情報量 I(X;Y) はいくつですか。',
      options: [
        { id: 'a', text: '0' },
        { id: 'b', text: '1' },
        { id: 'c', text: 'H(X)+H(Y)' },
        { id: 'd', text: '常に無限大' }
      ],
      answer: 'a',
      explanation: '独立なら片方を知ってももう片方の不確実性は減らないため0です。'
    },
    {
      id: 'information_theory_3',
      skill: 'coding',
      prompt: 'Huffman符号の特徴として正しいものはどれですか。',
      options: [
        { id: 'a', text: '固定長符号しか作れない' },
        { id: 'b', text: '頻度の高い記号に短い符号語を割り当てる' },
        { id: 'c', text: '必ず誤り訂正ができる' },
        { id: 'd', text: '暗号化専用の方式である' }
      ],
      answer: 'b',
      explanation: 'Huffman符号は出現確率に応じた可変長の接頭符号を作ります。'
    }
  ],
  algorithms_data_structures: [
    {
      id: 'algorithms_data_structures_1',
      skill: 'complexity',
      prompt: '要素数nの配列を半分ずつ探索範囲を狭める二分探索の時間計算量はどれですか。',
      options: [
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n)' },
        { id: 'd', text: 'O(n^2)' }
      ],
      answer: 'b',
      explanation: '探索範囲が各ステップで半分になるため O(log n) です。'
    },
    {
      id: 'algorithms_data_structures_2',
      skill: 'graph',
      prompt: '重みなしグラフで始点からの最短辺数を求める基本アルゴリズムはどれですか。',
      options: [
        { id: 'a', text: '幅優先探索' },
        { id: 'b', text: 'クイックソート' },
        { id: 'c', text: '二分探索' },
        { id: 'd', text: 'ハッシュ法' }
      ],
      answer: 'a',
      explanation: '重みなしグラフの最短路は幅優先探索で求められます。'
    },
    {
      id: 'algorithms_data_structures_3',
      skill: 'data_structure',
      prompt: '優先度付きキューの実装によく使われるデータ構造はどれですか。',
      options: [
        { id: 'a', text: 'ヒープ' },
        { id: 'b', text: 'スタックだけ' },
        { id: 'c', text: '単純な文字列' },
        { id: 'd', text: '真理値表' }
      ],
      answer: 'a',
      explanation: 'ヒープは最小値または最大値の取り出しを効率よく行えます。'
    }
  ],
  computer_systems: [
    {
      id: 'computer_systems_1',
      skill: 'cache',
      prompt: 'キャッシュメモリを使う主な理由はどれですか。',
      options: [
        { id: 'a', text: '主記憶より低速だから' },
        { id: 'b', text: 'CPUと主記憶の速度差を埋めるため' },
        { id: 'c', text: 'プログラムを暗号化するため' },
        { id: 'd', text: 'ネットワーク通信を不要にするため' }
      ],
      answer: 'b',
      explanation: 'キャッシュは局所性を利用してメモリアクセスを高速化します。'
    },
    {
      id: 'computer_systems_2',
      skill: 'binary',
      prompt: '8ビット符号なし整数で表せる最大値はどれですか。',
      options: [
        { id: 'a', text: '127' },
        { id: 'b', text: '128' },
        { id: 'c', text: '255' },
        { id: 'd', text: '256' }
      ],
      answer: 'c',
      explanation: '8ビット符号なし整数は0から2^8-1、つまり255までです。'
    },
    {
      id: 'computer_systems_3',
      skill: 'pipeline',
      prompt: '命令パイプラインの主な目的はどれですか。',
      options: [
        { id: 'a', text: '命令実行段階を重ねてスループットを上げる' },
        { id: 'b', text: 'すべての命令を必ず1クロックで完了させる' },
        { id: 'c', text: 'メモリ容量を無限にする' },
        { id: 'd', text: 'OSを不要にする' }
      ],
      answer: 'a',
      explanation: '複数命令の処理段階を重ねることで単位時間あたりの処理数を増やします。'
    }
  ],
  operating_systems: [
    {
      id: 'operating_systems_1',
      skill: 'process',
      prompt: 'プロセスとスレッドの説明として最も適切なものはどれですか。',
      options: [
        { id: 'a', text: 'スレッドは同じプロセス内でメモリ空間を共有し得る' },
        { id: 'b', text: 'プロセスは必ずCPUそのものである' },
        { id: 'c', text: 'スレッドはファイルであり実行されない' },
        { id: 'd', text: 'プロセスとスレッドは完全に同じ概念である' }
      ],
      answer: 'a',
      explanation: 'スレッドはプロセス内の実行単位で、同じアドレス空間を共有できます。'
    },
    {
      id: 'operating_systems_2',
      skill: 'synchronization',
      prompt: '排他制御が必要になる典型的な状況はどれですか。',
      options: [
        { id: 'a', text: '複数スレッドが共有変数を同時に更新する' },
        { id: 'b', text: '1つの定数を読むだけ' },
        { id: 'c', text: '電源を切っている' },
        { id: 'd', text: 'コメントだけを書く' }
      ],
      answer: 'a',
      explanation: '共有資源の競合を防ぐためにロックなどの排他制御を使います。'
    },
    {
      id: 'operating_systems_3',
      skill: 'virtual_memory',
      prompt: '仮想記憶の説明として正しいものはどれですか。',
      options: [
        { id: 'a', text: '各プロセスに独立したアドレス空間を見せる仕組み' },
        { id: 'b', text: 'CPUを物理的に増やす仕組み' },
        { id: 'c', text: 'ネットワークを暗号化する仕組み' },
        { id: 'd', text: 'キーボード入力を無効にする仕組み' }
      ],
      answer: 'a',
      explanation: '仮想記憶は保護や抽象化、物理メモリ管理を支える仕組みです。'
    }
  ],
  databases: [
    {
      id: 'databases_1',
      skill: 'relational_model',
      prompt: '関係データベースで表の行に相当するものはどれですか。',
      options: [
        { id: 'a', text: 'タプル' },
        { id: 'b', text: 'インデント' },
        { id: 'c', text: 'クロック' },
        { id: 'd', text: 'パケット' }
      ],
      answer: 'a',
      explanation: '関係モデルでは行をタプル、列を属性と呼びます。'
    },
    {
      id: 'databases_2',
      skill: 'normalization',
      prompt: '正規化の主な目的はどれですか。',
      options: [
        { id: 'a', text: 'データの冗長性や更新異常を減らす' },
        { id: 'b', text: 'すべての検索を遅くする' },
        { id: 'c', text: '主キーを必ず削除する' },
        { id: 'd', text: '表を画像に変換する' }
      ],
      answer: 'a',
      explanation: '正規化はデータの重複や更新時の不整合を減らす設計手法です。'
    },
    {
      id: 'databases_3',
      skill: 'transaction',
      prompt: 'ACID特性のIが表すものはどれですか。',
      options: [
        { id: 'a', text: 'Isolation' },
        { id: 'b', text: 'Index' },
        { id: 'c', text: 'Input' },
        { id: 'd', text: 'Integer' }
      ],
      answer: 'a',
      explanation: 'ACIDのIはIsolation、つまり分離性です。'
    }
  ],
  programming_languages: [
    {
      id: 'programming_languages_1',
      skill: 'scope',
      prompt: '静的スコープの説明として正しいものはどれですか。',
      options: [
        { id: 'a', text: '変数の参照先がプログラムの字句的構造で決まる' },
        { id: 'b', text: '変数の参照先が常に乱数で決まる' },
        { id: 'c', text: '実行中の呼び出し履歴だけで決まる' },
        { id: 'd', text: 'すべての変数がグローバルになる' }
      ],
      answer: 'a',
      explanation: '静的スコープではソースコード上の構造から名前解決を行います。'
    },
    {
      id: 'programming_languages_2',
      skill: 'type_system',
      prompt: '型検査の主な目的はどれですか。',
      options: [
        { id: 'a', text: '値の使い方の不整合を検出する' },
        { id: 'b', text: 'CPUの温度を測る' },
        { id: 'c', text: 'データベースを正規化する' },
        { id: 'd', text: '通信路容量を計算する' }
      ],
      answer: 'a',
      explanation: '型検査は不適切な演算や関数呼び出しを検出する助けになります。'
    },
    {
      id: 'programming_languages_3',
      skill: 'automata',
      prompt: '正規言語を受理する計算モデルとして代表的なものはどれですか。',
      options: [
        { id: 'a', text: '有限オートマトン' },
        { id: 'b', text: '関係データベース' },
        { id: 'c', text: 'キャッシュメモリ' },
        { id: 'd', text: '回帰分析' }
      ],
      answer: 'a',
      explanation: '正規言語は有限オートマトンで受理できます。'
    }
  ],
  ai_machine_learning: [
    {
      id: 'ai_machine_learning_1',
      skill: 'search',
      prompt: '幅優先探索の特徴として正しいものはどれですか。',
      options: [
        { id: 'a', text: '浅いノードから順に展開する' },
        { id: 'b', text: '必ず評価関数を使う' },
        { id: 'c', text: '重み付き最短路だけを解く' },
        { id: 'd', text: '訓練データを必要とする教師あり学習である' }
      ],
      answer: 'a',
      explanation: '幅優先探索はキューを使い、深さの小さいノードから探索します。'
    },
    {
      id: 'ai_machine_learning_2',
      skill: 'classification',
      prompt: '教師あり分類で使う評価指標として自然なものはどれですか。',
      options: [
        { id: 'a', text: '正解率' },
        { id: 'b', text: 'ページフォルト率だけ' },
        { id: 'c', text: 'クロック周波数だけ' },
        { id: 'd', text: 'エントロピー符号長だけ' }
      ],
      answer: 'a',
      explanation: '分類問題では正解率、適合率、再現率、F1などを使います。'
    },
    {
      id: 'ai_machine_learning_3',
      skill: 'optimization',
      prompt: '勾配降下法で更新方向を決めるために使うものはどれですか。',
      options: [
        { id: 'a', text: '損失関数の勾配' },
        { id: 'b', text: 'SQLの主キー' },
        { id: 'c', text: 'キャッシュラインサイズだけ' },
        { id: 'd', text: '文法の終端記号だけ' }
      ],
      answer: 'a',
      explanation: '勾配降下法は損失関数を小さくする方向へパラメータを更新します。'
    }
  ]
});

export function buildHokudaiDiagnosticTest(selectedUnitIds = [], options = {}){
  const unitIds = normalizeHokudaiUnitSelection(selectedUnitIds, {
    includeRequired: options.includeRequired !== false
  });
  const validation = validateHokudaiUnitSelection(unitIds);
  const questions = unitIds.flatMap(unitId => {
    const all = HOKUDAI_DIAGNOSTIC_QUESTIONS[unitId] || [];
    return all.slice(0, options.questionsPerUnit || 3).map(question => ({
      ...question,
      unitId
    }));
  });

  return {
    id: `hokudai-diagnostic-${Date.now().toString(36)}`,
    title: '北大情報理工学コース 単元別診断',
    unitIds,
    validation,
    questions,
    totalQuestions: questions.length,
    questionsPerUnit: options.questionsPerUnit || 3
  };
}

export function createEmptyDiagnosticAnswers(test){
  return Object.fromEntries((test?.questions || []).map(question => [question.id, null]));
}

export function scoreHokudaiDiagnosticTest(test, answers = {}){
  const questions = test?.questions || [];
  const byUnit = new Map();
  let correct = 0;

  for(const question of questions){
    const unit = getHokudaiUnitById(question.unitId);
    if(!byUnit.has(question.unitId)){
      byUnit.set(question.unitId, {
        unitId: question.unitId,
        label: unit?.label || question.unitId,
        shortLabel: unit?.shortLabel || unit?.label || question.unitId,
        correct: 0,
        total: 0,
        skills: {}
      });
    }

    const unitResult = byUnit.get(question.unitId);
    const isCorrect = answers[question.id] === question.answer;
    unitResult.total += 1;
    if(isCorrect){
      unitResult.correct += 1;
      correct += 1;
    }

    if(!unitResult.skills[question.skill]){
      unitResult.skills[question.skill] = { correct: 0, total: 0 };
    }
    unitResult.skills[question.skill].total += 1;
    if(isCorrect) unitResult.skills[question.skill].correct += 1;
  }

  const unitResults = [...byUnit.values()].map(result => {
    const scorePct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    return {
      ...result,
      scorePct,
      mastery: getHokudaiMasteryLevel(scorePct)
    };
  });

  const scorePct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return {
    correct,
    total: questions.length,
    scorePct,
    mastery: getHokudaiMasteryLevel(scorePct),
    unitResults,
    focusAreas: getHokudaiFocusAreas(unitResults)
  };
}

export function getHokudaiMasteryLevel(scorePct){
  if(scorePct >= 85) return { id: 'advanced', label: '得意', description: '過去問演習と答案精度の向上へ進める水準です。' };
  if(scorePct >= 65) return { id: 'standard', label: '標準', description: '基本は押さえています。典型問題の速度と説明力を伸ばしましょう。' };
  if(scorePct >= 40) return { id: 'basic', label: '基礎固め', description: '定義と基本手順の復習を優先しましょう。' };
  return { id: 'intro', label: '要補強', description: '入門事項から短い演習で立て直しましょう。' };
}

export function getHokudaiFocusAreas(unitResults = [], limit = 3){
  return [...unitResults]
    .sort((a, b) => a.scorePct - b.scorePct)
    .slice(0, limit)
    .map(result => ({
      unitId: result.unitId,
      label: result.label,
      scorePct: result.scorePct,
      suggestion: buildFocusSuggestion(result)
    }));
}

function buildFocusSuggestion(result){
  if(result.scorePct >= 85) return '過去問の記述答案を時間内に仕上げる練習へ進めます。';
  if(result.scorePct >= 65) return '典型問題を解く速度と、途中式・根拠の説明を強化しましょう。';
  if(result.scorePct >= 40) return '公式・定義・基本アルゴリズムを確認し、同型問題を反復しましょう。';
  return '教科書レベルの例題から始め、1問ごとに解法手順を言語化しましょう。';
}
