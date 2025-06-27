import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/common/ErrorFallback'
import { BoltBadge } from '@/components/landing/BoltBadge'

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
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
            <Toaster />
            <BoltBadge />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}