'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.fordcomponentsales.in/reset-password',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  // ✅ Success Screen
  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center 
      justify-center p-4">
        {/* Header Bar */}
        <div className="w-full max-w-md">
          <div className="bg-[#003478] rounded-t-xl px-6 py-3 text-center">
            <p className="text-white text-xs tracking-widest uppercase">
              Ford Motor Company – Component Sales Division
            </p>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-
            center justify-center mx-auto mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email!
            </h2>
            <p className="text-gray-500 mb-2">
              We sent a password reset link to:
            </p>
            <p className="text-[#003478] font-bold text-lg mb-6">
              {email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg 
            p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📋 Next Steps:
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal 
              list-inside">
                <li>Open your email inbox</li>
                <li>Click the reset link in the email</li>
                <li>Create your new password</li>
                <li>Login with new password</li>
              </ol>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Link expires in 24 hours. Check spam folder if not received.
            </p>
            <Link
              href="/login/admin"
              className="block w-full py-3 bg-[#003478] text-white 
              rounded-lg hover:bg-blue-900 transition font-medium text-center"
            >
              Back to Login
            </Link>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 
              hover:underline"
            >
              Try different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Form Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center 
    justify-center p-4">
      <div className="w-full max-w-md">
        {/* Ford Blue Header */}
        <div className="bg-[#003478] rounded-t-xl px-6 py-3 text-center">
          <p className="text-white text-xs tracking-widest uppercase">
            Ford Motor Company – Component Sales Division
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-b-xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#003478] rounded-full flex 
            items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter your email and we will send you a reset link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 
                focus:border-transparent outline-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg 
              p-3 flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white 
              transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#003478] hover:bg-blue-900'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white 
                  border-t-transparent rounded-full animate-spin"/>
                  Sending Reset Link...
                </span>
              ) : (
                '📧 Send Reset Link'
              )}
            </button>

            {/* Back to Login */}
            <Link
              href="/login/admin"
              className="block text-center text-sm text-gray-500 
              hover:text-[#003478] hover:underline mt-2"
            >
              ← Back to Login
            </Link>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Ford Motor Company – 
          Component Sales Division
        </p>
      </div>
    </div>
  )
}