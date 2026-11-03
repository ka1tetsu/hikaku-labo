// Automated UI checks must not generate real publisher analytics, ad impressions
// or referral clicks. This module is used ONLY by QA/capture scripts.
const REFERRAL_DOMAINS = ['a8.net','afl.rakuten.co.jp','accesstrade.net','valuecommerce.com','af.moshimo.com','click.linksynergy.com','felmat.net','afi-b.com','rentracks.jp','ad.presco.asia','tp.media','prf.hn'];
const isolatedScopes = new WeakSet();
const FIXTURE = '<svg xmlns="http://www.w3.org/2000/svg" width="234" height="60"><rect width="234" height="60" fill="#edf3ef"/><text x="117" y="35" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#162b28">広告素材（検証用）</text></svg>';
export function qaRequestKind(raw, origin) {
  try {
    const url=new URL(raw);
    if(url.origin===new URL(origin).origin&&url.pathname==='/api/track')return 'analytics';
    if(REFERRAL_DOMAINS.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))return 'affiliate';
  } catch { /* not a valid web request */ }
  return null;
}
export async function isolateQaNetwork(page,{origin,onBlocked=()=>{}}) {
  const scope=typeof page.context==='function'?page.context():page;
  if(isolatedScopes.has(scope))return;
  await scope.route('**/*',async route=>{
    const kind=qaRequestKind(route.request().url(),origin);
    if(!kind)return route.continue();
    onBlocked(kind);
    if(kind==='affiliate'&&route.request().resourceType()==='image')return route.fulfill({status:200,contentType:'image/svg+xml',body:FIXTURE});
    return route.fulfill({status:204,body:''});
  });
  isolatedScopes.add(scope);
}
