'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'ホーム' },
  { href: '/practice', label: '練習問題' },
  { href: '/vocabulary', label: '語彙学習' },
  { href: '/strategy', label: '攻略ガイド' },
  { href: '/scores', label: 'スコア記録' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav style={{
      background: '#1a56db',
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        height: 60,
      }}>
        <Link href="/" style={{
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '-.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '.4rem',
        }}>
          🎯 TOEIC攻略ラボ
        </Link>
        <div style={{ display: 'flex', gap: '.25rem', marginLeft: 'auto' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: pathname === l.href ? '#fff' : 'rgba(255,255,255,.75)',
                fontWeight: pathname === l.href ? 700 : 500,
                fontSize: '.9rem',
                padding: '.4rem .85rem',
                borderRadius: 8,
                background: pathname === l.href ? 'rgba(255,255,255,.15)' : 'transparent',
                transition: 'all .2s',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
