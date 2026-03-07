// app/api/auth/[...nextauth]/route.ts
import NextAuth        from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

const handler = NextAuth({
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
})

export { handler as GET, handler as POST }