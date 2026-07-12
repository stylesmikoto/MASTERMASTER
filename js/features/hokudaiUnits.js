export const HOKUDAI_EXAM_SOURCES = Object.freeze({
  subject1: {
    id: 'csit01_2025',
    title: '2025 専門科目1',
    url: 'https://www.ist.hokudai.ac.jp/examinfo/files/csit01_2025.pdf'
  },
  subject2: {
    id: 'csit02_2025',
    title: '2025 専門科目2',
    url: 'https://www.ist.hokudai.ac.jp/examinfo/files/csit02_2025.pdf'
  }
});

export const HOKUDAI_INFO_SCIENCE_PROFILE = Object.freeze({
  university: '北海道大学大学院情報科学院 情報科学専攻 情報理工学コース',
  shortName: '北大 情報理工学コース',
  note: '専門科目1は基礎数学と情報数学を含む3問選択の形式に合わせる。'
});

export const HOKUDAI_UNIT_GROUPS = Object.freeze([
  {
    id: 'subject1_required',
    label: '専門科目1 必須',
    description: '2025年度専門科目1の注意事項で選択必須とされる基礎系単元。',
    unitIds: ['basic_math', 'information_math'],
    required: true
  },
  {
    id: 'subject1_choice',
    label: '専門科目1 選択',
    description: '専門科目1で、必須2問に加えて選ぶ候補。',
    unitIds: ['probability_statistics', 'information_theory'],
    minSelect: 1,
    maxSelect: 1
  },
  {
    id: 'subject2_topics',
    label: '専門科目2 対策単元',
    description: '情報理工学コースの専門科目2対策として確認する専門系単元。',
    unitIds: [
      'algorithms_data_structures',
      'computer_systems',
      'operating_systems',
      'databases',
      'programming_languages',
      'ai_machine_learning'
    ],
    minSelect: 0
  }
]);

export const HOKUDAI_EXAM_UNITS = Object.freeze([
  {
    id: 'basic_math',
    label: '基礎数学',
    shortLabel: '基礎数学',
    groupId: 'subject1_required',
    sourceId: 'csit01_2025',
    required: true,
    keywords: ['線形代数', '行列', '対角化', '多変数微分', 'Taylor展開', '極値判定'],
    description: '行列・固有値・直交対角化、多変数関数の微分と極値を中心に確認する。'
  },
  {
    id: 'information_math',
    label: '情報数学',
    shortLabel: '情報数学',
    groupId: 'subject1_required',
    sourceId: 'csit01_2025',
    required: true,
    keywords: ['命題論理', '集合と写像', '順列組合せ', '形式言語', '文脈自由文法'],
    description: '論理・集合写像・組合せ・形式言語の基礎を確認する。'
  },
  {
    id: 'probability_statistics',
    label: '確率・統計',
    shortLabel: '確率統計',
    groupId: 'subject1_choice',
    sourceId: 'csit01_2025',
    required: false,
    keywords: ['条件付き確率', '期待値', '分散', '推定', '検定', '正規分布'],
    description: '確率分布、期待値と分散、推定・検定の基本操作を確認する。'
  },
  {
    id: 'information_theory',
    label: '情報理論',
    shortLabel: '情報理論',
    groupId: 'subject1_choice',
    sourceId: 'csit01_2025',
    required: false,
    keywords: ['エントロピー', '相互情報量', '通信路容量', '符号化', 'Huffman符号'],
    description: 'エントロピー、相互情報量、符号化と通信路の基礎を確認する。'
  },
  {
    id: 'algorithms_data_structures',
    label: 'アルゴリズム・データ構造',
    shortLabel: 'アルゴリズム',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['計算量', 'ソート', 'グラフ探索', '動的計画法', '木構造'],
    description: '計算量評価、基本データ構造、グラフ探索、動的計画法を確認する。'
  },
  {
    id: 'computer_systems',
    label: '計算機システム',
    shortLabel: '計算機',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['CPU', 'メモリ階層', 'キャッシュ', 'パイプライン', '2進表現'],
    description: '計算機アーキテクチャ、メモリ階層、命令実行の基礎を確認する。'
  },
  {
    id: 'operating_systems',
    label: 'オペレーティングシステム',
    shortLabel: 'OS',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['プロセス', 'スレッド', '排他制御', 'スケジューリング', '仮想記憶'],
    description: 'プロセス管理、同期、スケジューリング、仮想記憶を確認する。'
  },
  {
    id: 'databases',
    label: 'データベース',
    shortLabel: 'DB',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['関係モデル', 'SQL', '正規化', 'トランザクション', '索引'],
    description: '関係モデル、SQL、正規化、トランザクション処理を確認する。'
  },
  {
    id: 'programming_languages',
    label: 'プログラミング言語・形式言語',
    shortLabel: '言語',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['型', 'スコープ', '再帰', 'オートマトン', '文法'],
    description: '言語処理、型、スコープ、文法・オートマトンの基礎を確認する。'
  },
  {
    id: 'ai_machine_learning',
    label: '人工知能・機械学習',
    shortLabel: 'AI/ML',
    groupId: 'subject2_topics',
    sourceId: 'csit02_2025',
    required: false,
    keywords: ['探索', '分類', '損失関数', '勾配降下法', '評価指標'],
    description: '探索、教師あり学習、損失関数、評価指標の基礎を確認する。'
  }
]);

