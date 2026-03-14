import type { Metadata }   from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ProgressBar     from './components/ProgressBar'
import PageTransition  from './components/PageTransition'
import FloatingButtons from './components/FloatingButtons'
import Navbar          from './components/Navbar'
import SessionWrapper  from './components/SessionWrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets:  ['latin'],
})

export const metadata: Metadata = {
  title: {
    default:  'Ford Component Sales | Scrap Vehicle Pickup',
    template: '%s | Ford Component Sales',
  },
  description:
    'Professional scrap vehicle pickup service for Ford vehicles across the United States. Fast, eco-friendly and Ford authorised.',
  keywords: [
    'Ford scrap vehicle pickup',
    'Ford Component Sales',
    'FCS scrap pickup',
    'Ford vehicle recycling',
    'scrap vehicle collection USA',
    'fordcomponentsales.in',
  ],
  metadataBase: new URL('https://fordcomponentsales.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type:        'website',
    url:         'https://fordcomponentsales.in',
    siteName:    'Ford Component Sales',
    title:       'Ford Component Sales | Scrap Vehicle Pickup',
    description: 'Fast, reliable and eco-friendly scrap vehicle pickup for Ford vehicles across the US.',
    images: [{
      url:    '/og-image.png',
      width:  1200,
      height: 630,
      alt:    'Ford Component Sales - Scrap Vehicle Pickup',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Ford Component Sales | Scrap Vehicle Pickup',
    description: 'Professional Ford scrap vehicle pickup service across the United States.',
    images:      ['/og-image.png'],
  },
  icons: {
    icon:     '/favicon.ico',
    apple:    '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`
        ${geistSans.variable}
        ${geistMono.variable}
        antialiased
        bg-white dark:bg-[#0a0a0a]
        transition-colors duration-200
      `}>
        <SessionWrapper>

          {/* ── Progress Bar ── */}
          <ProgressBar />

          {/* ── Global Navbar ── */}
          <Navbar />

          {/* ── Page Content ── */}
          <PageTransition>
            {children}
          </PageTransition>

          {/* ── Floating Contact Buttons ── */}
          <FloatingButtons />

        </SessionWrapper>
      </body>
    </html>
  )
}
