'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/practice', label: '練習問題', icon: '📝' },
  { href: '/vocabulary', label: '語彙学習', icon: '📚' },
  { href: '/strategy', label: '攻略ガイド', icon: '🗺️' },
  { href: '/scores', label: 'スコア', icon: '📈' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top nav */}
      <nav style={{
        background: '#1a56db',
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
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
          height: 56,
          gap: '1rem',
        }}>
          <Link href="/" style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.15rem',
            letterSpacing: '-.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '.4rem',
            textDecoration: 'none',
          }}>
            🎯 <span>Vivlica</span>
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '.2rem', marginLeft: 'auto' }}>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  color: pathname === l.href ? '#fff' : 'rgba(255,255,255,.75)',
                  fontWeight: pathname === l.href ? 700 : 500,
                  fontSize: '.88rem',
                  padding: '.4rem .8rem',
                  borderRadius: 8,
                  background: pathname === l.href ? 'rgba(255,255,255,.18)' : 'transparent',
                  transition: 'all .2s',
                  textDecoration: 'none',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setOpen(!open)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              borderRadius: 6,
            }}
            aria-label="メニュー"
          >
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, opacity: open ? 0 : 1, transition: 'all .2s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div style={{
            background: '#1e40af',
            padding: '.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '.25rem',
          }}>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  color: '#fff',
                  padding: '.75rem 1rem',
                  borderRadius: 8,
                  background: pathname === l.href ? 'rgba(255,255,255,.18)' : 'transparent',
                  fontWeight: pathname === l.href ? 700 : 500,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.6rem',
                }}
              >
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom tab bar (mobile only) */}
      <div className="bottom-nav" style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        zIndex: 99,
        boxShadow: '0 -2px 10px rgba(0,0,0,.08)',
      }}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '.4rem 0 .3rem',
              gap: 2,
              textDecoration: 'none',
              color: pathname === l.href ? '#1a56db' : '#94a3b8',
              borderTop: pathname === l.href ? '2px solid #1a56db' : '2px solid transparent',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{l.icon}</span>
            <span style={{ fontSize: '.65rem', fontWeight: pathname === l.href ? 700 : 500 }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
