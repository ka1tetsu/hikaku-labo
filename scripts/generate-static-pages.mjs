// 静的ページ生成スクリプト
// SPAはJS実行前に本文が存在せず検索エンジンに評価されにくいため、
// 法務ページと購買ガイドを「素のHTML」として public/ に出力する。
// Viteは public/ をそのままdistへコピーするため、追加の設定なしで公開される。

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

const CATEGORIES = [
    { slug: 'smartphone', label: 'スマートフォン', genreId: '101240', emoji: '📱' },
    { slug: 'pc', label: 'パソコン', genreId: '501293', emoji: '💻' },
    { slug: 'camera', label: 'カメラ', genreId: '201026', emoji: '📷' },
    { slug: 'tv', label: 'テレビ', genreId: '213010', emoji: '📺' },
    { slug: 'earphone', label: 'イヤホン', genreId: '216131', emoji: '🎧' },
    { slug: 'appliance', label: '家電', genreId: '100804', emoji: '🏠' },
    { slug: 'game', label: 'ゲーム', genreId: '568453', emoji: '🎮' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function layout({ title, description, path, body, breadcrumb }) {
    const url = `${SITE}${path}`;
    const crumbLd = breadcrumb
        ? `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumb.map((b, i) => ({
                '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE}${b.path}`,
            })),
        })}</script>`
        : '';

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)} | 比較ラボ</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="比較ラボ" />
<meta property="og:title" content="${esc(title)} | 比較ラボ" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:locale" content="ja_JP" />
<meta name="twitter:card" content="summary_large_image" />
${crumbLd}
<style>
:root{--primary:#bf0000;--text:#222;--sub:#555;--border:#ddd;--bg:#f4f4f4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Noto Sans JP','Hiragino Kaku Gothic Pro',Meiryo,sans-serif;line-height:1.8}
a{color:#0033cc}
header{background:var(--primary);padding:12px 0}
header .inner{max-width:980px;margin:0 auto;padding:0 16px}
header a{color:#fff;text-decoration:none;font-size:1.4rem;font-weight:900}
header .y{color:#FFD700}
main{max-width:980px;margin:0 auto;padding:24px 16px}
.card{background:#fff;border:1px solid var(--border);border-radius:6px;padding:24px;margin-bottom:20px}
h1{font-size:1.5rem;margin:0 0 8px;border-left:5px solid var(--primary);padding-left:12px}
h2{font-size:1.15rem;margin:28px 0 8px;border-bottom:2px solid var(--border);padding-bottom:6px}
h3{font-size:1rem;margin:20px 0 6px}
.crumb{font-size:.8rem;color:var(--sub);margin-bottom:14px}
.lead{color:var(--sub)}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:.9rem}
th,td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}
th{background:#fafafa;white-space:nowrap}
.cta{display:inline-block;background:var(--primary);color:#fff!important;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:4px;margin-top:12px}
.links{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.links a{display:inline-block;background:#fff;border:1px solid var(--border);border-radius:20px;padding:6px 14px;text-decoration:none;font-size:.85rem}
.note{background:#fff8e6;border:1px solid #ffd596;border-radius:4px;padding:12px;font-size:.85rem;color:#7a4f00}
footer{background:#333;color:#ccc;padding:20px 0;font-size:.8rem}
footer .inner{max-width:980px;margin:0 auto;padding:0 16px}
footer a{color:#9cf}
.overflow{overflow-x:auto}
</style>
</head>
<body>
<header><div class="inner"><a href="/">比較<span class="y">ラボ</span></a></div></header>
<main>
${breadcrumb ? `<div class="crumb">${breadcrumb.map((b, i) => i === breadcrumb.length - 1 ? esc(b.name) : `<a href="${b.path}">${esc(b.name)}</a>`).join(' › ')}</div>` : ''}
${body}
</main>
<footer><div class="inner">
<p>※当サイトは楽天アフィリエイト・Amazonアソシエイト・ValueCommerce等のアフィリエイトプログラムに参加しています。リンク経由での購入により当サイトが収益を得る場合があります。</p>
<p><a href="/">トップ</a>・<a href="/about/">運営者情報</a>・<a href="/privacy/">プライバシーポリシー</a>・<a href="/terms/">利用規約</a>・<a href="/disclosure/">アフィリエイト開示</a>・<a href="/contact/">お問い合わせ</a></p>
<p>© 2026 比較ラボ</p>
</div></footer>
</body>
</html>
`;
}

