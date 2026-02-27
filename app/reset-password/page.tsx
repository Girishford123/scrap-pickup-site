'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [validLink, setValidLink] = useState(true)

  useEffect(() => {
    // Check if user came from valid reset link
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) {
      setValidLink(false)
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login/admin')
      }, 3000)
    }
  }

  // ✅ Invalid Link Screen
  if (!validLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center 
      justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md 
        w-full text-center">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900 mt-4">
            Invalid Reset Link
          </h2>
          <p className="text-gray-500 mt-2 mb-6">
            This link is expired or invalid. Please request a new one.
          </p>
          <a
            href="/forgot-password"
            className="block w-full py-3 bg-[#003478] text-white 
            rounded-lg hover:bg-blue-900 transition font-medium"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    )
  }

  // ✅ Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center 
      justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md 
        w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex 
          items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Updated!
          </h2>
          <p className="text-gray-500 mb-6">
            Your password has been successfully reset.
            Redirecting to login in 3 seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-[#003478] h-2 rounded-full animate-pulse 
            w-3/4"/>
          </div>
          <a
            href="/login/admin"
            className="block w-full py-3 bg-[#003478] text-white 
            rounded-lg hover:bg-blue-900 transition font-medium"
          >
            Go to Login Now
          </a>
        </div>
      </div>
    )
  }

  // ✅ Reset Password Form
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

        <div className="bg-white rounded-b-xl shadow-lg p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#003478] rounded-full flex 
            items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Password
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Choose a strong password for your account
            </p>
          </div>

          {/* Password Rules */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg 
          p-3 mb-4">
            <p className="text-xs text-blue-800 font-medium mb-1">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className={password.length >= 8 ? 
                'text-green-600' : ''}>
                {password.length >= 8 ? '✅' : '○'} 
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? 
                'text-green-600' : ''}>
                {/[A-Z]/.test(password) ? '✅' : '○'} 
                One uppercase letter
              </li>
              <li className={/[0-9]/.test(password) ? 
                'text-green-600' : ''}>
                {/[0-9]/.test(password) ? '✅' : '○'} 
                One number
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium 
              text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 
                  rounded-lg text-sm focus:ring-2 focus:ring-blue-500 
                  focus:border-transparent outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                  text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium 
              text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg text-sm 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  outline-none ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                />
                {confirmPassword && (
                  <span className="absolute right-3 top-1/2 
                  -translate-y-1/2">
                    {password === confirmPassword ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 
              rounded-lg p-3 flex items-center gap-2">
                <span>❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
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
                  Updating Password...
                </span>
              ) : (
                '🔐 Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Ford Motor Company
        </p>
      </div>
    </div>
  )
}