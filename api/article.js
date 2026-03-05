// /api/article.js
// カテゴリIDを受け取り、比較記事を1本返すサーバーレスAPI
// 実運用では OpenAI / 他LLM を呼び出すが、ここでは環境変数が無い場合は
// ルールベースなテンプレテキストを返す。

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
    `【徹底比較】${cat.name}おすすめベストバイ3選｜価格.comクローン版`;

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
    temperature: 0.5
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

  return {
    title,
    body: content,
    categoryId,
    model: body.model
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { categoryId = "smartphone", title } = req.query;

  try {
    const llmResult = await generateWithLLM(categoryId, title);
    if (llmResult) {
      return res.status(200).json({
        source: "llm",
        ...llmResult
      });
    }

    const cat = CATEGORY_MAP[categoryId] || {
      name: "家電全般",
      exampleProducts: ["人気モデルA", "人気モデルB", "人気モデルC"]
    };

    const fallbackTitle =
      title ||
      `【テンプレ】${cat.name}おすすめ比較ガイド（ダミー生成・APIキー未設定）`;

    const body = [
      `# ${fallbackTitle}`,
      "",
      "## まず結論：この3つから選べばOKです",
      "",
      `1. ${cat.exampleProducts[0]}：万能型で迷ったらコレ`,
      `2. ${cat.exampleProducts[1]}：価格と性能のバランス重視なら`,
      `3. ${cat.exampleProducts[2]}：こだわり派・ヘビーユース向け`,
      "",
      "## 選び方のポイント（要約）",
      "- 予算と用途（ゲーム・動画編集・ビジネスなど）を先に決める",
      "- スペック表の数字よりも、自分の使い方に合うかどうかを優先する",
      "- 安さだけで選ぶと、結果的に買い替えが早くなり損をしやすい",
      "",
      "※ この文章はAPIキー未設定環境用のテンプレートです。"
    ].join("\n");

    return res.status(200).json({
      source: "template",
      title: fallbackTitle,
      categoryId,
      model: null,
      body
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

