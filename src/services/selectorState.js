// Only known enum values enter the comparison. Never forward arbitrary URL input.
export function selectorAnswers(questions, category, search = '') {
  const params = new URLSearchParams(search);
  return Object.fromEntries(questions.map(question => {
    const fallback = question.options[category === 'hikari' && question.id === 'area' ? 2 : 0][0];
    const value = params.get(question.id);
    return [question.id, question.options.some(([id]) => id === value) ? value : fallback];
  }));
}
