// ビルド後の静的HTML生成（SEO用）。
//
// これまで全ページが空の <div id="root"></div> だけを返すSPAで、検索エンジンや
// SNSのクローラーに本文・見出し・内部リンクがほぼ見えていなかった。
// ここで React をサーバー描画して各HTMLに埋め込み、さらに
//   - 商品カテゴリ別のランディングページ /category/<slug>/
//   - sitemap.xml / robots.txt
//   - 構造化データ（JSON-LD）
// を dist/ に出力する。ブラウザ側は src/shared/mount.jsx でハイドレーションする。
//
// 使い方: vite build && vite build --ssr src/entry-server.jsx --outDir .ssr-build && node scripts/prerender.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://hikaku-labo.vercel.app').replace(/\/$/, '');

const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// JSON-LD 内で </script> が閉じタグとして解釈されないようにする
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

export function setHead(html, { title, description, canonical, structuredData = [] }) {
  let out = html;
  const replaceOrFail = (pattern, replacement, label) => {
    if (!pattern.test(out)) throw new Error(`prerender: ${label} がテンプレートに見つかりません`);
    out = out.replace(pattern, replacement);
  };
  if (title) {
    replaceOrFail(/<title>[^<]*<\/title>/, `<title>${escapeText(title)}</title>`, '<title>');
    out = out.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(title)}$2`);
  }
  if (description) {
    replaceOrFail(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`, 'meta description');
    out = out.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`);
  }
  if (canonical) {
    replaceOrFail(/(<link rel="canonical" href=")[^"]*(")/, `$1${escapeAttr(canonical)}$2`, 'canonical');
    out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escapeAttr(canonical)}$2`);
  }
  if (structuredData.length) {
    out = out.replace('</head>', `${structuredData.map(jsonLd).join('\n')}\n</head>`);
  }
  return out;
}

export function injectApp(html, appHtml) {
  const marker = /<div id="root"><\/div>/;
  if (!marker.test(html)) throw new Error('prerender: <div id="root"></div> が見つかりません');
  return html.replace(marker, () => `<div id="root">${appHtml}</div>`);
}

const breadcrumb = items => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
});

export function buildSitemap(urls, lastmod) {
  const body = urls.map(url => `  <url><loc>${escapeText(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function main() {
  const server = await import(pathToFileURL(join(root, '.ssr-build', 'entry-server.js')).href);
  const { render, PRODUCT_CATEGORIES, categoryPath, categoryPageTitle, SERVICES, TRAVEL_FAQ } = server;

  const homeTemplate = await readFile(join(dist, 'index.html'), 'utf8');
  const toolsTemplate = await readFile(join(dist, 'tools', 'index.html'), 'utf8');
  const travelTemplate = await readFile(join(dist, 'travel', 'index.html'), 'utf8');
  const home = { name: '比較ラボ', url: `${SITE_URL}/` };

  // トップページ
  await write(join(dist, 'index.html'), injectApp(setHead(homeTemplate, {
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '比較ラボ',
      url: `${SITE_URL}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?keyword={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    }],
  }), render('home', '/')));

  // カテゴリ別ランディングページ
  for (const category of PRODUCT_CATEGORIES) {
    const path = categoryPath(category);
    const url = `${SITE_URL}${path}`;
    const html = setHead(homeTemplate, {
      title: categoryPageTitle(category),
      description: category.description,
      canonical: url,
      structuredData: [breadcrumb([home, { name: `${category.label}の価格比較`, url }])],
    });
    await write(join(dist, path, 'index.html'), injectApp(html, render('home', path)));
  }

  // ITツール診断
  const toolsUrl = `${SITE_URL}/tools/`;
  await write(join(dist, 'tools', 'index.html'), injectApp(setHead(toolsTemplate, {
    structuredData: [
      breadcrumb([home, { name: '無料ITツール診断', url: toolsUrl }]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '比較ラボで比較しているITサービス',
        itemListElement: SERVICES.map((service, index) => ({ '@type': 'ListItem', position: index + 1, name: service.name, url: service.officialUrl })),
      },
    ],
  }), render('tools', '/tools/')));

  // 旅行予算
  const travelUrl = `${SITE_URL}/travel/`;
  await write(join(dist, 'travel', 'index.html'), injectApp(setHead(travelTemplate, {
    structuredData: [
      breadcrumb([home, { name: '旅行予算シミュレーター', url: travelUrl }]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: TRAVEL_FAQ.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
      },
    ],
  }), render('travel', '/travel/')));

  const urls = [`${SITE_URL}/`, ...PRODUCT_CATEGORIES.map(c => `${SITE_URL}${categoryPath(c)}`), toolsUrl, travelUrl];
  await write(join(dist, 'sitemap.xml'), buildSitemap(urls, new Date().toISOString().slice(0, 10)));
  await write(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`prerender: ${urls.length} pages, sitemap.xml, robots.txt を出力しました`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error); process.exit(1); });
}
