import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SwRegister from '@/components/SwRegister'

export const metadata: Metadata = {
  title: 'Vivlica - TOEIC高得点への完全ガイド',
  description: 'TOEICの傾向と対策を徹底研究。Part1〜7の攻略法、頻出語彙、模擬問題で効率的に高得点を目指そう。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vivlica',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a56db',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <SwRegister />
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 60px)', paddingBottom: '80px' }}>
          {children}
        </main>
        <footer style={{
          background: '#1e293b',
          color: '#94a3b8',
          textAlign: 'center',
          padding: '1.5rem 1rem',
          fontSize: '.8rem',
          marginTop: '2rem',
        }}>
          <p style={{ marginBottom: '.25rem', fontWeight: 700, color: '#e2e8f0' }}>Vivlica</p>
          <p>TOEICは米国法人 ETS の登録商標です</p>
        </footer>
      </body>
    </html>
  )
}
