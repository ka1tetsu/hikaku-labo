import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARD_SERVICES, HIKARI_SERVICES, HOKEN_SERVICES, SIM_SERVICES, SERVICE_IDS, CHECKED_AT } from '../src/services/catalog.js';
import { rankCards, rankHikari, rankSim, simPlanFor, sortByMonthlyPrice, sortCardsByFee, sortCardsByRate, cardFeeAmount } from '../src/services/score.js';
import { priceRecheckRequired, detailValue } from '../src/services/freshness.js';
import { affiliateEnvKey, serviceLink } from '../src/services/affiliate.js';
import { validOutboundEvent, validFunnelEvent } from '../src/shared/outboundSchema.js';

test('every service has an official https source and unique id', () => {
  assert.match(CHECKED_AT, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Set(SERVICE_IDS).size, SERVICE_IDS.length);
  for (const s of [...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES, ...HOKEN_SERVICES]) {
    assert.ok(s.officialUrl.startsWith('https://'), s.id);
    assert.ok(s.name && s.summary, s.id);
  }
  for (const s of SIM_SERVICES) {
    assert.ok(s.sourceUrl.startsWith('https://'), s.id);
    assert.ok(s.plans.every(p => p.price > 0 && Number.isInteger(p.price)), s.id);
  }
});

test('SIM ranking uses the cheapest plan that actually covers the data need', () => {
  assert.equal(simPlanFor(SIM_SERVICES.find(s => s.id === 'iijmio'), '3').price, 950);
  assert.equal(simPlanFor(SIM_SERVICES.find(s => s.id === 'linemo'), '30'), null);
  const unlimited = rankSim({ usage: 'unlimited' });
  assert.equal(unlimited[0].service.id, 'rakuten-mobile');
  const store = rankSim({ usage: '10', support: 'store' });
  assert.ok(store.slice(0, 3).every(r => r.service.store));
});

test('fiber ranking respects set discounts and service areas', () => {
  const kansaiAu = rankHikari({ housing: 'house', carrier: 'au', area: 'kansai' });
  // K3 で BIGLOBE光（関西で提供・auセット割・月額確認済み）を追加したため、料金未確認の
  // eo光より上位になる。eo光も関西で利用可能な候補として残ること
  assert.equal(kansaiAu[0].service.id, 'biglobe-hikari');
  assert.ok(kansaiAu.find(r => r.service.id === 'eo-hikari').available);
  assert.ok(kansaiAu.find(r => r.service.id === 'au-hikari').score < 30);
  assert.equal(rankHikari({ carrier: 'docomo', area: 'kanto' })[0].service.id, 'docomo-hikari');
});

test('K3 provider-type hikari entries carry official sources and honest null prices', () => {
  const added = ['biglobe-hikari', 'nifty-hikari', 'sonet-hikari', 'gmo-hikari']
    .map(id => HIKARI_SERVICES.find(s => s.id === id));
  assert.ok(added.every(Boolean));
  for (const s of added) {
    // フレッツ系コラボは全国（フレッツ光エリア）で、2026-11-04 に公式で確認した出典を持つ
    assert.equal(s.areas, 'all', s.id);
    assert.equal(s.checkedAt, '2026-11-04', s.id);
    assert.ok(s.sourceUrl.startsWith('https://'), s.id);
  }
  // 公式で単一の金額を確認できた2社だけ月額を持つ
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'biglobe-hikari').house, 5478);
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'biglobe-hikari').mansion, 4378);
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'nifty-hikari').house, 5720);
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'nifty-hikari').mansion, 4378);
  // 金額が定まらない2社は null のまま「公式で確認」に倒す
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'sonet-hikari').house, null);
  assert.equal(HIKARI_SERVICES.find(s => s.id === 'gmo-hikari').mansion, null);
  // セット割の有無も公式確認どおり（BIGLOBE・@nifty は au、So-net・GMO はなし）
  assert.deepEqual(HIKARI_SERVICES.find(s => s.id === 'biglobe-hikari').bundle, ['au']);
  assert.deepEqual(HIKARI_SERVICES.find(s => s.id === 'gmo-hikari').bundle, []);
});

test('card ranking applies age limits and ecosystems', () => {
  assert.notEqual(rankCards({ age: 'o40' })[0].service.id, 'jcb-w');
  assert.equal(rankCards({ ecosystem: 'rakuten' })[0].service.id, 'rakuten-card');
  assert.equal(rankCards({ priority: 'conveni' })[0].service.id, 'smbc-nl');
});

