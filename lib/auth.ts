// lib/auth.ts
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

export interface User {
  email:  string
  name?:  string
  image?: string
}

const ALLOWED_EMAILS = [
  'girishtrainer@gmail.com',
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ✅ REMOVED prompt:'consent' — was forcing 
      // consent screen every time
      authorization: {
        params: {
          access_type:   'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user }) {
      const userEmail = (user.email ?? '').toLowerCase().trim()
      console.log('=== SIGN IN ATTEMPT ===')
      console.log('User email:', userEmail)
      console.log('Allowed emails:', ALLOWED_EMAILS)
      console.log('Is allowed:', ALLOWED_EMAILS.includes(userEmail))
      return ALLOWED_EMAILS.includes(userEmail)
    },

    async jwt({ token, user, account }) {
      if (user)    token.email       = user.email
      if (account) token.accessToken = account.access_token
      return token
    },

    async session({ session, token }) {
      if (token) session.user.email = token.email as string
      return session
    },

    async redirect({ url, baseUrl }) {
      // ✅ After Sign Out → go to admin login
      if (url.includes('/api/auth/signout')) {
        return `${baseUrl}/admin/login`
      }
      // ✅ After Sign In → go to admin dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/admin/dashboard`
      }
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/'))     return `${baseUrl}${url}`
      return `${baseUrl}/admin/dashboard`
    },
  },

  pages: {
    signIn:  '/admin/login',
    signOut: '/admin/login',
    // ✅ CHANGED: error goes to dedicated page
    // not back to login (prevents loop!)
    error:   '/admin/auth-error',
  },

  debug: process.env.NODE_ENV === 'development',
}
