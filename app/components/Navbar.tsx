'use client'

import Link                            from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname }                 from 'next/navigation'
import { useSession, signOut }         from 'next-auth/react'
import DarkModeToggle                  from './DarkModeToggle'

const ADMIN_EMAILS = [
  'girishtrainer@gmail.com',
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

// ── Logos — No Background ───────────────────────────
function FordLogo({ height = 32 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ford-logo.png"
      alt="Ford"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
    />
  )
}

function FCSLogo({ height = 32 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/FCS-logo.png"
      alt="FCS"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
    />
  )
}

// ── Profile Dropdown ────────────────────────────────
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
  const dropdownRef     = useRef<HTMLDivElement>(null)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full
        border border-slate-200 dark:border-slate-700
        hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      >
        <div className={`
          w-7 h-7 rounded-full flex items-center justify-center
          font-bold text-xs
          ${isAdmin
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-700 text-white'
          }
        `}>
          {initials}
        </div>
        <span className="text-slate-700 dark:text-slate-200 text-sm
        font-medium hidden md:block">
          {name.split(' ')[0]}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform
          duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-11 bg-white
        dark:bg-[#1a1a1a] rounded-xl shadow-xl
        border border-slate-100 dark:border-slate-800
        w-60 z-50 overflow-hidden">

          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-100
          dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center
                font-bold text-sm flex-shrink-0
                ${isAdmin
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-700 text-white'
                }
              `}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900
                dark:text-white truncate">{name}</p>
                <p className="text-xs text-slate-400 truncate">{email}</p>
                <span className={`
                  inline-block text-xs font-semibold px-2 py-0.5
                  rounded-full mt-1
                  ${isAdmin
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                  }
                `}>
                  {isAdmin ? '🛡️ Admin' : '👤 Requestor'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Menu Items — ONLY shown after login ── */}
          <div className="py-1">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5
                  text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="text-base">📊</span>
                  Dashboard
                </Link>
                <Link
                  href="/admin/requests"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5
                  text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="text-base">📦</span>
                  Manage Requests
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/request-pickup"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5
                  text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="text-base">📋</span>
                  Request Pickup
                </Link>
                <Link
                  href="/track-pickup"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5
                  text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="text-base">🔍</span>
                  Track Pickup
                </Link>
              </>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { onLogout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5
              text-sm text-red-500
              hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <svg className="w-4 h-4" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0
                      01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3
                      3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main Navbar ─────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const [scrolled, setScrolled] = useState(false)
  const [mounted,  setMounted]  = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const userEmail  = (session?.user?.email ?? '').toLowerCase().trim()
  const isAdmin    = ADMIN_EMAILS.includes(userEmail)
  const isLoggedIn = status === 'authenticated'

  const hideOnPaths = [
    '/login/requestor',
    '/login/admin',
    '/admin/login',
    '/admin/auth-error',
    '/admin/unauthorized',
  ]

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }) }

  if (!mounted)                       return null
  if (status === 'loading')           return null
  if (hideOnPaths.includes(pathname)) return null

  // ── Nav Links ───────────────────────────────────
  // ✅ Dashboard & Manage Requests NOT in navbar
  // They only appear inside ProfileDropdown after login

  const guestLinks = [
    { label: 'How It Works',  href: '/#how-it-works' },
    { label: 'Why Choose Us', href: '/#why-us'       },
    { label: 'Contact',       href: '/#contact'      },
  ]

  const requestorLinks = [
    { label: 'Home',           href: '/'               },
    { label: 'Request Pickup', href: '/request-pickup' },
    { label: 'Track Pickup',   href: '/track-pickup'   },
  ]

  // ✅ Admin navbar only shows basic links
  // Dashboard + Manage Requests are in dropdown only
  const adminLinks = [
    { label: 'Home',    href: '/' },
    { label: 'Contact', href: '/#contact' },
  ]

  const navLinks = !isLoggedIn
    ? guestLinks
    : isAdmin
      ? adminLinks
      : requestorLinks

  return (
    <nav className={`
      sticky top-0 z-50
      bg-white/95 dark:bg-[#0a0a0a]/95
      backdrop-blur-md
      border-b border-slate-100 dark:border-slate-800
      transition-shadow duration-300
      ${scrolled ? 'shadow-md' : ''}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3">
            <FordLogo height={28} />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <FCSLogo  height={26} />
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition duration-200
                  ${pathname === link.href
                    ? 'text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />

            {/* ✅ Profile dropdown — contains Dashboard & Manage Requests */}
            {isLoggedIn ? (
              <ProfileDropdown
                name={session?.user?.name ?? userEmail.split('@')[0]}
                email={userEmail}
                isAdmin={isAdmin}
                onLogout={handleLogout}
              />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login/requestor"
                  className="text-sm font-medium text-slate-600
                  dark:text-slate-300 px-3 py-1.5 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/login"
                  className="text-sm font-semibold text-white
                  bg-slate-800 dark:bg-slate-700 px-4 py-1.5
                  rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600
                  transition shadow-sm"
                >
                  Admin
                </Link>
              </div>
            )}

            {/* ── Mobile Hamburger ── */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg
              hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-slate-600
                dark:bg-slate-300 rounded-full transition-all
                duration-300 ${menuOpen
                  ? 'rotate-45 translate-y-1.5' : ''}`}
                />
                <span className={`block h-0.5 bg-slate-600
                dark:bg-slate-300 rounded-full transition-all
                duration-300 ${menuOpen ? 'opacity-0' : ''}`}
                />
                <span className={`block h-0.5 bg-slate-600
                dark:bg-slate-300 rounded-full transition-all
                duration-300 ${menuOpen
                  ? '-rotate-45 -translate-y-2' : ''}`}
                />
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100
        dark:border-slate-800 bg-white dark:bg-[#0a0a0a]">
          <div className="px-4 py-3 space-y-1">

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`
                  block px-3 py-2.5 rounded-lg text-sm
                  font-medium transition
                  ${pathname === link.href
                    ? 'text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}

            {/* ✅ Mobile — show Dashboard links only when logged in */}
            {isLoggedIn && isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm
                  font-medium text-slate-500 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/admin/requests"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm
                  font-medium text-slate-500 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  📦 Manage Requests
                </Link>
              </>
            )}

            {/* Guest Buttons */}
            {!isLoggedIn && (
              <div className="pt-2 pb-1 border-t border-slate-100
              dark:border-slate-800 space-y-2">
                <Link
                  href="/login/requestor"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center border
                  border-slate-200 dark:border-slate-700
                  text-slate-700 dark:text-slate-300 px-4 py-2
                  rounded-lg text-sm font-medium
                  hover:bg-slate-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center bg-slate-800
                  text-white px-4 py-2 rounded-lg text-sm
                  font-semibold hover:bg-slate-700 transition"
                >
                  Admin Login
                </Link>
              </div>
            )}

            {/* Logout */}
            {isLoggedIn && (
              <div className="pt-2 border-t border-slate-100
              dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="w-full text-center text-sm text-red-500
                  py-2 hover:bg-red-50 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </nav>
  )
}