test('cards expose verified application details and GOLD U stays a separate paid product', () => {
  // (c) 全カードに申込条件等の details があり、年会費の行を必ず含む
  for (const s of CARD_SERVICES) {
    assert.ok(Array.isArray(s.details) && s.details.length >= 3, s.id);
    assert.ok(s.details.some(([label]) => label === '年会費'), s.id);
  }
  // (b) dカード GOLD U は通常版とは別商品：年会費は金額明記、年齢条件は maxAge で扱う
  const goldU = CARD_SERVICES.find(s => s.id === 'd-card-gold-u');
  assert.ok(goldU);
  assert.match(goldU.fee, /3,300円/);
  assert.equal(goldU.maxAge, 29);
  assert.equal(goldU.rate, 1.0);
  assert.ok(goldU.sourceUrl.startsWith('https://dcard.docomo.ne.jp/'));
  // 既存カードの相対順位は変えない（デフォルト条件での従来の並びを GOLD U を除いて維持）
  // 日付は K4 の改定予告（2026-12-01）より前に固定する。以後の並びは K4 テストで検証する
  const order = rankCards({}, '2026-11-04').map(r => r.service.id).filter(id => id !== 'd-card-gold-u');
  assert.deepEqual(order, ['recruit-card', 'aupay-card', 'd-card', 'jcb-w', 'paypay-card', 'rakuten-card', 'smbc-nl']);
  // 40歳以上では申込対象外として大きく減点される
  assert.ok(rankCards({ age: 'o40' }, '2026-11-04').find(r => r.service.id === 'd-card-gold-u').score < 30);
});

test('display sorts are mechanical keys and never use fit scores (K2)', () => {
  // 適合度スコアと逆転する並びでも、表示ソートはキーだけで決まること
  const rows = [
    { service: { name: 'B社', rate: 0.5, fee: '永年無料' }, monthly: 3000, score: 99 },
    { service: { name: 'A社', rate: 1.2, fee: '永年無料' }, monthly: 1000, score: 10 },
    { service: { name: 'C社', rate: 1.0, fee: '3,300円（税込）' }, monthly: null, score: 80 },
  ];
  // 価格順：月額の昇順、月額なしは末尾。入力配列は変更しない
  assert.deepEqual(sortByMonthlyPrice(rows).map(r => r.service.name), ['A社', 'B社', 'C社']);
  assert.deepEqual(rows.map(r => r.service.name), ['B社', 'A社', 'C社']);
  // 年会費はカタログの fee 表記から読むだけ（無料=0、金額はその数値）
  assert.equal(cardFeeAmount({ fee: '永年無料' }), 0);
  assert.equal(cardFeeAmount({ fee: '3,300円（税込）' }), 3300);
  // カード：年会費順は同額なら基本還元率の高い順、還元率順は基本還元率の降順のみ
  assert.deepEqual(sortCardsByFee(rows).map(r => r.service.name), ['A社', 'B社', 'C社']);
  assert.deepEqual(sortCardsByRate(rows).map(r => r.service.name), ['A社', 'C社', 'B社']);
  // 実カタログ：還元率順は全行で降順になり1位は最高還元率、年会費順の末尾は唯一の有料カード
  // 日付は K4 の改定予告（2026-12-01）より前に固定する
  const ranked = rankCards({}, '2026-11-04');
  const byRate = sortCardsByRate(ranked, '2026-11-04');
  assert.ok(byRate.every((r, i) => i === 0 || byRate[i - 1].service.rate >= r.service.rate));
  assert.equal(byRate[0].service.id, 'recruit-card');
  assert.equal(byRate.at(-1).service.id, 'smbc-nl');
  assert.equal(sortCardsByFee(ranked, '2026-11-04').at(-1).service.id, 'd-card-gold-u');
  // SIM：価格順は選択データ量に合うプラン月額の昇順（合うプランのないサービスは月額なしで末尾）
  const simByPrice = sortByMonthlyPrice(rankSim({ usage: 'unlimited' }, '2026-11-04'));
  const priced = simByPrice.filter(r => r.monthly !== null);
  assert.ok(priced.every((r, i) => i === 0 || priced[i - 1].monthly <= r.monthly));
  assert.equal(simByPrice.at(-1).monthly, null);
});

