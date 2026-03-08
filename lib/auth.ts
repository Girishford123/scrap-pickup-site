// lib/auth.ts
import GoogleProvider       from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

// ─── Types ───────────────────────────────────────────────
export interface User {
  email:      string
  name?:      string
  image?:     string
}

// ─── Auth Options ─────────────────────────────────────────
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
    maxAge:   30 * 24 * 60 * 60,   // 30 days
  },

  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path:     '/',
        secure:   true,
      },
    },
  },

  callbacks: {                        // ✅ callbacks wrapper!
    async signIn({ user }) {
      const rawEmails     = process.env.ALLOWED_EMAILS ?? ''
      const allowedEmails = rawEmails
        .split(',')
        .map(e => e.trim().toLowerCase())

      const userEmail = (user.email ?? '').toLowerCase()

      console.log('=== SIGN IN ATTEMPT ===')
      console.log('User email:     ', userEmail)
      console.log('Allowed emails: ', allowedEmails)
      console.log('Is allowed:     ', allowedEmails.includes(userEmail))

      return allowedEmails.includes(userEmail)
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
      console.log('Redirect called:', { url, baseUrl })
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/'))     return `${baseUrl}${url}`
      return `${baseUrl}/admin/dashboard`
    },
  },                                  // ✅ closes callbacks

  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },

  debug: true,
}

// ─── Legacy Helper Functions ──────────────────────────────
const SESSION_KEY = 'admin_user'

export function getUserSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function setUserSession(user: User): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}
