import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "比較ラボ - 次世代価格.comクローン",
  description: "スマホ・PC・家電の価格比較、口コミ、ランキングを一括でチェックできる次世代価格比較プラットフォーム"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold tracking-tight">
              比較ラボ<span className="ml-2 text-xs font-normal text-orange-500">next版</span>
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/categories" className="hover:text-orange-500">カテゴリ一覧</a>
              <a href="/ranking" className="hover:text-orange-500">ランキング</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
          {children}
        </main>
        <footer className="border-t bg-white py-4 mt-8">
          <div className="mx-auto max-w-6xl px-4 text-xs text-slate-500 flex justify-between">
            <span>© {new Date().getFullYear()} 比較ラボ</span>
            <span>価格.comを徹底研究した次世代価格比較エンジン</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

