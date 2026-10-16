// 商品カテゴリの単一の定義。トップページのカテゴリナビ・フッター・
// カテゴリ別ランディングページ（/category/<slug>/）・sitemap.xml が共通で参照する。
//
// genreId は楽天市場のジャンルID。www.rakuten.co.jp/category/<id>/ のページ名で確認済み（2026-10-16）。
// 以前の値は 501293=マウンテンバイク、201026=食品、568453=鉄板 などカテゴリと無関係で、
// カテゴリを押しても目的の商品がほとんど出ない状態だった。変更時は必ず同じ方法で確認すること。
//
// guide は一般的な選び方の観点だけを書く。特定商品の性能・順位・体験談は書かない（根拠がないため）。
export const PRODUCT_CATEGORIES = Object.freeze([
  {
    slug: 'smartphone', label: 'スマートフォン', genreId: '560202', emoji: '📱',
    keyword: 'スマートフォン',
    related: ['iPhone', 'Android スマホ', 'SIMフリー スマホ', 'スマホケース'],
    description: 'スマートフォン本体の価格・ポイント還元後の実質価格・レビュー評価を楽天市場の商品データで比較。Amazon・Yahoo!ショッピングの検索結果も確認できます。',
    guide: [
      { title: 'SIMフリーか、キャリア版か', body: '販売ページに「SIMフリー」「SIMロック解除済み」等の記載があるかを確認しましょう。中古・未使用品は利用制限（ネットワーク利用制限）の表記もチェックします。' },
      { title: 'ストレージ容量は余裕を持って', body: '写真や動画を多く撮る場合、容量不足は後から増やせない機種もあります。同じ機種でも容量違いで価格差が大きいため、比較表で揃えて比べましょう。' },
      { title: '新品・中古・整備済み品の違い', body: '状態ランク、保証期間、バッテリー状態の記載はショップごとに異なります。価格だけでなく保証条件まで確認するのが安全です。' },
    ],
  },
  {
    slug: 'pc', label: 'パソコン', genreId: '100026', emoji: '💻',
    keyword: 'ノートパソコン',
    related: ['ノートパソコン', 'ゲーミングPC', 'MacBook', 'モニター'],
    description: 'ノートパソコン・デスクトップPCの価格とポイント還元後の実質価格を比較。楽天市場の実データをもとに、Amazon・Yahoo!ショッピングでの検索も1クリックで。',
    guide: [
      { title: '用途からメモリ容量を決める', body: '事務作業・ウェブ閲覧中心か、写真・動画編集やゲームをするかで必要なメモリやCPUが変わります。商品名だけでなく仕様欄の数値を確認しましょう。' },
      { title: 'OS・Officeの有無を確認', body: '同じ型番でもOfficeソフトの有無で価格が変わります。「Office付き」「Officeなし」の表記を揃えて比較してください。' },
      { title: '持ち運ぶなら重さと端子', body: 'ノートPCを持ち歩くなら重量やバッテリー駆動時間、使いたい周辺機器に合う端子（USB-C、HDMI等）があるかが使い勝手を左右します。' },
    ],
  },
  {
    slug: 'camera', label: 'カメラ', genreId: '100212', emoji: '📷',
    keyword: 'カメラ',
    related: ['ミラーレス一眼', 'デジタルカメラ', 'アクションカメラ', 'SDカード'],
    description: 'ミラーレス一眼・デジタルカメラ・ビデオカメラの価格を比較。ポイント還元後の実質価格やレビュー件数を並べて確認できます。',
    guide: [
      { title: 'ボディ単体かレンズキットか', body: 'レンズ交換式カメラは「ボディのみ」と「レンズキット」で価格が大きく違います。比較するときはセット内容を揃えましょう。' },
      { title: '国内正規品と並行輸入品', body: '並行輸入品はメーカー保証の扱いが異なる場合があります。保証条件は販売ページで必ず確認してください。' },
      { title: '記録メディアと予備バッテリー', body: '撮影枚数や動画撮影の時間によっては、SDカードや予備バッテリーが追加で必要になります。総額で考えると比較しやすくなります。' },
    ],
  },
  {
    slug: 'tv', label: 'テレビ', genreId: '211742', emoji: '📺',
    keyword: 'テレビ',
    related: ['4Kテレビ', '有機ELテレビ', '液晶テレビ 32型', 'テレビ台'],
    description: '4Kテレビ・有機EL・液晶テレビの価格を比較。楽天市場の商品データで送料区分・ポイント倍率・実質価格をまとめて確認できます。',
    guide: [
      { title: '部屋に合うサイズを選ぶ', body: '設置場所の幅と視聴距離から無理のないサイズを決めましょう。スタンドの奥行きや壁掛け対応も確認ポイントです。' },
      { title: 'チューナー数と録画', body: '裏番組録画をしたい場合はチューナー数や外付けHDD録画への対応を確認します。4K放送を見るなら4Kチューナー内蔵かどうかも重要です。' },
      { title: '設置・リサイクル費用', body: '大型テレビは配送・設置費や、古いテレビのリサイクル料金が別途かかることがあります。商品価格だけでなく総額を確認しましょう。' },
    ],
  },
  {
    slug: 'earphone', label: 'イヤホン', genreId: '502835', emoji: '🎧',
    keyword: 'ワイヤレスイヤホン',
    related: ['ワイヤレスイヤホン', 'ノイズキャンセリング イヤホン', 'ヘッドホン', '骨伝導イヤホン'],
    description: 'ワイヤレスイヤホン・ヘッドホンの価格とレビュー評価を比較。ポイント還元後の実質価格で、楽天市場・Amazon・Yahoo!ショッピングをまとめてチェック。',
    guide: [
      { title: '使う場面で機能を選ぶ', body: '通勤・通学ならノイズキャンセリング、運動中なら防水・防汗性能、通話が多いならマイク性能など、使う場面で優先する機能が変わります。' },
      { title: '対応コーデックと接続', body: '使っているスマートフォンと対応コーデックの組み合わせで音質や遅延が変わることがあります。複数機器を使うならマルチポイント対応も確認しましょう。' },
      { title: 'バッテリーと保証', body: '本体とケース込みの再生時間、充電端子、メーカー保証の有無を販売ページで確認してください。' },
    ],
  },
  {
    slug: 'kaden', label: '家電', genreId: '562637', emoji: '🏠',
    keyword: '家電',
    related: ['ドラム式洗濯機', 'ロボット掃除機', '電子レンジ', '空気清浄機'],
    description: '洗濯機・掃除機・キッチン家電など生活家電の価格を比較。楽天市場の実データで、ポイント還元後の実質価格と送料区分を確認できます。',
    guide: [
      { title: '設置スペースと搬入経路', body: '洗濯機や冷蔵庫などの大型家電は、本体サイズに加えて搬入経路や扉の開き方まで確認しておくと失敗を防げます。' },
      { title: '型落ちモデルも比較する', body: '新モデルと前年モデルで機能差が小さい場合、型落ちのほうが価格を抑えられることがあります。仕様を見比べて判断しましょう。' },
      { title: '設置・引き取りの条件', body: '標準設置や旧製品の引き取りが含まれるかはショップによって異なります。オプション料金を含めた総額で比較してください。' },
    ],
  },
  {
    slug: 'game', label: 'ゲーム', genreId: '101205', emoji: '🎮',
    keyword: 'ゲーム機',
    related: ['Nintendo Switch', 'PlayStation 5', 'ゲームソフト', 'コントローラー'],
    description: 'ゲーム機本体・ソフト・周辺機器の価格を比較。楽天市場のポイント倍率を反映した実質価格で、お得な購入先を探せます。',
    guide: [
      { title: '本体の型番・セット内容', body: '同じゲーム機でもモデルや同梱物（ソフト・コントローラー等）で価格が変わります。型番とセット内容を揃えて比べましょう。' },
      { title: 'ダウンロード版とパッケージ版', body: 'ソフトはダウンロード版（コード）とパッケージ版で価格や中古売却のしやすさが異なります。' },
      { title: '新品・中古の保証', body: '中古本体は保証の有無や付属品の欠品に注意。販売ページの状態説明を確認してください。' },
    ],
  },
  {
    slug: 'fashion', label: 'レディースファッション', genreId: '100371', emoji: '👗',
    keyword: 'レディース ファッション',
    related: ['ワンピース', 'カーディガン', 'レディース スニーカー', 'トートバッグ'],
    description: 'レディースファッションアイテムの価格を比較。ポイント還元後の実質価格・レビュー評価・送料区分を楽天市場の商品データで確認できます。',
    guide: [
      { title: 'サイズ表の実寸を確認', body: '同じ表記サイズでもブランドによって実寸が違います。手持ちの服の実寸と比べると失敗を減らせます。' },
      { title: '返品・交換の条件', body: 'サイズ交換や返品の可否・送料負担はショップごとに異なります。購入前に確認しておきましょう。' },
      { title: '素材とお手入れ', body: '洗濯機で洗えるか、シワになりにくいかなど、素材の表記からお手入れのしやすさも比べられます。' },
    ],
  },
]);

