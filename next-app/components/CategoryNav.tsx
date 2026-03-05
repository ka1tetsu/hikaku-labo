"use client";

import { useRouter } from "next/navigation";

type Category = {
  label: string;
  slug: string;
  emoji?: string;
};

export function CategoryNav({ categories }: { categories: Category[] }) {
  const router = useRouter();

  return (
    <nav className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => router.push(`/categories?slug=${cat.slug}`)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs hover:border-orange-400 hover:bg-orange-50"
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </nav>
  );
}

