// Canonical production identity. Keep the existing route paths during migration.
export const SITE_NAME = 'Vivlica';
export const SITE_ORIGIN = 'https://vivlica.com';
export const LEGACY_ORIGIN = 'https://hikaku-labo.vercel.app';

export function siteOrigin(value = SITE_ORIGIN) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_ORIGIN must be an HTTPS origin without a path, query or credentials');
  }
  return url.origin;
}
