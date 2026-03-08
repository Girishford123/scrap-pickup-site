// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { isAdmin } from './lib/admin'

export default withAuth(
  function middleware(req) {
    const email = req.nextauth.token?.email ?? null

    // ✅ Block non-admin users
    if (!isAdmin(email)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // ✅ Must be logged in (have a token) to proceed
      authorized: ({ token }) => !!token,
    },
  }
)

// ✅ Protect admin dashboard and admin APIs
export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
}
