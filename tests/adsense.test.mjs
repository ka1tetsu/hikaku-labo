import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { adsenseConfig, adsenseSlot, adsenseScriptUrl, adsenseHeadSnippet, adsenseAdsTxtLine } from '../src/shared/adsenseConfig.js';
import { INFO_PAGES } from '../src/shared/infoContent.js';

const VALID_ENV = {
  VITE_ADSENSE_PUBLISHER_ID: 'ca-pub-1234567890123456',
  VITE_ADSENSE_SLOT_FOOTER: '1111111111',
  VITE_ADSENSE_SLOT_GUIDE_MID: '2222222222',
  VITE_ADSENSE_SLOT_GUIDE_END: '3333333333',
};

test('adsense stays fully disabled without a valid publisher ID', () => {
  for (const env of [{}, { VITE_ADSENSE_PUBLISHER_ID: '' }, { VITE_ADSENSE_PUBLISHER_ID: 'ca-pub-123' }, { VITE_ADSENSE_PUBLISHER_ID: 'pub-1234567890123456' }, { VITE_ADSENSE_PUBLISHER_ID: 'ca-pub-12345678901234567' }, undefined, null]) {
    const config = adsenseConfig(env);
    assert.equal(config.enabled, false, JSON.stringify(env));
    assert.equal(config.publisherId, null);
    assert.equal(adsenseSlot(config, 'footer'), null);
    assert.equal(adsenseScriptUrl(config), null);
    assert.equal(adsenseHeadSnippet(config), '');
    assert.equal(adsenseAdsTxtLine(config), '');
  }
});

test('a valid publisher ID enables config, script URL, head snippet and ads.txt line', () => {
  const config = adsenseConfig(VALID_ENV);
  assert.equal(config.enabled, true);
  assert.equal(config.publisherId, 'ca-pub-1234567890123456');
  assert.equal(adsenseScriptUrl(config), 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456');
  const snippet = adsenseHeadSnippet(config);
  assert.ok(snippet.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456'));
  assert.ok(snippet.includes('crossorigin="anonymous"'));
  assert.equal(adsenseAdsTxtLine(config), 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0');
});

test('each placement needs its own numeric slot ID', () => {
  const config = adsenseConfig(VALID_ENV);
  assert.equal(adsenseSlot(config, 'footer'), '1111111111');
  assert.equal(adsenseSlot(config, 'guide-mid'), '2222222222');
  assert.equal(adsenseSlot(config, 'guide-end'), '3333333333');
  assert.equal(adsenseSlot(config, 'unknown-placement'), null);
  const partial = adsenseConfig({ VITE_ADSENSE_PUBLISHER_ID: VALID_ENV.VITE_ADSENSE_PUBLISHER_ID });
  assert.equal(partial.enabled, true);
  assert.equal(adsenseSlot(partial, 'footer'), null);
  const malformed = adsenseConfig({ ...VALID_ENV, VITE_ADSENSE_SLOT_FOOTER: 'abc' });
  assert.equal(adsenseSlot(malformed, 'footer'), null);
  assert.equal(adsenseSlot(malformed, 'guide-mid'), '2222222222');
});

test('AdSlot renders nothing while unconfigured and the labelled unit once configured', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'error' });
  try {
    const { default: AdSlot } = await vite.ssrLoadModule('/src/shared/AdSlot.jsx');
    const render = props => renderToStaticMarkup(createElement(AdSlot, props));
    assert.equal(render({ config: adsenseConfig({}) }), '');
    assert.equal(render({ config: adsenseConfig({ VITE_ADSENSE_PUBLISHER_ID: VALID_ENV.VITE_ADSENSE_PUBLISHER_ID }) }), '');
    const html = render({ config: adsenseConfig(VALID_ENV) });
    assert.ok(html.includes('class="adsbygoogle"'));
    assert.ok(html.includes('data-ad-client="ca-pub-1234567890123456"'));
    assert.ok(html.includes('data-ad-slot="1111111111"'));
    assert.ok(html.includes('広告'));
    assert.ok(!html.includes('pagead2.googlesyndication.com'), 'SSR markup must not preload the ad script');
  } finally {
    await vite.close();
  }
});

test('every static guide loads the adsense guide module next to the concierge mount', async () => {
  const guides = (await readdir(new URL('../guides/', import.meta.url), { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name);
  assert.ok(guides.length >= 14);
  for (const guide of guides) {
    const html = await readFile(new URL(`../guides/${guide}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes('/src/shared/adsenseGuide.js'), guide);
    assert.ok(!html.includes('pagead2.googlesyndication.com'), guide + ' must not hardcode the ad script');
    assert.ok(!html.includes('ca-pub-'), guide + ' must not hardcode a publisher ID');
  }
});

test('privacy page explains third-party ad delivery and cookies', () => {
  const privacy = INFO_PAGES.find(page => page.path === '/privacy/');
  assert.ok(privacy);
  const text = privacy.sections.map(([title, body]) => title + body).join('\n');
  assert.ok(text.includes('Google AdSense'));
  assert.ok(text.includes('第三者配信事業者'));
  assert.ok(text.includes('Cookie'));
  assert.ok(text.includes('adssettings.google.com'));
});
