'use client'

import { useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginClient() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const callbackUrl = searchParams.get('callbackUrl') 
    || '/admin/dashboard'

  // ✅ Check for error param — PREVENTS LOOP
  const error = searchParams.get('error')

  const signInStartedRef = useRef(false)

  useEffect(() => {
    // ✅ If there is an error — DO NOT sign in again
    if (error) return

    if (status === 'authenticated') {
      router.replace(callbackUrl)
      return
    }

    if (status === 'unauthenticated' && !signInStartedRef.current) {
      signInStartedRef.current = true
      signIn('google', { callbackUrl })
    }
  }, [status, router, callbackUrl, error])

  // ✅ Show error message instead of spinning
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B4332]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ford-logo.png" alt="Ford Logo" className="h-12 w-auto" />
          <h1 className="text-2xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="text-gray-500 text-sm text-center">
            Your email is not authorized to access 
            the admin panel. Please contact your 
            system administrator.
          </p>
          <p className="text-xs text-gray-400">
            Error: {error}
          </p>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#163a2b] text-white font-semibold transition-colors"
          >
            Try Different Account
          </button>
        </div>
      </div>
    )
  }

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
