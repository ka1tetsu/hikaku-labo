// 価格推移（買い時グラフ）のためのユーティリティ
// 実データが無いため、商品ごとに決定論的（再レンダーでブレない）な価格履歴を生成する。
// 現在価格を終点に固定し、kakakuTrendUp（価格が上昇傾向か）に応じて過去の水準を決める。

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(a) {
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 直近 points か月分の価格系列（古い→新しい、末尾が現在価格）を返す
export function generatePriceHistory(seedStr, currentPrice, trendUp, points = 12) {
    const price = Number(currentPrice) || 0;
    if (price <= 0) return [];

    const rand = mulberry32(hashString(String(seedStr) + ':' + price));

    // 現在価格に対する「窓の始点からの総変化率」。上昇傾向なら過去は安く、下降傾向なら過去は高い。
    const driftTotal = (trendUp ? 1 : -1) * (0.06 + rand() * 0.12); // 6〜18%
    const start = price / (1 + driftTotal);

    const series = [];
    for (let i = 0; i < points; i++) {
        const t = i / (points - 1);
        const base = start + (price - start) * t;
        // 端点はノイズ無しで固定、途中は小さな揺らぎを加える
        const noise = i === 0 || i === points - 1 ? 0 : (rand() * 2 - 1) * base * 0.04;
        series.push(Math.max(1, Math.round(base + noise)));
    }
    series[points - 1] = price; // 終点を現在価格に厳密一致
    return series;
}

// 系列から「買い時度」を判定する
export function analyzePriceHistory(series) {
    if (!Array.isArray(series) || series.length < 2) return null;
    const current = series[series.length - 1];
    const min = Math.min(...series);
    const max = Math.max(...series);
    const minIndex = series.indexOf(min);
    const nearLow = current <= min * 1.02;         // 過去最安値クラス
    const pctFromLow = min > 0 ? Math.round(((current - min) / min) * 100) : 0;
    const savingFromMax = Math.max(0, max - current); // 最高値からの下げ幅

    let verdict;
    if (nearLow) {
        verdict = { level: 'best', text: '過去最安値クラス！今が買い時' };
    } else if (pctFromLow <= 5) {
        verdict = { level: 'good', text: '最安値に近く狙い目です' };
    } else if (current >= max * 0.98) {
        verdict = { level: 'wait', text: '価格が高め。値下がりを待つのも手' };
    } else {
        verdict = { level: 'normal', text: '価格は平常水準です' };
    }

    return { current, min, max, minIndex, nearLow, pctFromLow, savingFromMax, verdict };
}
