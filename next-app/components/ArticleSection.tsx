export function ArticleSection() {
  const articles = [
    {
      id: "smartphone-compare",
      title: "【2024年最新】スマートフォン徹底比較：価格.comを超える“本当に買うべき”3機種",
      category: "スマートフォン",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop&q=80&auto=format",
      desc: "カメラ・バッテリー・価格・リセールバリューを総合評価。iPhoneとハイエンドAndroidを同じ土俵で比較しました。",
      date: "2024-03-05"
    },
    {
      id: "laptop-compare",
      title: "【コスパ重視】仕事もゲームも1台で！ノートPCベストバイ10選",
      category: "ノートパソコン",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop&q=80&auto=format",
      desc: "リモートワーク向けの軽量モデルから、ゲーム・動画編集までこなせるハイパワー機まで、価格別に厳選。",
      date: "2024-03-01"
    }
  ];

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>📖 専門家＆AIによる徹底比較記事</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            数万件の口コミと価格推移データをAIが要約し、「買うべき人」「やめた方がいい人」までハッキリ書き切ります。
          </p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {articles.map((a) => (
          <article
            key={a.id}
            className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-soft"
          >
            <div className="relative h-40 w-full overflow-hidden">
              <img
                src={a.image}
                alt={a.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <span className="badge absolute left-3 top-3 bg-black/70 text-[11px]">
                {a.category}
              </span>
            </div>
            <div className="px-3 py-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{a.date}</span>
                <span>AI＋専門編集部監修</span>
              </div>
              <h3 className="text-sm font-semibold mb-1 line-clamp-2">{a.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-3">{a.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

