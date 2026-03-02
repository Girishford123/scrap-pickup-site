'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAIL    = process.env.NEXT_PUBLIC_ADMIN_EMAIL    || 'gkulkara@ford.com'
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Girishfcs@66!'

export default function AdminLogin() {
  const router = useRouter()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const emailMatch    = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
      const passwordMatch = password === ADMIN_PASSWORD

      if (emailMatch && passwordMatch) {
        // ✅ Save admin session
        localStorage.setItem('isAdminLoggedIn', 'true')
        localStorage.setItem('adminEmail', email.trim())

        // ✅ Save user session so Navbar works correctly
        localStorage.setItem('user_session', JSON.stringify({
          id:        'admin-001',
          email:     email.trim(),
          full_name: 'Administrator',
          role:      'admin',
        }))

        router.push('/admin/dashboard')

      } else {
        setError('Invalid email or password')
        setLoading(false)
      }

    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100
                    flex flex-col items-center justify-center p-4">

      {/* Ford Header Banner */}
      <div className="w-full max-w-md">
        <div className="bg-[#003478] rounded-t-2xl px-6 py-3 text-center">
          <p className="text-white text-xs tracking-widest uppercase font-medium">
            Ford Motor Company – Component Sales Division
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-b-2xl shadow-xl p-8">

        {/* Back to Home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500
                       hover:text-[#003478] transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none"
                 stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center
                          justify-center shadow-inner">
            <span className="text-4xl">🛡️</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Login</h1>
          <p className="text-gray-500 text-sm">Access the admin dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4
                          flex items-start gap-3">
            <span className="text-red-500 text-lg mt-0.5">❌</span>
            <div>
              <p className="text-red-700 font-medium text-sm">Login Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label htmlFor="email"
                   className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center
                              pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="gkulkara@ford.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200
                           rounded-xl text-sm text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#003478] focus:border-transparent
                           focus:bg-white outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password"
                   className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center
                              pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200
                           rounded-xl text-sm text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#003478] focus:border-transparent
                           focus:bg-white outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center
                           text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm
              transition-all duration-200 shadow-md ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#003478] to-blue-600 hover:from-blue-800 hover:to-blue-700 hover:shadow-lg active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent
                                rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <svg className="w-4 h-4" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">OR</span>
            </div>
          </div>

          {/* Requestor Link */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Are you a Requestor?{' '}
              <Link
                href="/login/requestor"
                className="text-[#003478] font-semibold hover:underline
                           transition-colors"
              >
                Requestor Login →
              </Link>
            </p>
          </div>

        </form>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-300 mt-3">
          © {new Date().getFullYear()} Ford Motor Company. All rights reserved.
        </p>
      </div>

    </div>
  )
}
