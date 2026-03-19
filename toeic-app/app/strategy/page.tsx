import { PARTS } from '@/lib/toeicData'

export default function StrategyPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.5rem' }}>🗺️ 攻略ガイド</h1>
        <p style={{ color: '#64748b' }}>データと分析に基づくTOEIC高得点攻略の完全マニュアル。スコア別学習プランも掲載。</p>
      </div>

      {/* スコア別学習プラン */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          📈 スコア別 最短攻略プラン
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              range: '〜600点',
              color: '#f97316',
              period: '3〜4ヶ月',
              focus: '基礎固め',
              plans: [
                '中学・高校の文法を総復習（動詞・名詞・形容詞・副詞・前置詞）',
                'TOEIC必須語彙800語を完全習得（TOEIC出る単特急 金のフレーズ前半）',
                'Part 5を毎日10問、正答率80%以上を目標に',
                '公式問題集リスニングを毎日1セット、音読・シャドーイング',
                '週1回模試形式で解いてスコアを確認',
              ],
              books: ['公式TOEIC L&R問題集', 'TOEIC出る単特急 金のフレーズ', '文法特急'],
            },
            {
              range: '600〜730点',
              color: '#84cc16',
              period: '2〜3ヶ月',
              focus: 'スコアアップ',
              plans: [
                'Part 5・6の文法問題を1問20秒以内で解く速度訓練',
                '語彙を1500語に拡充（金のフレーズ全体）',
                'Part 3・4 先読み練習を徹底（設問先読み→音声集中）',
                'Part 7 スキャニング練習（設問→本文→答え探し）',
                '毎日1〜2時間の継続学習、週末は模試1回分',
              ],
              books: ['公式問題集(最新版)', '金のフレーズ', '読解特急', 'リスニング特急'],
            },
            {
              range: '730〜860点',
              color: '#0ea5e9',
              period: '3〜5ヶ月',
              focus: '精度向上',
              plans: [
                '語彙を2000語以上に（銀のフレーズ・TEX加藤著）',
                'Part 7 複数文書問題を完全攻略',
                'リスニング速度への対応（1.2倍速練習）',
                '模試で時間内完答を必ず達成するよう時間管理強化',
                'ビジネス英語・ニュース英語で応用力を強化',
              ],
              books: ['銀のフレーズ', '公式問題集Vol.10〜11', 'Part7特急', 'ビジネス英語'],
            },
            {
              range: '860〜990点',
              color: '#8b5cf6',
              period: '6ヶ月以上',
              focus: '満点への道',
              plans: [
                '語彙を3000語以上（TOEIC TEST 英単語スピードマスター）',
                'リスニング：全問正解を目指す。難問Part 3・4を反復精聴',
                'Part 2 難問（間接的応答）を完全マスター',
                '模試で990点換算の正答数（L:97/R:97以上）を安定させる',
                '毎週本番同じ環境で2時間の通し練習を継続',
              ],
              books: ['公式問題集(全シリーズ)', 'TOEIC TEST英単語スピードマスター', 'Distinction 2000'],
            },
          ].map(plan => (
            <div key={plan.range} className="card" style={{ borderLeft: `4px solid ${plan.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: plan.color }}>{plan.range}</span>
                  <span style={{ marginLeft: '.75rem', fontSize: '.88rem', color: '#64748b' }}>目標スコア帯</span>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <span className="badge" style={{ background: plan.color + '20', color: plan.color }}>📅 {plan.period}</span>
                  <span className="badge badge-blue">{plan.focus}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#64748b', marginBottom: '.5rem' }}>学習ステップ</div>
                  <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {plan.plans.map((p, i) => (
                      <li key={i} style={{ display: 'flex', gap: '.5rem', fontSize: '.875rem', color: '#475569' }}>
                        <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                        {p}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#64748b', marginBottom: '.5rem' }}>おすすめ参考書</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                    {plan.books.map(b => (
                      <div key={b} style={{ display: 'flex', gap: '.4rem', alignItems: 'center', fontSize: '.875rem', color: '#475569' }}>
                        <span>📕</span> {b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part別攻略 */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          🎯 Part別 完全攻略法
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {PARTS.map(part => {
            const isListening = part.id <= 4
            const color = isListening ? '#0369a1' : '#065f46'
            const bg = isListening ? '#e0f2fe' : '#d1fae5'
            return (
              <div key={part.id} className="card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    background: bg, color,
                    padding: '.5rem .9rem', borderRadius: 10,
                    fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                  }}>{part.name}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '.2rem' }}>{part.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '.85rem' }}>{part.description} / {part.questions}問 / 目安{part.time}分</p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: '.2rem' }}>目標正答数</div>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {Object.entries(part.targetScore).map(([score, target]) => (
                        <span key={score} style={{ fontSize: '.75rem', background: '#f1f5f9', padding: '.15rem .5rem', borderRadius: 6, color: '#475569' }}>
                          {score}点: {target}問
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.5rem' }}>
                  {part.tips.map((tip, i) => (
                    <div key={i} style={{
                      background: '#f8fafc', borderRadius: 8, padding: '.6rem .85rem',
                      fontSize: '.84rem', color: '#475569', display: 'flex', gap: '.4rem',
                    }}>
                      <span style={{ color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 時間配分 */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          ⏱️ 本番の時間配分戦略
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ borderTop: '3px solid #0ea5e9' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0369a1' }}>🎧 Listening Section（45分）</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[
                { part: 'Part 1', time: '約5分', note: '音声に集中、選択肢先読み不要' },
                { part: 'Part 2', time: '約12分', note: '最初の疑問詞に集中' },
                { part: 'Part 3', time: '約20分', note: '各設問を先読みして音声に備える' },
                { part: 'Part 4', time: '約15分', note: '設問先読み→独話→回答' },
              ].map(row => (
                <div key={row.part} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '.5rem .75rem', background: '#f0f9ff', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700, minWidth: 60, color: '#0369a1' }}>{row.part}</span>
                  <span style={{ fontWeight: 800, color: '#1e293b', minWidth: 55 }}>{row.time}</span>
                  <span style={{ color: '#64748b', fontSize: '.84rem' }}>{row.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ borderTop: '3px solid #10b981' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#065f46' }}>📖 Reading Section（75分）</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[
                { part: 'Part 5', time: '10分', note: '1問20秒、品詞・文法問題は即答' },
                { part: 'Part 6', time: '8分', note: '前後文脈を確認、文挿入は要注意' },
                { part: 'Part 7', time: '54分', note: '設問先読み→スキャニング→NOT問題は後回し' },
                { part: '見直し', time: '3分', note: 'マークミス確認、解けなかった問題を処理' },
              ].map(row => (
                <div key={row.part} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '.5rem .75rem', background: '#f0fdf4', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700, minWidth: 60, color: '#065f46' }}>{row.part}</span>
                  <span style={{ fontWeight: 800, color: '#1e293b', minWidth: 55 }}>{row.time}</span>
                  <span style={{ color: '#64748b', fontSize: '.84rem' }}>{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 頻出トピック */}
      <section>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          🔥 TOEIC頻出トピックTOP10
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { rank: 1, topic: 'ビジネスミーティング', desc: '議事録・会議準備・アジェンダ', parts: 'Part 3,4,7' },
            { rank: 2, topic: '採用・人事', desc: '求人・面接・昇進・退職', parts: 'Part 3,4,6,7' },
            { rank: 3, topic: '旅行・出張', desc: 'フライト・ホテル・移動手段', parts: 'Part 3,4,7' },
            { rank: 4, topic: '購買・注文', desc: '発注・請求・配送・返品', parts: 'Part 3,6,7' },
            { rank: 5, topic: '会社案内', desc: '製品説明・サービス案内・広告', parts: 'Part 4,7' },
            { rank: 6, topic: '施設管理', desc: '修理・工事・メンテナンス', parts: 'Part 3,4,5' },
            { rank: 7, topic: 'イベント・展示会', desc: '参加登録・スケジュール変更', parts: 'Part 3,4,7' },
            { rank: 8, topic: '財務・会計', desc: '予算・決算・経費精算', parts: 'Part 6,7' },
            { rank: 9, topic: 'マーケティング', desc: '広告・プロモーション・調査', parts: 'Part 4,7' },
            { rank: 10, topic: '社内コミュニケーション', desc: 'メール・チャット・通知', parts: 'Part 6,7' },
          ].map(t => (
            <div key={t.rank} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0,
                background: t.rank <= 3 ? '#1a56db' : '#e2e8f0',
                color: t.rank <= 3 ? '#fff' : '#64748b',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '.85rem', borderBottomRightRadius: 8,
              }}>#{t.rank}</div>
              <div style={{ paddingTop: '1.5rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>{t.topic}</div>
                <p style={{ color: '#64748b', fontSize: '.82rem', marginBottom: '.5rem' }}>{t.desc}</p>
                <div style={{ fontSize: '.75rem', background: '#f1f5f9', padding: '.2rem .5rem', borderRadius: 999, display: 'inline-block', color: '#475569' }}>
                  {t.parts}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
