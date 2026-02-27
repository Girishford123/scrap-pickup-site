'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fordLogoError, setFordLogoError] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      if (data.user) {
        localStorage.setItem('isAdminLoggedIn', 'true')
        localStorage.setItem('adminEmail', email)
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center 
    justify-center p-4">
      <div className="w-full max-w-md">

        {/* ✅ Ford Blue Top Bar */}
        <div className="bg-[#003478] rounded-t-xl px-6 py-3 text-center">
          <p className="text-white text-xs tracking-widest uppercase font-medium">
            Ford Motor Company – Component Sales Division
          </p>
        </div>

        {/* ✅ Main Card */}
        <div className="bg-white rounded-b-xl shadow-lg p-8">

          {/* Logo + Title */}
          <div className="text-center mb-8">
            {/* Ford Logo */}
            {!fordLogoError ? (
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/2560px-Ford_logo_flat.svg.png"
                alt="Ford Logo"
                width={100}
                height={40}
                className="object-contain mx-auto mb-4"
                onError={() => setFordLogoError(true)}
                unoptimized
              />
            ) : (
              <div className="w-24 h-12 bg-[#003478] rounded-full flex 
              items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-white font-bold text-xl italic">
                  Ford
                </span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900">
              Admin Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to manage scrap pickup requests
            </p>
          </div>

          {/* ✅ Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Field */}
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
                focus:border-transparent outline-none transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                {/* ✅ FORGOT PASSWORD LINK - Next to password label */}
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#003478] hover:text-blue-800 
                  hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 
                  rounded-lg text-sm focus:ring-2 focus:ring-blue-500 
                  focus:border-transparent outline-none transition pr-12"
                />
                {/* Show/Hide Password Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                  text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ✅ Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg 
              p-3 flex items-center gap-2">
                <span className="text-red-500 flex-shrink-0">❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* ✅ Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white 
              transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#003478] hover:bg-blue-900 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white 
                  border-t-transparent rounded-full animate-spin"/>
                  Signing In...
                </span>
              ) : (
                '🔐 Sign In'
              )}
            </button>
          </form>

          {/* ✅ Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"/>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-400">
                Need help?
              </span>
            </div>
          </div>

          {/* ✅ Forgot Password - Also as standalone link below form */}
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm 
              text-gray-500 hover:text-[#003478] hover:underline transition"
            >
              🔑 Reset your password
            </Link>
          </div>

        </div>

        {/* ✅ Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Ford Motor Company – 
          Component Sales Division. All rights reserved.
        </p>

      </div>
    </div>
  )
}
