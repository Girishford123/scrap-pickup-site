// middleware.ts
import { withAuth }    from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = [
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

export default withAuth(
  function middleware(req) {
    const email = req.nextauth.token?.email ?? ''

    // ✅ Block non whitelisted users
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(
        new URL('/admin/unauthorized', req.url)
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // ✅ Must have valid token to proceed
      authorized: ({ token }) => !!token,
    },
  }
)

// ✅ Protect all admin routes
export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/api/admin/:path*',
  ],
}