export function findCategoryBySlug(slug) {
  return PRODUCT_CATEGORIES.find(category => category.slug === slug) || null;
}

export function findCategoryByGenreId(genreId) {
  return PRODUCT_CATEGORIES.find(category => category.genreId === String(genreId)) || null;
}

export function categoryPath(category) {
  return `/category/${category.slug}/`;
}

// /category/<slug>/ 形式のパスからカテゴリを取り出す（末尾スラッシュ有無を許容）
export function categoryFromPath(pathname = '') {
  const match = /^\/category\/([a-z0-9-]+)\/?$/.exec(pathname);
  return match ? findCategoryBySlug(match[1]) : null;
}

export function categoryPageTitle(category) {
  return `${category.label}の価格比較・最安値｜ポイント還元後の実質価格で比べる｜比較ラボ`;
}

// URL（/category/<slug>/ または ?keyword=&genreId=）から表示状態を決める。
// サーバー側の静的HTML生成でも同じ関数を使い、初期表示を一致させる。
export function resolveInitialView(pathname = '/', search = '') {
  const byPath = categoryFromPath(pathname);
  if (byPath) return { category: byPath, keyword: '' };
  const params = new URLSearchParams(search);
  const keyword = (params.get('keyword') || '').slice(0, 128);
  const byGenre = findCategoryByGenreId(params.get('genreId') || '');
  if (byGenre && (!keyword || keyword === byGenre.label)) return { category: byGenre, keyword: '' };
  return { category: null, keyword };
}