test('sort toggle is measured like selector_change and the SIM lead matches the fit order (K2)', () => {
  for (const page of ['sim', 'hikari', 'card']) assert.equal(validFunnelEvent({ event: 'funnel', page, action: 'sort_change' }), true, page);
  const page = readFileSync(new URL('../src/services/ServicesPage.jsx', import.meta.url), 'utf8');
  // 旧リード文（価格順と誤認させる文言）は残っていないこと
  assert.ok(!page.includes('月額の安いプランを順に並べます'));
  assert.match(page, /並び替え/);
  assert.match(page, /おすすめ順（適合度）/);
  assert.match(page, /recordFunnelEvent\('sort_change'\)/);
});

test('service links are sponsored only with an approved ASP tracking URL', () => {
  const iij = SIM_SERVICES.find(s => s.id === 'iijmio');
  assert.equal(affiliateEnvKey('rakuten-mobile'), 'VITE_AFF_URL_RAKUTEN_MOBILE');
  assert.deepEqual(serviceLink(iij, {}), { url: iij.officialUrl, sponsored: false });
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://px.a8.net/svt/ejp?a8mat=TEST' }).sponsored, true);
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://evil.example/x' }).sponsored, false);
  for (const id of SERVICE_IDS) assert.equal(validOutboundEvent({ event: 'outbound', section: 'life', merchant: id, placement: 'sim-rank', sponsored: false }), true, id);
});