// ---------- 購買ガイド本文（カテゴリ別の独自コンテンツ） ----------
const GUIDE_CONTENT = {
    smartphone: {
        desc: 'スマートフォンの選び方を価格帯別に解説。カメラ・バッテリー・画面など、価格差で何が変わるのかを整理し、予算から逆算して選ぶ手順を紹介します。',
        intro: 'スマートフォンは価格帯によって「何が良くなるのか」がはっきり分かれます。ここでは予算から逆算して、過不足のない1台を選ぶための判断材料を整理します。',
        table: [
            ['〜3万円', '日常利用中心。通話・SNS・地図が快適に使えれば十分な方向け。動作は軽めのアプリが中心。'],
            ['3〜7万円', '性能と価格のバランス帯。写真もそこそこ綺麗に撮れ、数年使う前提でも不満が出にくい。'],
            ['7〜12万円', 'カメラ・処理性能が明確に向上。写真や動画をよく撮る方、ゲームをする方向け。'],
            ['12万円〜', '最上位帯。望遠カメラや高リフレッシュレート画面など、こだわり用途向けの装備が揃う。'],
        ],
        points: [
            ['バッテリー容量', '4,000mAh以上あると一日の外出で電池切れを起こしにくくなります。使い方が重いほど重要度が上がります。'],
            ['画面サイズ', '6.1インチ前後が片手操作と見やすさのバランス点。動画視聴が多いなら6.5インチ以上も選択肢です。'],
            ['カメラ', '画素数よりもセンサーサイズや手ぶれ補正の有無が仕上がりに効きます。暗所での撮影が多いかで判断しましょう。'],
            ['ストレージ', '写真・動画を多く残すなら128GB以上を推奨。後から増設できない機種が多い点に注意してください。'],
        ],
    },
    pc: {
        desc: 'ノートパソコンの選び方を用途別に解説。事務作業・動画編集・ゲームで必要になるCPU・メモリ・ストレージの目安をまとめました。',
        intro: 'パソコンは「用途に対して足りているか」で選ぶのが最短です。スペック表の数字よりも、やりたいことに必要な水準を押さえましょう。',
        table: [
            ['文書作成・Web閲覧', 'CPUは廉価帯でも十分。メモリ8GB、SSD256GB以上が快適さの下限です。'],
            ['オフィス業務・複数タブ', 'メモリ16GBを推奨。タブやアプリを多数開いても動作が重くなりにくくなります。'],
            ['写真・動画編集', 'CPU性能とメモリ16〜32GB、SSD512GB以上。書き出し時間に直結します。'],
            ['PCゲーム', '独立GPU搭載機が前提。メモリ16GB以上、ストレージも容量に余裕を持たせましょう。'],
        ],
        points: [
            ['メモリ', '後から増設できない機種が増えています。購入時点で余裕を持たせるのが安全です。'],
            ['ストレージ', 'SSDが基本。容量は写真・動画の保存量から逆算しましょう。'],
            ['重量', '持ち運ぶなら1.3kg以下が目安。据え置き中心なら重量より画面サイズを優先できます。'],
            ['画面', '作業効率を重視するなら解像度と縦の広さが効きます。長時間使うなら映り込みの少ない非光沢も選択肢です。'],
        ],
    },
    camera: {
        desc: 'カメラの選び方を解説。センサーサイズ・レンズ・手ぶれ補正など、写真の仕上がりを左右する要素を整理します。',
        intro: 'カメラは本体だけでなくレンズ込みで考えるのが基本です。撮りたい被写体から逆算すると選択肢が絞れます。',
        table: [
            ['スナップ・旅行', '軽量なミラーレスや高級コンパクト。持ち歩ける重さかどうかが最重要です。'],
            ['ポートレート', '大きめのセンサーと明るい単焦点レンズ。背景をぼかしやすくなります。'],
            ['スポーツ・動物', '連写性能とオートフォーカス追従性能。望遠レンズが前提になります。'],
            ['動画撮影', '手ぶれ補正と記録形式を確認。長時間撮影時の発熱にも注意しましょう。'],
        ],
        points: [
            ['センサーサイズ', '大きいほど暗所に強く階調も豊かになりますが、本体とレンズが大きく重くなります。'],
            ['手ぶれ補正', '暗い場所や望遠撮影での歩留まりが大きく変わります。'],
            ['レンズ資産', 'マウントを変えるとレンズを買い直しになります。長く使う前提で選びましょう。'],
        ],
    },
    tv: {
        desc: 'テレビの選び方を解説。部屋の広さに合った画面サイズ、パネル種類、チューナーなど購入前の確認点をまとめました。',
        intro: 'テレビは「視聴距離に対して大きすぎないか」「必要な機能が入っているか」を押さえると失敗しません。',
        table: [
            ['〜6畳', '40〜43インチ程度。視聴距離が近いと大きすぎて疲れやすくなります。'],
            ['6〜8畳', '49〜55インチが目安。一般的なリビングで扱いやすいサイズ帯です。'],
            ['10畳以上', '55〜65インチ以上。離れて視聴するほど大画面が活きます。'],
        ],
        points: [
            ['パネル', '有機ELは黒の締まりとコントラストに優れ、液晶は明るい部屋に強く価格も抑えやすい傾向です。'],
            ['チューナー', '録画や4K放送の視聴要否で必要な構成が変わります。'],
            ['音質', '薄型化により内蔵スピーカーは音質が控えめな傾向です。映画をよく観るなら外部スピーカーも検討を。'],
        ],
    },
    earphone: {
        desc: 'ワイヤレスイヤホンの選び方を解説。ノイズキャンセリングの仕組み、装着方式、再生時間など基本を整理します。',
        intro: '使う場所と装着感で選ぶのが失敗しないコツです。スペックよりも「毎日つけたくなるか」が満足度を左右します。',
        table: [
            ['通勤・通学', 'ノイズキャンセリング搭載機。走行音の低減効果が体感しやすい環境です。'],
            ['在宅ワーク', '長時間つけても痛くならない装着感と、通話マイクの品質を重視。'],
            ['運動', '防水性能と落ちにくい装着方式。IPX4以上が目安です。'],
        ],
        points: [
            ['装着方式', 'カナル型は遮音性が高く、インナーイヤー型は圧迫感が少なめ。耳の形との相性が出ます。'],
            ['再生時間', '本体単体で6時間以上あると日常使いで困りにくくなります。'],
            ['ノイズキャンセリング', '低い連続音に強く、人の話し声などには効きにくい特性があります。'],
        ],
    },
    appliance: {
        desc: '生活家電の選び方を解説。設置スペース・容量・ランニングコストなど、購入前に確認したい点をまとめました。',
        intro: '家電は「置けるか」「容量が合っているか」を最初に確認しましょう。性能比較はその後で十分です。',
        table: [
            ['一人暮らし', '容量よりも設置スペース優先。搬入経路の幅も事前に測っておきましょう。'],
            ['二人〜家族', '使用頻度に対して容量が不足しないかを確認。余裕がある方が結果的に快適です。'],
        ],
        points: [
            ['設置スペース', '本体サイズだけでなく、放熱や扉の開閉に必要な余白も考慮が必要です。'],
            ['消費電力', '毎日使う家電ほど電気代の差が積み上がります。年間消費電力量を確認しましょう。'],
            ['お手入れ', 'フィルター清掃などの手間は継続利用の満足度に直結します。'],
        ],
    },
    game: {
        desc: 'ゲーム関連製品の選び方を解説。本体の違いや周辺機器の選定ポイントを整理します。',
        intro: '遊びたいタイトルが動く環境かどうかが出発点です。周辺機器は後から足せるため優先度は下がります。',
        table: [
            ['携帯して遊ぶ', '携帯モードのある機種。重量とバッテリー持ちを確認しましょう。'],
            ['据え置きで高画質', '性能重視の機種とテレビ側の対応。表示性能が活きる組み合わせかを確認。'],
        ],
        points: [
            ['対応タイトル', '遊びたいソフトが対応しているかを最初に確認しましょう。'],
            ['ストレージ', 'ダウンロード版中心なら容量不足になりやすく、増設可否の確認が重要です。'],
        ],
    },
};

