import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HIKARI_SERVICES } from '../src/services/catalog.js';
import { rankHikari } from '../src/services/score.js';
import { AREA_PAGES } from '../src/services/pages.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = content('src/services/StaticPages.jsx');
const simPair = source.slice(source.indexOf('export function SimPairPage'), source.indexOf('const CARRIERS'));
const hikariArea = source.slice(source.indexOf('export function HikariAreaPage'));

test('sim vs pages repeat the CTA row after the comparison table', () => {
  assert.equal((simPair.match(/sv-cta-row/g) || []).length, 2);
  const tableHeading = simPair.indexOf('違いを表で比べる');
  const firstRow = simPair.indexOf('sv-cta-row');
  const secondRow = simPair.indexOf('sv-cta-row', firstRow + 1);
  assert.ok(tableHeading > firstRow, 'first CTA row stays under the verdict');
  assert.ok(secondRow > tableHeading, 'second CTA row follows the comparison table');
});

test('hikari area pages anchor the candidate table to the service list', () => {
  assert.ok(hikariArea.includes('id={`service-${s.id}`}'), 'list items carry anchor ids');
  assert.ok(hikariArea.includes('className="sv-service-link"'), 'table service names are links');
  assert.ok(hikariArea.includes('href={`#service-${r.service.id}`}'), 'links point at the list anchors');
  assert.ok(content('src/services/services.css').includes('.sv-service-link'), 'link style exists');
});

test('hikari area pages put candidate CTAs directly under the candidate table', () => {
  assert.ok(hikariArea.includes('候補の公式サイトで、住所・建物ごとの提供状況を確認できます。'));
  assert.ok(hikariArea.includes('placement="hikari-area-table"'));
  const tableEnd = hikariArea.indexOf('</table></div>');
  assert.ok(hikariArea.indexOf('hikari-area-table') > tableEnd, 'CTA row follows the table');
});

// Mirrors the carrier rows in HikariAreaPage: the CTA row under the table is
// built from the per-carrier top picks that are actually offered in the area,
// so it must never come out empty and every linked anchor must exist.
const CARRIER_IDS = ['docomo', 'au', 'softbank', 'rakuten', 'none'];
for (const page of AREA_PAGES) {
  test(`hikari area ${page.area}: candidate picks resolve to listed services`, () => {
    const available = HIKARI_SERVICES.filter(s => s.areas === 'all' || s.areas.includes(page.area));
    const availableIds = new Set(available.map(s => s.id));
    const picks = CARRIER_IDS.flatMap(carrier => [
      rankHikari({ housing: 'house', carrier, area: page.area })[0].service,
      rankHikari({ housing: 'mansion', carrier, area: page.area })[0].service,
    ]);
    const candidates = [...new Set(picks.filter(s => availableIds.has(s.id)).map(s => s.id))];
    assert.ok(candidates.length > 0, 'at least one candidate CTA');
    for (const id of candidates) assert.ok(availableIds.has(id), id);
  });
}
