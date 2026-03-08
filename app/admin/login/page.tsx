// app/admin/login/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // If NextAuth (or your app) sends callbackUrl, respect it; otherwise go to dashboard
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

  // Prevent double signIn() calls (React Strict Mode in dev can run effects twice)
  const signInStartedRef = useRef(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
      return
    }

    if (status === 'unauthenticated' && !signInStartedRef.current) {
      signInStartedRef.current = true
      signIn('google', { callbackUrl })
    }
  }, [status, router, callbackUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B4332]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ford-logo.png" alt="Ford Logo" className="h-12 w-auto" />

        <h1 className="text-2xl font-bold text-[#1B4332]">Admin Login</h1>

        <p className="text-gray-500 text-sm text-center">
          Redirecting to Google Login...
        </p>

        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#163a2b] text-white font-semibold transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
