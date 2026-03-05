export function generateMockKakakuData(keyword, page = 1) {
    const isSmartphone = keyword.includes('スマホ') || keyword.includes('iPhone') || keyword.includes('スマートフォン');
    const isPC = keyword.includes('パソコン') || keyword.includes('PC') || keyword.includes('Mac');
    const isCamera = keyword.includes('カメラ') || keyword.includes('一眼');
    const isEarphone = keyword.includes('イヤホン') || keyword.includes('オーディオ');
    const isTV = keyword.includes('テレビ') || keyword.includes('液晶');

    const brands = isSmartphone ? ['Apple', 'Samsung', 'Google', 'Sony', 'Sharp'] :
        isPC ? ['Apple', 'Lenovo', 'HP', 'Dell', 'ASUS'] :
            isCamera ? ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'] :
                isEarphone ? ['Apple', 'Sony', 'Bose', 'Sennheiser', 'Anker'] :
                    isTV ? ['Sony', 'Panasonic', 'LG', 'Hisense', 'Toshiba'] :
                        ['メーカーA', 'メーカーB', 'メーカーC', 'メーカーD', 'メーカーE'];

    const getBasePrice = () => {
        if (isSmartphone) return 50000 + Math.floor(Math.random() * 100000);
        if (isPC) return 80000 + Math.floor(Math.random() * 150000);
        if (isCamera) return 100000 + Math.floor(Math.random() * 200000);
        if (isEarphone) return 5000 + Math.floor(Math.random() * 30000);
        if (isTV) return 60000 + Math.floor(Math.random() * 150000);
        return 10000 + Math.floor(Math.random() * 50000);
    };

    const getImg = (i) => {
        if (isSmartphone) return `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&q=80&rand=${i}`;
        if (isPC) return `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&q=80&rand=${i}`;
        if (isCamera) return `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop&q=80&rand=${i}`;
        if (isEarphone) return `https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop&q=80&rand=${i}`;
        if (isTV) return `https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop&q=80&rand=${i}`;
        return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&q=80&rand=${i}`;
    };

    const generateSpecs = () => {
        if (isSmartphone) return ['OS: iOS/Android', '画面: 6.1インチ OLED', 'バッテリー: 4000mAh', 'カメラ: 4800万画素', '重量: 170g'];
        if (isPC) return ['CPU: Core i7/M2', 'メモリ: 16GB', 'ストレージ: 512GB SSD', '画面: 14インチ', '重量: 1.2kg'];
        if (isCamera) return ['画素数: 2400万画素', 'センサー: フルサイズ', '連写: 10コマ/秒', '動画: 4K/60p', '重量: 600g'];
        if (isEarphone) return ['タイプ: カナル型', 'ノイキャン: 搭載', '再生時間: 8時間', '防水: IPX4', '重量: 5g'];
        if (isTV) return ['画面: 55インチ 4K', 'パネル: 有機EL', 'チューナー: 4K×2', 'VOD: 対応', 'スピーカー: 40W'];
        return ['サイズ: W100xH200', '重量: 500g', 'カラー: ブラック/ホワイト', '保証: 1年', '特徴: 高性能'];
    };

    const items = Array.from({ length: 20 }).map((_, i) => {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const modelYear = 2024 - Math.floor(Math.random() * 3);
        const series = ['Pro', 'Max', 'Ultra', 'Plus', 'Air', 'mini', 'Lite', 'Standard'][Math.floor(Math.random() * 8)];
        const price = getBasePrice();
        const reviewAvg = (3.5 + Math.random() * 1.5).toFixed(2);
        const reviewCount = Math.floor(Math.random() * 1000) + 10;
        const shopsCount = Math.floor(Math.random() * 40) + 3;
        const rank = (page - 1) * 20 + i + 1;

        const variation = Math.floor(Math.random() * 1000);
        let titleSuffix = '';
        if (keyword !== 'おすすめ' && keyword !== '人気') {
            titleSuffix = ` ${keyword}`;
        }

        return {
            Item: {
                itemName: `${brand} 最新モデル ${series} ${modelYear}年発売 SIMフリー${titleSuffix} [${variation}]`,
                itemPrice: price,
                itemUrl: '#',
                affiliateUrl: '#',
                mediumImageUrls: [{ imageUrl: getImg(i) }],
                shopName: `${brand} 公式ストア`,
                reviewAverage: Number(reviewAvg),
                reviewCount: reviewCount,
                // Kakaku specific mock data custom fields we will append
                kakakuSpecs: generateSpecs(),
                kakakuRank: rank,
                kakakuShops: shopsCount,
                kakakuTrendUp: Math.random() > 0.5,
                kakakuRelease: `${modelYear}年 ${Math.floor(Math.random() * 12) + 1}月発売`,
                aiSummary: {
                    pros: isSmartphone ? ['カメラ性能が圧倒的', 'バッテリーが1日持つ'] : isPC ? ['処理速度が大幅向上', '打鍵感が良い'] : ['前モデルより機能強化', 'コスパが抜群'],
                    cons: isSmartphone ? ['本体が少し重い', '価格が高め'] : isPC ? ['ポートが少ない', '発熱が少しある'] : ['設定が複雑', 'サイズが大きい'],
                    target: isSmartphone ? 'クリエイティブな作業をする人' : isPC ? 'リモートワーク中心の人' : '初めて購入するエントリー層',
                },
                tradeInPrice: isSmartphone ? 45000 : (isPC ? 32000 : 0),
                insurancePrice: price * 0.05,
            }
        };
    });

    return {
        Items: items,
        pageCount: 5,
        hits: 100
    };
}
