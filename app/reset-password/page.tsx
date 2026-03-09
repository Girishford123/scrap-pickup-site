'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter }    from 'next/navigation'

function ResetPasswordForm() {
  const searchParams          = useSearchParams()
  const router                = useRouter()
  const token                 = searchParams.get('token')

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [verifying,   setVerifying]   = useState(true)
  const [tokenValid,  setTokenValid]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Verify token on load ────────────────────────
  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setError('Invalid or missing reset link.')
      return
    }
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const res  = await fetch(`/api/reset-password/verify?token=${token}`)
      const data = await res.json()
      if (data.valid) {
        setTokenValid(true)
      } else {
        setError(data.error || 'This reset link has expired or already been used.')
      }
    } catch {
      setError('Failed to verify reset link.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/reset-password/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login/requestor'), 3000)
      } else {
        setError(data.error || 'Failed to reset password.')
      }
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ────────────────────────────────────
  if (verifying) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-4 border-blue-900 
                        border-t-transparent rounded-full 
                        animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Verifying your reset link...</p>
      </div>
    )
  }

  // ── Success ────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full 
                        flex items-center justify-center mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Password Reset Successful!
        </h2>
        <p className="text-gray-500 text-sm">
          Your password has been updated.<br />
          Redirecting to login...
        </p>
        <div className="w-6 h-6 border-4 border-green-500 
                        border-t-transparent rounded-full 
                        animate-spin mx-auto" />
      </div>
    )
  }

  // ── Invalid Token ──────────────────────────────
  if (!tokenValid) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full 
                        flex items-center justify-center mx-auto">
          <span className="text-3xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Link Expired</h2>
        <p className="text-red-500 text-sm">{error}</p>
        <p className="text-gray-400 text-sm">
          Please contact your admin to send a new reset link.
        </p>
        <a
          href="/login/requestor"
          className="inline-block mt-4 px-6 py-2.5 bg-[#003478] 
                     text-white rounded-xl text-sm font-medium 
                     hover:bg-blue-800 transition"
        >
          ← Back to Login
        </a>
      </div>
    )
  }

  // ── Reset Form ────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl 
                        flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Set New Password
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Enter and confirm your new password below
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
        </div>
      )}

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 py-2.5 border border-gray-200 
                       rounded-xl text-sm focus:ring-2 
                       focus:ring-blue-500 outline-none transition pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 
                       text-gray-400 hover:text-gray-600"
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full px-4 py-2.5 border border-gray-200 
                       rounded-xl text-sm focus:ring-2 
                       focus:ring-blue-500 outline-none transition pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 
                       text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? '🙈' : '👁️'}
          </button>
        </div>
        {/* Match Indicator */}
        {confirm && (
          <p className={`text-xs mt-1 ${
            password === confirm ? 'text-green-600' : 'text-red-500'
          }`}>
            {password === confirm ? '✅ Passwords match' : '❌ Passwords do not match'}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-[#003478] text-white rounded-xl 
                   font-semibold hover:bg-blue-800 transition 
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
      </button>
    </div>
  )
}

// ── Page Wrapper with Suspense ─────────────────────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br 
                    from-blue-50 to-gray-100 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl 
                      w-full max-w-md p-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-blue-900 
                            border-t-transparent rounded-full 
                            animate-spin mx-auto" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
