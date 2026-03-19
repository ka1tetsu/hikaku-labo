// TOEIC完全対策データ

export const PARTS = [
  {
    id: 1,
    name: 'Part 1',
    title: '写真描写問題',
    questions: 6,
    time: 5,
    description: '写真を見て、4つの音声から最適な説明を選ぶ',
    tips: [
      '写真全体を素早くスキャンする（人物・場所・物・動作）',
      '現在進行形（is/are + -ing）に注意',
      '誤答は似た発音や視覚的トラップが多い',
      '消去法を活用する',
    ],
    targetScore: { 600: 5, 730: 6, 860: 6, 990: 6 },
  },
  {
    id: 2,
    name: 'Part 2',
    title: '応答問題',
    questions: 25,
    time: 12,
    description: '質問または文を聞き、最も適切な応答を3つから選ぶ',
    tips: [
      '最初の疑問詞（What/When/Where/Why/Who/How）に集中',
      '直接的な回答だけでなく間接的な回答も正解になる',
      '選択肢を先読みせず音声に集中する',
      'Yes/No疑問文でも正解はYes/Noで始まらない場合がある',
    ],
    targetScore: { 600: 17, 730: 20, 860: 23, 990: 25 },
  },
  {
    id: 3,
    name: 'Part 3',
    title: '会話問題',
    questions: 39,
    time: 20,
    description: '2〜3人の会話を聞き、各セットの3問に答える',
    tips: [
      '問題と選択肢を先読み（先読みが命）',
      '話者の意図・目的・次のアクションに注目',
      '図表問題は図を事前に確認',
      '1問ミスしても落ち着いて次の問題に移る',
    ],
    targetScore: { 600: 24, 730: 30, 860: 36, 990: 39 },
  },
  {
    id: 4,
    name: 'Part 4',
    title: 'トーク問題',
    questions: 30,
    time: 15,
    description: '1人による独話を聞き、各セットの3問に答える',
    tips: [
      '冒頭の情報（誰が・どこで・何のため）を掴む',
      'アナウンス・音声メッセージ・会議のパターンを習得',
      '数字・日付・場所などの具体情報をメモ',
      '先読みで問われる内容を予測する',
    ],
    targetScore: { 600: 18, 730: 24, 860: 28, 990: 30 },
  },
  {
    id: 5,
    name: 'Part 5',
    title: '短文穴埋め問題',
    questions: 30,
    time: 10,
    description: '空欄に入る最適な語句を4択から選ぶ',
    tips: [
      '品詞問題（名詞・動詞・形容詞・副詞）を瞬時に判定',
      '文法問題は文全体を読まず構造を見る',
      '語彙問題は文脈と相性（コロケーション）で選ぶ',
      '1問20秒以内に解く速度を意識',
    ],
    targetScore: { 600: 18, 730: 23, 860: 27, 990: 30 },
  },
  {
    id: 6,
    name: 'Part 6',
    title: '長文穴埋め問題',
    questions: 16,
    time: 8,
    description: '長文の中の空欄4つに適切な語句・文を選ぶ',
    tips: [
      '前後の文脈を必ず確認（特に文挿入問題）',
      'Part 5と同じ品詞・文法の知識が基礎',
      '文書の種類（メール・通知・広告）を把握する',
      '流れを理解してから選択肢を吟味',
    ],
    targetScore: { 600: 10, 730: 13, 860: 15, 990: 16 },
  },
  {
    id: 7,
    name: 'Part 7',
    title: '読解問題',
    questions: 54,
    time: 54,
    description: '単一・複数の文書を読み、問いに答える',
    tips: [
      '設問を先読みして読む箇所を絞る（スキャニング）',
      '文書の種類（メール・チャット・広告・記事）を把握',
      'NOT問題は時間がかかるので後回し',
      '複数文書問題は情報の連携に注目',
    ],
    targetScore: { 600: 30, 730: 40, 860: 49, 990: 54 },
  },
]

export const SCORE_LEVELS = [
  { min: 0, max: 299, label: 'Beginner', color: '#ef4444', description: 'TOEIC入門。基本文法と必須単語から始めよう' },
  { min: 300, max: 499, label: 'Elementary', color: '#f97316', description: '基礎固め。中学英語レベルの完全習得が目標' },
  { min: 500, max: 599, label: 'Pre-Intermediate', color: '#f59e0b', description: '日常会話レベル。ビジネス頻出表現を強化' },
  { min: 600, max: 729, label: 'Intermediate', color: '#84cc16', description: '実用英語レベル。就職・昇進に活用可能' },
  { min: 730, max: 859, label: 'Upper-Intermediate', color: '#10b981', description: '上級者。グローバルビジネスで通用するレベル' },
  { min: 860, max: 989, label: 'Advanced', color: '#0ea5e9', description: 'ハイレベル。英語を仕事のツールとして活用' },
  { min: 990, max: 990, label: 'Perfect', color: '#8b5cf6', description: '満点。全問正解の最高峰' },
]