function guidePage(cat) {
    const c = GUIDE_CONTENT[cat.slug];
    const others = CATEGORIES.filter(x => x.slug !== cat.slug);
    const body = `
<article class="card">
<h1>${esc(cat.label)}の選び方｜失敗しないための比較ポイント</h1>
<p class="lead">${esc(c.desc)}</p>
<p>${esc(c.intro)}</p>

<h2>用途・予算別の目安</h2>
<div class="overflow"><table>
<thead><tr><th>目安</th><th>選び方のポイント</th></tr></thead>
<tbody>${c.table.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody>
</table></div>

<h2>購入前に確認したい項目</h2>
${c.points.map(([k, v]) => `<h3>${esc(k)}</h3><p>${esc(v)}</p>`).join('\n')}

<h2>実際の価格を比較する</h2>
<p>条件が固まったら、楽天市場・Amazon・Yahoo!ショッピングの価格やレビューを並べて比較できます。価格帯やレビュー評価で絞り込んで候補を確認してください。</p>
<a class="cta" href="/?cat=${cat.genreId}">${esc(cat.label)}の価格を比較する ▶</a>
<p class="note">掲載している価格・レビューは各ECサイトから取得した時点の情報です。最新の価格および在庫状況は必ずリンク先の販売店でご確認ください。</p>

<h2>他のカテゴリの選び方</h2>
<ul class="links">${others.map(o => `<li><a href="/guide/${o.slug}/">${o.emoji} ${esc(o.label)}の選び方</a></li>`).join('')}</ul>
</article>`;
    return {
        path: `/guide/${cat.slug}/`,
        html: layout({
            title: `${cat.label}の選び方｜失敗しないための比較ポイント`,
            description: c.desc,
            path: `/guide/${cat.slug}/`,
            breadcrumb: [{ name: 'トップ', path: '/' }, { name: '購買ガイド', path: '/guide/' }, { name: `${cat.label}の選び方`, path: `/guide/${cat.slug}/` }],
            body,
        }),
    };
}

