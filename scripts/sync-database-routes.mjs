import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function databaseRoutes(manifest) {
  const { upstream, entry, pages, resources, apis, private: privatePaths } = manifest;
  const url = new URL(upstream);
  if (url.origin !== 'https://vivlica.vivlica.workers.dev' || url.href !== upstream + '/' || url.username || url.password) throw new Error('Unexpected database upstream');
  const publicPrefixes = [...pages, ...resources, ...apis];
  if (new Set([...publicPrefixes, ...privatePaths]).size !== publicPrefixes.length + privatePaths.length) throw new Error('Duplicate database routes');
  return {
    rewrites: [
      // Use the already deployed landing page; integration must not depend on
      // a simultaneous release of the independent database application.
      { source: entry, destination: upstream + '/' },
      ...['q', 'status'].map(key => ({ source: '/', has: [{ type: 'query', key }], destination: upstream + '/' })),
      // Match the bare prefix separately: an empty wildcard otherwise adds a
      // trailing slash, which changes Next's exact public API paths.
      ...publicPrefixes.flatMap(prefix => [
        ...(prefix === entry ? [] : [{ source: prefix, destination: upstream + prefix }]),
        { source: prefix + '/:path*', destination: upstream + prefix + '/:path*' },
      ]),
    ],
    redirects: privatePaths.flatMap(prefix => [
      { source: prefix, destination: upstream + prefix, permanent: false },
      { source: prefix + '/:path*', destination: upstream + prefix + '/:path*', permanent: false },
    ]),
    headers: privatePaths.map(prefix => ({ source: prefix + '/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
  };
}

export function databaseSitemap(manifest) {
  const paths = manifest.sitemapPages;
  if (!paths?.length || new Set(paths).size !== paths.length || paths.some(path => !/^\/[a-z0-9/-]+$/.test(path) || !manifest.pages.some(prefix => path === prefix || path.startsWith(prefix + '/')))) throw new Error('Invalid database sitemap paths');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + paths.map(path => `  <url><loc>https://vivlica.com${path}</loc></url>`).join('\n') + '\n</urlset>\n';
}

export async function syncDatabaseRoutes({ check = false } = {}) {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('integration/vividatabase.json', root), 'utf8'));
  const configPath = new URL('vercel.json', root);
  if (manifest.sitemap !== '/sitemap-database.xml') throw new Error('Unexpected database sitemap filename');
  const sitemapPath = new URL('public' + manifest.sitemap, root);
  const sitemap = databaseSitemap(manifest);
  const previousSitemap = await readFile(sitemapPath, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
  if (check && sitemap !== previousSitemap) throw new Error('Run npm run sync:database-routes and commit the database sitemap');
  if (!check && sitemap !== previousSitemap) await writeFile(sitemapPath, sitemap);
  const previous = await readFile(configPath, 'utf8'), config = JSON.parse(previous);
  const generated = databaseRoutes(manifest);
  // Keep existing Vivlica redirects and headers. Only replace this upstream's
  // generated rules; the manifest is the reviewable list of proxied paths.
  config.redirects = [...(config.redirects || []).filter(rule => !rule.destination.startsWith(manifest.upstream + '/')), ...generated.redirects];
  config.rewrites = [...(config.rewrites || []).filter(rule => !rule.destination.startsWith(manifest.upstream + '/')), ...generated.rewrites];
  const privateSources = new Set(generated.headers.map(rule => rule.source));
  config.headers = [...(config.headers || []).filter(rule => !privateSources.has(rule.source)), ...generated.headers];
  const next = JSON.stringify(config, null, 2) + '\n';
  if (check && next !== previous) throw new Error('Run npm run sync:database-routes and commit vercel.json');
  if (!check && next !== previous) await writeFile(configPath, next);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncDatabaseRoutes({ check: process.argv.includes('--check') }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
