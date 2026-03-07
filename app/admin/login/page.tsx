'use client'

export const dynamic = 'force-dynamic'

import { signIn, useSession } from 'next-auth/react'
import { useRouter }          from 'next/navigation'
import { useEffect }          from 'react'

export default function AdminLoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If already logged in → redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center
                      justify-center bg-[#1B4332]">
        <p className="text-white text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center
                    justify-center bg-[#1B4332]">
      <div className="bg-white rounded-2xl shadow-2xl
                      p-10 flex flex-col items-center gap-6
                      w-full max-w-md">

        {/* Ford Logo */}
        <img
          src="/ford-logo.png"
          alt="Ford Logo"
          className="h-12 w-auto"
        />

        <h1 className="text-2xl font-bold text-[#1B4332]">
          Admin Login
        </h1>

        <p className="text-gray-500 text-sm text-center">
          Sign in with your Ford Microsoft account
          to access the admin dashboard.
        </p>

        <button
          onClick={() => signIn('azure-ad',
            { callbackUrl: '/admin/dashboard' }
          )}
          className="
            w-full bg-[#1B4332] hover:bg-[#145a32]
            text-white font-semibold
            py-3 px-6 rounded-xl
            transition duration-200
            shadow-md hover:shadow-lg
            flex items-center justify-center gap-3
          "
        >
          {/* Microsoft Icon */}
          <svg width="20" height="20" viewBox="0 0 21 21">
            <rect x="1"  y="1"  width="9" height="9"
                  fill="#f25022"/>
            <rect x="11" y="1"  width="9" height="9"
                  fill="#7fba00"/>
            <rect x="1"  y="11" width="9" height="9"
                  fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9"
                  fill="#ffb900"/>
          </svg>
          Sign in with Microsoft
        </button>

      </div>
    </div>
  )
}