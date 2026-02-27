'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false)
        return
      }

      try {
        const response = await fetch('/api/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok && data.valid) {
          setTokenValid(true)
          setUserEmail(data.email)
        }
      } catch (err) {
        console.error('Token verify error:', err)
      }

      setVerifying(false)
    }

    verifyToken()
  }, [token])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        router.push('/login/requestor')
      }, 3000)

    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  // ✅ Verifying State
  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center 
      justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003478] 
          border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying reset link...
          </p>
        </div>
      </div>
    )
  }

  // ✅ Invalid Token State
  if (!tokenValid) {
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
            <div className="w-20 h-20 bg-red-100 rounded-full 
            flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              This password reset link is invalid or has expired.
              Links are only valid for 1 hour.
              Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="block w-full py-3 bg-[#003478] 
              text-white rounded-xl hover:bg-blue-900 
              transition font-semibold text-center"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Success State
  if (success) {
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
            flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Password Updated!
            </h2>
            <p className="text-gray-500 mb-2">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-[#003478] font-semibold 
            animate-pulse">
              Redirecting to login in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Reset Password Form
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
            flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reset Password
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Resetting password for:
            </p>
            <p className="text-[#003478] font-semibold text-sm 
            bg-blue-50 py-1 px-3 rounded-lg inline-block mt-1">
              {userEmail}
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold 
              text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 
                  border border-gray-200 rounded-xl text-sm 
                  focus:ring-2 focus:ring-[#003478] 
                  focus:border-transparent outline-none 
                  transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 
                  flex items-center text-gray-400 
                  hover:text-gray-600 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold 
              text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 
                  border border-gray-200 rounded-xl text-sm 
                  focus:ring-2 focus:ring-[#003478] 
                  focus:border-transparent outline-none 
                  transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 
                  flex items-center text-gray-400 
                  hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`text-sm flex items-center gap-2 
              font-medium ${
                password === confirmPassword
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}>
                {password === confirmPassword ? (
                  <><span>✅</span> Passwords match</>
                ) : (
                  <><span>❌</span> Passwords do not match</>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 
              rounded-xl p-4 flex items-start gap-3">
                <span className="text-red-500">❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold 
              text-white text-sm transition-all duration-200 
              shadow-md ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#003478] to-blue-600 \
                     hover:from-blue-800 hover:to-blue-700 \
                     hover:shadow-lg active:scale-95'
              }`}
            >
              {loading ? (
                <span className="flex items-center 
                justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white 
                  border-t-transparent rounded-full animate-spin"/>
                  Updating Password...
                </span>
              ) : (
                '🔐 Update Password'
              )}
            </button>

            <Link
              href="/forgot-password"
              className="block text-center text-sm text-gray-500 
              hover:text-[#003478] hover:underline 
              transition-colors"
            >
              ← Request New Reset Link
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

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center 
      justify-center">
        <div className="w-12 h-12 border-4 border-[#003478] 
        border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}