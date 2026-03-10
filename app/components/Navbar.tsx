'use client'

import Link                       from 'next/link'
import { useState, useEffect }    from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion }                 from 'framer-motion'
import { useSession, signOut }    from 'next-auth/react'
import DarkModeToggle             from './DarkModeToggle'

// ── Ford Logo ──────────────────────────────────────────
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
        style={{
          height:  `${height}px`,
          width:   'auto',
          display: 'block',
        }}
      />
    </div>
  )
}

// ── FCS Logo ───────────────────────────────────────────
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
        style={{
          height:  `${height}px`,
          width:   'auto',
          display: 'block',
        }}
      />
    </div>
  )
}

// ── Profile Dropdown Component ─────────────────────────
function ProfileDropdown({
  name,
  email,
  isAdmin,
  onLogout,
}: {
  name:     string
  email:    string
  isAdmin:  boolean
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative">

      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10
        hover:bg-white/20 border border-white/20
        rounded-full pl-1 pr-3 py-1 transition duration-200"
      >
        {/* Round Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center
          justify-center font-bold text-sm shadow-md ${
            isAdmin
              ? 'bg-yellow-400 text-[#1B4332]'
              : 'bg-white     text-[#1B4332]'
          }`}
        >
          {initials}
        </div>

        {/* Name */}
        <span className="text-white text-xs font-medium
        hidden md:block">
          {name.split(' ')[0]}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-white/70 transition-transform
          duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-12 bg-white
        rounded-xl shadow-2xl border border-gray-100
        w-56 z-50 overflow-hidden">

          {/* User Info Header */}
          <div className="px-4 py-3 bg-gray-50
          border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex
                items-center justify-center font-bold text-sm ${
                  isAdmin
                    ? 'bg-yellow-400 text-[#1B4332]'
                    : 'bg-[#1B4332]  text-white'
                }`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold
                text-gray-900 truncate">
                  {name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {email}
                </p>
                <span
                  className={`inline-block text-xs font-bold
                  px-2 py-0.5 rounded-full mt-0.5 ${
                    isAdmin
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100  text-green-700'
                  }`}
                >
                  {isAdmin ? '🛡️ Admin' : '👤 Requestor'}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                onLogout()
                setOpen(false)
              }}
              className="w-full flex items-center gap-3
              px-4 py-3 text-sm text-red-600
              hover:bg-red-50 transition duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3
                  0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3
                  3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

    </div>
  )
}

// ── Main Navbar Component ──────────────────────────────
export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()

  const { data: session, status } = useSession()

  const [scrolled, setScrolled] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  // ── Admin emails list ────────────────────────────────
  const ADMIN_EMAILS = (
    process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? ''
  ).split(',').map((e) => e.trim())

  const userEmail  = (session?.user?.email ?? '').toLowerCase()
  const isAdmin    = ADMIN_EMAILS.includes(userEmail)
  const isLoggedIn = status === 'authenticated'

  // ── Hide Navbar on these pages ───────────────────────
  const hideOnPaths = [
    '/',
    '/login/requestor',
    '/login/admin',
    '/admin/login',
  ]

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Logout Handler ───────────────────────────────────
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Do not render before mount
  if (!mounted)                       return null
  if (status === 'loading')           return null
  if (hideOnPaths.includes(pathname)) return null

  // ── Admin Links ──────────────────────────────────────
  const adminLinks = [
    { label: '📊 Dashboard',       href: '/admin/dashboard' },
    { label: '📦 Manage Requests', href: '/admin/dashboard' },
  ]

  // ── Requestor Links ──────────────────────────────────
  const requestorLinks = [
    { label: '🏠 Home',           href: '/'               },
    { label: '📋 Request Pickup', href: '/request-pickup' },
    { label: '🔍 Track Pickup',   href: '/track-pickup'   },
  ]

  // ── Guest Links ──────────────────────────────────────
  const guestLinks = [
    { label: '🏠 Home', href: '/' },
  ]

  const navLinks = !isLoggedIn
    ? guestLinks
    : isAdmin
      ? adminLinks
      : requestorLinks

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 bg-[#1B4332] text-white
      transition-shadow duration-300 ${
        scrolled ? 'shadow-2xl' : 'shadow-lg'
      }`}
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
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium
                text-sm transition duration-200 ${
                  pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-4">
            <DarkModeToggle />

            {isLoggedIn ? (

              // ── LOGGED IN ───────────────────────────
              <div className="flex items-center gap-3">
                <ProfileDropdown
                  name={
                    session?.user?.name ??
                    userEmail.split('@')[0]
                  }
                  email={userEmail}
                  isAdmin={isAdmin}
                  onLogout={handleLogout}
                />
              </div>

            ) : (

              // ── NOT LOGGED IN ───────────────────────
              <div className="flex items-center gap-2">
                <Link
                  href="/login/requestor"
                  className="bg-white/10 hover:bg-white/20
                  text-white text-sm font-semibold px-4 py-2
                  rounded-lg border border-white/20
                  transition duration-200"
                >
                  Requestor Login
                </Link>
                <Link
                  href="/admin/login"
                  className="bg-white text-[#1B4332]
                  hover:bg-green-50 text-sm font-semibold
                  px-4 py-2 rounded-lg transition duration-200
                  shadow-md hover:shadow-lg"
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
