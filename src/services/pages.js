// Static long-tail pages generated at build time (scripts/prerender.mjs):
//   /sim/vs/<a>-<b>/      every pair of SIM brands
//   /hikari/area/<area>/  fiber options per region
//   /sim/<id>/            per-service detail pages (K1)
//   /hikari/<id>/         per-service detail pages (K1)
//   /card/<id>/           per-service detail pages (K1)
import { CARD_SERVICES, HIKARI_SERVICES, SIM_SERVICES } from './catalog.js';

export const AREAS = Object.freeze([
  ['hokkaido', '北海道'], ['tohoku', '東北'], ['kanto', '関東'], ['hokuriku', '北陸・甲信越'], ['tokai', '東海'],
  ['kansai', '関西'], ['chugoku', '中国'], ['shikoku', '四国'], ['kyushu', '九州'], ['okinawa', '沖縄'],
]);
export const areaLabel = id => AREAS.find(([key]) => key === id)?.[1] || id;

export const SIM_PAIRS = Object.freeze(SIM_SERVICES.flatMap((a, i) => SIM_SERVICES.slice(i + 1).map(b => ({
  a: a.id, b: b.id, slug: `${a.id}-${b.id}`, path: `/sim/vs/${a.id}-${b.id}/`, title: `${a.name}と${b.name}の比較`,
}))));

export const AREA_PAGES = Object.freeze(AREAS.map(([id, label]) => ({ area: id, path: `/hikari/area/${id}/`, title: `${label}の光回線` })));

// Per-service detail pages (K1). Only services whose catalog entry carries enough
// service-specific facts get a page; thin entries stay integrated into the
// category / area pages instead of becoming near-empty detail pages.
//   SIM: every brand has a full plan table with prices → all get a page.
//   Hikari: eo光・コミュファ光 have price: null for both housing types and no
//     plan-level facts to show → excluded (they remain on the area pages).
//   Card: every card has verified details (申込条件等) → all get a page.
export const SIM_DETAIL_PAGES = Object.freeze(SIM_SERVICES.map(s => ({
  id: s.id, path: `/sim/${s.id}/`, title: `${s.name}の料金・プラン`,
})));

export const HIKARI_DETAIL_PAGES = Object.freeze(HIKARI_SERVICES
  .filter(s => s.house !== null || s.mansion !== null)
  .map(s => ({ id: s.id, path: `/hikari/${s.id}/`, title: `${s.name}の料金・提供エリア` })));

export const CARD_DETAIL_PAGES = Object.freeze(CARD_SERVICES.map(s => ({
  id: s.id, path: `/card/${s.id}/`, title: `${s.name}の詳細`,
})));
