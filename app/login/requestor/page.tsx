'use client'

import { useState } from 'react'
import Link from 'next/link'

// ✅ REMOVED: import { supabase } from '@/lib/supabase'
// We no longer call Supabase directly from browser!

export default function RequestorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // Pickup form states
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [formData, setFormData] = useState({
    rcrcNumber: '',
    rcrcName: '',
    rcrcContactPerson: '',
    rcrcEmail: '',
    rcrcPhoneNumber: '',
    rcrcAddress: '',
    rcrcAddress2: '',
    state: '',
    rcrcZipCode: '',
    preferredDate: '',
    pickupHours: '',
    palletQuantity: '',
    totalPiecesQuantity: '',
    notes: ''
  })

  // US States list
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  // ✅ FIXED handleLogin — calls API instead of Supabase directly
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ✅ Call your secure API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      // ✅ Check if login failed
      if (!response.ok) {
        setError(result.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      // ✅ Check if user is a requestor
      if (result.user.role !== 'requestor') {
        setError('Access denied. This login is for requestors only.')
        setLoading(false)
        return
      }

      // ✅ Login success!
      setIsLoggedIn(true)
      setUserData(result.user)
      setFormData(prev => ({
        ...prev,
        rcrcEmail: result.user.email,
        rcrcContactPerson: result.user.full_name
      }))
      setLoading(false)

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    setEmail('')
    setPassword('')
    setFormData({
      rcrcNumber: '',
      rcrcName: '',
      rcrcContactPerson: '',
      rcrcEmail: '',
      rcrcPhoneNumber: '',
      rcrcAddress: '',
      rcrcAddress2: '',
      state: '',
      rcrcZipCode: '',
      preferredDate: '',
      pickupHours: '',
      palletQuantity: '',
      totalPiecesQuantity: '',
      notes: ''
    })
    setSubmitSuccess(false)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // ✅ FIXED handlePickupSubmit — calls API instead of Supabase directly
  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError('')

    try {
      // ✅ Call your secure API endpoint
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: formData.rcrcContactPerson || userData.full_name,
          phone: formData.rcrcPhoneNumber || '0000000000',
          email: formData.rcrcEmail || userData.email,
          address1: formData.rcrcAddress || 'N/A',
          address2: formData.rcrcAddress2,
          city: formData.rcrcName || 'N/A',
          state: formData.state || 'N/A',
          zip: formData.rcrcZipCode || '00000',
          preferred_date: formData.preferredDate,
          time_window: formData.pickupHours || 'TBD',
          scrap_category: 'Components',
          description: formData.notes,
          status: 'pending',
          user_id: userData.id,
          rcrc_number: formData.rcrcNumber,
          rcrc_name: formData.rcrcName,
          rcrc_contact_person: formData.rcrcContactPerson,
          rcrc_email: formData.rcrcEmail,
          rcrc_phone_number: formData.rcrcPhoneNumber,
          rcrc_address: formData.rcrcAddress,
          rcrc_address2: formData.rcrcAddress2,
          rcrc_zip_code: formData.rcrcZipCode,
          pallet_quantity: formData.palletQuantity
            ? parseInt(formData.palletQuantity)
            : 0,
          total_pieces_quantity: formData.totalPiecesQuantity
            ? parseInt(formData.totalPiecesQuantity)
            : 0,
          special_instructions: formData.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(`Error: ${result.error || 'Failed to submit request'}`)
        setSubmitLoading(false)
        return
      }

      const requestId = result.data ? result.data.id : 'N/A'

      // Send email to requestor
      try {
        await fetch('/api/pickup-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.rcrcEmail || userData.email,
            subject: 'Pickup Request Confirmation - Ford Component Sales',
            requestorName: formData.rcrcContactPerson || userData.full_name,
            rcrcNumber: formData.rcrcNumber,
            rcrcName: formData.rcrcName,
            rcrcContactPerson: formData.rcrcContactPerson,
            rcrcEmail: formData.rcrcEmail,
            rcrcPhoneNumber: formData.rcrcPhoneNumber,
            rcrcAddress: formData.rcrcAddress,
            rcrcAddress2: formData.rcrcAddress2,
            state: formData.state,
            rcrcZipCode: formData.rcrcZipCode,
            preferredDate: formData.preferredDate,
            pickupHours: formData.pickupHours,
            palletQuantity: formData.palletQuantity,
            totalPiecesQuantity: formData.totalPiecesQuantity,
            notes: formData.notes,
            requestId: requestId
          })
        })
      } catch (emailError) {
        console.error('Failed to send requestor email:', emailError)
      }

      // Send email to admin
      try {
        await fetch('/api/pickup-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'gkulkara@ford.com',
            subject: 'New Pickup Request Submitted',
            requestorName: formData.rcrcContactPerson || userData.full_name,
            rcrcNumber: formData.rcrcNumber,
            rcrcName: formData.rcrcName,
            rcrcContactPerson: formData.rcrcContactPerson,
            rcrcEmail: formData.rcrcEmail,
            rcrcPhoneNumber: formData.rcrcPhoneNumber,
            rcrcAddress: formData.rcrcAddress,
            rcrcAddress2: formData.rcrcAddress2,
            state: formData.state,
            rcrcZipCode: formData.rcrcZipCode,
            preferredDate: formData.preferredDate,
            pickupHours: formData.pickupHours,
            palletQuantity: formData.palletQuantity,
            totalPiecesQuantity: formData.totalPiecesQuantity,
            notes: formData.notes,
            requestId: requestId
          })
        })
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError)
      }

      setSubmitSuccess(true)
      setSubmitLoading(false)

      setFormData({
        rcrcNumber: '',
        rcrcName: '',
        rcrcContactPerson: userData.full_name,
        rcrcEmail: userData.email,
        rcrcPhoneNumber: '',
        rcrcAddress: '',
        rcrcAddress2: '',
        state: '',
        rcrcZipCode: '',
        preferredDate: '',
        pickupHours: '',
        palletQuantity: '',
        totalPiecesQuantity: '',
        notes: ''
      })

      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSubmitSuccess(false), 5000)

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
      setSubmitLoading(false)
    }
  }

  // ============================================
  // LOGIN FORM VIEW
  // ============================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 
      via-white to-blue-50 flex flex-col items-center 
      justify-center p-4">

        {/* Ford Header Banner */}
        <div className="w-full max-w-md">
          <div className="bg-[#003478] rounded-t-2xl px-6 py-3 
          text-center">
            <p className="text-white text-xs tracking-widest 
            uppercase font-medium">
              Ford Motor Company – Component Sales Division
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md bg-white rounded-b-2xl 
        shadow-xl p-8">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full 
            flex items-center justify-center shadow-inner">
              <svg
                className="w-10 h-10 text-[#003478]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 
                2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 
                12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Requestor Login
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to request a pickup
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 
            rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-500 text-lg mt-0.5">❌</span>
              <div>
                <p className="text-red-700 font-medium text-sm">
                  Login Failed
                </p>
                <p className="text-red-600 text-sm mt-0.5">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold 
                text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 
                flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 
                      0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 
                      0 10-9 9m4.5-1.206a8.959 8.959 0 
                      01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 
                  border border-gray-200 rounded-xl text-sm 
                  text-gray-900 placeholder-gray-400
                  focus:ring-2 focus:ring-[#003478] 
                  focus:border-transparent focus:bg-white
                  outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold 
                text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 
                flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 
                      2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 
                      002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 
                  border border-gray-200 rounded-xl text-sm 
                  text-gray-900 placeholder-gray-400
                  focus:ring-2 focus:ring-[#003478] 
                  focus:border-transparent focus:bg-white
                  outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 
                  flex items-center text-gray-400 
                  hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round"
                        strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 
                        0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 
                        9.97 0 011.563-3.029m5.858.908a3 3 0 
                        114.243 4.243M9.878 9.878l4.242 
                        4.242M9.88 9.88l-3.29-3.29m7.532 
                        7.532l3.29 3.29M3 3l3.59 3.59m0 
                        0A9.953 9.953 0 0112 5c4.478 0 
                        8.268 2.943 9.543 7a10.025 10.025 
                        0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round"
                        strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round"
                        strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 
                        5c4.478 0 8.268 2.943 9.542 7-1.274 
                        4.057-5.064 7-9.542 7-4.477 
                        0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
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
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white 
                  border-t-transparent rounded-full animate-spin"/>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-4 h-4" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round"
                      strokeLinejoin="round" strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </span>
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-[#003478] font-medium
                hover:text-blue-800 hover:underline 
                transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"/>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">OR</span>
              </div>
            </div>

            {/* Admin Login Link */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">
                Are you an Admin?{' '}
                <Link
                  href="/login/admin"
                  className="text-[#003478] font-semibold 
                  hover:underline transition-colors"
                >
                  Admin Login →
                </Link>
              </p>
              <Link
                href="/"
                className="block text-sm text-gray-400 
                hover:text-[#003478] hover:underline 
                transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-300 mt-3">
            © {new Date().getFullYear()} Ford Motor Company. 
            All rights reserved.
          </p>
        </div>
      </div>
    )
  }

  // REST OF YOUR FILE STAYS EXACTLY THE SAME
  // (The pickup form JSX below login view)
  // KEEP EVERYTHING FROM "PICKUP REQUEST FORM VIEW"
  // ONWARDS EXACTLY AS IT WAS!