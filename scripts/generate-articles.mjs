// scripts/generate-articles.mjs
// 価格.comクローン用の比較記事を大量生成して Markdown ファイルとして保存するスクリプト
// 前提: /api/article がデプロイ済み（例: https://hikaku-labo.vercel.app/api/article）

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== 設定ここから =====

// 記事を保存するディレクトリ（リポジトリ内）
const OUTPUT_DIR = join(__dirname, "..", "content", "articles");

// 記事生成APIのベースURL（必要に応じて変更）
const ARTICLE_API_BASE =
  process.env.ARTICLE_API_BASE || "https://hikaku-labo.vercel.app/api/article";

// 生成対象カテゴリとサブトピック
const CATEGORY_TOPICS = {
  smartphone: [
    "ハイエンド",
    "ミドルレンジ",
    "格安SIMセット",
    "カメラ重視",
    "ゲーム向け",
    "初心者向け",
    "子ども用"
  ],
  pc: [
    "ビジネス用ノート",
    "ゲーミングPC",
    "クリエイター向け",
    "大学生向け",
    "在宅ワーク向け",
    "動画編集向け"
  ],
  tv: [
    "4K有機EL",
    "65インチ以上",
    "ゲーム向け低遅延",
    "一人暮らし用小型",
    "リビング用ハイエンド"
  ]
};

// ===== 設定ここまで =====

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function slugify(text) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}

async function fetchArticle(categoryId, title) {
  const url = new URL(ARTICLE_API_BASE);
  url.searchParams.set("categoryId", categoryId);
  if (title) url.searchParams.set("title", title);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Article API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log("▶ 記事大量生成を開始します...");
  console.log(`  API: ${ARTICLE_API_BASE}`);
  console.log(`  出力先: ${OUTPUT_DIR}`);

  await ensureDir(OUTPUT_DIR);

  let count = 0;

  for (const [categoryId, topics] of Object.entries(CATEGORY_TOPICS)) {
    for (const topic of topics) {
      const customTitle = `【徹底比較】${topic} ${categoryId} おすすめベストバイガイド`;
      console.log(`  - 生成中: category=${categoryId}, topic=${topic}`);

      try {
        const article = await fetchArticle(categoryId, customTitle);
        const safeTitle = slugify(topic || article.title || "article");
        const filename = `${categoryId}-${safeTitle}.md`;
        const filePath = join(OUTPUT_DIR, filename);

        const frontMatter = [
          "---",
          `title: "${article.title.replace(/"/g, '\\"')}"`,
          `categoryId: "${categoryId}"`,
          `source: "${article.source || "unknown"}"`,
          `model: "${article.model || ""}"`,
          `generatedAt: "${new Date().toISOString()}"`,
          "---",
          ""
        ].join("\n");

        const body = typeof article.body === "string" ? article.body : String(article.body || "");

        await writeFile(filePath, frontMatter + body, "utf8");
        console.log(`    -> 保存完了: ${filename}`);
        count += 1;
      } catch (err) {
        console.error(`    !! 失敗: ${err.message}`);
      }
      // API負荷を考慮して、少しだけウェイト
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`✅ 生成完了: 合計 ${count} 記事`);
}

main().catch((err) => {
  console.error("致命的なエラー:", err);
  process.exit(1);
});