export const VOCABULARY_SETS = [
  {
    id: 'business-basics',
    name: 'ビジネス基本語彙',
    description: 'TOEIC頻出ビジネス単語 基礎編',
    level: '600点目標',
    words: [
      { word: 'accommodate', meaning: '収容する、対応する', example: 'The hotel can accommodate 500 guests.', part: '動詞' },
      { word: 'allocate', meaning: '割り当てる、配分する', example: 'We need to allocate more budget for marketing.', part: '動詞' },
      { word: 'anticipate', meaning: '予測する、期待する', example: 'We anticipate strong sales this quarter.', part: '動詞' },
      { word: 'authorize', meaning: '許可する、認可する', example: 'Only managers can authorize purchases over $500.', part: '動詞' },
      { word: 'collaborate', meaning: '協力する、共同作業する', example: 'Our teams collaborate closely on projects.', part: '動詞' },
      { word: 'comprehensive', meaning: '包括的な、総合的な', example: 'We offer a comprehensive benefits package.', part: '形容詞' },
      { word: 'deadline', meaning: '締め切り、期限', example: 'The deadline for submissions is Friday.', part: '名詞' },
      { word: 'delegate', meaning: '委任する、代表者', example: 'She delegated the task to her assistant.', part: '動詞/名詞' },
      { word: 'efficient', meaning: '効率的な', example: 'The new system is more efficient than the old one.', part: '形容詞' },
      { word: 'estimate', meaning: '見積もる、推定する', example: 'Please provide an estimate for the repairs.', part: '動詞/名詞' },
      { word: 'facilitate', meaning: '促進する、容易にする', example: 'Technology facilitates remote work.', part: '動詞' },
      { word: 'implement', meaning: '実施する、導入する', example: 'We will implement the new policy next month.', part: '動詞' },
    ],
  },
  {
    id: 'finance',
    name: 'ファイナンス・会計語彙',
    description: 'TOEIC頻出 金融・会計単語',
    level: '730点目標',
    words: [
      { word: 'amortize', meaning: '償却する、分割払いにする', example: 'The loan will be amortized over 10 years.', part: '動詞' },
      { word: 'audit', meaning: '監査する、会計検査', example: 'The company undergoes an annual audit.', part: '動詞/名詞' },
      { word: 'depreciation', meaning: '減価償却、価値の下落', example: 'Equipment depreciation affects the balance sheet.', part: '名詞' },
      { word: 'dividend', meaning: '配当金', example: 'Shareholders received a dividend this quarter.', part: '名詞' },
      { word: 'expenditure', meaning: '支出、経費', example: 'The annual expenditure exceeded the budget.', part: '名詞' },
      { word: 'fiscal', meaning: '財政の、会計の', example: 'The fiscal year ends in December.', part: '形容詞' },
      { word: 'invoice', meaning: '請求書、インボイス', example: 'Please send the invoice to our accounting department.', part: '名詞' },
      { word: 'liability', meaning: '負債、責任', example: 'The company has significant liabilities.', part: '名詞' },
      { word: 'portfolio', meaning: 'ポートフォリオ、有価証券一覧', example: 'She manages a diverse investment portfolio.', part: '名詞' },
      { word: 'revenue', meaning: '収益、歳入', example: 'Annual revenue increased by 15%.', part: '名詞' },
      { word: 'surplus', meaning: '余剰、黒字', example: 'The budget showed a surplus this year.', part: '名詞' },
      { word: 'transaction', meaning: '取引、処理', example: 'All transactions are recorded automatically.', part: '名詞' },
    ],
  },
  {
    id: 'office-hr',
    name: 'オフィス・人事語彙',
    description: 'TOEIC頻出 職場・人事単語',
    level: '730点目標',
    words: [
      { word: 'appraisal', meaning: '評価、査定', example: 'Annual performance appraisals are conducted in December.', part: '名詞' },
      { word: 'candidate', meaning: '候補者、応募者', example: 'We interviewed five candidates for the position.', part: '名詞' },
      { word: 'commute', meaning: '通勤する、通勤', example: 'She commutes two hours each day.', part: '動詞/名詞' },
      { word: 'compensation', meaning: '報酬、補償', example: 'The compensation package includes health insurance.', part: '名詞' },
      { word: 'comply', meaning: '従う、順守する', example: 'All employees must comply with safety regulations.', part: '動詞' },
      { word: 'consecutive', meaning: '連続した', example: 'He worked five consecutive weekends.', part: '形容詞' },
      { word: 'convene', meaning: '召集する、集まる', example: 'The board will convene next Tuesday.', part: '動詞' },
      { word: 'credentials', meaning: '資格、証明書', example: 'Please submit your credentials with your application.', part: '名詞' },
      { word: 'probationary', meaning: '試用期間の', example: 'New hires have a 90-day probationary period.', part: '形容詞' },
      { word: 'relocate', meaning: '移転する、引っ越す', example: 'The company will relocate its headquarters.', part: '動詞' },
      { word: 'resign', meaning: '辞職する', example: 'She resigned from her position last week.', part: '動詞' },
      { word: 'roster', meaning: '名簿、一覧表', example: 'Please check the roster for your shift.', part: '名詞' },
    ],
  },
  {
    id: 'advanced-vocab',
    name: 'ハイスコア必須語彙',
    description: '860点以上を目指す上級単語',
    level: '860点目標',
    words: [
      { word: 'accolade', meaning: '賞賛、栄誉', example: 'The product received numerous accolades.', part: '名詞' },
      { word: 'amalgamate', meaning: '合併する、統合する', example: 'The two departments will amalgamate next year.', part: '動詞' },
      { word: 'benchmark', meaning: '基準、指標', example: 'This sets a benchmark for industry standards.', part: '名詞' },
      { word: 'contingency', meaning: '不測の事態、緊急事態', example: 'We have a contingency plan in place.', part: '名詞' },
      { word: 'discretionary', meaning: '任意の、裁量による', example: 'Employees receive discretionary bonuses.', part: '形容詞' },
      { word: 'expedite', meaning: '迅速に処理する', example: 'We need to expedite the approval process.', part: '動詞' },
      { word: 'incumbent', meaning: '現職者、義務がある', example: 'It is incumbent upon managers to inform staff.', part: '名詞/形容詞' },
      { word: 'leverage', meaning: '活用する、てこの力', example: 'We can leverage our existing customer base.', part: '動詞/名詞' },
      { word: 'mandate', meaning: '義務付ける、命令', example: 'Attendance is mandated for all staff.', part: '動詞/名詞' },
      { word: 'proprietary', meaning: '専有の、特許の', example: 'This is our proprietary technology.', part: '形容詞' },
      { word: 'reconcile', meaning: '調整する、和解する', example: 'We need to reconcile the accounts.', part: '動詞' },
      { word: 'streamline', meaning: '合理化する、効率化する', example: 'We will streamline our operations.', part: '動詞' },
    ],
  },
]

