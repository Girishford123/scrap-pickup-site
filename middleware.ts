import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // ✅ Allow Power Automate — no auth needed
        if (pathname.startsWith(
          '/api/admin/sync-from-powerautomate'
        )) {
          return true
        }

        // 🔒 Everything else needs token
        return !!token
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
