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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
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

      if (data.password !== password) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Update state and pre-fill form with user data
      setIsLoggedIn(true)
      setUserData(data)
      setFormData(prev => ({
        ...prev,
        rcrcEmail: data.email,
        rcrcContactPerson: data.full_name
      }))
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
            // Required fields from old structure
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
            
            // New RCRC fields
            user_id: userData.id,
            rcrc_number: formData.rcrcNumber,
            rcrc_name: formData.rcrcName,
            rcrc_contact_person: formData.rcrcContactPerson,
            rcrc_email: formData.rcrcEmail,
            rcrc_phone_number: formData.rcrcPhoneNumber,
            rcrc_address: formData.rcrcAddress,
            rcrc_address2: formData.rcrcAddress2,
            rcrc_zip_code: formData.rcrcZipCode,
            pallet_quantity: formData.palletQuantity ? parseInt(formData.palletQuantity) : 0,
            total_pieces_quantity: formData.totalPiecesQuantity ? parseInt(formData.totalPiecesQuantity) : 0,
            special_instructions: formData.notes
          }
        ])
        .select()

      console.log('Insert result:', { data, error: submitError })

      if (submitError) {
        console.error('Submit error:', submitError)
        setError(`Error: ${submitError.message}`)
        setSubmitLoading(false)
        return
      }

      // Success!
      setSubmitSuccess(true)
      setSubmitLoading(false)

      // Reset form (keep user info)
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
      console.error('Pickup request error:', err)
      setError(`Unexpected error: ${err.message}`)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome, {userData?.full_name}!</h2>
            <p className="text-sm text-gray-600">{userData?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Scrap Pickup Request</h1>
            <p className="text-blue-100 mt-2">Fill out the details below to schedule your pickup</p>
          </div>

          {/* Form Content */}
          <form onSubmit={handlePickupSubmit} className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 font-semibold">✅ Pickup request submitted successfully!</p>
              </div>
            )}

            <div className="space-y-8">
              {/* Section 1: RCRC Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  RCRC Information
                </h3>
                <div className="space-y-6 ml-11">
                  {/* Row 1: RCRC Number and Name */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Number
                      </label>
                      <input
                        type="text"
                        name="rcrcNumber"
                        value={formData.rcrcNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="RCRC-12345"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Name
                      </label>
                      <input
                        type="text"
                        name="rcrcName"
                        value={formData.rcrcName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Center Name"
                      />
                    </div>
                  </div>

                  {/* Row 2: Contact Person and Email */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Contact Person Name
                      </label>
                      <input
                        type="text"
                        name="rcrcContactPerson"
                        value={formData.rcrcContactPerson}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Contact Person"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Email
                      </label>
                      <input
                        type="email"
                        name="rcrcEmail"
                        value={formData.rcrcEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="rcrc@example.com"
                      />
                    </div>
                  </div>

                  {/* Row 3: Phone Number */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Phone Number
                      </label>
                      <input
                        type="tel"
                        name="rcrcPhoneNumber"
                        value={formData.rcrcPhoneNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Row 4: Address 1 (Full Width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RCRC Address 1
                    </label>
                    <input
                      type="text"
                      name="rcrcAddress"
                      value={formData.rcrcAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Street Address"
                    />
                  </div>

                  {/* Row 5: Address 2 (Full Width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RCRC Address 2
                    </label>
                    <input
                      type="text"
                      name="rcrcAddress2"
                      value={formData.rcrcAddress2}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Apt, Suite, Unit, Building (optional)"
                    />
                  </div>

                  {/* Row 6: State and Zip Code */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Zip Code
                      </label>
                      <input
                        type="text"
                        name="rcrcZipCode"
                        value={formData.rcrcZipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="12345"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Pickup Schedule */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  Pickup Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-6 ml-11">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date to Pickup
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Hours
                    </label>
                    <select
                      name="pickupHours"
                      value={formData.pickupHours}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Select time slot</option>
                      <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                      <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                      <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Quantities */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  Quantities
                </h3>
                <div className="grid md:grid-cols-2 gap-6 ml-11">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pallet Quantity
                    </label>
                    <input
                      type="number"
                      name="palletQuantity"
                      min="0"
                      value={formData.palletQuantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Pieces Quantity
                    </label>
                    <input
                      type="number"
                      name="totalPiecesQuantity"
                      min="0"
                      value={formData.totalPiecesQuantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Notes */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                  Additional Information
                </h3>
                <div className="ml-11">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Any special instructions, access codes, or additional details..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-blue-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Request...
                  </span>
                ) : (
                  'Submit Pickup Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}