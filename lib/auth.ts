// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import AzureADProvider    from 'next-auth/providers/azure-ad'

// ─────────────────────────────────────────────────────────
// NextAuth Options
// ─────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId:     process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId:     process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowed = [
        'gkulkara@ford.com',
        'mrideno2@ford.com',
      ]
      return allowed.includes(user.email ?? '')
    },
    async session({ session }) {
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}

// ─────────────────────────────────────────────────────────
// Legacy Session Helpers (used by Navbar + Requestor flow)
// ─────────────────────────────────────────────────────────
export type User = {
  email:      string
  full_name?: string
  role:       'admin' | 'requestor'
}

const SESSION_KEY = 'user_session'

export function getUserSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

export function setUserSession(user: User): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}