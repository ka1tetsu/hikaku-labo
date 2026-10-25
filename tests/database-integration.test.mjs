import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { databaseRoutes, databaseSitemap, syncDatabaseRoutes } from '../scripts/sync-database-routes.mjs';

const read = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));

test('every database page, asset and API prefix maps to the existing service without replacing comparison routes', async () => {
  const manifest = await read('integration/vividatabase.json');
  const { rewrites } = databaseRoutes(manifest);
  for (const path of ['/database', '/screener', '/company', '/osint', '/signals', '/data', '/_next', '/api/v1', '/api/health', '/api/osint', '/v1', '/mcp']) {
    assert.ok(rewrites.some(rule => rule.source === path + '/:path*' && rule.destination === manifest.upstream + path + '/:path*'), path);
    if (path !== manifest.entry) assert.ok(rewrites.some(rule => rule.source === path && rule.destination === manifest.upstream + path), 'bare ' + path);
  }
  const roots = new Set(rewrites.filter(rule => !rule.has).map(rule => rule.source));
  for (const path of ['/', '/compare', '/tools', '/travel', '/life', '/sim', '/hikari', '/card', '/hoken', '/about', '/privacy', '/api/search', '/api/track', '/api/compare']) assert.equal(roots.has(path + '/:path*'), false, path);
  assert.ok(rewrites.filter(rule => rule.source === '/').every(rule => rule.has?.length === 1 && ['q', 'status'].includes(rule.has[0].key)));
  assert.equal(rewrites.filter(rule => rule.source === '/database').length, 1);
  assert.equal(rewrites.find(rule => rule.source === '/database').destination, manifest.upstream + '/');
  const sitemap = databaseSitemap(manifest);
  assert.match(sitemap, /<loc>https:\/\/vivlica.com\/database<\/loc>/);
  assert.doesNotMatch(sitemap, /workers\.dev|\/owner|\/billing|\/console/);
  assert.equal(rewrites.some(rule => rule.source === manifest.sitemap), false);
});

test('private login and billing stay on the established authenticated origin with nonpersistent redirects', async () => {
  const manifest = await read('integration/vividatabase.json');
  const { rewrites, redirects, headers } = databaseRoutes(manifest);
  for (const prefix of manifest.private) {
    const source = prefix + '/:path*';
    assert.equal(rewrites.some(rule => rule.source === source), false);
    assert.deepEqual(redirects.find(rule => rule.source === source), { source, destination: manifest.upstream + source, permanent: false });
    assert.ok(headers.find(rule => rule.source === source).headers.some(header => header.key === 'Cache-Control' && header.value === 'no-store'));
  }
});

test('database proxy cannot be redirected to an arbitrary upstream and checked-in routes remain reproducible', async () => {
  const manifest = await read('integration/vividatabase.json');
  for (const upstream of ['http://vivlica.vivlica.workers.dev', 'https://other.example', 'https://user:secret@vivlica.vivlica.workers.dev']) assert.throws(() => databaseRoutes({ ...manifest, upstream }));
  await syncDatabaseRoutes({ check: true });
});
