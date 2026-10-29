// Source: A8.net Yahoo!トラベル, user-supplied「通常広告用」素材 (2026-10-17).
// DO NOT modify the A8 advertisement code or extract the URL.
// Publisher confirmed the canonical media site is registered on 2026-10-29.\n// Preserve the A8 standard creative verbatim and retain the emergency-off switch.
export const YAHOO_TRAVEL_A8_CREATIVES = Object.freeze({
  banner234: [
    '<a href="https://px.a8.net/svt/ejp?a8mat=4AZ9C4+21TRSI+4ZCO+65U41" rel="nofollow">',
    '<img border="0" width="234" height="60" alt="" src="https://www21.a8.net/svt/bgt?aid=260305924124&wid=001&eno=01&mid=s00000023244001035000&mc=1"></a>',
    '<img border="0" width="1" height="1" src="https://www13.a8.net/0.gif?a8mat=4AZ9C4+21TRSI+4ZCO+65U41" alt="">',
  ].join('\n'),
  banner300: [
    '<a href="https://px.a8.net/svt/ejp?a8mat=4AZ9C4+21TRSI+4ZCO+65ME9" rel="nofollow">',
    '<img border="0" width="300" height="250" alt="" src="https://www29.a8.net/svt/bgt?aid=260305924124&wid=001&eno=01&mid=s00000023244001034000&mc=1"></a>',
    '<img border="0" width="1" height="1" src="https://www14.a8.net/0.gif?a8mat=4AZ9C4+21TRSI+4ZCO+65ME9" alt="">',
  ].join('\n'),
});

export const YAHOO_TRAVEL_A8_IDS = Object.freeze({ banner234: '65U41', banner300: '65ME9' });

export function travelAffiliateEnabled(env = {}) {
  // Publisher explicitly confirmed registration of the current canonical site.\n  // An explicit different registered origin still blocks serving the ad.
  if (env.VITE_A8_TRAVEL_DISABLED === 'true') return false;
  const origin = env.VITE_SITE_ORIGIN || 'https://vivlica.com';
  const registered = env.VITE_A8_TRAVEL_REGISTERED_ORIGIN || 'https://vivlica.com';
  try {
    const site = new URL(origin), allowed = new URL(registered);
    return site.protocol === 'https:' && allowed.protocol === 'https:' && !allowed.username && !allowed.password && allowed.pathname === '/' && !allowed.search && !allowed.hash && site.origin === allowed.origin;
  } catch { return false; }
}
