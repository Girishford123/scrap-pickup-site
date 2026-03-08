// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Only these 3 accounts are allowed as admin
const ADMIN_EMAILS = [
  'gkulkara@ford.com',
  'mrideno2@ford.com',
  'girishtrainer@gmail.com',
].map((e) => e.toLowerCase().trim())

export default withAuth(
  function middleware(req) {
    const email = (req.nextauth.token?.email ?? '').toLowerCase().trim()

    // Block non-whitelisted users
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Must be logged in (have a token) to proceed
      authorized: ({ token }) => !!token,
    },
  }
)

// Protect admin dashboard and admin APIs
export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
}
