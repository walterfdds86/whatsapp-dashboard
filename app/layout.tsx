import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhatsApp Dashboard',
  description: 'Gestão de demandas do WhatsApp em tempo real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-900 h-screen flex flex-col overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
