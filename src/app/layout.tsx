import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dokani - AI-Powered Return Management Platform',
  description: 'Transform your e-commerce returns with AI-powered triage, voice & video customer service, and intelligent policy management.',
  keywords: 'e-commerce, returns, AI, customer service, automation, refunds',
  authors: [{ name: 'Dokani Team' }],
  openGraph: {
    title: 'Dokani - AI-Powered Return Management Platform',
    description: 'Transform your e-commerce returns with AI-powered triage, voice & video customer service, and intelligent policy management.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dokani - AI-Powered Return Management Platform',
    description: 'Transform your e-commerce returns with AI-powered triage, voice & video customer service, and intelligent policy management.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}