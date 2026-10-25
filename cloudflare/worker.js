import search from '../api/search.js';
import compare from '../api/compare.js';
import track from '../api/track.js';
import diagnostic from '../api/diag.js';
import flightPrices from '../api/flight-prices.js';
import article from '../api/article.js';
import reviewSummary from '../api/reviewSummary.js';
import { runHandler } from './adapter.js';

const routes = new Map([
  ['/api/search', search], ['/api/compare', compare], ['/api/track', track],
  ['/api/diag', diagnostic], ['/api/flight-prices', flightPrices],
  ['/api/article', article], ['/api/reviewSummary', reviewSummary],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const handler = routes.get(url.pathname);
    if (handler) {
      try { return await runHandler(handler, request, { bodyLimit: url.pathname === '/api/track' ? 512 : 32768 }); }
      catch {
        // Never log a request URL, body, authorization header or provider error.
        console.error(JSON.stringify({ type: 'vivlica_api_error', route: url.pathname }));
        return Response.json({ error: 'service_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return Response.json({ error: 'not_found' }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
