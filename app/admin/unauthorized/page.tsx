// app/admin/unauthorized/page.tsx
'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ADMIN_EMAILS } from '../../../lib/admin'

export default function Unauthorized() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>

        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your Google account is not authorized to access this dashboard.
        </p>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-red-600 mb-2">
            🔒 Authorized Accounts Only:
          </p>

          <div className="space-y-1">
            {ADMIN_EMAILS.map((email) => (
              <div key={email} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-300" />
                <p className="text-xs text-red-500">{email}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-blue-600 leading-relaxed">
            If you believe you should have access, please contact the system administrator at gkulkara@ford.com
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-sm"
          >
            Sign Out & Try Another Account
          </button>

          <button
            onClick={() => router.push('/admin/login')}
            className="w-full py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors"
          >
            ← Back to Login
          </button>
        </div>

        <div className="border-t border-gray-100 mt-6 pt-4">
          <p className="text-xs text-gray-300">
            Ford Motor Company — MCL Scrap Pickup System
          </p>
        </div>
      </div>
    </div>
  )
}
