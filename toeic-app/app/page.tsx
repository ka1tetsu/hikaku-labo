import Link from 'next/link'
import { PARTS, SCORE_LEVELS } from '@/lib/toeicData'

export default function Home() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
        borderRadius: 20,
        padding: '3.5rem 2.5rem',
        color: '#fff',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 300, height: 300,
          background: 'rgba(255,255,255,.07)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -60,
          width: 200, height: 200,
          background: 'rgba(255,255,255,.05)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,.2)',
            borderRadius: 999,
            padding: '.3rem .9rem',
            fontSize: '.8rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            🔬 傾向と対策を超研究
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            TOEIC 高得点への<br />最短ルートを掴め
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: .9, maxWidth: 500, marginBottom: '2rem', lineHeight: 1.6 }}>
            Part 1〜7の完全攻略法・頻出語彙・模擬問題で
            効率よくスコアアップ。データに基づいた学習法で
            目標スコアを最短で達成しよう。
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/practice" className="btn btn-lg" style={{ background: '#fff', color: '#1a56db' }}>
              📝 練習問題を始める
            </Link>
            <Link href="/strategy" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.4)' }}>
              🗺️ 攻略ガイドを見る
            </Link>
          </div>
        </div>
      </div>

      {/* TOEIC概要 */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem', color: '#1e293b' }}>
          📊 TOEIC L&Rの構成を把握する
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Listening */}
          <div className="card" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>🎧</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Listening Section</div>
                <div style={{ fontSize: '.85rem', color: '#64748b' }}>100問 / 約45分 / 495点満点</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {PARTS.slice(0, 4).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}: {p.title}</span>
                  <span className="badge badge-blue">{p.questions}問</span>
                </div>
              ))}
            </div>
          </div>
          {/* Reading */}
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>📖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Reading Section</div>
                <div style={{ fontSize: '.85rem', color: '#64748b' }}>100問 / 75分 / 495点満点</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {PARTS.slice(4).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}: {p.title}</span>
                  <span className="badge badge-green">{p.questions}問</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '.25rem' }}>スコアの仕組み</div>
              <p style={{ color: '#64748b', fontSize: '.9rem', lineHeight: 1.7 }}>
                TOEICはリスニング・リーディング各495点の合計990点満点。各問題の難易度に応じた<strong>素点換算</strong>が行われるため、
                正答数がそのままスコアにならない。全体で<strong>85〜90%正答</strong>が990点の目安。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* スコアレベル */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          🏆 スコアレベルと目標設定
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {SCORE_LEVELS.filter(l => l.min > 0).map(level => (
            <div key={level.label} className="card" style={{ borderTop: `3px solid ${level.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 800, color: level.color, fontSize: '1.1rem' }}>
                  {level.min === 990 ? '990' : `${level.min}〜${level.max}`}点
                </span>
                <span style={{
                  background: level.color + '20',
                  color: level.color,
                  padding: '.2rem .65rem',
                  borderRadius: 999,
                  fontSize: '.8rem',
                  fontWeight: 700,
                }}>{level.label}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '.87rem', lineHeight: 1.5 }}>{level.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 学習コンテンツ */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          🚀 今すぐ学習を始める
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              href: '/practice',
              icon: '📝',
              title: '練習問題',
              desc: 'Part 1〜7の模擬問題で実戦力を鍛える。解説付きで弱点を把握。',
              color: '#1a56db',
              bg: '#dbeafe',
            },
            {
              href: '/vocabulary',
              icon: '📚',
              title: '語彙学習',
              desc: 'TOEIC頻出4000語から厳選。フラッシュカードで効率的に暗記。',
              color: '#7c3aed',
              bg: '#ede9fe',
            },
            {
              href: '/strategy',
              icon: '🗺️',
              title: '攻略ガイド',
              desc: '各Partの解き方・時間配分・スコア別学習プランを徹底解説。',
              color: '#0d9488',
              bg: '#ccfbf1',
            },
            {
              href: '/scores',
              icon: '📈',
              title: 'スコア管理',
              desc: '練習結果を記録してスコアの推移を可視化。弱点分析もできる。',
              color: '#d97706',
              bg: '#fef3c7',
            },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                cursor: 'pointer',
                transition: 'all .2s',
                height: '100%',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: '1rem',
                }}>{item.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '.4rem', color: item.color }}>{item.title}</h3>
                <p style={{ color: '#475569', fontSize: '.87rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 高得点Tips */}
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          ⚡ 高得点取得者が実践する5つの戦略
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              no: '01',
              title: '先読みで勝負が決まる',
              body: 'Part 3・4は音声前に設問と選択肢を先読みすることが最重要。何を聞けばいいかを把握してから音声を聞くことで正答率が劇的に向上する。',
            },
            {
              no: '02',
              title: '語彙力がすべての基盤',
              body: 'TOEIC頻出語彙の習得なしに高得点は不可能。毎日30〜50語を継続して学習し、3ヶ月で1500語を習得することを目標にしよう。',
            },
            {
              no: '03',
              title: 'Part 5は1問20秒ルール',
              body: 'Reading 75分のうちPart 5に使う時間は最大10分。品詞問題・時制問題は文全体を読まずに解く練習をして、時間をPart 7に回す。',
            },
            {
              no: '04',
              title: 'Part 7はスキャニングで攻略',
              body: '文書全体を読んでから設問を見るのは時間の無駄。設問を先に読み、答えが書いてある箇所だけを素早く探す「スキャニング」を徹底する。',
            },
            {
              no: '05',
              title: '毎日のシャドーイングで耳を鍛える',
              body: 'TOEIC公式音源を使ったシャドーイングを毎日15分。アメリカ英語・イギリス英語・カナダ英語・オーストラリア英語の4種類に慣れることが重要。',
            },
          ].map(tip => (
            <div key={tip.no} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #1a56db, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '.95rem',
              }}>{tip.no}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '.3rem', fontSize: '1.02rem' }}>{tip.title}</div>
                <p style={{ color: '#475569', fontSize: '.88rem', lineHeight: 1.7 }}>{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
