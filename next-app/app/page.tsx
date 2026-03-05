import Link from "next/link";
import { CategoryNav } from "../components/CategoryNav";
import { RankingSidebar } from "../components/RankingSidebar";
import { ArticleSection } from "../components/ArticleSection";

const CATEGORIES = [
  { label: "スマートフォン", slug: "smartphone", emoji: "📱" },
  { label: "パソコン", slug: "pc", emoji: "💻" },
  { label: "カメラ", slug: "camera", emoji: "📷" },
  { label: "テレビ", slug: "tv", emoji: "📺" },
  { label: "イヤホン", slug: "earphone", emoji: "🎧" },
  { label: "家電", slug: "appliance", emoji: "🏠" },
  { label: "ゲーム", slug: "game", emoji: "🎮" }
];

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="card shadow-soft">
          <h1 className="text-2xl font-semibold mb-3">
            次世代価格.comクローンで、最安値とベストバイが一目で分かる。
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            スマホ・PC・家電の価格比較、口コミ、ランキング、AIによるおすすめ記事までを一画面に凝縮しました。
          </p>
          <form
            action="/categories"
            className="flex gap-2 mt-2"
          >
            <input
              name="q"
              placeholder="例）iPhone 15 Pro / ゲーミングノート / 4Kテレビ"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/70"
            />
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              価格を検索
            </button>
          </form>
        </section>

        <section className="card shadow-soft">
          <CategoryNav categories={CATEGORIES} />
        </section>

        <section className="card shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">人気カテゴリの売れ筋ランキング</h2>
            <Link href="/ranking" className="text-xs text-orange-600 hover:underline">
              すべてのランキングを見る →
            </Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            直近のアクセスと価格推移データから、「いま本当に売れている」商品だけをピックアップ。
          </p>
          <RankingSidebar />
        </section>

        <ArticleSection />
      </div>
      <aside className="space-y-4">
        <div className="card shadow-soft">
          <h3 className="text-sm font-semibold mb-2">リアルタイム最安値検索</h3>
          <p className="text-xs text-slate-600 mb-3">
            楽天・Amazon・Yahoo!ショッピング・家電量販店の価格を同時比較。還元ポイントや送料まで含めて総支払額を算出します。
          </p>
          <ul className="space-y-1 text-xs text-slate-700">
            <li>・主要ECモールのAPI連携＋スクレイピング</li>
            <li>・秒単位の価格履歴をもとにした「今が買い時」スコア</li>
            <li>・AIが用途別に最適な1台を提案</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

