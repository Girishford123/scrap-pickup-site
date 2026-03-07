// app/admin/login/page.tsx
'use client'
export const dynamic = 'force-dynamic'
import { signIn, useSession } from 'next-auth/react'
import { useRouter }          from 'next/navigation'
import { useEffect }          from 'react'

export default function AdminLogin() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // ✅ If already logged in redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50
                      flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500
                          border-t-transparent rounded-full
                          animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 to-gray-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl
                      w-full max-w-md p-8 text-center">

        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl
                          flex items-center justify-center
                          mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🏭</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Ford MCL Admin
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Scrap Pickup Management Dashboard
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6" />

        {/* Access Notice */}
        <div className="bg-amber-50 border border-amber-100
                        rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">
                Restricted Access
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                This dashboard is only accessible to
                authorized Ford admin accounts.
                Unauthorized access attempts are logged.
              </p>
            </div>
          </div>
        </div>

        {/* Authorized Users */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-gray-500
                        uppercase tracking-wide mb-2">
            Authorized Accounts
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-xs text-gray-600">
                gkulkara@ford.com
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-xs text-gray-600">
                mrideno2@ford.com
              </p>
            </div>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() =>
            signIn('google', {
              callbackUrl: '/admin/dashboard',
            })
          }
          className="w-full flex items-center justify-center
                     gap-3 px-6 py-4 bg-white border-2
                     border-gray-200 hover:border-blue-400
                     hover:bg-blue-50 rounded-2xl font-semibold
                     text-gray-700 transition-all duration-200
                     shadow-sm hover:shadow-md group"
        >
          {/* Google SVG Icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="group-hover:text-blue-600
                           transition-colors">
            Sign in with Google
          </span>
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Use your authorized Ford Google account
        </p>

        {/* Footer */}
        <div className="border-t border-gray-100 mt-6 pt-4">
          <p className="text-xs text-gray-300">
            Ford Motor Company — MCL Scrap Pickup System
          </p>
        </div>

      </div>
    </div>
  )
}
