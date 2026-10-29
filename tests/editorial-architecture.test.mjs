import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EDITORIAL_PANELS } from '../src/shared/editorialPanels.js';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('shared editorial panels are factual and actionable, never fake scores or prices',()=>{
  assert.deepEqual(Object.keys(EDITORIAL_PANELS).sort(),['tools','travel']);
  for(const [section,panel] of Object.entries(EDITORIAL_PANELS)){
    for(const name of ['ariaLabel','eyebrow','title','footnote','href','linkLabel'])
      assert.ok(typeof panel[name]==='string' && panel[name].length>1,section+': '+name);
    assert.equal(panel.rows.length,3,section);
    for(const row of panel.rows)assert.ok(row.label.length>1 && row.value.length>12);
  }
  assert.match(EDITORIAL_PANELS.tools.footnote,/独自ルール/);
  assert.match(EDITORIAL_PANELS.travel.footnote,/初泊参考額/);
  assert.equal(EDITORIAL_PANELS.tools.href,'#method');
  assert.equal(EDITORIAL_PANELS.travel.href,'/guides/travel-total-cost/');
});

test('both specialist hero screens share one evidence component and no dummy infographic',()=>{
  const tools=source('src/tools/ToolsPage.jsx');
  const travel=source('src/travel/TravelDiscovery.jsx');
  assert.match(tools,/<DecisionEvidence section="tools"\/>/);
  assert.match(travel,/<DecisionEvidence section="travel"\/>/);
  assert.match(tools,/id="method"/);
  assert.doesNotMatch(tools,/YOUR TOOL MATCH|ANALYSIS|tl-hero-visual/);
  assert.doesNotMatch(travel,/FIND YOUR|tvx-hero-art|tvx-art-orbit/);
  assert.match(source('src/shared/DecisionEvidence.jsx'),/EDITORIAL_PANELS\[section\]/);
});

test('shared decisions use semantic evidence list and focusable source link',()=>{
  const component=source('src/shared/DecisionEvidence.jsx');
  const styles=source('src/shared/DecisionEvidence.css');
  assert.match(component,/<aside/);
  assert.match(component,/<dl>/);
  assert.match(component,/<dt>/);
  assert.match(component,/<dd>/);
  assert.match(component,/<a href=\{data.href\}>/);
  assert.match(styles,/:focus-visible/);
  assert.match(styles, /max-width:780px/);
  assert.match(styles, /max-width:420px/);
});

test('modern site QA includes 16 routes, 3 widths, and interactive coverage',()=>{
  const qa=source('scripts/browser-qa.mjs');
  const workflow=source('.github/workflows/browser-design-qa.yml');
  assert.match(qa,/width:375/);
  assert.match(qa,/width:768/);
  assert.match(qa,/width:1440/);
  for(const p of ['\/compare\/','\/life\/','\/tools\/','\/travel\/','\/travel\/hotels\/'])assert.ok(qa.includes(p.replaceAll('\\','')),p);
  assert.match(qa,/savings-estimate/);
  assert.match(qa,/price-search/);
  assert.match(workflow,/npm run build/);
  assert.match(workflow,/upload-artifact/);
});
