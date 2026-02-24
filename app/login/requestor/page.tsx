'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RequestorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('====== LOGIN DEBUG START ======')
    console.log('Input email:', email)
    console.log('Input password:', password)
    console.log('Input password length:', password.length)
    console.log('Input password as array:', password.split(''))

    try {
      // Query Supabase for customer user
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'customer')
        .single()

      console.log('Database error:', dbError)
      console.log('Database data:', data)

      if (dbError) {
        console.log('ERROR: Database query failed:', dbError.message)
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      if (!data) {
        console.log('ERROR: No user found')
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      console.log('User found!')
      console.log('DB password:', data.password)
      console.log('DB password length:', data.password?.length)
      console.log('DB password as array:', data.password?.split(''))
      console.log('Passwords equal?', data.password === password)
      console.log('Passwords equal (trimmed)?', data.password?.trim() === password.trim())
      
      // Character by character comparison
      for (let i = 0; i < Math.max(password.length, data.password?.length || 0); i++) {
        console.log(`Char ${i}: Input="${password[i]}" (${password.charCodeAt(i)}) vs DB="${data.password?.[i]}" (${data.password?.charCodeAt(i)})`)
      }

      // Check password with trim
      if (data.password?.trim() !== password.trim()) {
        console.log('ERROR: Password mismatch')
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      console.log('SUCCESS: Login successful!')
      console.log('====== LOGIN DEBUG END ======')

      // Save customer session
      localStorage.setItem('isCustomerLoggedIn', 'true')
      localStorage.setItem('customerEmail', email)
      localStorage.setItem('customerId', data.id)
      localStorage.setItem('customerName', data.name)
      localStorage.setItem('customerPhone', data.phone || '')

      // Redirect to request form
      router.push('/request')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <span className="text-3xl text-white">👤</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Requestor Login</h1>
          <p className="text-gray-600">Sign in to submit a pickup request</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="user@ford.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Test Credentials: user@ford.com / User123!
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}