import { parseFragment } from 'parse5';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { DESTINATION_CATALOG } from '../src/travel/destinations.js';

const attributes = {
  table: ['border', 'cellpadding', 'cellspacing', 'style'], tr: ['style'], tbody: [],
  td: ['style'], div: ['style'], p: ['style'], br: [],
  a: ['href', 'target', 'rel', 'style'], img: ['src', 'border', 'style', 'alt', 'title', 'width', 'height'],
};
const cssProperties = new Set(['border', 'border-radius', 'background-color', 'margin', 'padding', 'text-align', 'overflow', 'width', 'vertical-align', 'display', 'font-size', 'line-height', 'word-wrap', 'color']);
function trustedUrl(raw, host) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port) throw new Error('許可された楽天のHTTPS素材だけを使用できます。');
  return url;
}
function textContent(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textContent).join('');
}

// Parse, inspect and retain the supplied bytes; never rewrite affiliate HTML.
export function inspectTravelAd(html, { destination } = {}) {
  if (typeof html !== 'string' || !html.trim() || Buffer.byteLength(html) > 32768) throw new Error('広告HTMLは空でない32KB以内の素材を指定してください。');
  const links = [], images = [];
  function visit(node) {
    if (node.tagName) {
      if (!Object.hasOwn(attributes, node.tagName)) throw new Error('未対応のHTML要素です: ' + node.tagName);
      for (const attr of node.attrs || []) {
        if (attr.namespace || !attributes[node.tagName].includes(attr.name)) throw new Error('未対応のHTML属性です: ' + attr.name);
        if (attr.name === 'style') for (const declaration of attr.value.split(';').filter(value => value.trim())) {
          const match = declaration.trim().match(/^([a-z-]+)\s*:\s*([-#a-zA-Z0-9.,%\s]+)$/);
          if (!match || !cssProperties.has(match[1])) throw new Error('未対応の広告スタイルです。');
        }
      }
      const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
      if (node.tagName === 'a') {
        if (attrs.target !== '_blank' || !['sponsored', 'noopener'].every(value => (attrs.rel || '').split(/\s+/).includes(value))) throw new Error('広告リンクにはtarget="_blank"とsponsored・noopenerが必要です。');
        links.push({ url: trustedUrl(attrs.href, 'hb.afl.rakuten.co.jp'), name: textContent(node).trim() });
      }
      if (node.tagName === 'img') images.push(trustedUrl(attrs.src, 'hbb.afl.rakuten.co.jp'));
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parseFragment(html));
  if (!links.length || !images.length || links.some(link => link.url.href !== links[0].url.href)) throw new Error('1施設分の楽天トラベル画像・テキスト素材を指定してください。');
  const affiliateId = links[0].url.pathname.match(/^\/hgc\/([a-f0-9]+(?:\.[a-f0-9]+){3})\/$/)?.[1];
  if (!affiliateId) throw new Error('楽天の紹介IDを読み取れません。');
  const landing = trustedUrl(links[0].url.searchParams.get('pc'), 'travel.rakuten.co.jp');
  const hotelId = landing.pathname.match(/^\/HOTEL\/(\d+)\/\1\.html$/)?.[1];
  if (!hotelId || images.some(image => image.pathname !== '/hgb/' + affiliateId + '/' || image.searchParams.get('item_id') !== hotelId)) throw new Error('施設番号と広告画像が一致しません。');
  const names = [...new Set(links.map(link => link.name).filter(Boolean))];
  if (names.length !== 1) throw new Error('施設名を一意に読み取れません。');
  const matches = DESTINATION_CATALOG.filter(city => city.area === 'domestic' && names[0].includes(city.name));
  const city = destination ? DESTINATION_CATALOG.find(city => city.id === destination && city.area === 'domestic') : matches.length === 1 ? matches[0] : null;
  if (!city) throw new Error('旅行先を一意に判定できません。--destination に掲載先の都市IDを指定してください。');
  return { id: 'rakuten-hotel-' + hotelId, name: names[0], destinationId: city.id, hotelId, affiliateId, sha256: createHash('sha256').update(html).digest('hex') };
}

export async function importTravelAds(sources, { directory = new URL('../src/travel/ads/', import.meta.url), destination, replace = false } = {}) {
  // Validate the entire batch before changing any registered material.
  const batch = new Map();
  for (const html of sources) {
    const ad = inspectTravelAd(html, { destination });
    const duplicate = batch.get(ad.id);
    if (duplicate && duplicate.ad.sha256 !== ad.sha256) throw new Error('同じ施設の異なる素材が含まれています: ' + ad.id);
    batch.set(ad.id, { ad, html });
  }
  if (!batch.size) throw new Error('登録するHTML素材がありません。');
  const indexUrl = new URL('index.json', directory);
  let entries;
  try { entries = JSON.parse(await readFile(indexUrl, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; entries = []; }
  if (!Array.isArray(entries)) throw new Error('広告一覧が壊れています。');
  const results = [], writes = [];
  for (const { ad, html } of batch.values()) {
    const previous = entries.find(entry => entry.id === ad.id);
    if (previous && previous.sha256 === ad.sha256 && previous.destinationId === ad.destinationId) {
      if (await readFile(new URL(ad.id + '.html', directory), 'utf8') !== html) throw new Error('保存済みの原文HTMLが一致しません。');
      results.push({ ...ad, status: 'unchanged' });
      continue;
    }
    if (previous && !replace) throw new Error('同じ施設の別素材が登録済みです。差し替える場合のみ --replace を指定してください。');
    writes.push({ ad, html });
    results.push({ ...ad, status: previous ? 'replaced' : 'added' });
  }
  if (writes.length) {
    await mkdir(directory, { recursive: true });
    for (const { ad, html } of writes) await writeFile(new URL(ad.id + '.html', directory), html);
    const updated = new Map(entries.map(entry => [entry.id, entry]));
    for (const { ad } of writes) updated.set(ad.id, ad);
    await writeFile(indexUrl, JSON.stringify([...updated.values()], null, 2) + '\n');
  }
  return results;
}

export async function importTravelAd(html, options = {}) {
  return (await importTravelAds([html], options))[0];
}

export async function importTravelAdDirectory(source, options = {}) {
  const files = [];
  async function discover(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('素材フォルダ内のシンボリックリンクは使用できません。');
      if (entry.isDirectory()) await discover(path);
      else if (/\.html?$/i.test(entry.name)) files.push(path);
    }
  }
  await discover(resolve(source));
  return importTravelAds(await Promise.all(files.map(file => readFile(file, 'utf8'))), options);
}

async function main() {
  const args = process.argv.slice(2), options = {};
  let file, sourceDirectory;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--file') { file = args.shift(); if (!file || file.startsWith('--')) throw new Error('--file にHTMLファイルを指定してください。'); }
    else if (arg === '--destination') { options.destination = args.shift(); if (!options.destination || options.destination.startsWith('--')) throw new Error('--destination に都市IDを指定してください。'); }
    else if (arg === '--directory') { sourceDirectory = args.shift(); if (!sourceDirectory || sourceDirectory.startsWith('--')) throw new Error('--directory に素材フォルダを指定してください。'); }
    else if (arg === '--replace') options.replace = true;
    else throw new Error('使い方: npm run ads:import -- (--file 素材.html | --directory 素材フォルダ) [--destination hakodate] [--replace]（ファイル省略時は標準入力）');
  }
  if (file && sourceDirectory) throw new Error('--file と --directory は同時に指定できません。');
  if (sourceDirectory) {
    const results = await importTravelAdDirectory(sourceDirectory, options);
    console.log(JSON.stringify({ count: results.length, results }, null, 2));
    return;
  }
  let html;
  if (file) html = await readFile(file, 'utf8');
  else {
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 32768) throw new Error('広告HTMLは32KB以内で指定してください。');
      chunks.push(chunk);
    }
    html = Buffer.concat(chunks).toString('utf8');
  }
  console.log(JSON.stringify(await importTravelAd(html, options), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
