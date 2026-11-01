// Public ASP-issued tracking URLs that are safe to commit: they are rendered into
// page HTML anyway. Add an entry only after the program is approved and the link
// was created in the ASP console. VITE_AFF_URL_<ID> and VITE_AFFILIATE_LINKS take
// precedence. Never put API keys, passwords or private tokens here.
export const PUBLIC_AFFILIATE_LINKS = Object.freeze({
  // Rakuten Affiliate shop link for Rakuten Mobile (created 2026-11-02 in the link builder).
  'rakuten-mobile': 'https://hb.afl.rakuten.co.jp/hsc/58b80593.c1cc6abc.433ccf31.62544894/?link_type=pict&rafst=rmn&ut=eyJwYWdlIjoic2hvcCIsInR5cGUiOiJwaWN0IiwiY29sIjoxLCJjYXQiOjEsImJhbiI6MjM3Nzg5NSwiYW1wIjpmYWxzZX0%3D',
});
