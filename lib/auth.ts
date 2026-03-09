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
      authorization: {
        params: {
          prompt:        'consent',
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

  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path:     '/',
        secure:   process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async signIn({ user }) {
      const userEmail = (user.email ?? '').toLowerCase().trim()
      console.log('=== SIGN IN ATTEMPT ===')
      console.log('User email:', userEmail)
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
      // ✅ After Sign Out → always go to admin login
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

  // ✅ Added signOut page
  pages: {
    signIn:  '/admin/login',
    signOut: '/admin/login',   // ← THIS was missing!
    error:   '/admin/login',
  },

  debug: process.env.NODE_ENV === 'development',
}

// ── Legacy helpers ─────────────────────────────────────
const SESSION_KEY = 'admin_user'

export function getUserSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null
    return JSON.parse(stored) as User
  } catch { return null }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

export function setUserSession(user: User): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {}
}
