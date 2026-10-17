// Inject server-rendered markup into the built HTML so content is crawlable and
// visible before JavaScript runs. Runs after `vite build`.
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { render, PAGES } = await vite.ssrLoadModule('/src/ssr.jsx');
  for (const file of Object.keys(PAGES)) {
    const path = new URL('../dist/' + file, import.meta.url);
    const html = await readFile(path, 'utf8');
    if (!html.includes('<div id="root"></div>')) throw new Error('root placeholder missing in ' + file);
    await writeFile(path, html.replace('<div id="root"></div>', `<div id="root">${render(file)}</div>`));
    console.log('prerendered', file);
  }
} finally {
  await vite.close();
}
