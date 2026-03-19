'use client'
import { useState, useEffect } from 'react'
import { PARTS, getScoreLevel, type StudySession } from '@/lib/toeicData'

export default function ScoresPage() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [targetScore, setTargetScore] = useState(730)
  const [inputScore, setInputScore] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('toeic_sessions') || '[]')
      setSessions(saved)
      const ts = parseInt(localStorage.getItem('toeic_target') || '730')
      setTargetScore(ts)
    } catch {}
  }, [])

  const saveTarget = (v: number) => {
    setTargetScore(v)
    localStorage.setItem('toeic_target', String(v))
  }

  const addManualScore = () => {
    const score = parseInt(inputScore)
    if (isNaN(score) || score < 10 || score > 990) return
    const session: StudySession = {
      date: new Date().toISOString(),
      part: 0,
      score,
      total: 990,
      timeSpent: 7200,
    }
    const newSessions = [session, ...sessions]
    setSessions(newSessions)
    localStorage.setItem('toeic_sessions', JSON.stringify(newSessions))
    setInputScore('')
  }

  const clearAll = () => {
    if (confirm('全ての記録を削除しますか？')) {
      setSessions([])
      localStorage.removeItem('toeic_sessions')
    }
  }

  const practiceSessions = sessions.filter(s => s.part > 0)
  const testSessions = sessions.filter(s => s.part === 0)

  const partStats = PARTS.map(part => {
    const ps = practiceSessions.filter(s => s.part === part.id)
    const avg = ps.length > 0 ? Math.round(ps.reduce((a, s) => a + (s.score / s.total) * 100, 0) / ps.length) : null
    return { ...part, sessions: ps, avg }
  })

  const recentTestScore = testSessions[0]?.score || null
  const level = recentTestScore ? getScoreLevel(recentTestScore) : null

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.5rem' }}>📈 スコア記録</h1>
        <p style={{ color: '#64748b' }}>練習結果・模試スコアを記録して、学習の進捗を可視化しよう。</p>
      </div>

      {/* 目標スコア設定 */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1a56db11, #0ea5e911)', border: '1px solid #1a56db33' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🎯 目標スコアを設定</h3>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[400, 500, 600, 730, 800, 860, 900, 990].map(score => (
            <button
              key={score}
              onClick={() => saveTarget(score)}
              style={{
                padding: '.5rem 1rem', borderRadius: 8,
                border: '1.5px solid',
                borderColor: targetScore === score ? '#1a56db' : '#e2e8f0',
                background: targetScore === score ? '#1a56db' : '#fff',
                color: targetScore === score ? '#fff' : '#475569',
                fontWeight: 700, cursor: 'pointer', fontSize: '.9rem',
                transition: 'all .15s',
              }}
            >
              {score}点
            </button>
          ))}
        </div>
        <div style={{ marginTop: '1rem', fontSize: '.85rem', color: '#475569' }}>
          現在の目標: <strong style={{ color: '#1a56db', fontSize: '1.1rem' }}>{targetScore}点</strong>
          {level && recentTestScore && (
            <span style={{ marginLeft: '1rem' }}>
              最新スコア: <strong style={{ color: level.color }}>{recentTestScore}点（{level.label}）</strong>
              &nbsp;→ 目標まで <strong>{Math.max(0, targetScore - recentTestScore)}点</strong>
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* 模試スコア入力 */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📝 模試スコアを記録</h3>
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem' }}>
            <input
              type="number"
              min={10} max={990} step={5}
              placeholder="例: 730"
              value={inputScore}
              onChange={e => setInputScore(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManualScore()}
              style={{
                flex: 1, padding: '.65rem 1rem',
                border: '1.5px solid #e2e8f0', borderRadius: 8,
                fontSize: '.95rem', outline: 'none',
              }}
            />
            <button onClick={addManualScore} className="btn btn-primary">
              記録する
            </button>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '.8rem' }}>
            ※ 公式模試・練習テストのスコアを手動で入力できます
          </p>
        </div>

        {/* サマリー */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📊 学習サマリー</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: '練習問題', value: practiceSessions.length, unit: '回', color: '#1a56db' },
              { label: '模試記録', value: testSessions.length, unit: '回', color: '#7c3aed' },
              {
                label: '平均正答率',
                value: practiceSessions.length > 0
                  ? Math.round(practiceSessions.reduce((a, s) => a + (s.score / s.total) * 100, 0) / practiceSessions.length)
                  : '-',
                unit: practiceSessions.length > 0 ? '%' : '',
                color: '#10b981',
              },
              {
                label: '最高スコア',
                value: testSessions.length > 0 ? Math.max(...testSessions.map(s => s.score)) : '-',
                unit: testSessions.length > 0 ? '点' : '',
                color: '#f59e0b',
              },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: stat.color }}>
                  {stat.value}{stat.unit}
                </div>
                <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: '.2rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Part別正答率 */}
      {practiceSessions.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🎯 Part別 平均正答率</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {partStats.filter(p => p.avg !== null).map(p => {
              const color = p.avg! >= 80 ? '#10b981' : p.avg! >= 60 ? '#f59e0b' : '#ef4444'
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}: {p.title}</span>
                    <span style={{ fontWeight: 700, color }}>{p.avg}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${p.avg}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* スコア履歴 */}
      {sessions.length > 0 ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>📋 学習履歴</h3>
            <button onClick={clearAll} style={{
              padding: '.35rem .75rem', borderRadius: 6,
              border: '1px solid #fca5a5', background: '#fff',
              color: '#ef4444', cursor: 'pointer', fontSize: '.8rem',
            }}>
              全削除
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {sessions.slice(0, 20).map((s, i) => {
              const isTest = s.part === 0
              const pct = isTest ? Math.round((s.score / 990) * 100) : Math.round((s.score / s.total) * 100)
              const partInfo = isTest ? null : PARTS.find(p => p.id === s.part)
              const lvl = isTest ? getScoreLevel(s.score) : null
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '.75rem 1rem', background: '#f8fafc', borderRadius: 8,
                  flexWrap: 'wrap',
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '.78rem', minWidth: 75 }}>{formatDate(s.date)}</span>
                  <span style={{
                    fontSize: '.78rem', fontWeight: 700,
                    background: isTest ? '#ede9fe' : '#dbeafe',
                    color: isTest ? '#6d28d9' : '#1a56db',
                    padding: '.15rem .55rem', borderRadius: 999,
                    minWidth: 80, textAlign: 'center',
                  }}>
                    {isTest ? '模試' : partInfo?.name || `Part ${s.part}`}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>
                    {isTest ? `${s.score}点` : `${s.score}/${s.total}問`}
                  </span>
                  {lvl && <span style={{ fontSize: '.78rem', color: lvl.color, fontWeight: 700 }}>{lvl.label}</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${pct}%`,
                        background: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <span style={{ fontSize: '.8rem', color: '#64748b' }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
          <p>まだ記録がありません。</p>
          <p style={{ fontSize: '.85rem', marginTop: '.5rem' }}>
            練習問題を解くか、模試スコアを入力して学習記録を始めましょう。
          </p>
        </div>
      )}
    </div>
  )
}