function guideIndex() {
    const body = `
<article class="card">
<h1>購買ガイド一覧</h1>
<p class="lead">カテゴリごとに「何を基準に選べばよいか」をまとめています。スペック表を読む前に、必要な水準を把握しておくと選択肢が絞りやすくなります。</p>
<ul class="links">${CATEGORIES.map(c => `<li><a href="/guide/${c.slug}/">${c.emoji} ${esc(c.label)}の選び方</a></li>`).join('')}</ul>
<h2>価格を比較する</h2>
<ul class="links">${CATEGORIES.map(c => `<li><a href="/?cat=${c.genreId}">${esc(c.label)}の価格比較</a></li>`).join('')}</ul>
</article>`;
    return {
        path: '/guide/',
        html: layout({
            title: '購買ガイド一覧｜カテゴリ別の選び方',
            description: 'スマートフォン・パソコン・カメラ・テレビ・イヤホン・家電・ゲームのカテゴリ別に、失敗しない選び方の基準をまとめた購買ガイド一覧です。',
            path: '/guide/',
            breadcrumb: [{ name: 'トップ', path: '/' }, { name: '購買ガイド', path: '/guide/' }],
            body,
        }),
    };
}

// ---------- 法務・運営ページ ----------
const LEGAL = [
    {
        path: '/about/', title: '運営者情報', description: '比較ラボの運営方針、掲載情報の取得元、収益の仕組みについて説明しています。',
        body: `<article class="card">
<h1>運営者情報</h1>
<h2>サイト名</h2><p>比較ラボ</p>
<h2>サイトの目的</h2>
<p>比較ラボは、楽天市場・Amazon・Yahoo!ショッピングなどの通販サイトで販売されている商品の価格やレビュー情報を横断して検索・比較できるサービスです。購入先を選ぶ際の判断材料を提供することを目的としています。</p>
<h2>掲載情報について</h2>
<p>商品名・価格・レビュー評価・レビュー件数・店舗名は、各ECサイトが提供するAPIを通じて取得した情報を表示しています。取得時点の情報であるため、実際の価格・在庫状況と異なる場合があります。ご購入前には必ずリンク先の販売店で最新情報をご確認ください。</p>
<p>当サイトは商品の販売を行っておらず、在庫の保有や発送、返品対応は行いません。売買契約は利用者と各販売店との間で成立します。</p>
<h2>収益について</h2>
<p>当サイトはアフィリエイトプログラムによる紹介料を収益源としています。詳細は<a href="/disclosure/">アフィリエイト開示</a>をご覧ください。</p>
<h2>お問い合わせ</h2>
<p><a href="/contact/">お問い合わせページ</a>よりご連絡ください。</p>
</article>`},
    {
        path: '/privacy/', title: 'プライバシーポリシー', description: '比較ラボにおける個人情報・アクセス解析・Cookieの取り扱いについて説明しています。',
        body: `<article class="card">
<h1>プライバシーポリシー</h1>
<p>比較ラボ（以下「当サイト」）における利用者情報の取り扱いについて、以下のとおり定めます。</p>
<h2>1. 取得する情報</h2>
<p>当サイトは、利用者が入力した検索キーワード、閲覧したページ、ブラウザの種類、参照元などの情報を取得する場合があります。氏名・住所・電話番号といった個人を直接特定する情報を、当サイトが入力フォームを通じて取得することはありません。</p>
<h2>2. アクセス解析ツールについて</h2>
<p>当サイトでは、サイトの利用状況を把握するためにアクセス解析ツールを使用する場合があります。これらのツールはCookieを利用して匿名のトラフィックデータを収集します。収集された情報は利用状況の分析およびサイト改善の目的で利用します。</p>
<p>Cookieの利用はブラウザの設定により無効化できます。設定方法はご利用のブラウザのヘルプをご確認ください。</p>
<h2>3. アフィリエイトプログラムとCookie</h2>
<p>当サイトは第三者のアフィリエイトプログラムに参加しています。これらのプログラムでは、利用者が当サイトのリンクを経由して各ECサイトを訪問した際に、成果の計測を目的としてCookieが利用されることがあります。これにより当サイトが利用者の個人情報を取得することはありません。</p>
<h2>4. 情報の第三者提供</h2>
<p>当サイトは、法令に基づく場合を除き、取得した情報を第三者に提供することはありません。</p>
<h2>5. 免責事項</h2>
<p>当サイトに掲載する価格・在庫・仕様等の情報は各ECサイトから取得した時点のものであり、正確性・最新性を保証するものではありません。掲載情報に基づいて利用者が行った行為により生じた損害について、当サイトは責任を負いかねます。</p>
<p>リンク先の外部サイトにおける個人情報の取り扱いについては、各サイトのプライバシーポリシーをご確認ください。</p>
<h2>6. 本ポリシーの変更</h2>
<p>本ポリシーの内容は、必要に応じて予告なく変更することがあります。変更後の内容は当ページに掲載した時点から効力を生じます。</p>
</article>`},
    {
        path: '/terms/', title: '利用規約', description: '比較ラボの利用条件、禁止事項、免責事項を定めた利用規約です。',
        body: `<article class="card">
<h1>利用規約</h1>
<p>本規約は、比較ラボ（以下「当サイト」）の利用条件を定めるものです。当サイトを利用された時点で、本規約に同意いただいたものとみなします。</p>
<h2>1. サービス内容</h2>
<p>当サイトは、各ECサイトが公開する商品情報を検索・比較して表示するサービスを提供します。当サイトは商品の販売者ではなく、売買契約は利用者と各販売店との間で直接成立します。</p>
<h2>2. 掲載情報について</h2>
<p>価格・在庫・仕様・レビュー等の情報は各ECサイトから取得した時点のものです。取得後に変更されている場合があるため、購入前には必ずリンク先の販売店で最新情報をご確認ください。当サイトはこれらの情報の正確性・完全性・最新性を保証しません。</p>
<h2>3. 禁止事項</h2>
<p>利用者は、当サイトの利用にあたり以下の行為を行ってはなりません。</p>
<ul>
<li>法令または公序良俗に違反する行為</li>
<li>当サイトの運営を妨害する行為、サーバーに過度な負荷をかける行為</li>
<li>当サイトの掲載内容を無断で複製・転載・改変する行為</li>
<li>他の利用者または第三者の権利を侵害する行為</li>
</ul>
<h2>4. 免責事項</h2>
<p>当サイトの利用または利用不能により生じた損害、およびリンク先の外部サイトにおける取引で生じたトラブルについて、当サイトは一切の責任を負いません。</p>
<p>当サイトは、予告なくサービス内容の変更・中断・終了を行う場合があります。</p>
<h2>5. 規約の変更</h2>
<p>本規約は必要に応じて変更することがあります。変更後の規約は当ページに掲載した時点から効力を生じます。</p>
</article>`},
    {
        path: '/disclosure/', title: 'アフィリエイト開示', description: '比較ラボが参加しているアフィリエイトプログラムと、収益の仕組みについて明示しています。',
        body: `<article class="card">
<h1>アフィリエイト開示</h1>
<p class="note">当サイトはアフィリエイトプログラムに参加しており、リンク経由での購入により紹介料を受け取る場合があります。</p>
<h2>参加しているプログラム</h2>
<ul>
<li>楽天アフィリエイト</li>
<li>Amazonアソシエイト・プログラム</li>
<li>バリューコマース（Yahoo!ショッピング等）</li>
</ul>
<h2>収益の仕組み</h2>
<p>当サイトに掲載している商品リンクの一部はアフィリエイトリンクです。利用者がこれらのリンクを経由して各ECサイトで商品を購入された場合、当サイトは各プログラムの規定に基づき紹介料を受け取ります。</p>
<p>紹介料は各ECサイトから当サイトに支払われるものであり、<strong>利用者の購入価格に上乗せされることはありません</strong>。利用者が追加の費用を負担することは一切ありません。</p>
<h2>掲載順・表示について</h2>
<p>検索結果の表示順は、利用者が選択した並び替え条件（価格・レビュー評価など）および各ECサイトのAPIが返す順序に基づいています。</p>
<p>購入ボタンの遷移先は、商品ページへの直接リンクが利用できる場合はそれを優先します。直接リンクが取得できない場合は、各ECサイト内の検索結果ページへ遷移します。</p>
<h2>Amazonアソシエイトについて</h2>
<p>当サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。</p>
<h2>掲載情報の正確性</h2>
<p>価格およびレビュー情報は各ECサイトから取得した時点のものであり、実際の販売価格と異なる場合があります。最新の価格は必ずリンク先でご確認ください。</p>
</article>`},
    {
        path: '/contact/', title: 'お問い合わせ', description: '比較ラボへのお問い合わせ方法についてご案内しています。',
        body: `<article class="card">
<h1>お問い合わせ</h1>
<p>当サイトに関するご意見・ご指摘・掲載内容の訂正依頼などは、下記の窓口までご連絡ください。</p>
<h2>お問い合わせ窓口</h2>
<p class="note">※お問い合わせ先のメールアドレスは、サイト運営者にて設定してください（本ページの内容を編集してください）。</p>
<h2>ご連絡いただく際のお願い</h2>
<ul>
<li>掲載内容に関するお問い合わせの場合、該当ページのURLをお知らせください。</li>
<li>商品の在庫・配送・返品に関するお問い合わせには対応できません。各販売店へ直接お問い合わせください。</li>
</ul>
<h2>商品に関するお問い合わせについて</h2>
<p>当サイトは商品の販売を行っておりません。購入した商品に関するお問い合わせは、購入元の販売店（楽天市場の各店舗、Amazon、Yahoo!ショッピングの各ストア等）へ直接ご連絡ください。</p>
</article>`},
];

