import { travelAffiliateEnabled, YAHOO_TRAVEL_A8_CREATIVES } from './a8TravelAds.js';
import { recordOutboundClick } from '../shared/outboundClient.js';

// A8.net does not permit pulling a naked affiliate URL out of the standard HTML.
// Render the source creative verbatim and only on a registered, permitted domain.
// A non-sponsored official URL remains usable while the publisher verifies a new host.
export default function YahooTravelAd({ variant = 'banner234', placement = 'yahoo-compare' }) {
  const enabled = travelAffiliateEnabled(import.meta.env);
  const record = sponsored => recordOutboundClick({ section:'travel', merchant:'yahoo-travel', placement, sponsored });
  if (!enabled) return <div className="yt-ad-placement" aria-label="Yahoo!トラベルを確認">
    <p className="yt-ad-label">Yahoo!トラベル（通常の公式リンク）</p>
    <p>予約前に宿泊日・人数・支払総額・ポイントとキャンセル条件をご確認ください。</p>
    <a href="https://travel.yahoo.co.jp/" target="_blank" rel="noopener noreferrer" onClick={() => record(false)}>
      Yahoo!トラベルで実際の宿泊料金を見る ↗
    </a>
  </div>;
  const html = YAHOO_TRAVEL_A8_CREATIVES[variant];
  if (!html) return null;
  return <div className="yt-ad-placement" aria-label="Yahoo!トラベル PR広告">
    <p className="yt-ad-label">PR・広告｜Yahoo!トラベル</p>
    <p>宿泊条件を揃えて料金を確認。比較結果は広告によって変更されません。</p>
    <div className="yt-ad-creative" onClick={event => {
      if (event.target.closest('a[href^="https://px.a8.net/"]')) record(true);
    }} dangerouslySetInnerHTML={{ __html: html }} />
  </div>;
}
