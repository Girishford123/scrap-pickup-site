import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Middleware ────────────────────────────────────────────
const authMiddleware = withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // ✅ Allow public routes
        if (pathname.startsWith('/api/auth'))    return true
        if (pathname.startsWith('/admin/login')) return true
        if (pathname === '/')                    return true

        // 🔒 Everything else requires token
        return !!token
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

// ── Main Export — runs BEFORE withAuth ───────────────────
export default function middleware(req: NextRequest) {

  // ✅ Allow Power Automate sync — completely skip withAuth
  if (
    req.nextUrl.pathname.startsWith(
      '/api/admin/sync-from-powerautomate'
    )
  ) {
    console.log('✅ Sync route — bypassing auth')
    return NextResponse.next()
  }

  // 🔒 All other routes go through NextAuth
  return (authMiddleware as any)(req)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
