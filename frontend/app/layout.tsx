import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'CODUKU - Competitive Coding Platform',
  description: 'Master competitive programming with AI-powered learning and real-time contests',
  keywords: ['coding', 'competitive programming', 'leaderboard', 'contests', 'education'],
  openGraph: {
    title: 'CODUKU',
    description: 'The next-generation competitive coding platform',
    url: 'https://coduku.college.edu',
    siteName: 'CODUKU',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
