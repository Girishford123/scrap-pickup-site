// lib/auth.ts
import GoogleProvider  from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

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
    strategy:  'jwt',
    maxAge:    30 * 24 * 60 * 60,  // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path:     '/',
        secure:   true,             // ✅ Must be true for https
      },
    },
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails =
        process.env.ALLOWED_EMAILS
          ?.split(',')
          .map(e => e.trim()) ?? []
      console.log('SignIn attempt:', user.email)
      console.log('Allowed emails:', allowedEmails)
      const isAllowed = allowedEmails.includes(user.email ?? '')
      console.log('Is allowed:', isAllowed)
      return isAllowed
    },
    async jwt({ token, user, account }) {
      if (user)    token.email = user.email
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
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
  debug: true,              // ✅ Enable logs to see errors
}
