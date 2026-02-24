'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RequestorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Query the users table directly with plain text password
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'requestor')
        .maybeSingle()

      if (dbError) {
        console.error('Database error:', dbError)
        setError('An error occurred. Please try again.')
        setLoading(false)
        return
      }

      if (!data) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Compare plain text passwords
      if (data.password !== password) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Save customer session
      localStorage.setItem('isCustomerLoggedIn', 'true')
      localStorage.setItem('customerEmail', email)
      localStorage.setItem('customerId', data.id)
      localStorage.setItem('customerName', data.full_name)

      // Redirect to customer dashboard
      router.push('/customer/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Requestor Login</h1>
          <p className="text-gray-600">Sign in to manage your pickup requests</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login/admin" className="text-blue-600 hover:text-blue-700 text-sm">
            Admin Login →
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-700 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}