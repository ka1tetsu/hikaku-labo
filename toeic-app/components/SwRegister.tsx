'use client'
import { useEffect, useState } from 'react'

export default function SwRegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    const prompt = installPrompt as any
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') {
      setInstalled(true)
    }
    setShowBanner(false)
    setInstallPrompt(null)
  }

  if (!showBanner || installed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #1a56db, #0ea5e9)',
      color: '#fff',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 9999,
      boxShadow: '0 -4px 16px rgba(0,0,0,.2)',
    }}>
      <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>🎯</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '.95rem' }}>Vivlicaをインストール</div>
        <div style={{ fontSize: '.78rem', opacity: .85, marginTop: '.1rem' }}>
          ホーム画面に追加してオフラインでも学習できます
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff',
            padding: '.5rem .85rem',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '.82rem',
            fontWeight: 600,
          }}
        >
          後で
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: '#fff',
            border: 'none',
            color: '#1a56db',
            padding: '.5rem .85rem',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '.82rem',
            fontWeight: 800,
          }}
        >
          インストール
        </button>
      </div>
    </div>
  )
}
