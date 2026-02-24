'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RequestorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // Pickup form states
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [location, setLocation] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
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

      // Update state to show pickup form
      setIsLoggedIn(true)
      setUserData(data)
      setLoading(false)
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    setEmail('')
    setPassword('')
    setPickupDate('')
    setPickupTime('')
    setLocation('')
    setItemDescription('')
    setSpecialInstructions('')
    setSubmitSuccess(false)
  }

  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError('')

    try {
      const { error: submitError } = await supabase
        .from('pickup_requests')
        .insert([
          {
            user_id: userData.id,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            location: location,
            item_description: itemDescription,
            special_instructions: specialInstructions,
            status: 'pending'
          }
        ])

      if (submitError) {
        console.error('Submit error:', submitError)
        setError('Failed to submit pickup request. Please try again.')
        setSubmitLoading(false)
        return
      }

      // Success!
      setSubmitSuccess(true)
      setSubmitLoading(false)

      // Reset form
      setPickupDate('')
      setPickupTime('')
      setLocation('')
      setItemDescription('')
      setSpecialInstructions('')

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      console.error('Pickup request error:', err)
      setError('An unexpected error occurred')
      setSubmitLoading(false)
    }
  }

  // ============================================
  // LOGIN FORM VIEW
  // ============================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Requestor Login</h1>
            <p className="text-gray-600">Sign in to request a pickup</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-medium">❌ {error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
            <Link href="/login/admin" className="block text-blue-600 hover:text-blue-700 font-medium transition">
              Admin Login →
            </Link>
            <Link href="/" className="block text-gray-500 hover:text-gray-700 text-sm transition">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // PICKUP REQUEST FORM VIEW (After Login)
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📦 Request Pickup</h1>
              <p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-blue-600">{userData?.full_name}</span>!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Pickup Form */}
        <div className="bg-white rounded-b-3xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-medium">❌ {error}</p>
            </div>
          )}

          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <p className="font-medium">✅ Pickup request submitted successfully!</p>
            </div>
          )}

          <form onSubmit={handlePickupSubmit} className="space-y-6">
            {/* Date & Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pickupDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Pickup Date *
                </label>
                <input
                  type="date"
                  id="pickupDate"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="pickupTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  🕐 Pickup Time *
                </label>
                <input
                  type="time"
                  id="pickupTime"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Pickup Location *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>

            {/* Item Description */}
            <div>
              <label htmlFor="itemDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Item Description *
              </label>
              <textarea
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Describe the items to be picked up..."
                required
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="block text-sm font-semibold text-gray-700 mb-2">
                💬 Special Instructions (Optional)
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Any special instructions for the driver..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {submitLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : '📤 Submit Pickup Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}