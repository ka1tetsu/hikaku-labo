import Link from "next/link";

type ProductPageParams = { id: string };

// 本来はここでDBや外部APIから商品・価格・レビュー・記事などを取得する
async function getProduct(id: string) {
  return {
    id,
    name: `サンプル商品 ${id} - 価格.comクローンデモ`,
    brand: "SampleBrand",
    category: "スマートフォン",
    minPrice: 79800,
    maxPrice: 99800,
    reviewAverage: 4.3,
    reviewCount: 256,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop&q=80&auto=format",
    specs: [
      "OS: iOS / Android 相当",
      "ディスプレイ: 6.1インチ 有機EL",
      "ストレージ: 256GB",
      "カメラ: 4800万画素 広角＋望遠",
      "重量: 約170g"
    ],
    shops: [
      { id: "rakuten", name: "楽天市場", price: 79800, point: "10倍", url: "#" },
      { id: "amazon", name: "Amazon.co.jp", price: 81200, point: "通常", url: "#" },
      { id: "yahoo", name: "Yahoo!ショッピング", price: 80500, point: "PayPay +12%", url: "#" }
    ],
    aiSummary: {
      pros: "カメラ・バッテリー・処理性能のバランスが非常に良く、長く使える万能モデル。",
      cons: "価格は高めで、ライトユーザーにはオーバースペックになりやすい。",
      who: "ゲームも写真も動画編集も1台でこなしたい、ヘビーユース寄りのユーザーに最適。"
    }
  };
}

export default async function ProductDetailPage({ params }: { params: ProductPageParams }) {
  const product = await getProduct(params.id);

  return (
    <div className="space-y-5">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:underline">
          トップ
        </Link>{" "}
        &gt;{" "}
        <Link href="/categories" className="hover:underline">
          {product.category}
        </Link>{" "}
        &gt; <span className="text-slate-700">{product.name}</span>
      </nav>

      <section className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="card shadow-soft">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/2">
              <img
                src={product.image}
                alt={product.name}
                className="w-full rounded-xl object-cover"
              />
            </div>
            <div className="md:w-1/2 space-y-2">
              <h1 className="text-lg font-semibold">{product.name}</h1>
              <div className="text-xs text-slate-500">{product.brand}</div>
              <div className="mt-2 text-sm">
                <div className="text-xs text-slate-500">価格帯（目安）</div>
                <div className="text-xl font-bold text-orange-600">
                  ¥{product.minPrice.toLocaleString()}〜¥
                  {product.maxPrice.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  主要ショップの価格・ポイントを自動集計して表示します。
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                  ★ {product.reviewAverage.toFixed(1)} / 5.0
                </span>
                <span className="ml-2 text-[11px] text-slate-500">
                  レビュー {product.reviewCount}件（自社＋外部サイト集約）
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside className="card shadow-soft space-y-3">
          <h2 className="text-sm font-semibold">AI要約（メリット・デメリット・おすすめな人）</h2>
          <div className="text-xs space-y-2">
            <div>
              <div className="font-semibold text-emerald-700 text-[13px] mb-0.5">
                ✅ メリット
              </div>
              <p className="text-slate-700">{product.aiSummary.pros}</p>
            </div>
            <div>
              <div className="font-semibold text-rose-700 text-[13px] mb-0.5">⚠ デメリット</div>
              <p className="text-slate-700">{product.aiSummary.cons}</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-[13px] mb-0.5">
                👤 こういう人におすすめ
              </div>
              <p className="text-slate-700">{product.aiSummary.who}</p>
            </div>
            <p className="text-[11px] text-slate-500">
              ※ 自社サイトと提携ECサイトの口コミをAIが要約しています。誇張表現や誤りがあればお知らせください。
            </p>
          </div>
        </aside>
      </section>

      <section className="card shadow-soft space-y-3">
        <h2 className="text-sm font-semibold">主要ショップの価格一覧</h2>
        <table className="w-full text-xs border-separate border-spacing-y-1">
          <thead className="text-[11px] text-slate-500">
            <tr>
              <th className="text-left">ショップ</th>
              <th className="text-right">価格</th>
              <th className="text-right">ポイント・還元</th>
              <th className="text-right">リンク</th>
            </tr>
          </thead>
          <tbody>
            {product.shops.map((s) => (
              <tr key={s.id} className="bg-slate-50/80">
                <td className="px-2 py-1">{s.name}</td>
                <td className="px-2 py-1 text-right font-semibold text-orange-600">
                  ¥{s.price.toLocaleString()}
                </td>
                <td className="px-2 py-1 text-right text-slate-600">{s.point}</td>
                <td className="px-2 py-1 text-right">
                  <a
                    href={s.url}
                    className="inline-flex items-center justify-center rounded-full border border-orange-500 px-2 py-0.5 text-[11px] text-orange-600 hover:bg-orange-50"
                  >
                    ショップへ
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card shadow-soft space-y-2">
        <h2 className="text-sm font-semibold">主なスペック</h2>
        <ul className="grid gap-1 text-xs text-slate-700 md:grid-cols-2">
          {product.specs.map((s, idx) => (
            <li key={idx}>・{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

