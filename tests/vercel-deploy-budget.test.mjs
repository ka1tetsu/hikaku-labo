import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const conf=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
test('Vercel keeps main production auto-deploy enabled and pauses noisy feature previews',()=>{
  const d=conf.git?.deploymentEnabled;
  assert.equal(d?.['**'],false);
  assert.equal(d?.main,true);
  assert.equal(d?.['preview/**'],true);
  assert.equal(conf.framework,'vite');
  assert.equal(conf.outputDirectory,'dist');
});
test('deployment quota mitigation retains public domains and worker proxy routes',()=>{
  const redirects=conf.redirects.map(x=>x.destination);
  const rewrites=conf.rewrites.map(x=>x.source);
  assert.ok(redirects.some(x=>x.includes('vivlica.com')));
  assert.ok(rewrites.includes('/database'));
  assert.ok(rewrites.includes('/api/health'));
  assert.ok(conf.headers.some(x=>x.source==='/release.json'));
});

test('safe once-per-day recovery checks released SHA and required CI before retrying',()=>{
  const flow=readFileSync(new URL('../.github/workflows/production-auto-recovery.yml',import.meta.url),'utf8');
  assert.match(flow,/cron: '17 10 \* \* \*'/);
  assert.match(flow,/if \[\[ "\$\(date -u \+%Y%m%d\)" < "20261101" \]\]/);
  assert.match(flow,/scripts\/recovery-preflight\.mjs/);
  assert.match(flow,/git commit --allow-empty/);
  assert.match(flow,/scripts\/release-recovery\.mjs wait/);
});
