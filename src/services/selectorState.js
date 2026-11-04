// Only known enum values enter the comparison. Never forward arbitrary URL input.
//
// Neutral defaults (Fix 7): for hikari, the initial answers must not presume a
// specific carrier or region on the user's behalf. The area fallback is 関東
// (options[2], pre-existing) and the carrier fallback is 'none' （その他・格安SIM)
// instead of the first option (docomo), so the initial ranking is driven by
// price and area rather than by a carrier bundle the user may not have. This
// only changes the default input condition; the ranking calculation itself
// (score.js) is untouched, and other categories keep first-option fallbacks.
function fallbackFor(question, category) {
  if (category === 'hikari' && question.id === 'area') return question.options[2][0];
  if (category === 'hikari' && question.id === 'carrier') {
    const none = question.options.find(([id]) => id === 'none');
    if (none) return none[0];
  }
  return question.options[0][0];
}

export function selectorAnswers(questions, category, search = '') {
  const params = new URLSearchParams(search);
  return Object.fromEntries(questions.map(question => {
    const fallback = fallbackFor(question, category);
    const value = params.get(question.id);
    return [question.id, question.options.some(([id]) => id === value) ? value : fallback];
  }));
}
