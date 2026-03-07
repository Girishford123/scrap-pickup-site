'use client'

export const dynamic = 'force-dynamic'

import { signIn } from 'next-auth/react'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center
                    justify-center bg-[#1B4332]">
      <div className="bg-white rounded-2xl shadow-2xl
                      p-10 flex flex-col items-center gap-6
                      w-full max-w-md">

        {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <svg width="20" height="20" viewBox="0 0 21 21">
            <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
            <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign in with Microsoft
        </button>

      </div>
    </div>
  )
}
