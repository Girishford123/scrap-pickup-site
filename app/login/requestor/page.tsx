'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RequestorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  // Pickup form states
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [location, setLocation] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Check if already logged in on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isCustomerLoggedIn')
    const customerEmail = localStorage.getItem('customerEmail')
    const customerId = localStorage.getItem('customerId')
    const customerName = localStorage.getItem('customerName')

    if (loggedIn && customerId) {
      setIsLoggedIn(true)
      setUserData({
        id: customerId,
        email: customerEmail,
        full_name: customerName
      })
    }
  }, [])

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

      // Save customer session
      localStorage.setItem('isCustomerLoggedIn', 'true')
      localStorage.setItem('customerEmail', email)
      localStorage.setItem('customerId', data.id)
      localStorage.setItem('customerName', data.full_name)

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
    localStorage.removeItem('isCustomerLoggedIn')
    localStorage.removeItem('customerEmail')
    localStorage.removeItem('customerId')
    localStorage.removeItem('customerName')
    setIsLoggedIn(false)
    setUserData(null)
    setEmail('')
    setPassword('')
  }

  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError('')

    try {
      const { data, error: submitError } = await supabase
        .from('pickup_requests')
        .insert([
          {
            user_id: userData.id,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            location: location,
            item_description: itemDescription,
            special_instructions: specialInstructions,
            status: 'pending',
            created_at: new Date().toISOString()
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

  // LOGIN FORM VIEW
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Requestor Login</h1>
            <p className="text-gray-600">Sign in to request a pickup</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
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

  // PICKUP REQUEST FORM VIEW (After Login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logout */}
        <div className="bg-white rounded-t-2xl shadow-xl p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Request Pickup</h1>
            <p className="text-gray-600">Welcome, {userData?.full_name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* Pickup Form */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✅ Pickup request submitted successfully!
            </div>
          )}

          <form onSubmit={handlePickupSubmit} className="space-y-6">
            {/* Pickup Date */}
            <div>
              <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date *
              </label>
              <input
                type="date"
                id="pickupDate"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Pickup Time */}
            <div>
              <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Time *
              </label>
              <input
                type="time"
                id="pickupTime"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>

            {/* Item Description */}
            <div>
              <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Item Description *
              </label>
              <textarea
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the items to be picked up..."
                required
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special instructions for the driver..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitLoading ? 'Submitting...' : 'Submit Pickup Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}