"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  price: number;
  image: string;
  rank: number;
};

const MOCK_ITEMS: Item[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `mock-${i}`,
  name: `売れ筋スマートフォン ${i + 1}`,
  price: 79800 + i * 3000,
  image: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&h=120&fit=crop&q=80&auto=format`,
  rank: i + 1
}));

export function RankingSidebar() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    // TODO: 本番では /api/ranking 等から取得
    setItems(MOCK_ITEMS);
  }, []);

  return (
    <ol className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2"
        >
          <div className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 rounded-md object-cover"
            />
            <span className="absolute -left-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
              {item.rank}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="line-clamp-2 text-xs font-medium">{item.name}</div>
            <div className="mt-1 text-xs font-semibold text-orange-600">
              ¥{item.price.toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

