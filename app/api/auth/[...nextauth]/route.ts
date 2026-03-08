// app/api/auth/[...nextauth]/route.ts
import NextAuth        from 'next-auth'
import GoogleProvider  from 'next-auth/providers/google'

const handler = NextAuth({
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
    async session({ session }) {
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/admin/dashboard`
    },
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
})

export { handler as GET, handler as POST }
