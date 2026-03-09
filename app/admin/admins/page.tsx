'use client'

import { useSession } from 'next-auth/react'
import { useRouter }  from 'next/navigation'
import { useEffect }  from 'react'
import Link           from 'next/link'

const ADMINS = [
  {
    name:   'Girish',
    email:  'girishtrainer@gmail.com',
    role:   'Super Admin',
    avatar: 'G',
    color:  'bg-blue-600',
  },
  {
    name:   'G Kulkarni',
    email:  'gkulkara@ford.com',
    role:   'Admin',
    avatar: 'G',
    color:  'bg-green-600',
  },
  {
    name:   'M Rideno',
    email:  'mrideno2@ford.com',
    role:   'Admin',
    avatar: 'M',
    color:  'bg-purple-600',
  },
]

export default function AdminsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-[#003478] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              ← Dashboard
            </Link>
            <div className="h-5 w-px bg-blue-400" />
            <h1 className="text-xl font-bold text-white">Admin Management</h1>
          </div>
          <span className="text-blue-200 text-sm">{session?.user?.email}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-blue-500 text-2xl mt-0.5">ℹ️</div>
          <div>
            <p className="font-semibold text-blue-800">
              Admin Access via Google Sign-In
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Admin accounts are managed via Google authentication.
              Only the email addresses listed below can access the admin dashboard.
              To add or remove an admin, update the <code className="bg-blue-100 px-1 rounded">ADMIN_EMAILS</code> environment variable.
            </p>
          </div>
        </div>

        {/* Title Row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Current Admins ({ADMINS.length})
          </h2>
          <span className="text-sm text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">
            Google OAuth Only
          </span>
        </div>

        {/* Admin Cards */}
        <div className="space-y-4">
          {ADMINS.map((admin, index) => (
            <div
              key={admin.email}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5"
            >
              {/* Avatar */}
              <div className={`w-14 h-14 ${admin.color} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0`}>
                {admin.avatar}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-lg">{admin.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    index === 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {admin.role}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{admin.email}</p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                  Active
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200">
                  🔐 Google SSO
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* How to Add Admin Box */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>⚙️</span> How to Add / Remove an Admin
          </h3>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to <span className="bg-gray-700 px-1.5 py-0.5 rounded font-mono text-xs">Environment Variables</span></li>
            <li>Find <span className="bg-gray-700 px-1.5 py-0.5 rounded font-mono text-xs">ADMIN_EMAILS</span></li>
            <li>Add or remove email addresses (comma-separated)</li>
            <li>Redeploy the project for changes to take effect</li>
          </ol>
          <div className="mt-4 bg-gray-700 rounded-xl p-3 font-mono text-xs text-green-300">
            ADMIN_EMAILS=girishtrainer@gmail.com,gkulkara@ford.com,mrideno2@ford.com
          </div>
        </div>

      </div>
    </div>
  )
}
