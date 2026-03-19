import Link from 'next/link'
import { PARTS, SCORE_LEVELS } from '@/lib/toeicData'

export default function Home() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
        borderRadius: 20,
        padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2.5rem)',
        color: '#fff',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, background: 'rgba(255,255,255,.07)', borderRadius: '50%' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.2)', borderRadius: 999, padding: '.25rem .85rem', fontSize: '.78rem', fontWeight: 700, marginBottom: '.75rem' }}>
            🔬 傾向と対策を超研究
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: '.75rem' }}>
            TOEIC高得点への<br />最短ルートを掴め
          </h1>
          <p style={{ fontSize: 'clamp(.85rem, 2.5vw, 1rem)', opacity: .9, maxWidth: 480, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Part 1〜7の完全攻略・頻出語彙・解説付き模擬問題で<br className="sp-only" />効率よくスコアアップ
          </p>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <Link href="/practice" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#fff', color: '#1a56db', fontWeight: 800, padding: '.75rem 1.5rem', borderRadius: 12, fontSize: '.95rem', textDecoration: 'none' }}>
              📝 練習問題を始める
            </Link>
            <Link href="/strategy" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.4)', fontWeight: 700, padding: '.75rem 1.5rem', borderRadius: 12, fontSize: '.95rem', textDecoration: 'none' }}>
              🗺️ 攻略ガイド
            </Link>
          </div>
        </div>
      </div>

      {/* クイックアクセス（モバイル重視） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
        {[
          { href: '/practice/5', icon: '📝', label: 'Part 5', sub: '短文穴埋め 15問', color: '#1a56db', bg: '#dbeafe' },
          { href: '/practice/6', icon: '📄', label: 'Part 6', sub: '長文穴埋め 4問', color: '#7c3aed', bg: '#ede9fe' },
          { href: '/practice/7', icon: '📖', label: 'Part 7', sub: '読解問題 4問', color: '#0d9488', bg: '#ccfbf1' },
          { href: '/vocabulary', icon: '🃏', label: '語彙フラッシュ', sub: '48語のカード', color: '#d97706', bg: '#fef3c7' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1rem .75rem', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '.35rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '.92rem', color: item.color }}>{item.label}</div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '.15rem' }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* TOEIC構成 */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>📊 TOEIC L&R の構成</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[
            {
              icon: '🎧',
              title: 'Listening Section',
              sub: '100問 / 約45分 / 495点満点',
              bg: '#e0f2fe', color: '#0369a1', border: '#0ea5e9',
              parts: PARTS.slice(0, 4),
              badgeClass: 'badge-blue',
            },
            {
              icon: '📖',
              title: 'Reading Section',
              sub: '100問 / 75分 / 495点満点',
              bg: '#d1fae5', color: '#065f46', border: '#10b981',
              parts: PARTS.slice(4),
              badgeClass: 'badge-green',
            },
          ].map(sec => (
            <div key={sec.title} className="card" style={{ borderLeft: `4px solid ${sec.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.75rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: sec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{sec.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.95rem' }}>{sec.title}</div>
                  <div style={{ fontSize: '.75rem', color: '#64748b' }}>{sec.sub}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {sec.parts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem .65rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '.82rem' }}>{p.name}: {p.title}</span>
                    <span className={`badge ${sec.badgeClass}`}>{p.questions}問</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* スコアレベル */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>🏆 スコアレベル</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {SCORE_LEVELS.filter(l => l.min > 0).map(level => (
            <div key={level.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', borderRadius: 12, padding: '.8rem 1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ minWidth: 72, fontWeight: 900, color: level.color, fontSize: '.9rem' }}>
                {level.min === 990 ? '990' : `${level.min}〜${level.max}`}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{level.label}</div>
                <div style={{ fontSize: '.75rem', color: '#64748b' }}>{level.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', width: 8, height: 32, borderRadius: 4, background: level.color, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </section>

      {/* 高得点の5戦略 */}
      <section>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>⚡ 高得点者が実践する5つの戦略</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {[
            { no: '01', title: '先読みで勝負が決まる', body: 'Part 3・4は音声前に設問と選択肢を先読みする。何を聞けばいいか把握してから音声を聞くと正答率が劇的に向上。' },
            { no: '02', title: '語彙力がすべての基盤', body: 'TOEIC頻出語彙の習得なしに高得点は不可能。毎日30〜50語を継続。3ヶ月で1500語を習得が目標。' },
            { no: '03', title: 'Part 5は1問20秒ルール', body: 'Part 5に使う時間は最大10分。品詞・時制問題は文全体を読まずに解く練習をして時間をPart 7に回す。' },
            { no: '04', title: 'Part 7はスキャニングで攻略', body: '設問を先読みし、答えが書いてある箇所だけを素早く探す「スキャニング」を徹底。全文精読は時間の無駄。' },
            { no: '05', title: '毎日シャドーイングで耳を鍛える', body: 'TOEIC音源を使ったシャドーイングを毎日15分。米・英・加・豪の4種類のアクセントに慣れることが重要。' },
          ].map(tip => (
            <div key={tip.no} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1a56db, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '.85rem' }}>
                {tip.no}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '.25rem', fontSize: '.95rem' }}>{tip.title}</div>
                <p style={{ color: '#475569', fontSize: '.82rem', lineHeight: 1.6 }}>{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
