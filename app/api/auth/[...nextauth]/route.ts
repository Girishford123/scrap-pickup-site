// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// ✅ Whitelisted admin emails only
const ADMIN_EMAILS = [
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {

    // ✅ Block anyone not in whitelist
    async signIn({ user }) {
      const email = user.email ?? ''
      if (!ADMIN_EMAILS.includes(email)) {
        return false
      }
      return true
    },

    // ✅ Attach role to token
    async jwt({ token, user }) {
      if (user) {
        token.role  = 'admin'
        token.email = user.email
      }
      return token
    },

    // ✅ Attach role to session
    async session({ session, token }) {
      if (session.user) {
        session.user.role  = token.role  as string
        session.user.email = token.email as string
      }
      return session
    },

    // ✅ Redirect after login
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/admin/dashboard`
    },
  },

  pages: {
    signIn: '/admin/login',
    error:  '/admin/unauthorized',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }