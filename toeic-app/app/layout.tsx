import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'TOEIC攻略ラボ - 高得点への完全ガイド',
  description: 'TOEICの傾向と対策を徹底研究。Part1〜7の攻略法、頻出語彙、模擬問題で効率的に高得点を目指そう。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
        <footer style={{
          background: '#1e293b',
          color: '#94a3b8',
          textAlign: 'center',
          padding: '2rem',
          fontSize: '.85rem',
          marginTop: '4rem',
        }}>
          <p>TOEIC攻略ラボ © 2024 | TOEICは米国法人 ETS の登録商標です</p>
        </footer>
      </body>
    </html>
  )
}
