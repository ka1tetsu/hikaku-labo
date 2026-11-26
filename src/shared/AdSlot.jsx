import { useEffect } from 'react';
import { adsenseConfig, adsenseScriptUrl, adsenseSlot } from './adsenseConfig.js';
import './adsense.css';

let scriptRequested = false;

// Loads adsbygoogle.js once per page, only after a configured slot mounts.
function loadAdsenseScript(config) {
  if (scriptRequested || typeof document === 'undefined') return;
  const url = adsenseScriptUrl(config);
  if (!url) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = url;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

// Display-ad slot rendered only when the publisher ID and this placement's
// slot ID are both configured (see adsenseConfig.js). While unconfigured it
// renders nothing at all, so pages keep their current layout and no ad
// network request is made. Placements are limited to spots that do not sit
// next to affiliate calls to action (currently: just before the site footer).
export default function AdSlot({ placement = 'footer', config = adsenseConfig() }) {
  const slot = adsenseSlot(config, placement);
  useEffect(() => {
    if (!slot) return;
    loadAdsenseScript(config);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* an unavailable ad network leaves the labelled frame empty */ }
  }, [slot, config]);
  if (!slot) return null;
  return (
    <aside className="vl-ad" aria-label="広告">
      <span className="vl-ad-label">広告</span>
      <ins
        className="adsbygoogle"
        data-ad-client={config.publisherId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