const UNIT_BY_ID = new Map(HOKUDAI_EXAM_UNITS.map(unit => [unit.id, unit]));

export function getHokudaiExamUnits({ groupId } = {}){
  return groupId
    ? HOKUDAI_EXAM_UNITS.filter(unit => unit.groupId === groupId)
    : [...HOKUDAI_EXAM_UNITS];
}

export function getHokudaiUnitById(unitId){
  return UNIT_BY_ID.get(unitId) || null;
}

export function getRequiredHokudaiUnitIds(){
  return HOKUDAI_EXAM_UNITS.filter(unit => unit.required).map(unit => unit.id);
}

export function normalizeHokudaiUnitSelection(selectedUnitIds = [], { includeRequired = true } = {}){
  const selected = new Set(selectedUnitIds.filter(id => UNIT_BY_ID.has(id)));
  if(includeRequired){
    getRequiredHokudaiUnitIds().forEach(id => selected.add(id));
  }
  return [...selected];
}

export function validateHokudaiUnitSelection(selectedUnitIds = []){
  const normalized = normalizeHokudaiUnitSelection(selectedUnitIds, { includeRequired: false });
  const selected = new Set(normalized);
  const errors = [];
  const warnings = [];

  for(const requiredId of getRequiredHokudaiUnitIds()){
    if(!selected.has(requiredId)){
      errors.push(`${getHokudaiUnitById(requiredId).label}は専門科目1で必須です。`);
    }
  }

  const subject1ChoiceIds = HOKUDAI_UNIT_GROUPS
    .find(group => group.id === 'subject1_choice')
    .unitIds;
  const subject1ChoiceCount = subject1ChoiceIds.filter(id => selected.has(id)).length;
  if(subject1ChoiceCount < 1){
    errors.push('専門科目1では、確率・統計または情報理論から1単元を選んでください。');
  }
  if(subject1ChoiceCount > 1){
    warnings.push('専門科目1の本番選択は1単元想定です。対策として複数選ぶ場合は診断問題数が増えます。');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    selectedUnitIds: normalized
  };
}

export function buildHokudaiSelectionSummary(selectedUnitIds = []){
  const normalized = normalizeHokudaiUnitSelection(selectedUnitIds);
  const units = normalized.map(getHokudaiUnitById).filter(Boolean);
  return {
    unitIds: normalized,
    labels: units.map(unit => unit.label),
    keywords: [...new Set(units.flatMap(unit => unit.keywords))],
    sources: [...new Set(units.map(unit => HOKUDAI_EXAM_SOURCES[unit.sourceId]?.url).filter(Boolean))]
  };
}

export function getHokudaiFormPreset(){
  return {
    university: HOKUDAI_INFO_SCIENCE_PROFILE.university,
    subjects: '専門科目1（基礎数学・情報数学を含む3問選択）/ 専門科目2 / 英語スコア提出 / 口述試験',
    pastExam: [
      HOKUDAI_EXAM_SOURCES.subject1.url,
      HOKUDAI_EXAM_SOURCES.subject2.url
    ].join('\n')
  };
}
