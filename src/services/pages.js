// Static long-tail pages generated at build time (scripts/prerender.mjs):
//   /sim/vs/<a>-<b>/      every pair of SIM brands
//   /hikari/area/<area>/  fiber options per region
import { SIM_SERVICES } from './catalog.js';

export const AREAS = Object.freeze([
  ['hokkaido', '北海道'], ['tohoku', '東北'], ['kanto', '関東'], ['hokuriku', '北陸・甲信越'], ['tokai', '東海'],
  ['kansai', '関西'], ['chugoku', '中国'], ['shikoku', '四国'], ['kyushu', '九州'], ['okinawa', '沖縄'],
]);
export const areaLabel = id => AREAS.find(([key]) => key === id)?.[1] || id;

export const SIM_PAIRS = Object.freeze(SIM_SERVICES.flatMap((a, i) => SIM_SERVICES.slice(i + 1).map(b => ({
  a: a.id, b: b.id, slug: `${a.id}-${b.id}`, path: `/sim/vs/${a.id}-${b.id}/`, title: `${a.name}と${b.name}の比較`,
}))));

export const AREA_PAGES = Object.freeze(AREAS.map(([id, label]) => ({ area: id, path: `/hikari/area/${id}/`, title: `${label}の光回線` })));
