import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ford Component Sales | Scrap Vehicle Pickup Service',
  description: 'Professional scrap component collection for Ford vehicles.',
  keywords: 'Ford, scrap pickup, component sales, vehicle recycling, India',
  icons: {
    icon: '/FCS-logo.png',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}