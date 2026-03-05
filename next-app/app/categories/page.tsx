import Link from "next/link";
import { redirect } from "next/navigation";

const CATEGORY_DEFS = [
  { slug: "smartphone", name: "スマートフォン", description: "iPhone / Android / 格安SIM対応機など", emoji: "📱" },
  { slug: "pc", name: "パソコン", description: "ノートPC / デスクトップ / ゲーミングPC", emoji: "💻" },
  { slug: "camera", name: "カメラ", description: "ミラーレス / 一眼レフ / コンデジ", emoji: "📷" },
  { slug: "tv", name: "テレビ", description: "4K / 8K / 有機EL / ゲーム向け低遅延モデル", emoji: "📺" },
  { slug: "earphone", name: "イヤホン・ヘッドホン", description: "ノイキャン対応 / ワイヤレス / 有線モニター", emoji: "🎧" },
  { slug: "appliance", name: "生活家電", description: "洗濯機 / 冷蔵庫 / 掃除機 / 電子レンジ", emoji: "🏠" }
];

type SearchParams = { q?: string; slug?: string };

export default function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, slug } = searchParams;

  if (slug) {
    // 本来はカテゴリ別の一覧APIを叩いてSSR/ISRする。
    // ここでは商品詳細一覧のダミーにリダイレクト。
    redirect(`/ranking?category=${slug}`);
  }

  const title = q ? `「${q}」に関連するカテゴリ` : "カテゴリ一覧";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
        {q && (
          <p className="text-xs text-slate-600">
            価格.comと同様に、検索キーワードから関連の強いカテゴリをピックアップしました。
          </p>
        )}
      </header>

      <ul className="grid gap-3 md:grid-cols-2">
        {CATEGORY_DEFS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/ranking?category=${c.slug}`}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-soft hover:border-orange-400"
            >
              <div className="mt-1 text-2xl">{c.emoji}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{c.name}</h2>
                  <span className="badge bg-slate-900/80 text-[10px]">ランキングあり</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{c.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

