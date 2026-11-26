// AdSense slots for the static guide pages (guides/*/index.html).
//
// Guides are plain HTML, so slots are placed from the article structure at
// runtime instead of editing every article body: one slot before a middle
// section heading and, on longer guides, one before the final section
// heading. Slots are never placed next to the closing call-to-action block
// or any affiliate link. While the publisher ID is unconfigured (see
// adsenseConfig.js) this module does nothing: no script, no frames.
import { adsenseConfig, adsenseScriptUrl, adsenseSlot } from './adsenseConfig.js';

const config = adsenseConfig();

function buildSlot(placement) {
  const slot = adsenseSlot(config, placement);
  if (!slot) return null;
  const aside = document.createElement('aside');
  aside.className = 'vl-ad vl-ad-guide';
  aside.setAttribute('aria-label', '広告');
  const label = document.createElement('span');
  label.className = 'vl-ad-label';
  label.textContent = '広告';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.dataset.adClient = config.publisherId;
  ins.dataset.adSlot = slot;
  ins.dataset.adFormat = 'auto';
  ins.dataset.fullWidthResponsive = 'true';
  aside.append(label, ins);
  return aside;
}

function loadScript() {
  const url = adsenseScriptUrl(config);
  if (!url || document.querySelector('script[src^="https://pagead2.googlesyndication.com"]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = url;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

if (config.enabled && typeof document !== 'undefined') {
  const article = document.querySelector('main article, article');
  const headings = article ? [...article.querySelectorAll('h2')] : [];
  const targets = [];
  if (headings.length >= 2) targets.push(['guide-mid', headings[Math.floor(headings.length / 2)]]);
  if (headings.length >= 4) targets.push(['guide-end', headings[headings.length - 1]]);
  const inserted = [];
  for (const [placement, heading] of targets) {
    if (inserted.some(([, used]) => used === heading)) continue;
    const slotElement = buildSlot(placement);
    if (!slotElement) continue;
    heading.before(slotElement);
    inserted.push([placement, heading]);
  }
  if (inserted.length) {
    loadScript();
    for (let i = 0; i < inserted.length; i += 1) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch { /* an unavailable ad network leaves the labelled frame empty */ }
    }
  }
}
