// A single editorial presentation pattern shared across different comparison engines.
// Values describe verification steps, never fabricated live prices or rankings.
export const EDITORIAL_PANELS = Object.freeze({
  tools: {
    ariaLabel: 'ITツールを選ぶときの確認事項',
    eyebrow: '比べる基準',
    title: '安いかどうかだけでなく、使い続けられるか。',
    rows: [
      { label: '作りたいもの', value: '必要な機能・公開先・運用方法に対応しているか' },
      { label: '支払う費用', value: '基本料金、決済・取引手数料、追加費用を確認する' },
      { label: '継続のしやすさ', value: '管理の手間、データ移行、問い合わせ方法も比べる' },
    ],
    footnote: 'サイト内の適合スコアは独自ルールによる目安です。サービス品質の実測評価ではありません。',
    href: '#method',
    linkLabel: '評価方法と注意点を確認する',
  },
  travel: {
    ariaLabel: '旅行の支払総額を比べるときの確認事項',
    eyebrow: '予約前の比較メモ',
    title: '表示された料金より、最後に支払う金額。',
    rows: [
      { label: '宿泊費', value: '泊数・室数・税・サービス料・現地支払いを含める' },
      { label: '移動費', value: '航空券・鉄道だけでなく、駅からの移動や追加料金も確認する' },
      { label: '予約条件', value: 'キャンセル無料期限、食事、人数、在庫を同条件でそろえる' },
    ],
    footnote: '宿泊の初泊参考額と、旅行者が入力して計算した旅費総額は別の数字です。',
    href: '/guides/travel-total-cost/',
    linkLabel: '支払総額の比較方法を見る',
  },
});
