import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ProgressBar     from './components/ProgressBar'
import PageTransition  from './components/PageTransition'
import FloatingButtons from './components/FloatingButtons'
import Navbar          from './components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets:  ['latin'],
})

export const metadata: Metadata = {
  title:       'Ford Component Sales | Scrap Vehicle Pickup',
  description: 'Professional scrap vehicle pickup service for Ford vehicles across the United States.',
  keywords:    'Ford, scrap vehicle, pickup, FCS, components',
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
        {/* Progress Bar */}
        <ProgressBar />

        {/* Role Based Navbar */}
        <Navbar />

        {/* Page Content with Transitions */}
        <PageTransition>
          {children}
        </PageTransition>

        {/* Floating Contact Buttons */}
        <FloatingButtons />
      </body>
    </html>
  )
}