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
          Sign in with your Ford Google account
          to access the admin dashboard.
        </p>

        <button
          onClick={() => signIn('google',
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
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

      </div>
    </div>
  )
}