export const PRACTICE_QUESTIONS: Record<number, Question[]> = {
  5: [
    {
      id: 1,
      text: 'The new marketing strategy _____ significant results within just three months of implementation.',
      options: ['produces', 'produced', 'producing', 'production'],
      correct: 1,
      explanation: '過去形(produced)が正解。',
      explanationDetail: {
        point: '時制の選択',
        rule: '"within just three months of implementation"という副詞句は、実施から3ヶ月という過去の完結した期間を指します。過去の出来事を述べる場合は過去形を使います。',
        wrongChoices: '(A) produces: 現在形のため不可 / (C) producing: 現在分詞のため主語・述語関係が崩れる / (D) production: 名詞のため動詞の位置に入れない',
        tip: 'TOEIC時制問題の鉄則：副詞句（yesterday, last year, ago, within...等）が過去を示していれば過去形を選ぶ。',
      },
      category: '時制',
    },
    {
      id: 2,
      text: 'Employees are required to submit _____ expense reports by the end of each month.',
      options: ['them', 'their', 'they', 'theirs'],
      correct: 1,
      explanation: '所有格代名詞(their)が正解。',
      explanationDetail: {
        point: '代名詞の格',
        rule: '空欄の直後に名詞(expense reports)があるため、名詞を修飾できる所有格(their)が必要です。',
        wrongChoices: '(A) them: 目的格のため名詞を修飾できない / (C) they: 主格のため名詞を修飾できない / (D) theirs: 独立所有格（後ろに名詞不要）なので不適切',
        tip: '代名詞問題は空欄の前後を確認：後ろに名詞→所有格(my/your/their)、動詞の目的語→目的格(me/you/them)',
      },
      category: '代名詞',
    },
    {
      id: 3,
      text: 'The conference will be held _____ the Hilton Hotel on March 15.',
      options: ['in', 'at', 'on', 'by'],
      correct: 1,
      explanation: '前置詞(at)が正解。',
      explanationDetail: {
        point: '場所の前置詞',
        rule: 'atは特定の地点・施設（ホテル、駅、空港など）を示します。建物名の前にはatを使うのがTOEIC頻出パターンです。',
        wrongChoices: '(A) in: 空間の内部（in the room）や都市・国名（in Tokyo）に使用 / (C) on: 表面や通り名（on the desk, on Main Street）に使用 / (D) by: 手段や期限（by train, by Friday）に使用',
        tip: 'at + ホテル/空港/駅名、in + 部屋/建物内部/都市名、on + 通り名/フロア名。この3パターンを丸暗記！',
      },
      category: '前置詞',
    },
    {
      id: 4,
      text: 'The report must be _____ reviewed before submission to ensure accuracy.',
      options: ['care', 'careful', 'carefully', 'carefulness'],
      correct: 2,
      explanation: '副詞(carefully)が正解。',
      explanationDetail: {
        point: '品詞の識別（副詞）',
        rule: '空欄は動詞(reviewed)を修飾する位置にあるため、副詞が必要です。副詞は動詞・形容詞・他の副詞を修飾します。',
        wrongChoices: '(A) care: 名詞または動詞 / (B) careful: 形容詞（名詞を修飾するか補語になる）/ (D) carefulness: 名詞',
        tip: '品詞問題の見極め方：①空欄の前後を確認 ②動詞の前後→副詞 ③名詞の前→形容詞 ④この形 -fully/-ously/-ily は副詞のサイン',
      },
      category: '品詞',
    },
    {
      id: 5,
      text: '_____ the project deadline is approaching, all team members must prioritize their tasks.',
      options: ['Although', 'Because', 'However', 'Despite'],
      correct: 1,
      explanation: '接続詞(Because)が正解。',
      explanationDetail: {
        point: '接続詞・論理関係',
        rule: '文全体の論理関係：「締め切りが迫っている（原因）→ 優先順位をつけなければならない（結果）」という因果関係。Becauseは原因・理由を示す接続詞です。',
        wrongChoices: '(A) Although: 逆接（〜にもかかわらず）で文脈に合わない / (C) However: 副詞のため2つの節を直接つなげない / (D) Despite: 前置詞のため後ろに動詞節は続かない（Despite + 名詞）',
        tip: 'Despite/In spite of + 名詞（句）、Although/Though/Even though + 主語 + 動詞。これは超頻出！Despiteの後に節が来たら誤答。',
      },
      category: '接続詞',
    },
    {
      id: 6,
      text: 'Mr. Johnson has been _____ as the new director of operations.',
      options: ['appoint', 'appointed', 'appointing', 'appointment'],
      correct: 1,
      explanation: '現在完了受動態(appointed)が正解。',
      explanationDetail: {
        point: '受動態と能動態',
        rule: 'has been + 過去分詞(appointed)で現在完了受動態を形成します。「任命された」という受け身の意味になります。appoint(任命する)は他動詞で、受動態では appoint → appointed。',
        wrongChoices: '(A) appoint: 動詞原形（has been の後は過去分詞が必要）/ (C) appointing: 現在分詞（能動進行形になり意味が変わる）/ (D) appointment: 名詞（動詞の位置に入れない）',
        tip: 'has/have been + 過去分詞 = 現在完了受動態。TOEIC Part 5では「be + 過去分詞」か「be + 現在分詞」かの区別が頻出！',
      },
      category: '態',
    },
    {
      id: 7,
      text: 'The company offers _____ competitive salary packages to attract top talent.',
      options: ['high', 'highly', 'higher', 'highest'],
      correct: 1,
      explanation: '副詞(highly)が正解。',
      explanationDetail: {
        point: '形容詞 vs 副詞',
        rule: '空欄の直後に形容詞(competitive)があるため、形容詞を修飾する副詞(highly)が必要です。highly competitive = 非常に競争力のある、という意味になります。',
        wrongChoices: '(A) high: 形容詞または副詞だが、highly competitiveという決まり表現があり文脈に合わない / (C) higher: 比較級（than がない）/ (D) highest: 最上級（the がない）',
        tip: 'highly + 形容詞のコロケーションはTOEIC頻出：highly qualified(高度な資格を持つ)、highly recommend(強く推薦する)、highly unlikely(まずありえない)',
      },
      category: '副詞',
    },
    {
      id: 8,
      text: 'Customers who purchase three or more items will receive a _____ discount.',
      options: ['specify', 'special', 'specially', 'specificity'],
      correct: 1,
      explanation: '形容詞(special)が正解。',
      explanationDetail: {
        point: '品詞の識別（形容詞）',
        rule: '空欄は冠詞(a)と名詞(discount)の間にあるため、名詞を修飾する形容詞が必要です。',
        wrongChoices: '(A) specify: 動詞（〜を明示する）/ (C) specially: 副詞（形容詞を修飾するが、名詞の前には置けない）/ (D) specificity: 名詞（a + 名詞 + 名詞という形は不自然）',
        tip: '冠詞(a/an/the)の直後、または所有格(my/your)の直後に空欄があれば→形容詞が入る！これを覚えれば品詞問題の半分は解ける。',
      },
      category: '品詞',
    },
    {
      id: 9,
      text: 'The merger will allow both companies to _____ their resources more effectively.',
      options: ['combine', 'combining', 'combined', 'combination'],
      correct: 0,
      explanation: '動詞原形(combine)が正解。',
      explanationDetail: {
        point: 'to不定詞の形',
        rule: 'allow + 目的語 + to不定詞の構文。to不定詞のtoの後は動詞の原形が必ずきます。',
        wrongChoices: '(B) combining: 動名詞または現在分詞（to の後には原形）/ (C) combined: 過去分詞（to combined は不自然）/ (D) combination: 名詞（to + 名詞で目的・用途の意味になるが文脈に合わない）',
        tip: 'allow/enable/permit/require/ask/tell + 目的語 + to + 動詞原形 という構文はTOEIC超頻出！この形を丸暗記しよう。',
      },
      category: '動詞の形',
    },
    {
      id: 10,
      text: 'The manager asked that all reports be submitted _____ than scheduled.',
      options: ['early', 'earlier', 'earliest', 'most early'],
      correct: 1,
      explanation: '比較級(earlier)が正解。',
      explanationDetail: {
        point: '比較級の形成',
        rule: 'than があるので比較級が必要です。earlyの比較級はearlier（-erをつける）です。',
        wrongChoices: '(A) early: 原級（thanとセットでは使えない）/ (C) earliest: 最上級（the...est、thanとセットでは使えない）/ (D) most early: 誤った最上級の形（正しくはthe earliest）',
        tip: '比較級のシグナル：than の存在！thanを見たら比較級(more.../ ...er)を選ぶ。最上級のシグナル：the の存在、またはof all/in the world等。',
      },
      category: '比較',
    },
    {
      id: 11,
      text: 'The sales figures for the third quarter were _____ than those of the previous year.',
      options: ['encouragingly', 'encouraging', 'more encouraging', 'most encouraging'],
      correct: 2,
      explanation: '比較級(more encouraging)が正解。',
      explanationDetail: {
        point: '長い形容詞の比較級',
        rule: '2音節以上の形容詞（encouraging等）の比較級はmore + 形容詞で表します。than があるので比較級が必要。',
        wrongChoices: '(A) encouragingly: 副詞（wereの後の補語には形容詞が来る）/ (B) encouraging: 原級（thanとセットでは不可）/ (D) most encouraging: 最上級（thanとセットでは不可）',
        tip: '1音節の形容詞：比較級は-er（bigger, faster）/ 2音節以上の形容詞：比較級はmore（more efficient, more complex）',
      },
      category: '比較',
    },
    {
      id: 12,
      text: 'The factory will _____ operations next month after completing safety inspections.',
      options: ['resume', 'resuming', 'resumed', 'resumption'],
      correct: 0,
      explanation: '動詞原形(resume)が正解。',
      explanationDetail: {
        point: '助動詞の後の動詞形',
        rule: 'will の後には動詞の原形が続きます。助動詞(will/can/may/should等)の後は常に動詞原形。',
        wrongChoices: '(B) resuming: 現在分詞（will + 現在分詞は不可）/ (C) resumed: 過去形または過去分詞（will + 過去形は不可）/ (D) resumption: 名詞（動詞の位置に名詞は入れない）',
        tip: '助動詞の後は必ず動詞原形！will/would/can/could/may/might/should/must + 動詞原形。これはTOEICの絶対法則。',
      },
      category: '動詞の形',
    },
    {
      id: 13,
      text: 'Please contact _____ if you have any questions about the new software.',
      options: ['I', 'my', 'me', 'mine'],
      correct: 2,
      explanation: '目的格代名詞(me)が正解。',
      explanationDetail: {
        point: '代名詞の格（目的格）',
        rule: '動詞(contact)の目的語になるため、目的格(me)が必要です。',
        wrongChoices: '(A) I: 主格（文の主語になる）/ (B) my: 所有格（名詞の前に置く）/ (D) mine: 独立所有格（後ろに名詞不要、例：That book is mine）',
        tip: '動詞の後 = 目的格(me/you/him/her/us/them)、前置詞の後 = 目的格、名詞の前 = 所有格(my/your/his/her/our/their)',
      },
      category: '代名詞',
    },
    {
      id: 14,
      text: 'The new employee training program has proven to be quite _____ in improving productivity.',
      options: ['effect', 'effective', 'effectively', 'effectiveness'],
      correct: 1,
      explanation: '形容詞(effective)が正解。',
      explanationDetail: {
        point: 'be動詞の後の品詞',
        rule: 'proven to be の後には形容詞または名詞が補語として続きます。quite（とても）は副詞で形容詞を修飾するため、quite + 形容詞の形になります。',
        wrongChoices: '(A) effect: 名詞（quite effect は不自然）/ (C) effectively: 副詞（be quite effectively は不自然）/ (D) effectiveness: 名詞（quite + 名詞は通常使わない）',
        tip: 'quite/very/fairly/rather + 形容詞 の組み合わせはTOEIC頻出。これらの後には必ず形容詞！',
      },
      category: '品詞',
    },
    {
      id: 15,
      text: '_____ attending the annual conference, all participants must register online by October 1.',
      options: ['Prior to', 'As a result of', 'Instead of', 'In addition to'],
      correct: 0,
      explanation: '前置詞句(Prior to)が正解。',
      explanationDetail: {
        point: '前置詞句の意味',
        rule: '"Prior to attending" = 参加する前に。カンファレンスに参加する前に登録が必要という文脈に合います。',
        wrongChoices: '(B) As a result of: 〜の結果として（因果関係を示す）/ (C) Instead of: 〜の代わりに（代替を示す）/ (D) In addition to: 〜に加えて（追加を示す）',
        tip: 'prior to = before（〜の前に）、subsequent to = after（〜の後に）。TOEICではprior toがbeforeより高頻度で登場！',
      },
      category: '前置詞',
    },
  ],
  6: [
    {
      id: 1,
      text: `Dear Ms. Thompson,

Thank you for your interest in the Project Manager position at Apex Solutions. We were impressed with your application and would like to _____ you for an interview.

Please confirm your availability for next week.`,
      options: ['invite', 'invited', 'inviting', 'invitation'],
      correct: 0,
      explanation: '動詞原形(invite)が正解。',
      explanationDetail: {
        point: 'to不定詞の構造',
        rule: '"would like to + 動詞原形"は英語の基本構文。to の後は必ず動詞原形が続きます。文脈は「面接にご招待したい」という採用メールの定型表現。',
        wrongChoices: '(B) invited: 過去分詞（to invited は文法的に不可）/ (C) inviting: 現在分詞（to inviting も不可）/ (D) invitation: 名詞（would like to + 名詞の場合は意味が変わる）',
        tip: 'TOEIC採用メールの定型文：We would like to invite you for an interview. / We are pleased to inform you that... このような表現は繰り返し出題される！',
      },
      category: '動詞の形',
    },
    {
      id: 2,
      text: `To: All Staff
Re: Office Renovation

Please be _____ that the main conference room will be unavailable from Monday through Wednesday next week due to scheduled renovations.

Alternative rooms are available on the third floor.`,
      options: ['advised', 'advising', 'advisory', 'advice'],
      correct: 0,
      explanation: '受動態(advised)が正解。',
      explanationDetail: {
        point: 'ビジネス慣用表現',
        rule: '"Please be advised that..." は「〜をお知らせします・ご承知ください」というビジネス英語の定型表現です。be + 過去分詞(advised)の受動態形式。',
        wrongChoices: '(B) advising: 現在分詞（be advising は進行形になる）/ (C) advisory: 形容詞または名詞（be advisory は不自然）/ (D) advice: 名詞（be advice は不自然）',
        tip: 'TOEIC Part 6で狙われるビジネス定型文：Please be advised that...（通知）、Please be informed that...（案内）、Please note that...（注意）',
      },
      category: '慣用表現',
    },
    {
      id: 3,
      text: `Northgate Shopping Mall
Spring Sale Notice

The Northgate Shopping Mall is pleased to announce its annual Spring Sale. _____, all participating stores will offer discounts of 20 to 50 percent on selected items.

The sale will run from April 5 through April 12. Customers who spend over $100 will receive a free gift.`,
      options: [
        'For the duration of the event',
        'Instead of the regular price',
        'According to recent surveys',
        'Regardless of the season',
      ],
      correct: 0,
      explanation: '文脈に合う文挿入(For the duration of the event)が正解。',
      explanationDetail: {
        point: 'Part 6 文挿入問題',
        rule: '文挿入問題は前後の文脈を必ず確認します。この空欄の後に「全参加店舗が20〜50%引き」とあり、「イベント期間中は」という時間的文脈が最も自然。',
        wrongChoices: '(B) Instead of the regular price: 通常価格の代わりに（文脈不一致）/ (C) According to recent surveys: 最近の調査によれば（文脈不一致）/ (D) Regardless of the season: 季節に関わらず（スプリングセールなので矛盾）',
        tip: '文挿入問題の解き方：①空欄前後の文を読む ②代名詞の指示先を確認 ③時制の一致を確認 ④全体の文書の論理の流れに合うものを選ぶ',
      },
      category: '文挿入',
    },
    {
      id: 4,
      text: `Memo
From: HR Department
To: All Employees
Re: Benefits Enrollment

The annual benefits enrollment period begins on November 1. Employees who wish to make changes to their health insurance coverage must do _____ by November 30.

Forms are available on the company intranet.`,
      options: ['so', 'this', 'it', 'such'],
      correct: 0,
      explanation: '代名詞(so)が正解。',
      explanationDetail: {
        point: '代動詞・代名詞の使い方',
        rule: '"do so" = 前述の動詞句（make changes to their health insurance coverage）を指す。"do so"はフォーマルな文書でよく使われる表現で、前に述べた行為を繰り返さずに指示する。',
        wrongChoices: '(B) this: do this も可能だが、do so の方がフォーマルで文書的 / (C) it: do it は非フォーマルで文書には不適切 / (D) such: do such は文法的に不自然',
        tip: 'do so はビジネス文書や正式文書でよく使われる表現。If you wish to apply, please do so by...（申し込む場合は〜までに）という形でTOEICに頻出！',
      },
      category: '代名詞',
    },
  ],
  7: [
    {
      id: 1,
      text: `HIGHLAND TECH SOLUTIONS
Job Opening: Senior Software Engineer

Highland Tech Solutions is seeking an experienced software engineer to join our growing team.

Requirements:
- 5+ years of experience in software development
- Proficiency in Python, JavaScript, or Java
- Strong problem-solving skills
- Experience with agile methodologies

We offer competitive salaries, flexible working hours, and comprehensive benefits.

To apply, send your resume to careers@highlandtech.com by April 30.`,
      question: 'What is one requirement for the position?',
      options: [
        'A degree in computer science',
        'Previous management experience',
        'Knowledge of specific programming languages',
        'Certification in agile methodology',
      ],
      correct: 2,
      explanation: '"Proficiency in Python, JavaScript, or Java"（特定のプログラミング言語の知識）が要件として記載されている。',
      explanationDetail: {
        point: 'Part 7 詳細情報問題',
        rule: '設問の"requirement"（要件）に対応する箇所をスキャニングで探します。Requirements セクションに "Proficiency in Python, JavaScript, or Java"（特定言語の習熟度）があります。',
        wrongChoices: '(A) コンピューターサイエンスの学位：本文に記載なし / (B) 管理職経験：本文に記載なし / (D) アジャイル認定：本文には「経験」が要件で「認定証」とは書かれていない',
        tip: 'Part 7詳細問題の解き方：①設問の疑問詞と主要語（requirement, purpose, when等）を確認 ②本文の対応する箇所にスキャニング ③選択肢と本文の表現が言い換えられていることに注意！',
      },
      category: '詳細情報',
    },
    {
      id: 2,
      text: `HIGHLAND TECH SOLUTIONS
Job Opening: Senior Software Engineer

Highland Tech Solutions is seeking an experienced software engineer to join our growing team.

Requirements:
- 5+ years of experience in software development
- Proficiency in Python, JavaScript, or Java
- Strong problem-solving skills
- Experience with agile methodologies

We offer competitive salaries, flexible working hours, and comprehensive benefits.

To apply, send your resume to careers@highlandtech.com by April 30.`,
      question: 'By what date should applications be submitted?',
      options: [
        'March 30',
        'April 1',
        'April 30',
        'May 1',
      ],
      correct: 2,
      explanation: '本文末尾に"by April 30"と明記されている。',
      explanationDetail: {
        point: 'Part 7 日付・期限の情報',
        rule: '"by" は期限を示す前置詞。"send your resume... by April 30" = 4月30日までに履歴書を送ること。期限・日付を問う設問はスキャニングで素早く解けます。',
        wrongChoices: '誤答選択肢には実際の日付前後の日付が並んでいます。これは混乱を狙ったTOEICの典型的なトラップです。',
        tip: '数字・日付は文書中に目立つため、スキャニングで素早く発見できます。by/until/before の違いに注意：by = 期限、until = 継続（〜まで）、before = 〜より前',
      },
      category: '詳細情報',
    },
    {
      id: 3,
      text: `To: marketing@globalinc.com
From: sarah.chen@globalinc.com
Subject: Q3 Campaign Results

Hi Team,

I wanted to share the results from our third-quarter marketing campaign. Overall, the campaign exceeded expectations with a 23% increase in website traffic and a 15% improvement in conversion rates compared to Q2.

However, our social media engagement was lower than anticipated. I recommend we review our content strategy for Q4 and consider working with influencers to boost our online presence.

The full report will be available on the shared drive by end of day Friday.

Best regards,
Sarah Chen
Marketing Director`,
      question: 'What does Sarah recommend for the next quarter?',
      options: [
        'Increasing the overall marketing budget',
        'Revising the content strategy and exploring influencer partnerships',
        'Focusing more on website development',
        'Reducing social media activity',
      ],
      correct: 1,
      explanation: '"review our content strategy" + "consider working with influencers" = コンテンツ戦略の見直しとインフルエンサー活用が正解。',
      explanationDetail: {
        point: 'Part 7 推奨・提案問題',
        rule: '"I recommend" の後に提案内容が続きます。①"review our content strategy"（コンテンツ戦略見直し）②"consider working with influencers"（インフルエンサー活用）の2つをまとめた選択肢が正解。',
        wrongChoices: '(A) 予算増加：本文に記載なし / (C) ウェブサイト開発：本文ではウェブトラフィックが増加しており問題なし / (D) SNS活動を減らす：逆。SNS強化を提案している',
        tip: '「推奨/提案」問題のシグナル語句：recommend, suggest, advise, propose + that節/動名詞。"What does X recommend/suggest?" という設問は頻出！',
      },
      category: '推測・目的',
    },
    {
      id: 4,
      text: `NOTICE TO RESIDENTS
Greenwood Apartment Complex

Due to maintenance work on the water supply system, water service will be temporarily suspended in all units from 8:00 A.M. to 2:00 P.M. on Thursday, September 14.

Residents are advised to store adequate water in advance. We apologize for any inconvenience this may cause.

For questions, contact the building manager at (555) 890-1234 or manager@greenwoodapts.com.

Greenwood Management Team`,
      question: 'What will residents experience on September 14?',
      options: [
        'A scheduled fire drill',
        'Temporary loss of water service',
        'Electrical maintenance',
        'Relocation to another unit',
      ],
      correct: 1,
      explanation: '"water service will be temporarily suspended" = 水道サービスが一時的に停止される。',
      explanationDetail: {
        point: 'Part 7 告知文の主題把握',
        rule: '"water service will be temporarily suspended" が設問の答えです。suspended = 停止された。"residents experience" → "water service suspended" の言い換えに注意。',
        wrongChoices: '(A) 消防訓練：記載なし / (C) 電気メンテナンス：誤り（水道のメンテナンス）/ (D) 別の部屋への移動：記載なし',
        tip: '告知文（Notice）でよく出るパターン：施設の一時閉鎖・工事・停電・水道停止の告知。Who/What/When/Where/Whyの情報を素早くスキャン！',
      },
      category: '詳細情報',
    },
  ],
}

export interface Question {
  id: number
  text: string
  options: string[]
  correct: number
  explanation: string
  explanationDetail?: {
    point: string        // 問われているポイント
    rule: string         // 文法・語法ルール
    wrongChoices?: string // 誤答の理由
    tip?: string         // 覚え方・TOEIC攻略ヒント
  }
  category: string
  question?: string
}

export interface StudySession {
  date: string
  part: number
  score: number
  total: number
  timeSpent: number
}

export function getScoreLevel(score: number) {
  return SCORE_LEVELS.find(l => score >= l.min && score <= l.max) || SCORE_LEVELS[0]
}

export function estimateTotalScore(answers: Record<number, number>): number {
  const partScores: Record<number, number> = {
    1: (answers[1] || 0) * 16,
    2: (answers[2] || 0) * 9,
    3: (answers[3] || 0) * 9,
    4: (answers[4] || 0) * 9,
    5: (answers[5] || 0) * 9,
    6: (answers[6] || 0) * 14,
    7: (answers[7] || 0) * 8,
  }
  const total = Object.values(partScores).reduce((a, b) => a + b, 0)
  return Math.min(990, Math.max(10, total))
}
