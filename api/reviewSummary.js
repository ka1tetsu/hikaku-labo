import { paidAiAccess } from '../server/paidAiAccess.js';
// /api/reviewSummary.js
// 実際のレビュー文を受け取り、「メリット・デメリット・おすすめな人」を3行で返すAPI

async function summarizeWithLLM(reviews) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const trimmed = reviews.slice(0, 500);
  const joined = trimmed
    .map((r, i) => `【レビュー${i + 1}】\n${r}`)
    .join("\n\n");

  const system =
    "あなたは家電レビューを要約する日本語AIです。事実ベースで簡潔に要約し、誇張表現を避けてください。";
  const user = `
以下のレビュー群から、その製品の「メリット」「デメリット」「こういう人におすすめ」をそれぞれ1文で日本語でまとめてください。

出力フォーマットは必ず以下の3行にしてください：
メリット: ...
デメリット: ...
おすすめ: ...

レビュー一覧:
${joined}
`;

  const body = {
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    max_completion_tokens: 600,
    temperature: 0.3
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "";

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result = { pros: "", cons: "", who: "" };
  for (const l of lines) {
    if (l.startsWith("メリット")) {
      result.pros = l.replace(/^メリット[:：]\s*/, "");
    } else if (l.startsWith("デメリット")) {
      result.cons = l.replace(/^デメリット[:：]\s*/, "");
    } else if (l.startsWith("おすすめ")) {
      result.who = l.replace(/^おすすめ[:：]\s*/, "");
    }
  }

  return result;
}

export default async function handler(req, res) {
  if (!paidAiAccess(req, res, 'POST')) return;
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'invalid_json' }); }
  const reviews = body?.reviews;
  if (!Array.isArray(reviews) || reviews.length < 1 || reviews.length > 20 || reviews.some(review => typeof review !== 'string' || !review.trim() || review.length > 1000)) {
    return res.status(400).json({ error: 'Provide 1 to 20 reviews of at most 1000 characters each.' });
  }
  try {
    const result = await summarizeWithLLM(reviews);
    return res.status(200).json({ source: 'llm', reviewRequired: true, ...result });
  } catch {
    return res.status(502).json({ error: 'summary_failed' });
  }
}
