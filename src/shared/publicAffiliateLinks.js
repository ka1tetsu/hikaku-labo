// Public ASP-issued tracking URLs that are safe to commit: they are rendered into
// page HTML anyway. Add an entry only after the program is approved and the link
// was created in the ASP console. VITE_AFF_URL_<ID> and VITE_AFFILIATE_LINKS take
// precedence. Never put API keys, passwords or private tokens here.
export const PUBLIC_AFFILIATE_LINKS = Object.freeze({
  // Rakuten Affiliate shop link for Rakuten Mobile (created 2026-11-02 in the link builder).
  'rakuten-mobile': 'https://hb.afl.rakuten.co.jp/hsc/58b80593.c1cc6abc.433ccf31.62544894/?link_type=pict&rafst=rmn&ut=eyJwYWdlIjoic2hvcCIsInR5cGUiOiJwaWN0IiwiY29sIjoxLCJjYXQiOjEsImJhbiI6MjM3Nzg5NSwiYW1wIjpmYWxzZX0%3D',
  // A8.net text link for au Hikari via the GlobalCast program (approved 2026-11-04).
  // Chosen over the also-approved ValueCommerce link because its per-activation
  // reward (¥30,000) is higher than ValueCommerce's (¥25,300 tax incl.).
  'au-hikari': 'https://px.a8.net/svt/ejp?a8mat=4BGD79+EJC2AI+42Y0+5YRHE',
  // A8.net text link for Docomo Hikari via the GMO Tokutoku BB program (approved 2026-11-04).
  // New-use reward ¥9,000 (2 Gbps plan ¥13,000 / 10 Gbps plan ¥17,000).
  'docomo-hikari': 'https://px.a8.net/svt/ejp?a8mat=4BGD79+F468GQ+50+54MIOY',
});
