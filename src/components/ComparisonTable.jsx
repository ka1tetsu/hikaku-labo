import { buildRakutenAffiliateUrl } from '../api';

const yen = (n) => `¥${Math.round(n).toLocaleString()}`;

// 各行の定義。value は表示用、score は「どの列が最も優れているか」の比較用。
// score が null の行はハイライトしない（優劣が一意に決まらない項目）。
const ROWS = [
    {
        key: 'itemPrice',
        label: '商品価格',
        value: (it) => yen(it.itemPrice),
        score: (it) => -it.itemPrice, // 安いほど良い
    },
    {
        key: 'shipping',
        label: '送料',
        value: (it) => (it.isFreeShipping ? '送料無料' : '送料別（店舗により変動）'),
        score: (it) => (it.isFreeShipping ? 1 : 0),
    },
    {
        key: 'point',
        label: 'ポイント',
        value: (it) => `${it.pointRate}倍（約 ${yen(it.pointBack)} 相当）`,
        score: (it) => it.pointBack,
    },
    {
        key: 'effectivePrice',
        label: '実質価格（ポイント還元後）',
        value: (it) => yen(it.effectivePrice),
        score: (it) => -it.effectivePrice,
        emphasis: true,
    },
    {
        key: 'review',
        label: 'レビュー評価',
        value: (it) => (it.reviewCount > 0 ? `★ ${it.reviewAverage.toFixed(2)}` : 'レビューなし'),
        score: (it) => (it.reviewCount > 0 ? it.reviewAverage : -1),
    },
    {
        key: 'reviewCount',
        label: 'レビュー件数',
        value: (it) => `${it.reviewCount.toLocaleString()}件`,
        score: (it) => it.reviewCount,
    },
    {
        key: 'shop',
        label: 'ショップ',
        value: (it) => it.shopName || '—',
        score: null,
    },
    {
        key: 'card',
        label: 'カード決済',
        value: (it) => (it.creditCardFlag === 1 ? '利用可' : '要確認'),
        score: null,
    },
    {
        key: 'asuraku',
        label: 'あす楽',
        value: (it) => (it.asurakuFlag === 1 ? '対応' : '非対応'),
        score: (it) => (it.asurakuFlag === 1 ? 1 : 0),
    },
];

export default function ComparisonTable({ items, onRemove, onClear }) {
    if (items.length === 0) return null;

    // 行ごとの最良スコアを求める。全列が同値の場合はハイライトしない。
    const bestScores = {};
    for (const row of ROWS) {
        if (!row.score) continue;
        const scores = items.map(row.score);
        const max = Math.max(...scores);
        const allSame = scores.every((s) => s === max);
        bestScores[row.key] = allSame ? null : max;
    }

    const hasShippingCaveat = items.some((it) => !it.isFreeShipping);

    return (
        <section className="comparison-panel">
            <div className="comparison-header">
                <h2 className="comparison-title">選択した商品を比較（{items.length}件）</h2>
                <button className="comparison-clear" onClick={onClear}>すべて解除</button>
            </div>

            {items.length === 1 && (
                <p className="comparison-hint">もう1件チェックすると横並びで比較できます。</p>
            )}

            <div className="comparison-scroll">
                <table className="comparison-table">
                    <thead>
                        <tr>
                            <th className="comparison-rowhead">項目</th>
                            {items.map((it) => (
                                <th key={it.itemCode} className="comparison-colhead">
                                    <button
                                        className="comparison-remove"
                                        onClick={() => onRemove(it.itemCode)}
                                        title="比較から外す"
                                    >×</button>
                                    {it.imageUrl && (
                                        <img src={it.imageUrl} alt={it.itemName} className="comparison-thumb" loading="lazy" />
                                    )}
                                    <span className="comparison-name">{it.itemName}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((row) => (
                            <tr key={row.key} className={row.emphasis ? 'row-emphasis' : ''}>
                                <th className="comparison-rowhead">{row.label}</th>
                                {items.map((it) => {
                                    const best =
                                        bestScores[row.key] != null && row.score(it) === bestScores[row.key];
                                    return (
                                        <td key={it.itemCode} className={best ? 'cell-best' : ''}>
                                            {row.value(it)}
                                            {best && <span className="best-badge">ベスト</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr>
                            <th className="comparison-rowhead">購入</th>
                            {items.map((it) => (
                                <td key={it.itemCode}>
                                    <a
                                        href={buildRakutenAffiliateUrl(it, it.itemName)}
                                        target="_blank"
                                        rel="noopener noreferrer sponsored"
                                        className="comparison-cta"
                                    >楽天市場で見る ▶</a>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="comparison-note">
                価格・ポイント・レビューは楽天市場APIの取得時点の値です。
                実質価格は「商品価格 − ポイント還元相当額」で算出しています。
                {hasShippingCaveat && ' 送料別の商品は送料を含んでいません。'}
                最新の価格・在庫は楽天市場の商品ページでご確認ください。
            </p>
        </section>
    );
}
