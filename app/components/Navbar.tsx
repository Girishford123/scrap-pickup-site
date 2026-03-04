'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import DarkModeToggle from './DarkModeToggle'
import { getUserSession, clearUserSession, User } from '@/lib/auth'

// ─── Ford Logo ────────────────────────────────────────
function FordLogo({ height = 36 }: { height?: number }) {
  return (
    <div style={{
      background:     'white',
      borderRadius:   '12px',
      padding:        '8px 16px',
      boxShadow:      '0 4px 12px rgba(0,0,0,0.15)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      border:         '1px solid #f0f0f0',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ford-logo.png"
        alt="Ford Logo"
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      />
    </div>
  )
}

// ─── FCS Logo ─────────────────────────────────────────
function FCSLogo({ height = 36 }: { height?: number }) {
  return (
    <div style={{
      background:     'white',
      borderRadius:   '12px',
      padding:        '8px 16px',
      boxShadow:      '0 4px 12px rgba(0,0,0,0.15)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      border:         '1px solid #f0f0f0',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/FCS-logo.png"
        alt="FCS Logo"
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      />
    </div>
  )
}

// ─── Main r ──────────────────────────────────────
export default function r() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user,     setUser]     = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  // ✅ FIX: Hide r on login pages and home page
  const hideOnPaths = [
    '/',
    '/login/requestor',
    '/login/admin',
  ]

  useEffect(() => {
    setMounted(true)

    // ✅ FIX: Re-read session every time pathname changes
    // This ensures after login redirect, user is picked up
    const session = getUserSession()
    setUser(session)

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname]) // ✅ pathname dependency ensures re-read on every page change

  const handleLogout = () => {
    clearUserSession()
    setUser(null)
    router.push('/')
  }

  // Do not render on hidden paths or before mount
  if (!mounted)                       return null
  if (hideOnPaths.includes(pathname)) return null

  // ── Requestor Links ───────────────────────────────
  const requestorLinks = [
    { label: '🏠 Home',           href: '/'               },
    { label: '📋 Request Pickup', href: '/request-pickup' },
    { label: '🔍 Track Pickup',   href: '/track-pickup'   },
  ]

  // ── Admin Links ───────────────────────────────────
  const adminLinks = [
    { label: '📊 Dashboard',       href: '/dashboard'      },
    { label: '📦 Manage Requests', href: '/admin/requests' },
  ]

  // ── Guest Links ───────────────────────────────────
  const guestLinks = [
    { label: '🏠 Home', href: '/' },
  ]

  // ✅ FIX: Correct role check
  const navLinks =
    !user
      ? guestLinks
      : user.role === 'admin'
        ? adminLinks
        : requestorLinks

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        sticky top-0 z-50
        bg-[#1B4332] text-white
        transition-shadow duration-300
        ${scrolled ? 'shadow-2xl' : 'shadow-lg'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* ── Logos ── */}
          <Link href="/" className="flex items-center gap-4">
            <FordLogo height={32} />
            <div className="h-10 w-px bg-white/30" />
            <FCSLogo  height={32} />
          </Link>

          {/* ── Nav Links ── */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`
                  px-4 py-2 rounded-lg
                  font-medium text-sm
                  transition duration-200
                  ${pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-4">
            <DarkModeToggle />

            {/* ✅ FIX: Only show login buttons when NO user session */}
            {user ? (
              // ── LOGGED IN: Show user info + logout ──
              <div className="flex items-center gap-3">

                {/* User Badge */}
                <div className="
                  hidden md:flex items-center gap-2
                  bg-white/10 border border-white/20
                  rounded-full px-3 py-1
                ">
                  <span className="text-xs">
                    {user.role === 'admin' ? '🛡️' : '👤'}
                  </span>
                  <span className="text-green-100 text-xs font-medium">
                    {user.full_name?.split(' ')[0] || user.email}
                  </span>
                  <span className={`
                    text-xs font-bold px-2 py-0.5 rounded-full
                    ${user.role === 'admin'
                      ? 'bg-yellow-400/20 text-yellow-300'
                      : 'bg-green-400/20 text-green-300'
                    }
                  `}>
                    {user.role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="
                    bg-red-500/80 hover:bg-red-600
                    text-white text-sm font-semibold
                    px-4 py-2 rounded-lg
                    transition duration-200
                    shadow-md hover:shadow-lg
                  "
                >
                  Logout
                </button>
              </div>
            ) : (
              // ── NOT LOGGED IN: Show login buttons ──
              // ✅ FIX: Admin Login button ONLY shows when no session
              <div className="flex items-center gap-2">
                <Link
                  href="/login/requestor"
                  className="
                    bg-white/10 hover:bg-white/20
                    text-white text-sm font-semibold
                    px-4 py-2 rounded-lg
                    border border-white/20
                    transition duration-200
                  "
                >
                  Requestor Login
                </Link>
                <Link
                  href="/login/admin"
                  className="
                    bg-white text-[#1B4332]
                    hover:bg-green-50
                    text-sm font-semibold
                    px-4 py-2 rounded-lg
                    transition duration-200
                    shadow-md hover:shadow-lg
                  "
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.nav>
  )
}