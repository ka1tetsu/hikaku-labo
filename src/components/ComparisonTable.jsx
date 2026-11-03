import { recordOutboundClick } from '../shared/outboundClient.js';
import { catalogPurchaseTarget } from '../shared/catalogPurchase.js';
import { shippingLabel } from '../shared/compareWorkbench.js';

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
        value: (it) => shippingLabel({shippingStatus:it.shippingStatus,shippingFree:it.isFreeShipping}),
        score: (it) => (it.isFreeShipping ? 1 : 0),
    },
    {
        key: 'point',
        label: 'ポイント',
        value: (it) => Number.isFinite(it.pointBack)?`${it.pointBack.toLocaleString('ja-JP')}pt（取得元の表示）`:'未取得',
        score: (it) => it.pointBack,
    },
    {
        key: 'effectivePrice',
        label: 'ポイント考慮後の参考額（支払額とは別）',
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
        label: '配送サービスの表示',
        value: (it) => (it.asurakuFlag === 1 ? '取得元に対応表示あり・地域等は要確認' : '対応状況未取得'),
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
                <button type="button" className="comparison-clear" onClick={onClear}>すべて解除</button>
            </div>

            {items.length === 1 && (
                <p className="comparison-hint">もう1件チェックすると横並びで比較できます。</p>
            )}

            <div className="comparison-scroll" role="region" aria-label="商品比較表（左右にスクロールできます）" tabIndex="0">
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
                                        aria-label={it.itemName + "を比較から外す"}
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
                            {items.map((it) => {
                                const target=catalogPurchaseTarget(it);
                                return <td key={it.itemCode}>{target?<a href={target.url} target="_blank" rel={target.sponsored?'noopener noreferrer sponsored':'noopener noreferrer'} className="comparison-cta"
                                    onClick={()=>recordOutboundClick({section:'products',merchant:target.merchant,placement:'comparison-table',sponsored:target.sponsored})}>
                                    {target.label}で見る ↗{target.sponsored?'（PR）':''}</a>:<span>購入先未取得</span>}</td>;
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="comparison-note">
                価格・ポイント・レビューは各取得元APIの値です。
                ポイント考慮後の参考額は現金支払額ではなく、送料・割引条件も別に確認してください。
                {hasShippingCaveat && ' 送料が不明・別途の出品は送料込み総額を確認できていません。'}
                最新の価格・在庫・色・容量・状態は、それぞれの販売ページでご確認ください。
            </p>
        </section>
    );
}
