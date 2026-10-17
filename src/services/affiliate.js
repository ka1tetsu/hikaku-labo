// A service link becomes an affiliate (PR) link only when an ASP-issued tracking URL
// is configured as VITE_AFF_URL_<ID> (e.g. VITE_AFF_URL_IIJMIO). Unapproved → official URL.
const ASP_HOSTS = ['px.a8.net', 'ck.jp.ap.valuecommerce.com', 'af.moshimo.com', 'h.accesstrade.net', 'click.linksynergy.com', 't.felmat.net', 't.afi-b.com', 'www.rentracks.jp', 'ad.presco.asia'];

export const affiliateEnvKey = id => 'VITE_AFF_URL_' + id.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export function serviceLink(service, env = {}) {
  const candidate = env[affiliateEnvKey(service.id)];
  if (typeof candidate === 'string' && candidate.trim()) {
    try {
      const url = new URL(candidate.trim());
      if (url.protocol === 'https:' && ASP_HOSTS.includes(url.hostname) && !url.username && !url.password) return { url: url.href, sponsored: true };
    } catch { /* invalid configuration falls back to the official site */ }
  }
  return { url: service.officialUrl, sponsored: false };
}
