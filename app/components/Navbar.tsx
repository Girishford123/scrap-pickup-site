'use client'

import Link                       from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut }    from 'next-auth/react'
import DarkModeToggle             from './DarkModeToggle'

// ── Admin Emails — server-side only, NOT exposed ────
// These are checked via session role, not env var
const ADMIN_EMAILS = [
  'girishtrainer@gmail.com',
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

// ── Ford Logo ───────────────────────────────────────
function FordLogo({ height = 32 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-md border border-gray-100 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ford-logo.png"
        alt="Ford Logo"
        style={{ height: `${height}px`, width: 'auto' }}
      />
    </div>
  )
}

// ── FCS Logo ────────────────────────────────────────
function FCSLogo({ height = 32 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-md border border-gray-100 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/FCS-logo.png"
        alt="FCS Logo"
        style={{ height: `${height}px`, width: 'auto' }}
      />
    </div>
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

  // ✅ Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">

      {/* ── Avatar Button ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full pl-1 pr-3 py-1 transition duration-200"
      >
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          font-bold text-sm shadow-md
          ${isAdmin
            ? 'bg-yellow-400 text-[#1B4332]'
            : 'bg-white text-[#1B4332]'
          }
        `}>
          {initials}
        </div>
        <span className="text-white text-xs font-medium hidden md:block">
          {name.split(' ')[0]}
        </span>
        <svg
          className={`w-3 h-3 text-white/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 w-60 z-50 overflow-hidden"
          >

            {/* User Info */}
            <div className="px-4 py-4 bg-gray-50 dark:bg-[#222] border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`
                  w-11 h-11 rounded-full flex items-center
                  justify-center font-bold text-sm flex-shrink-0
                  ${isAdmin
                    ? 'bg-yellow-400 text-[#1B4332]'
                    : 'bg-[#1B4332] text-white'
                  }
                `}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {email}
                  </p>
                  <span className={`
                    inline-block text-xs font-bold px-2 py-0.5
                    rounded-full mt-1
                    ${isAdmin
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-[#1B4332]'
                    }
                  `}>
                    {isAdmin ? '🛡️ Admin' : '👤 Requestor'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Menu Items ── */}
            <div className="py-1">
              {isAdmin && (
                <>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <span>📊</span> Dashboard
                  </Link>
                  <Link
                    href="/admin/requests"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <span>📦</span> Manage Requests
                  </Link>
                </>
              )}

              {!isAdmin && (
                <>
                  <Link
                    href="/request-pickup"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <span>📋</span> Request Pickup
                  </Link>
                  <Link
                    href="/track-pickup"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <span>🔍</span> Track Pickup
                  </Link>
                </>
              )}
            </div>

            {/* ── Sign Out ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 py-1">
              <button
                type="button"
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <svg className="w-4 h-4" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                        strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── Main Navbar ─────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()

  const { data: session, status } = useSession()

  const [scrolled,  setScrolled]  = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  const userEmail  = (session?.user?.email ?? '').toLowerCase().trim()
  const isAdmin    = ADMIN_EMAILS.includes(userEmail)
  const isLoggedIn = status === 'authenticated'

  // ✅ Pages where Navbar is hidden
  const hideOnPaths = [
    '/login/requestor',
    '/login/admin',
    '/admin/login',
    '/admin/auth-error',
    '/admin/unauthorized',
  ]
  // ✅ Removed '/' from hideOnPaths
  // Home page now has Navbar (was missing before!)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (!mounted)                         return null
  if (status === 'loading')             return null
  if (hideOnPaths.includes(pathname))   return null

  // ── Nav Links based on role ──
  const adminLinks = [
    { label: '📊 Dashboard',       href: '/admin/dashboard'  },
    { label: '📦 Manage Requests', href: '/admin/requests'   },
    { label: '👥 Customers',       href: '/admin/customers'  },
  ]

  const requestorLinks = [
    { label: '🏠 Home',           href: '/'                },
    { label: '📋 Request Pickup', href: '/request-pickup'  },
    { label: '🔍 Track Pickup',   href: '/track-pickup'    },
  ]

  const guestLinks = [
    { label: '🏠 Home',        href: '/'            },
    { label: 'How It Works',   href: '/#how-it-works' },
    { label: 'Why Choose Us',  href: '/#why-us'       },
    { label: 'Contact',        href: '/#contact'      },
  ]

  const navLinks = !isLoggedIn
    ? guestLinks
    : isAdmin
      ? adminLinks
      : requestorLinks

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`
          sticky top-0 z-50 bg-[#1B4332] text-white
          transition-all duration-300
          ${scrolled ? 'shadow-2xl' : 'shadow-lg'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center gap-3 flex-shrink-0"
            >
              <FordLogo height={28} />
              <div className="h-8 w-px bg-white/30" />
              <FCSLogo  height={28} />
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition duration-200
                    ${pathname === link.href
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-green-100 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Right Side ── */}
            <div className="flex items-center gap-2 md:gap-3">
              <DarkModeToggle />

              {/* ── Authenticated ── */}
              {isLoggedIn ? (
                <ProfileDropdown
                  name={session?.user?.name ?? userEmail.split('@')[0]}
                  email={userEmail}
                  isAdmin={isAdmin}
                  onLogout={handleLogout}
                />
              ) : (
                /* ── Guest Buttons — Desktop only ── */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login/requestor"
                    className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition duration-200"
                  >
                    Requestor Login
                  </Link>
                  <Link
                    href="/admin/login"
                    className="bg-white text-[#1B4332] hover:bg-green-50 text-sm font-semibold px-4 py-2 rounded-lg transition duration-200 shadow-md"
                  >
                    Admin Login
                  </Link>
                </div>
              )}

              {/* ── Mobile Hamburger ── */}
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className={`
                    block h-0.5 bg-white rounded-full transition-all duration-300
                    ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}
                  `} />
                  <span className={`
                    block h-0.5 bg-white rounded-full transition-all duration-300
                    ${menuOpen ? 'opacity-0 scale-x-0' : ''}
                  `} />
                  <span className={`
                    block h-0.5 bg-white rounded-full transition-all duration-300
                    ${menuOpen ? '-rotate-45 -translate-y-2' : ''}
                  `} />
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{   opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-white/10 bg-[#163a2b]"
            >
              <div className="px-4 py-4 space-y-1">

                {/* Nav Links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      block px-4 py-3 rounded-xl text-sm font-medium transition
                      ${pathname === link.href
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-green-100 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Guest Login Buttons on Mobile */}
                {!isLoggedIn && (
                  <div className="pt-3 pb-1 border-t border-white/10 space-y-2">
                    <Link
                      href="/login/requestor"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center bg-white/10 text-white border border-white/20 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition"
                    >
                      🔐 Requestor Login
                    </Link>
                    <Link
                      href="/admin/login"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center bg-white text-[#1B4332] px-4 py-3 rounded-xl text-sm font-bold hover:bg-green-50 transition"
                    >
                      🛡️ Admin Login
                    </Link>
                  </div>
                )}

                {/* Logout on Mobile */}
                {isLoggedIn && (
                  <div className="pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:text-white hover:bg-red-600/30 transition"
                    >
                      <svg className="w-4 h-4" fill="none"
                           stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round"
                              strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.nav>
    </>
  )
}
