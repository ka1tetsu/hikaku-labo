import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EVIDENCE_BY_SECTION } from '../src/shared/evidenceContent.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('every core Vivlica section discloses verified inputs, formula, exclusions and action',()=>{
  assert.deepEqual(Object.keys(EVIDENCE_BY_SECTION).sort(),['life','products','tools','travel']);
  for(const [name,evidence] of Object.entries(EVIDENCE_BY_SECTION)){
    for(const field of ['title','short','source','calculation','excluded','next'])
      assert.ok(typeof evidence[field]==='string' && evidence[field].length>(field==='title'?4:12),name+': '+field);
  }
  assert.match(EVIDENCE_BY_SECTION.travel.excluded,/A8/);
  assert.match(EVIDENCE_BY_SECTION.travel.calculation,/入力/);
  assert.match(EVIDENCE_BY_SECTION.products.excluded,/送料/);
  assert.match(EVIDENCE_BY_SECTION.life.excluded,/工事費/);
  assert.match(EVIDENCE_BY_SECTION.tools.excluded,/実測/);
});
test('shared header has keyboard-expandable source-and-limit section across product areas',()=>{
  const header=source('src/shared/SiteHeader.jsx');
  assert.match(header,/EVIDENCE_BY_SECTION\[active\]/);
  assert.match(header,/<details className="hl-evidence-details">/);
  assert.match(header,/<dt>情報源<\/dt>/);
  assert.match(header,/<dt>含まれない情報<\/dt>/);
  assert.match(header,/href="\/editorial-policy\/"/);
});
test('site assistant is described accurately as a rule-based local tool',()=>{
  const welcome=source('src/shared/siteConcierge.js');
  const panel=source('src/shared/SiteConcierge.jsx');
  assert.match(welcome,/条件検索アシスタント/);
  assert.doesNotMatch(welcome,/こんにちは！VivlicaのAIコンシェルジュです/);
  assert.match(panel,/条件検索アシスタント/);
  assert.match(source('src/shared/ConciergeChat.jsx'),/生成AIではなく/);
  assert.match(source('src/travel/Concierge.jsx'),/モデルコースはたたき台/);
});
test('home and price-compare flows avoid AI marketing labels and cite missing checkout costs',()=>{
  const home=source('src/shared/SectionDirectory.jsx');
  const article=source('src/components/ArticleSection.jsx');
  assert.match(home,/条件をそろえて比べる/);
  assert.match(article,/送料やクーポン適用後の購入額/);
  assert.match(source('src/shared/infoContent.js'),/文章と判断の責任/);
  assert.match(source('src/shared/siteDirectory.js'),/入力条件/);
});
test('high-traffic stylesheet paths do not select Inter and preserve Japanese readability',()=>{
  const files=['src/index.css','src/shared/foundation.css','src/shared/home-refresh.css',
    'src/shared/concierge.css','src/services/services.css','src/tools/tools.css',
    'src/travel/travel.css','src/travel/hotel-search.css','src/travel/hotel-detail.css','public/guides.css'];
  for(const path of files){
    const contents=source(path);
    assert.doesNotMatch(contents,/\bInter\b/,path);
  }
  assert.match(source('src/shared/foundation.css'),/hl-evidence-details/);
});
test('mass produced AI comparison articles cannot be written to public article directory without review',()=>{
  const generator=source('scripts/generate-articles.mjs');
  assert.match(generator,/--drafts-only/);
  assert.match(generator,/reviewRequired: true/);
  assert.match(generator,/publicationApproved: false/);
  assert.match(generator,/editor-review-required/);
  assert.doesNotMatch(generator,/join\(__dirname, "..", "content", "articles"\)/);
});
test('Impeccable sitewide detector runs with telemetry disabled and regression gate rather than global ignores',()=>{
  const config=JSON.parse(source('.impeccable/config.json'));
  const workflow=source('.github/workflows/impeccable.yml');
  const gate=source('scripts/impeccable-gate.mjs');
  assert.equal(config.telemetry,false);
  assert.deepEqual(config.detector.ignoreRules,[]);
  assert.deepEqual(config.detector.ignoreFiles,[]);
  assert.match(workflow,/DO_NOT_TRACK/);
  assert.match(workflow,/actions\/upload-artifact/);
  assert.match(workflow,/pull_request/);
  assert.match(gate,/impeccable@/);
  assert.match(gate,/baselinePrimary/);
  assert.match(gate,/regressions/);
});
