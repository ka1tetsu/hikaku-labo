'use client'
import { useState } from 'react'
import { VOCABULARY_SETS } from '@/lib/toeicData'

type Word = { word: string; meaning: string; example: string; part: string }

export default function VocabularyPage() {
  const [activeSet, setActiveSet] = useState(0)
  const [mode, setMode] = useState<'list' | 'flashcard'>('list')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')

  const set = VOCABULARY_SETS[activeSet]
  const filteredWords = set.words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning.includes(search)
  )

  const remainingCards = set.words.filter((_, i) => !known.has(i))

  const handleKnow = () => {
    setKnown(prev => new Set([...prev, cardIndex]))
    nextCard()
  }
  const handleUnknow = () => {
    setUnknown(prev => new Set([...prev, cardIndex]))
    nextCard()
  }
  const nextCard = () => {
    setFlipped(false)
    const remaining = set.words.map((_, i) => i).filter(i => !known.has(i))
    const nextIdx = remaining.find(i => i > cardIndex)
    if (nextIdx !== undefined) setCardIndex(nextIdx)
    else if (remaining.length > 0) setCardIndex(remaining[0])
  }
  const resetFlash = () => {
    setCardIndex(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
  }

  const currentCard = set.words[cardIndex]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.5rem' }}>📚 語彙学習</h1>
        <p style={{ color: '#64748b' }}>TOEIC頻出語彙を単語帳・フラッシュカードで効率的に習得しよう。</p>
      </div>

      {/* セット選択 */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {VOCABULARY_SETS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActiveSet(i); setSearch(''); setCardIndex(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set()) }}
            style={{
              padding: '.6rem 1.1rem',
              borderRadius: 10,
              border: '1.5px solid',
              borderColor: activeSet === i ? '#1a56db' : '#e2e8f0',
              background: activeSet === i ? '#1a56db' : '#fff',
              color: activeSet === i ? '#fff' : '#475569',
              fontWeight: activeSet === i ? 700 : 500,
              cursor: 'pointer', fontSize: '.88rem', transition: 'all .2s',
            }}
          >
            {s.name}
            <span style={{
              marginLeft: '.5rem', fontSize: '.75rem',
              background: activeSet === i ? 'rgba(255,255,255,.25)' : '#f1f5f9',
              padding: '.1rem .45rem', borderRadius: 999,
            }}>{s.words.length}語</span>
          </button>
        ))}
      </div>

      {/* モード切替 */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
          {(['list', 'flashcard'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '.45rem 1rem', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: '.88rem', fontWeight: 600,
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#1a56db' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all .2s',
              }}
            >
              {m === 'list' ? '📋 一覧' : '🃏 フラッシュカード'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '.85rem', color: '#64748b' }}>
          <span style={{ fontWeight: 700, color: '#1a56db' }}>{set.level}</span>
          &nbsp;·&nbsp;{set.description}
        </div>
      </div>

      {mode === 'list' ? (
        <>
          {/* 検索 */}
          <div style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="単語・意味で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '.7rem 1rem',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: '.95rem', outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          {/* 単語一覧 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredWords.map((w, i) => (
              <WordCard key={w.word} word={w} index={i} />
            ))}
          </div>
          {filteredWords.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              「{search}」に一致する単語が見つかりません
            </div>
          )}
        </>
      ) : (
        /* フラッシュカード */
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* 進捗 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '.85rem' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ 覚えた: {known.size}語</span>
            <span style={{ color: '#64748b' }}>残り: {set.words.length - known.size}語</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ 要復習: {unknown.size}語</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: '1.5rem' }}>
            <div className="progress-fill" style={{ width: `${(known.size / set.words.length) * 100}%`, background: '#10b981' }} />
          </div>

          {known.size === set.words.length ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ fontWeight: 800, marginBottom: '.5rem' }}>全語彙マスター！</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{set.words.length}語すべて覚えました！</p>
              <button onClick={resetFlash} className="btn btn-primary">もう一度挑戦</button>
            </div>
          ) : (
            <>
              {/* カード */}
              <div
                onClick={() => setFlipped(!flipped)}
                style={{
                  background: flipped ? 'linear-gradient(135deg, #1a56db, #0ea5e9)' : '#fff',
                  border: '2px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  minHeight: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,.08)',
                  transition: 'all .3s',
                  marginBottom: '1.5rem',
                  color: flipped ? '#fff' : '#1e293b',
                }}
              >
                {!flipped ? (
                  <>
                    <div style={{ fontSize: '.85rem', color: '#94a3b8', fontWeight: 600 }}>
                      {cardIndex + 1} / {set.words.length}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.5px' }}>
                      {currentCard?.word}
                    </div>
                    <div style={{ fontSize: '.85rem', color: '#94a3b8', background: '#f1f5f9', padding: '.2rem .7rem', borderRadius: 999 }}>
                      {currentCard?.part}
                    </div>
                    <div style={{ fontSize: '.82rem', color: '#94a3b8', marginTop: '.5rem' }}>
                      タップして意味を確認
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentCard?.meaning}</div>
                    <div style={{ fontSize: '.88rem', opacity: .85, fontStyle: 'italic', lineHeight: 1.6 }}>
                      {currentCard?.example}
                    </div>
                    <div style={{ fontSize: '.8rem', opacity: .7, marginTop: '.5rem' }}>
                      タップして単語に戻る
                    </div>
                  </>
                )}
              </div>

              {/* ボタン */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  onClick={handleUnknow}
                  style={{
                    padding: '1rem', borderRadius: 12,
                    border: '2px solid #ef4444', background: '#fff',
                    color: '#ef4444', fontWeight: 700, cursor: 'pointer',
                    fontSize: '1rem', transition: 'all .2s',
                  }}
                >
                  ✗ もう一度
                </button>
                <button
                  onClick={handleKnow}
                  style={{
                    padding: '1rem', borderRadius: 12,
                    border: '2px solid #10b981', background: '#10b981',
                    color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontSize: '1rem', transition: 'all .2s',
                  }}
                >
                  ✓ 覚えた！
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function WordCard({ word, index }: { word: Word; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="card"
      style={{ cursor: 'pointer', transition: 'all .2s' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.4rem' }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{word.word}</span>
          <span style={{
            marginLeft: '.5rem', fontSize: '.75rem',
            background: '#f1f5f9', color: '#64748b',
            padding: '.1rem .45rem', borderRadius: 999,
          }}>{word.part}</span>
        </div>
        <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      <div style={{ color: '#475569', fontWeight: 600, fontSize: '.9rem', marginBottom: expanded ? '.75rem' : 0 }}>
        {word.meaning}
      </div>
      {expanded && (
        <div style={{
          background: '#f8fafc', borderRadius: 8, padding: '.75rem',
          fontSize: '.85rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.6,
          borderTop: '1px solid #e2e8f0', marginTop: '.5rem', paddingTop: '.75rem',
        }}>
          📎 {word.example}
        </div>
      )}
    </div>
  )
}
