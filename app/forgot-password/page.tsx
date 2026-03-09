'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)

    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  // ── Success Screen ────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col
                      items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="bg-[#003478] rounded-t-xl
                          px-6 py-3 text-center">
            <p className="text-white text-xs tracking-widest
                          uppercase font-medium">
              Ford Motor Company – Component Sales Division
            </p>
          </div>

          <div className="bg-white rounded-b-xl shadow-lg
                          p-8 text-center">

            <div className="w-24 h-24 bg-green-100 rounded-full
                            flex items-center justify-center
                            mx-auto mb-6">
              <span className="text-5xl">📧</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email!
            </h2>

            <p className="text-gray-500 mb-2 text-sm">
              If this email is registered, we sent a
              password reset link to:
            </p>

            <p className="text-[#003478] font-bold text-lg mb-6
                          bg-blue-50 py-2 px-4 rounded-lg
                          inline-block">
              {email}
            </p>

            <div className="bg-blue-50 border border-blue-200
                            rounded-xl p-5 mb-6 text-left">
              <p className="text-sm text-blue-800
                            font-semibold mb-3">
                📋 Next Steps:
              </p>
              <ol className="text-sm text-blue-700
                             space-y-2 list-decimal list-inside">
                <li>Open your email inbox</li>
                <li>Find email from{' '}
  <strong>noreply@fordcomponentsales.in</strong>
</li>
                <li>Click the{' '}
                  <strong>Reset My Password</strong>{' '}button
                </li>
                <li>Create your new password</li>
                <li>Login with your new password</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200
                            rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                ⚠️ Link expires in <strong>1 hour</strong>.
                Check spam folder if not received.
              </p>
            </div>

            <Link
              href="/login/admin"
              className="block w-full py-3 bg-[#003478]
                         text-white rounded-xl hover:bg-blue-900
                         transition font-semibold text-center mb-3"
            >
              Back to Login
            </Link>

            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-gray-500
                         hover:text-[#003478] hover:underline
                         transition-colors"
            >
              Try different email
            </button>

          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Ford Motor Company –
            Component Sales Division
          </p>
        </div>
      </div>
    )
  }

  // ── Form Screen ───────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col
                    items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="bg-[#003478] rounded-t-xl
                        px-6 py-3 text-center">
          <p className="text-white text-xs tracking-widest
                        uppercase font-medium">
            Ford Motor Company – Component Sales Division
          </p>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-8">

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-[#003478] rounded-full
                            flex items-center justify-center
                            mx-auto mb-4">
              <span className="text-white text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Enter your email and we will send you a reset link
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold
                                text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3
                                flex items-center
                                pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400"
                       fill="none" stroke="currentColor"
                       viewBox="0 0 24 24">
                    <path strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21
                             8M5 19h14a2 2 0 002-2V7a2 2 0
                             00-2-2H5a2 2 0 00-2 2v10a2 2 0
                             002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50
                             border border-gray-200 rounded-xl
                             text-sm text-gray-900
                             placeholder-gray-400
                             focus:ring-2 focus:ring-[#003478]
                             focus:border-transparent
                             focus:bg-white outline-none
                             transition-all duration-200"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200
                              rounded-xl p-4 flex items-start
                              gap-3">
                <span className="text-red-500 mt-0.5">❌</span>
                <div>
                  <p className="text-red-700 font-medium text-sm">
                    Error
                  </p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold
                text-white text-sm transition-all duration-200
                shadow-md ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#003478] to-blue-600 hover:from-blue-800 hover:to-blue-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {loading ? (
                <span className="flex items-center
                                 justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full
                                  animate-spin" />
                  Sending Reset Link...
                </span>
              ) : (
                '📧 Send Reset Link'
              )}
            </button>

            <Link
              href="/login/admin"
              className="block text-center text-sm text-gray-500
                         hover:text-[#003478] hover:underline
                         mt-2 transition-colors"
            >
              ← Back to Login
            </Link>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Ford Motor Company –
          Component Sales Division
        </p>
      </div>
    </div>
  )
}
