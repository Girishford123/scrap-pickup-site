import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {

        const { pathname } = req.nextUrl

        // ✅ Allow Power Automate sync route — no auth needed
        if (pathname.startsWith('/api/admin/sync-from-powerautomate')) {
          return true
        }

        // ✅ Allow public routes
        if (pathname.startsWith('/api/auth'))      return true
        if (pathname.startsWith('/admin/login'))   return true
        if (pathname === '/')                       return true

        // 🔒 Everything else requires auth token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
