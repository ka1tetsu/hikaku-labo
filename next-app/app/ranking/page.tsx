import Link from "next/link";

const MOCK_RANKING = Array.from({ length: 10 }).map((_, i) => ({
  id: `item-${i}`,
  name: `売れ筋スマートフォン ${i + 1}`,
  price: 79800 + i * 3000,
  reviews: 120 + i * 23,
  rating: 4.1 + (i % 3) * 0.1,
  image:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=260&h=200&fit=crop&q=80&auto=format",
  trend: i < 3 ? "up" : i > 7 ? "down" : "flat"
}));

type SearchParams = { category?: string };

export default function RankingPage({ searchParams }: { searchParams: SearchParams }) {
  const category = searchParams.category ?? "smartphone";

  const categoryLabel =
    category === "pc"
      ? "ノートパソコン"
      : category === "camera"
      ? "カメラ"
      : category === "tv"
      ? "テレビ"
      : "スマートフォン";

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1">
            {categoryLabel} 売れ筋ランキング（擬似価格.comスタイル）
          </h1>
          <p className="text-xs text-slate-600">
            アクセス数・価格推移・レビュー評価を総合して算出した人気スコア順に並べています。
          </p>
        </div>
        <Link href="/categories" className="text-xs text-orange-600 hover:underline">
          他のカテゴリを見る →
        </Link>
      </header>

      <ol className="space-y-2">
        {MOCK_RANKING.map((item, index) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-soft md:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-md object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.id}`}
                className="text-sm font-semibold hover:text-orange-600 line-clamp-2"
              >
                {item.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <span>レビュー {item.reviews}件</span>
                <span>満足度 {item.rating.toFixed(1)} / 5.0</span>
                <span
                  className={
                    item.trend === "up"
                      ? "text-emerald-600"
                      : item.trend === "down"
                      ? "text-rose-600"
                      : "text-slate-500"
                  }
                >
                  {item.trend === "up"
                    ? "値下がり傾向"
                    : item.trend === "down"
                    ? "値上がり傾向"
                    : "横ばい"}
                </span>
              </div>
            </div>
            <div className="text-right text-sm min-w-[96px]">
              <div className="font-bold text-orange-600">
                ¥{item.price.toLocaleString()}
              </div>
              <div className="mt-1">
                <Link
                  href={`/products/${item.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-orange-500 bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-orange-600"
                >
                  最安値をチェック
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

