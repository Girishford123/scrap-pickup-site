'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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
  const [validLink, setValidLink] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if valid reset link
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1)
    )
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      setValidLink(true)
      // Set session with token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || ''
      })
    }
    setChecking(false)
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login/admin')
      }, 3000)
    }
  }

  // Still checking token
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex 
      items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#003478] 
          border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="mt-3 text-gray-600">Verifying link...</p>
        </div>
      </div>
    )
  }

  // Invalid or expired link
  if (!validLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col 
      items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#003478] rounded-t-xl px-6 py-3 
          text-center">
            <p className="text-white text-xs tracking-widest uppercase">
              Ford Motor Company – Component Sales Division
            </p>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg p-8 
          text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full 
            flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-500 mb-6">
              This password reset link is invalid or has expired.
              Please request a new one.
            </p>
            <a
              href="/forgot-password"
              className="block w-full py-3 bg-[#003478] text-white 
              rounded-lg hover:bg-blue-900 transition font-medium 
              text-center"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col 
      items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#003478] rounded-t-xl px-6 py-3 
          text-center">
            <p className="text-white text-xs tracking-widest uppercase">
              Ford Motor Company – Component Sales Division
            </p>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg p-8 
          text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full 
            flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Password Updated!
            </h2>
            <p className="text-gray-500 mb-2">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-[#003478] font-medium">
              Redirecting to login in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col 
    items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#003478] rounded-t-xl px-6 py-3 
        text-center">
          <p className="text-white text-xs tracking-widest uppercase">
            Ford Motor Company – Component Sales Division
          </p>
        </div>
        <div className="bg-white rounded-b-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#003478] rounded-full 
            flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reset Password
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium 
              text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 
                focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium 
              text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500 
                focus:border-transparent outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 
              rounded-lg p-3 flex items-center gap-2">
                <span>❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium 
              text-white transition ${
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
      </div>
    </div>
  )
}