async function run() {
    const pages = [
        guideIndex(),
        ...CATEGORIES.map(guidePage),
        ...LEGAL.map(l => ({
            path: l.path,
            html: layout({
                title: l.title, description: l.description, path: l.path, body: l.body,
                breadcrumb: [{ name: 'トップ', path: '/' }, { name: l.title, path: l.path }],
            }),
        })),
    ];

    for (const page of pages) {
        const outPath = join(PUBLIC, page.path, 'index.html');
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, page.html, 'utf-8');
    }

    // sitemap.xml を実在するURLで再生成
    const urls = [
        { loc: '/', priority: '1.0', freq: 'daily' },
        { loc: '/guide/', priority: '0.9', freq: 'weekly' },
        ...CATEGORIES.map(c => ({ loc: `/guide/${c.slug}/`, priority: '0.9', freq: 'weekly' })),
        ...CATEGORIES.map(c => ({ loc: `/?cat=${c.genreId}`, priority: '0.7', freq: 'daily' })),
        ...LEGAL.map(l => ({ loc: l.path, priority: '0.3', freq: 'monthly' })),
    ];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u.loc.replace(/&/g, '&amp;')}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
    await writeFile(join(PUBLIC, 'sitemap.xml'), sitemap, 'utf-8');

    console.log(`生成完了: ${pages.length}ページ + sitemap.xml`);
    for (const p of pages) console.log('  -', p.path);
}

run();
