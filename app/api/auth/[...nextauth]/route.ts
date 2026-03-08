// app/api/auth/[...nextauth]/route.ts
import NextAuth             from 'next-auth'
import GoogleProvider       from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails =
        process.env.ALLOWED_EMAILS
          ?.split(',')
          .map(e => e.trim()) ?? []
      return allowedEmails.includes(user.email ?? '')
    },
    async jwt({ token, user }) {
      if (user) token.email = user.email
      return token
    },
    async session({ session, token }) {
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/admin/dashboard')) {
        return `${baseUrl}/admin/dashboard`
      }
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/admin/dashboard`
    },
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }