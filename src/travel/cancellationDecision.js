// User-supplied booking totals and cancellation penalties only.
// A scenario comparison, not a live quote, risk forecast or travel recommendation.
function yenAmount(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (!/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}

export function compareCancellationDecisions({
  flexibleTotal, restrictedTotal, flexibleFee, restrictedFee,
} = {}) {
  const values = [flexibleTotal, restrictedTotal, flexibleFee, restrictedFee].map(yenAmount);
  if (values.some(value => value === null)) return null;
  const [flex, restricted, flexPenalty, restrictedPenalty] = values;
  // Empty/zero-value 'bookings' must never be recommended.
  if (!flex || !restricted || flexPenalty > flex || restrictedPenalty > restricted) return null;
  const savingsIfTravel = flex - restricted;
  const extraCostIfCancel = restrictedPenalty - flexPenalty;
  // A purely mathematical threshold under a two-outcome hypothetical model.
  // Never present this as an estimated personal cancellation likelihood.
  const threshold = savingsIfTravel > 0 && extraCostIfCancel > 0
    ? savingsIfTravel / (savingsIfTravel + extraCostIfCancel)
    : null;
  return Object.freeze({
    flexibleTotal: flex, restrictedTotal: restricted,
    flexibleFee: flexPenalty, restrictedFee: restrictedPenalty,
    savingsIfTravel, extraCostIfCancel,
    cancellationThreshold: threshold,
  });
}