test('insurance page compares no insurance products and lists services without ranking', () => {
  const page = readFileSync(new URL('../src/services/ServicesPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /特定の保険商品の比較・推奨・募集は行いません/);
  assert.match(page, /五十音順/);
  assert.ok(!HOKEN_SERVICES.some(s => 'score' in s || 'rate' in s));
  // 事実情報の整理表は五十音順の並びを維持し、Related から /life/ ハブへ導線を持つ
  assert.deepEqual(HOKEN_SERVICES.map(s => s.id), ['hoken-clinic', 'hokennomadoguchi', 'hoken-minaoshi-lab']);
  assert.match(page, /sv-hoken-table/);
  assert.match(page, /hoken: \[\['\/life\/'/);
  // 表の事実項目は各社の公式サイトで確認できた事実だけを使う（未確認の項目はフィールドを持たない）
  const clinic = HOKEN_SERVICES.find(s => s.id === 'hoken-clinic');
  assert.equal(clinic.consultMethods, '店舗・オンライン');
  assert.equal(clinic.storeNetwork, '全国309店舗');
  assert.equal(clinic.feature, '取扱保険会社は約50社（店舗により異なる）');
  const madoguchi = HOKEN_SERVICES.find(s => s.id === 'hokennomadoguchi');
  assert.equal(madoguchi.consultMethods, '店舗・オンライン');
  assert.equal(madoguchi.feature, '取扱保険会社は40社以上、300商品以上');
  const lab = HOKEN_SERVICES.find(s => s.id === 'hoken-minaoshi-lab');
  assert.equal(lab.consultMethods, '訪問・オンライン');
  assert.equal(lab.storeNetwork, '全国に約60拠点（2025年4月時点）');
  assert.equal(lab.feature, '取扱保険会社は42社（2026年9月時点）');
  assert.ok(HOKEN_SERVICES.every(s => s.fee === '無料'));
});

test('per-service detail pages cover only services with enough catalog facts (K1)', async () => {
  const { SIM_DETAIL_PAGES, HIKARI_DETAIL_PAGES, CARD_DETAIL_PAGES, SIM_PAIRS, AREA_PAGES } = await import('../src/services/pages.js');
  // SIM・カードは全サービスに個別ページ。光は料金が確認できる7社だけ（K3でBIGLOBE光・@nifty光を追加）
  assert.equal(SIM_DETAIL_PAGES.length, SIM_SERVICES.length);
  assert.equal(CARD_DETAIL_PAGES.length, CARD_SERVICES.length);
  assert.deepEqual(HIKARI_DETAIL_PAGES.map(p => p.id), ['docomo-hikari', 'softbank-hikari', 'au-hikari', 'nuro-hikari', 'rakuten-hikari', 'biglobe-hikari', 'nifty-hikari']);
  // 料金が null の eo光・コミュファ光・So-net光・GMOとくとくBB光は薄いページになるため作らず、地域ページに統合したままにする
  assert.ok(!HIKARI_DETAIL_PAGES.some(p => p.id === 'eo-hikari' || p.id === 'commufa-hikari' || p.id === 'sonet-hikari' || p.id === 'gmo-hikari'));
  const all = [...SIM_DETAIL_PAGES, ...HIKARI_DETAIL_PAGES, ...CARD_DETAIL_PAGES];
  assert.equal(new Set(all.map(p => p.path)).size, all.length);
  assert.ok(all.every(p => /^\/(sim|hikari|card)\/[a-z0-9-]+\/$/.test(p.path)));
  // 既存の静的ページ（vs・地域）とパスが衝突しない
  const taken = new Set([...SIM_PAIRS.map(p => p.path), ...AREA_PAGES.map(p => p.path)]);
  assert.ok(all.every(p => !taken.has(p.path)));
  // ssr に静的ページとして登録され、計測のページIDも引ける
  const ssr = readFileSync(new URL('../src/ssr.jsx', import.meta.url), 'utf8');
  for (const name of ['SIM_DETAIL_PAGES', 'HIKARI_DETAIL_PAGES', 'CARD_DETAIL_PAGES', 'SimServicePage', 'HikariServicePage', 'CardServicePage']) assert.match(ssr, new RegExp(name));
  const { pageId } = await import('../src/shared/outboundSchema.js');
  assert.equal(pageId('/sim/ahamo/'), 'sim-service-ahamo');
  assert.equal(pageId('/hikari/au-hikari/'), 'hikari-service-au-hikari');
  assert.equal(pageId('/card/rakuten-card/'), 'card-service-rakuten-card');
  assert.equal(pageId('/hikari/eo-hikari/'), null);
});

test('catalog freshness flips revised prices to unconfirmed after the announced date (K4)', () => {
  const BEFORE = '2026-11-30'; // 改定日の前日
  const ON = '2026-12-01'; // 改定日
  const TODAY = '2026-11-04'; // K4 導入時点の現在日付
  const ahamo = SIM_SERVICES.find(s => s.id === 'ahamo');
  const softbankHikari = HIKARI_SERVICES.find(s => s.id === 'softbank-hikari');
  const dCard = CARD_SERVICES.find(s => s.id === 'd-card');
  const goldU = CARD_SERVICES.find(s => s.id === 'd-card-gold-u');

  // priceRevisionFrom は、注意書きに日付つきの改定・見直し予告が明記されている4サービスだけに付く
  const flagged = [...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES].filter(s => s.priceRevisionFrom);
  assert.deepEqual(flagged.map(s => s.id).sort(), ['ahamo', 'd-card', 'd-card-gold-u', 'softbank-hikari']);
  assert.ok(flagged.every(s => s.priceRevisionFrom === '2026-12-01'));
  // 根拠は各サービスの注意書きの日付表記そのもの（推測で入れた日付ではないこと）
  assert.ok(ahamo.cautions.some(c => c.includes('2026年12月1日')));
  assert.ok(softbankHikari.cautions.some(c => c.includes('2026年12月利用分から')));
  for (const card of [dCard, goldU]) assert.ok(card.cautions.some(c => c.includes('2026年12月以降')));

  // 境界：前日までは要再確認にならず、改定日当日から要再確認になる
  for (const s of flagged) {
    assert.equal(priceRecheckRequired(s, BEFORE), false, s.id);
    assert.equal(priceRecheckRequired(s, ON), true, s.id);
    assert.equal(priceRecheckRequired(s, '2027-01-15'), true, s.id);
  }
  // 予告のないサービスは将来の日付でも要再確認にならない
  assert.equal(priceRecheckRequired(SIM_SERVICES.find(s => s.id === 'iijmio'), '2027-01-15'), false);
  // Date でも判定できる（日付は東京時間で読む）
  assert.equal(priceRecheckRequired(ahamo, new Date('2026-11-30T12:00:00+09:00')), false);
  assert.equal(priceRecheckRequired(ahamo, new Date('2026-12-01T00:30:00+09:00')), true);

  // SIM：改定前は通常表示、改定後はプラン価格が未確認になる。サービス自体は一覧から消えない
  assert.equal(simPlanFor(ahamo, '30', BEFORE).price, 2970);
  assert.equal(simPlanFor(ahamo, '30', ON), null);
  const simBefore = rankSim({ usage: '30' }, BEFORE).find(r => r.service.id === 'ahamo');
  assert.equal(simBefore.monthly, 2970);
  assert.equal(simBefore.priceRecheck, false);
  const simAfter = rankSim({ usage: '30' }, ON);
  assert.equal(simAfter.length, SIM_SERVICES.length);
  const ahamoAfter = simAfter.find(r => r.service.id === 'ahamo');
  assert.equal(ahamoAfter.monthly, null);
  assert.equal(ahamoAfter.plan, null);
  assert.equal(ahamoAfter.priceRecheck, true);
  assert.ok(ahamoAfter.cautions.some(c => c.includes('再確認中')));

  // 光：改定後は月額が未確認になり、理由に改定前の金額が出ない
  const hikariBefore = rankHikari({ housing: 'house' }, BEFORE).find(r => r.service.id === 'softbank-hikari');
  assert.equal(hikariBefore.monthly, 5720);
  const hikariAfter = rankHikari({ housing: 'house' }, ON).find(r => r.service.id === 'softbank-hikari');
  assert.equal(hikariAfter.monthly, null);
  assert.equal(hikariAfter.priceRecheck, true);
  assert.ok(!hikariAfter.reasons.some(r => r.includes('5,720')));

  // カード：改定後は還元率・年会費を理由にもスコアにも使わない。予告のない他社は影響を受けない
  const cardBefore = rankCards({}, BEFORE).find(r => r.service.id === 'd-card');
  assert.ok(cardBefore.reasons.some(r => r.includes('基本還元率 1.0%')));
  const cardsAfter = rankCards({}, ON);
  assert.equal(cardsAfter.length, CARD_SERVICES.length);
  const dAfter = cardsAfter.find(r => r.service.id === 'd-card');
  assert.equal(dAfter.priceRecheck, true);
  assert.ok(!dAfter.reasons.some(r => r.includes('1.0%')));
  assert.ok(dAfter.cautions.some(c => c.includes('再確認中')));
  const recruitAfter = cardsAfter.find(r => r.service.id === 'recruit-card');
  assert.equal(recruitAfter.priceRecheck, false);
  assert.ok(recruitAfter.reasons.some(r => r.includes('基本還元率 1.2%')));
  // 表示ソートでも、未確認のカードは末尾に寄る
  assert.equal(sortCardsByRate(cardsAfter, ON).at(-1).priceRecheck, true);
  assert.equal(sortCardsByFee(cardsAfter, ON).at(-1).priceRecheck, true);

  // 詳細行のマスク：価格性の行だけが「公式で確認」になり、それ以外はカタログのまま
  assert.equal(detailValue(dCard, ['年会費', '永年無料'], BEFORE), '永年無料');
  assert.equal(detailValue(dCard, ['年会費', '永年無料'], ON), '公式で確認');
  assert.equal(detailValue(dCard, ['基本還元率', '1.0%（100円につき1ポイント）'], ON), '公式で確認');
  assert.equal(detailValue(dCard, ['国際ブランド', 'Visa／Mastercard'], ON), 'Visa／Mastercard');

  // 導入日（2026-11-04）時点では、改定日を過ぎていないため全サービス通常表示のまま
  assert.ok(![...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES].some(s => priceRecheckRequired(s, TODAY)));
  assert.equal(rankSim({ usage: '30' }, TODAY).find(r => r.service.id === 'ahamo').monthly, 2970);
  assert.equal(rankHikari({ housing: 'house' }, TODAY).find(r => r.service.id === 'softbank-hikari').monthly, 5720);
});

test('long-tail pages cover every SIM pair and every region once', async () => {
  const { SIM_PAIRS, AREA_PAGES, AREAS } = await import('../src/services/pages.js');
  assert.equal(SIM_PAIRS.length, SIM_SERVICES.length * (SIM_SERVICES.length - 1) / 2);
  assert.equal(new Set(SIM_PAIRS.map(p => p.path)).size, SIM_PAIRS.length);
  assert.ok(SIM_PAIRS.every(p => /^\/sim\/vs\/[a-z0-9-]+\/$/.test(p.path)));
  assert.equal(AREA_PAGES.length, AREAS.length);
  for (const [area] of AREAS) assert.ok(rankHikari({ area, carrier: 'docomo' }).some(r => r.available), area);
  const script = readFileSync(new URL('../scripts/prerender.mjs', import.meta.url), 'utf8');
  assert.match(script, /STATIC_PAGES/);
  assert.match(script, /SITE_ORIGIN/);
  assert.match(script, /sitemap\.xml/);
});
