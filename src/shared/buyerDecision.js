// Plain, explainable buyer choices. Never use affiliate commission, popularity
// claims or unverified similar products to choose a featured purchase link.
export function purchaseChoices(offers = []) {
  const eligible = (Array.isArray(offers) ? offers : []).filter(offer =>
    offer?.sameProduct === true && ['jan', 'model'].includes(offer?.matchBasis) &&
    Number.isFinite(offer?.price) && offer.price > 0 &&
    typeof offer?.url === 'string' && offer.url.startsWith('https://'));
  const priceOrder = [...eligible].sort((a, b) => a.price - b.price || (b.reviewCount || 0) - (a.reviewCount || 0));
  const cheapest = priceOrder[0];
  if (!cheapest) return [];
  const result = [{ kind: 'cash', label: '商品価格が最小の一致候補', offer: cheapest }];
  const freeShipping = priceOrder.find(o => o.shippingStatus === 'free' && o.url !== cheapest.url);
  if (freeShipping) {
    result.push({
      kind: 'shipping', label: '送料無料と表示された一致候補',
      offer: freeShipping, priceDifference: freeShipping.price - cheapest.price,
    });
  }
  return result;
}

export function sourceNotice(sources = {}) {
  const active = Object.entries({rakuten:'楽天市場',yahoo:'Yahoo!ショッピング'})
    .filter(([key]) => sources[key] === 'ok').map(([, label]) => label);
  const unavailable = Object.entries({rakuten:'楽天市場',yahoo:'Yahoo!ショッピング'})
    .filter(([key]) => sources[key] === 'error').map(([, label]) => label);
  if (!active.length && !unavailable.length) return null;
  return {
    active,
    unavailable,
    message: active.length ? active.join('・') + 'の取得結果を表示中。' +
      (unavailable.length ? unavailable.join('・') + 'は今回取得できませんでした。' : '') :
      unavailable.join('・') + 'の価格を今回取得できませんでした。',
  };
}
