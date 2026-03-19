'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PARTS, PRACTICE_QUESTIONS, type Question } from '@/lib/toeicData'

export default function PracticeClient({ partId }: { partId: number }) {
  const part = PARTS.find(p => p.id === partId)
  const questions = PRACTICE_QUESTIONS[partId] || []

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [showExplanation, setShowExplanation] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(part?.time ? part.time * 60 : 600)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (finished) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setFinished(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [finished])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const q = questions[current] as Question | undefined

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    setShowExplanation(true)
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setSelected(null)
      setShowExplanation(false)
    } else {
      setFinished(true)
      const correct = answers.filter((a, i) => a === questions[i]?.correct).length
      const session = {
        date: new Date().toISOString(),
        part: partId,
        score: correct,
        total: questions.length,
        timeSpent: Math.round((Date.now() - startTime) / 1000),
      }
      try {
        const saved = JSON.parse(localStorage.getItem('toeic_sessions') || '[]')
        saved.unshift(session)
        localStorage.setItem('toeic_sessions', JSON.stringify(saved.slice(0, 50)))
      } catch {}
    }
  }

  const correctCount = answers.filter((a, i) => a !== null && a === questions[i]?.correct).length

  if (!part || questions.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</div>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Part {partId} の練習問題</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          リスニング問題は音声ファイルが必要なため、現在はPart 5・6・7の読解問題をご利用いただけます。
        </p>
        <Link href="/practice" className="btn btn-primary">練習問題一覧に戻る</Link>
      </div>
    )
  }

  if (finished) {
    const score = answers.filter((a, i) => a !== null && a === questions[i]?.correct).length
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div style={{ maxWidth: 700, margin: '3rem auto', padding: '0 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            {pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '.5rem' }}>
            {part.name} 完了！
          </h2>
          <div style={{
            fontSize: '3rem', fontWeight: 900,
            color: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
            marginBottom: '.25rem',
          }}>
            {score}/{questions.length}
          </div>
          <div style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2rem' }}>正解率 {pct}%</div>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '.95rem' }}>問題別結果</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center' }}>
              {answers.map((a, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '.85rem',
                  background: a === questions[i]?.correct ? '#d1fae5' : '#fee2e2',
                  color: a === questions[i]?.correct ? '#065f46' : '#991b1b',
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {pct >= 80 && (
            <div style={{ background: '#d1fae5', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', color: '#065f46', fontWeight: 600, fontSize: '.9rem' }}>
              素晴らしい！本番でも同じ集中力を発揮しよう 💪
            </div>
          )}
          {pct < 60 && (
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', color: '#991b1b', fontWeight: 600, fontSize: '.9rem' }}>
              解説をしっかり読んで、同じ問題をもう一度挑戦しよう！
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setCurrent(0); setAnswers(Array(questions.length).fill(null)); setSelected(null); setShowExplanation(false); setFinished(false) }} className="btn btn-secondary">
              もう一度挑戦
            </button>
            <Link href="/practice" className="btn btn-primary">問題一覧へ</Link>
            <Link href="/scores" className="btn btn-secondary">スコアを確認</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '.2rem' }}>
            <Link href="/practice" style={{ color: '#1a56db' }}>練習問題</Link> / {part.name}
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>{part.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            background: timeLeft < 60 ? '#fee2e2' : '#f1f5f9',
            color: timeLeft < 60 ? '#ef4444' : '#475569',
            padding: '.4rem .9rem', borderRadius: 8,
            fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem',
          }}>⏱️ {formatTime(timeLeft)}</div>
        </div>
      </div>

      {/* 進捗 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: '#64748b', marginBottom: '.4rem' }}>
          <span>問題 {current + 1} / {questions.length}</span>
          <span>正答 {correctCount} 問</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* 問題 */}
      {q && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="badge badge-blue">Q{current + 1}</span>
            <span style={{ fontSize: '.8rem', color: '#64748b', background: '#f1f5f9', padding: '.2rem .6rem', borderRadius: 6 }}>
              {q.category}
            </span>
          </div>

          {q.question ? (
            <div>
              <div style={{
                background: '#f8fafc', borderRadius: 10, padding: '1.25rem',
                border: '1px solid #e2e8f0', marginBottom: '1rem',
                fontSize: '.9rem', lineHeight: 1.8, whiteSpace: 'pre-line',
              }}>
                {q.text}
              </div>
              <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{q.question}</p>
            </div>
          ) : (
            <p style={{
              fontSize: '1.05rem', lineHeight: 1.8,
              background: '#f8fafc', padding: '1.25rem', borderRadius: 10,
              border: '1px solid #e2e8f0', marginBottom: '1rem',
            }}>
              {q.text}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {q.options.map((opt, i) => {
              let bg = '#f8fafc', border = '#e2e8f0', color = '#1e293b', fontWeight: number | undefined
              if (selected !== null) {
                if (i === q.correct) { bg = '#d1fae5'; border = '#10b981'; color = '#065f46'; fontWeight = 700 }
                else if (i === selected && i !== q.correct) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; fontWeight = 700 }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  style={{
                    textAlign: 'left', padding: '.85rem 1rem',
                    background: bg, border: `1.5px solid ${border}`,
                    borderRadius: 10, cursor: selected !== null ? 'default' : 'pointer',
                    color, fontWeight,
                    fontSize: '.9rem', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '.75rem',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: selected !== null
                      ? i === q.correct ? '#10b981' : i === selected ? '#ef4444' : '#e2e8f0'
                      : '#e2e8f0',
                    color: selected !== null && (i === q.correct || i === selected) ? '#fff' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '.8rem', flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 解説 */}
      {showExplanation && q && (
        <div className="card" style={{
          marginBottom: '1.25rem',
          background: selected === q.correct ? '#f0fdf4' : '#fff7ed',
          border: `1.5px solid ${selected === q.correct ? '#86efac' : '#fed7aa'}`,
        }}>
          {/* 正誤バッジ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${selected === q.correct ? '#86efac' : '#fed7aa'}` }}>
            <span style={{ fontSize: '1.6rem' }}>{selected === q.correct ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: selected === q.correct ? '#16a34a' : '#ea580c' }}>
                {selected === q.correct ? '正解！よくできました！' : `不正解　正解は【${String.fromCharCode(65 + q.correct)}】${q.options[q.correct]}`}
              </div>
              <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: '.15rem' }}>
                {q.explanation}
              </div>
            </div>
          </div>

          {/* 詳細解説 */}
          {q.explanationDetail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {/* 問われているポイント */}
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 90, padding: '.2rem .5rem',
                  background: '#1a56db', color: '#fff',
                  borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
                  textAlign: 'center', lineHeight: 1.4,
                }}>問われている<br />ポイント</span>
                <p style={{ color: '#1e40af', fontWeight: 700, fontSize: '.9rem', paddingTop: '.15rem' }}>
                  {q.explanationDetail.point}
                </p>
              </div>

              {/* 文法・語法ルール */}
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 90, padding: '.2rem .5rem',
                  background: '#0d9488', color: '#fff',
                  borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
                  textAlign: 'center', lineHeight: 1.4,
                }}>文法・<br />語法ルール</span>
                <p style={{ color: '#134e4a', fontSize: '.88rem', lineHeight: 1.7, paddingTop: '.1rem' }}>
                  {q.explanationDetail.rule}
                </p>
              </div>

              {/* 誤答の理由 */}
              {q.explanationDetail.wrongChoices && (
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <span style={{
                    minWidth: 90, padding: '.2rem .5rem',
                    background: '#dc2626', color: '#fff',
                    borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
                    textAlign: 'center', lineHeight: 1.4,
                  }}>誤答の<br />理由</span>
                  <p style={{ color: '#7f1d1d', fontSize: '.85rem', lineHeight: 1.7, paddingTop: '.1rem' }}>
                    {q.explanationDetail.wrongChoices}
                  </p>
                </div>
              )}

              {/* TOEICのコツ */}
              {q.explanationDetail.tip && (
                <div style={{
                  background: '#fefce8', border: '1px solid #fde047',
                  borderRadius: 8, padding: '.75rem 1rem',
                  display: 'flex', gap: '.6rem', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                  <p style={{ color: '#713f12', fontSize: '.85rem', lineHeight: 1.7 }}>
                    <strong>TOEIC攻略ヒント：</strong>{q.explanationDetail.tip}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ナビゲーション */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => {
            if (current > 0) {
              setCurrent(current - 1)
              setSelected(answers[current - 1])
              setShowExplanation(answers[current - 1] !== null)
            }
          }}
          disabled={current === 0}
          className="btn btn-secondary"
          style={{ opacity: current === 0 ? .4 : 1 }}
        >
          ← 前の問題
        </button>
        {selected !== null && (
          <button onClick={handleNext} className="btn btn-primary btn-lg">
            {current < questions.length - 1 ? '次の問題 →' : '結果を見る 🏁'}
          </button>
        )}
      </div>
    </div>
  )
}
