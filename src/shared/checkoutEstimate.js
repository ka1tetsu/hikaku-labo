// Buyer-entered checkout assumptions only. No merchant API prices are persisted.
// Unknown postage must never be assumed to be free.
export function moneyInput(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!/^[0-9]{1,9}$/.test(text)) return null;
  const amount = Number(text);
  return Number.isSafeInteger(amount) && amount <= 999999999 ? amount : null;
}

export function checkoutEstimate(offer, { shipping = '', coupon = '' } = {}) {
  const price = Number(offer?.price);
  if (!Number.isSafeInteger(price) || price <= 0) return { status: 'invalid', total: null };
  const free = offer?.shippingStatus === 'free' || offer?.shippingFree === true;
  const enteredShipping = moneyInput(shipping);
  const postage = free ? 0 : enteredShipping;
  const enteredCoupon = String(coupon).trim() ? moneyInput(coupon) : 0;
  if (enteredCoupon === null || (String(shipping).trim() && enteredShipping === null)) {
    return { status: 'invalid', total: null };
  }
  if (postage === null) {
    return { status: 'needs-shipping', total: null, price, coupon: enteredCoupon, shipping: null };
  }
  if (enteredCoupon > price + postage) {
    return { status: 'invalid', total: null, reason: 'discount_exceeds_total' };
  }
  const total = price + postage - enteredCoupon;
  const point = Number.isFinite(Number(offer?.point)) ? Math.max(0, Number(offer.point)) : 0;
  return {
    status: 'ready', price, shipping: postage, coupon: enteredCoupon,
    total, point, afterPoints: total - point,
    shippingSource: free ? 'api-free' : 'buyer-entered',
  };
}

export function checkoutComparison(offers, adjustments = {}, getKey = offer => offer.store + ':' + offer.url) {
  const rows = (Array.isArray(offers) ? offers : []).map(offer => ({
    offer, ...checkoutEstimate(offer, adjustments[getKey(offer)]),
  }));
  const priced = rows.filter(row => row.status === 'ready');
  const sorted = [...priced].sort((a, b) => a.total - b.total);
  return {
    rows, cheapest: sorted[0] || null, missingCount: rows.length - priced.length,
    difference: sorted.length >= 2 ? sorted[sorted.length - 1].total - sorted[0].total : null,
  };
}
