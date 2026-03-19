import Link from 'next/link'
import { PARTS } from '@/lib/toeicData'

const sectionColors: Record<string, { bg: string; color: string; border: string }> = {
  listening: { bg: '#e0f2fe', color: '#0369a1', border: '#0ea5e9' },
  reading: { bg: '#d1fae5', color: '#065f46', border: '#10b981' },
}

export default function PracticePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.3rem' }}>📝 練習問題</h1>
        <p style={{ color: '#64748b', fontSize: '.88rem' }}>Part別に模擬問題を解いて実戦力を身につけよう。全問解説付き。</p>
      </div>

      {/* Listening */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '.3rem .85rem', borderRadius: 999, fontWeight: 700, fontSize: '.82rem' }}>🎧 Listening Section</div>
          <span style={{ color: '#64748b', fontSize: '.78rem' }}>100問 / 約45分</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.75rem' }}>
          {PARTS.slice(0, 4).map(part => (
            <PartCard key={part.id} part={part} section="listening" />
          ))}
        </div>
      </section>

      {/* Reading */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '.3rem .85rem', borderRadius: 999, fontWeight: 700, fontSize: '.82rem' }}>📖 Reading Section</div>
          <span style={{ color: '#64748b', fontSize: '.78rem' }}>100問 / 75分</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.75rem' }}>
          {PARTS.slice(4).map(part => (
            <PartCard key={part.id} part={part} section="reading" />
          ))}
        </div>
      </section>

      {/* 学習ヒント */}
      <div className="card" style={{ marginTop: '2.5rem', background: '#f8fafc' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📌 練習問題の活用法</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '⏱️', title: '時間を計る', desc: '本番と同じ時間制限で解くことで時間感覚を養う' },
            { icon: '📖', title: '解説を熟読', desc: '正解でも不正解でも必ず解説を読んで理解を深める' },
            { icon: '🔁', title: '繰り返す', desc: '同じ問題を3回解いて完全に定着させる' },
            { icon: '📊', title: '弱点を記録', desc: 'ミスしたカテゴリをスコア記録ページに記録する' },
          ].map(tip => (
            <div key={tip.title} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.3rem' }}>{tip.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.2rem' }}>{tip.title}</div>
                <p style={{ color: '#64748b', fontSize: '.82rem', lineHeight: 1.5 }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PartCard({ part, section }: { part: typeof PARTS[0]; section: string }) {
  const col = section === 'listening'
    ? { bg: '#e0f2fe', color: '#0369a1', border: '#0ea5e9' }
    : { bg: '#d1fae5', color: '#065f46', border: '#10b981' }

  const hasQuestions = [5, 6, 7].includes(part.id)

  return (
    <div className="card" style={{ borderTop: `3px solid ${col.border}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <div>
          <span style={{
            background: col.bg, color: col.color,
            padding: '.15rem .6rem', borderRadius: 999,
            fontSize: '.78rem', fontWeight: 700,
          }}>{part.name}</span>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '.4rem' }}>{part.title}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', color: col.color }}>{part.questions}</div>
          <div style={{ fontSize: '.75rem', color: '#64748b' }}>問</div>
        </div>
      </div>

      <p style={{ color: '#475569', fontSize: '.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
        {part.description}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#64748b', marginBottom: '.4rem' }}>攻略のポイント</div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          {part.tips.slice(0, 2).map((tip, i) => (
            <li key={i} style={{ fontSize: '.8rem', color: '#475569', display: 'flex', gap: '.4rem' }}>
              <span style={{ color: col.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {hasQuestions ? (
          <Link href={`/practice/${part.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            練習問題を解く →
          </Link>
        ) : (
          <div style={{
            textAlign: 'center', padding: '.6rem',
            background: '#f1f5f9', borderRadius: 8,
            color: '#94a3b8', fontSize: '.85rem',
          }}>
            🎧 リスニング問題（音源が必要）
          </div>
        )}
      </div>
    </div>
  )
}
