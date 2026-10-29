import { paidAiAccess } from '../server/paidAiAccess.js';
// /api/article.js
// カテゴリIDを受け取り、比較記事を1本返すサーバーレスAPI
// 管理者のBearer認証でのみ有料生成する。キー未設定時は無効。

const CATEGORY_MAP = {
  smartphone: {
    name: "スマートフォン",
    exampleProducts: ["iPhone 15 Pro", "Pixel 9 Pro", "Xperia 1 VI"]
  },
  pc: {
    name: "ノートパソコン",
    exampleProducts: ["MacBook Air", "ThinkPad X1 Carbon", "ROG Zephyrus G"]
  },
  tv: {
    name: "4Kテレビ",
    exampleProducts: ["有機EL 55インチ", "65インチ液晶", "ゲーミング対応4Kテレビ"]
  }
};

async function generateWithLLM(categoryId, overrideTitle) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const cat = CATEGORY_MAP[categoryId] || {
    name: "家電全般",
    exampleProducts: ["人気モデルA", "人気モデルB", "人気モデルC"]
  };

  const title =
    overrideTitle ||
    `【徹底比較】${cat.name}おすすめベストバイ3選｜Vivlica編集用ドラフト`;

  const system = "あなたは日本語で家電の比較レビュー記事を書くプロ編集者です。事実ベースで簡潔に書いてください。";
  const user = `
「${cat.name}」カテゴリの比較記事を、以下の構成で日本語で作成してください。

- タイトル（H1）
- 「まず結論」セクション（どれを選べばよいかを3行で）
- 第1章：選び方のポイント（スペックや価格帯の目安）
- 第2章：おすすめモデル3つ（想定モデル名: ${cat.exampleProducts.join(" / ")}）
  - 各モデルのメリット・デメリット・向いている人を具体的に
- 第3章：よくある失敗パターンと回避策
- まとめ（用途別にどれを買うべきかを再度整理）

価格や在庫など、具体的な数値は「目安」としてぼかし、誇張表現は避けてください。
`;

  const body = {
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    max_completion_tokens: 1200,
    temperature: 0.5
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

  return {
    title,
    body: content,
    categoryId,
    model: body.model
  };
}

export default async function handler(req, res) {
  if (!paidAiAccess(req, res, 'GET')) return;
  const { categoryId = 'smartphone', title } = req.query || {};
  if (typeof categoryId !== 'string' || !Object.hasOwn(CATEGORY_MAP, categoryId) || (title !== undefined && (typeof title !== 'string' || title.length > 200))) {
    return res.status(400).json({ error: 'invalid_generation_parameters' });
  }
  try {
    const result = await generateWithLLM(categoryId, title);
    return res.status(200).json({ source: 'llm', reviewRequired: true, ...result });
  } catch {
    return res.status(502).json({ error: 'generation_failed' });
  }
}
