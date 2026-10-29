import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { siteOrigin, SITE_ORIGIN } from '../src/shared/site.js';

const cwd = fileURLToPath(new URL('../', import.meta.url));
// A Cloudflare build targets the custom domain, independently of Vercel's build.
const env = { ...process.env, SITE_ORIGIN: siteOrigin(process.env.CLOUDFLARE_SITE_ORIGIN || SITE_ORIGIN) };
execFileSync('npm', ['run', 'build'], { cwd, env, stdio: 'inherit' });
execFileSync('npm', ['run', 'verify:build'], { cwd, env, stdio: 'inherit' });
await writeFile(new URL('../dist/_headers', import.meta.url), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/release.json
  Cache-Control: no-store
`);
console.log('Cloudflare static assets and API build are prepared; no account or DNS changes were made.');
