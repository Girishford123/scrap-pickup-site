// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'  // ← Use ONE shared config

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }