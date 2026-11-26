// Google AdSense configuration, kept in exactly one place.
//
// Nothing is rendered while the publisher ID is unset or malformed: no
// adsbygoogle.js script, no ad slots, no ads.txt entry. Setting the build
// environment variables below is the only switch, so the code can ship ahead
// of the AdSense account approval and activate the moment the ID exists.
//
//   VITE_ADSENSE_PUBLISHER_ID  ca-pub-<16 digits> issued by AdSense
//   VITE_ADSENSE_SLOT_FOOTER   numeric ad unit ID for the pre-footer slot
//   VITE_ADSENSE_SLOT_GUIDE_MID / VITE_ADSENSE_SLOT_GUIDE_END
//                              numeric ad unit IDs for the guide slots
//
// A placement whose slot ID is unset stays empty even when the publisher ID
// is set, so each surface can be enabled independently.

const PUBLISHER_ID_PATTERN = /^ca-pub-\d{16}$/;
const SLOT_ID_PATTERN = /^\d{1,20}$/;

// Google's seller ID in the ads.txt certification chain (constant published
// by Google for every AdSense publisher).
export const ADSENSE_ADS_TXT_CERT_ID = 'f08c47fec0942fa0';

function cleanSlot(raw) {
  return typeof raw === 'string' && SLOT_ID_PATTERN.test(raw.trim()) ? raw.trim() : null;
}

export function adsenseConfig(env = import.meta.env) {
  const source = env && typeof env === 'object' ? env : {};
  const rawId = typeof source.VITE_ADSENSE_PUBLISHER_ID === 'string' ? source.VITE_ADSENSE_PUBLISHER_ID.trim() : '';
  const publisherId = PUBLISHER_ID_PATTERN.test(rawId) ? rawId : null;
  const slots = {
    footer: cleanSlot(source.VITE_ADSENSE_SLOT_FOOTER),
    'guide-mid': cleanSlot(source.VITE_ADSENSE_SLOT_GUIDE_MID),
    'guide-end': cleanSlot(source.VITE_ADSENSE_SLOT_GUIDE_END),
  };
  return { enabled: publisherId !== null, publisherId, slots };
}

export function adsenseSlot(config, placement) {
  if (!config || !config.enabled) return null;
  const slot = config.slots ? config.slots[placement] : null;
  return typeof slot === 'string' && SLOT_ID_PATTERN.test(slot) ? slot : null;
}

export function adsenseScriptUrl(config) {
  if (!config || !config.enabled) return null;
  return 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + config.publisherId;
}

// Site-verification / Auto ads snippet for the document head. Empty string
// while disabled so build tooling can inject it unconditionally.
export function adsenseHeadSnippet(config) {
  const url = adsenseScriptUrl(config);
  if (!url) return '';
  return `<script async src="${url}" crossorigin="anonymous"></script>`;
}

// The single line this site contributes to /ads.txt once the publisher ID
// exists. Format: <ad system domain>, <publisher ID without "ca-">, DIRECT,
// <certification ID>. Empty string while disabled: no placeholder is served.
export function adsenseAdsTxtLine(config) {
  if (!config || !config.enabled) return '';
  return `google.com, ${config.publisherId.replace(/^ca-/, '')}, DIRECT, ${ADSENSE_ADS_TXT_CERT_ID}`;
}
