import { createHash, timingSafeEqual } from 'node:crypto';

// These endpoints are not used by the browser UI. Paid generation is a private
// operator action; an OpenAI key alone must not turn it into a public cost sink.
export function paidAiAccess(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', method);
  if (req.method !== method) { res.status(405).json({ error: 'method_not_allowed' }); return false; }
  const expected = process.env.AI_GENERATION_TOKEN;
  if (!expected || !process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: 'paid_generation_disabled' });
    return false;
  }
  const supplied = typeof req.headers?.authorization === 'string' ? req.headers.authorization.replace(/^Bearer /, '') : '';
  const digest = value => createHash('sha256').update(value).digest();
  if (!req.headers?.authorization?.startsWith('Bearer ') || !timingSafeEqual(digest(supplied), digest(expected))) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}
