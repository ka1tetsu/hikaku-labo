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
    temperature: 0.3
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
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

function summarizeTemplate(reviews) {
  const sample = (reviews || []).slice(0, 3);
  const joined = sample.join(" / ").slice(0, 120);

  return {
    pros: "多くのユーザーが「コスパの良さ」と「使い勝手の良さ」を評価しており、総じて満足度は高い傾向です。",
    cons: "一部のレビューでは「初期設定の分かりづらさ」や「細かな部分の作りの甘さ」が指摘されています。",
    who: "価格を抑えつつ、日常利用でストレスなく使える製品を探している人に向いています。参考レビュー抜粋: " + joined
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
    const reviews = Array.isArray(body.reviews) ? body.reviews : [];

    if (!reviews.length) {
      return res.status(400).json({ error: "reviews (string配列) を1件以上指定してください。" });
    }

    const llmResult = await summarizeWithLLM(reviews);
    if (llmResult) {
      return res.status(200).json({
        source: "llm",
        ...llmResult
      });
    }

    const fallback = summarizeTemplate(reviews);
    return res.status(200).json({
      source: "template",
      ...fallback
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

