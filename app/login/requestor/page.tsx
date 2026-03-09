'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react' 
import { useUploadThing } from '@/lib/uploadthing'


// ── Types ──────────────────────────────────────────────
interface UserSession {
  id: string | number
  email: string
  full_name: string
  role: string
}

interface FormData {
  rcrcNumber: string
  rcrcName: string
  rcrcContactPerson: string
  rcrcEmail: string
  rcrcPhoneNumber: string
  rcrcAddress: string
  rcrcAddress2: string
  state: string
  rcrcZipCode: string
  preferredDate: string
  pickupHours: string
  palletQuantity: string
  totalPiecesQuantity: string
  notes: string
}

interface Attachment {
  url: string
  name: string
}

// ── Session helpers (localStorage) ────────────────────
function saveSession(user: UserSession) {
  localStorage.setItem('user_session', JSON.stringify(user))
}

function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem('user_session')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  localStorage.removeItem('user_session')
}

// ── US States ─────────────────────────────────────────
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// ── Default form state ────────────────────────────────
const DEFAULT_FORM: FormData = {
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
  notes: '',
}

// ── Main Component ────────────────────────────────────
export default function RequestorPage() {

  // Login state
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Session / user
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] =
    useState<UserSession | null>(null)

  // Form state
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM)

  // UI state
  const [error, setError]               = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // UploadThing
  const { startUpload } = useUploadThing('pickupAttachment')

  // ── Handlers ────────────────────────────────────────

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ── Login ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid email or password')
        setLoginLoading(false)
        return
      }

      if (data.user.role !== 'requestor') {
        setError('Access denied. This login is for requestors only.')
        setLoginLoading(false)
        return
      }

      const user: UserSession = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
      }

      saveSession(user)
      setCurrentUser(user)
      setIsLoggedIn(true)
      setFormData(prev => ({
        ...prev,
        rcrcEmail: user.email,
        rcrcContactPerson: user.full_name,
      }))
      setLoginLoading(false)

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoginLoading(false)
    }
  }

  // ── Logout ───────────────────────────────────────────
  const handleLogout = () => {
    clearSession()
    setIsLoggedIn(false)
    setCurrentUser(null)
    setEmail('')
    setPassword('')
    setFormData(DEFAULT_FORM)
    setSelectedFiles([])
    setSubmitSuccess(false)
    setError('')
  }

  // ── Submit Pickup Request ────────────────────────────
const handlePickupSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setSubmitLoading(true)

  // Step 1: Upload attachments
  let attachments: Attachment[] = []

  if (selectedFiles.length > 0) {
    try {
      setUploadProgress(true)
      const uploaded = await startUpload(selectedFiles)
      setUploadProgress(false)

      if (uploaded && uploaded.length > 0) {
        attachments = uploaded.map((f: any) => ({
          url: f.ufsUrl ?? f.url,
          name: f.name,
        }))
      }
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr)
      setUploadProgress(false)
      setError('File upload failed. Please try again.')
      setSubmitLoading(false)
      return
    }
  }

  // Step 2: Build insert payload
  const insertPayload = {
    customer_name:
      formData.rcrcContactPerson ||
      currentUser?.full_name || '',
    phone:   formData.rcrcPhoneNumber || '',
    email:   formData.rcrcEmail || currentUser?.email || '',
    address1: formData.rcrcAddress  || '',
    address2: formData.rcrcAddress2 || '',
    city:    formData.rcrcName  || '',
    state:   formData.state     || '',
    zip:     formData.rcrcZipCode || '',
    preferred_date: formData.preferredDate || '',
    time_window:    formData.pickupHours   || '',
    scrap_category: 'Components',
    description:    formData.notes || '',
    status:  'pending',
    user_id: String(currentUser?.id),
    rcrc_number:         formData.rcrcNumber         || '',
    rcrc_name:           formData.rcrcName           || '',
    rcrc_contact_person: formData.rcrcContactPerson  || '',
    rcrc_email:          formData.rcrcEmail          || '',
    rcrc_phone_number:   formData.rcrcPhoneNumber    || '',
    rcrc_address:        formData.rcrcAddress        || '',
    rcrc_address2:       formData.rcrcAddress2       || '',
    rcrc_zip_code:       formData.rcrcZipCode        || '',
    pallet_quantity: formData.palletQuantity
      ? parseInt(formData.palletQuantity)
      : 0,
    total_pieces_quantity: formData.totalPiecesQuantity
      ? parseInt(formData.totalPiecesQuantity)
      : 0,
    special_instructions: formData.notes || '',
    attachments: attachments,
  }

  // Step 3: Submit to API
  try {
    console.log('📦 Submitting via API:', insertPayload)

    const res = await fetch('/api/pickup-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insertPayload),
    })

    let result: any = {}
    try {
      result = await res.json()
    } catch {
      console.error('❌ Non-JSON response. HTTP Status:', res.status)
      setError(
        `Server error (${res.status}): API route not found or ` +
        `returned no JSON. Check /api/pickup-request/route.ts exists.`
      )
      setSubmitLoading(false)
      return
    }

    if (!res.ok || !result.success) {
      console.error('❌ Insert failed:', result)
      setError(
        `Database Error (${res.status}): ${result.error || 'Unknown error'}`
      )
      setSubmitLoading(false)
      return
    }

    console.log('✅ Insert success:', result.data)

    const submittedRecord = result.data?.[0]
    const requestId: string = submittedRecord?.id
      ? String(submittedRecord.id)
      : 'N/A'

    // Step 4: Send requestor confirmation email
    try {
      await fetch('/api/pickup-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.rcrcEmail || currentUser?.email,
          subject: 'Pickup Request Confirmation – Ford Component Sales',
          requestorName:
            formData.rcrcContactPerson || currentUser?.full_name,
          rcrcNumber:          formData.rcrcNumber,
          rcrcName:            formData.rcrcName,
          rcrcContactPerson:   formData.rcrcContactPerson,
          rcrcEmail:           formData.rcrcEmail,
          rcrcPhoneNumber:     formData.rcrcPhoneNumber,
          rcrcAddress:         formData.rcrcAddress,
          rcrcAddress2:        formData.rcrcAddress2,
          state:               formData.state,
          rcrcZipCode:         formData.rcrcZipCode,
          preferredDate:       formData.preferredDate,
          pickupHours:         formData.pickupHours,
          palletQuantity:      formData.palletQuantity,
          totalPiecesQuantity: formData.totalPiecesQuantity,
          notes:               formData.notes,
          requestId:           requestId,
          attachments:         attachments,
        }),
      })
    } catch (emailErr) {
      console.error('Requestor email failed:', emailErr)
    }

    // Step 5: Send admin notification email
    try {
      await fetch('/api/pickup-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'gkulkara@ford.com',
          subject: 'New Pickup Request Submitted',
          requestorName:
            formData.rcrcContactPerson || currentUser?.full_name,
          rcrcNumber:          formData.rcrcNumber,
          rcrcName:            formData.rcrcName,
          rcrcContactPerson:   formData.rcrcContactPerson,
          rcrcEmail:           formData.rcrcEmail,
          rcrcPhoneNumber:     formData.rcrcPhoneNumber,
          rcrcAddress:         formData.rcrcAddress,
          rcrcAddress2:        formData.rcrcAddress2,
          state:               formData.state,
          rcrcZipCode:         formData.rcrcZipCode,
          preferredDate:       formData.preferredDate,
          pickupHours:         formData.pickupHours,
          palletQuantity:      formData.palletQuantity,
          totalPiecesQuantity: formData.totalPiecesQuantity,
          notes:               formData.notes,
          requestId:           requestId,
          attachments:         attachments,
        }),
      })
    } catch (adminEmailErr) {
      console.error('Admin email failed:', adminEmailErr)
    }

    // Step 6: Reset form on success
    setSubmitSuccess(true)
    setSubmitLoading(false)
    setSelectedFiles([])
    setFormData({
      ...DEFAULT_FORM,
      rcrcContactPerson: currentUser?.full_name || '',
      rcrcEmail:         currentUser?.email     || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setSubmitSuccess(false), 5000)

  } catch (err: any) {
    console.error('❌ Submit error:', err)
    setError(`Error: ${err.message}`)
    setSubmitLoading(false)
  }
}

  // ════════════════════════════════════════════════════
  // RENDER: LOGIN PAGE
  // ════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">

        {/* Ford header bar */}
        <div className="w-full max-w-md">
          <div className="bg-[#003478] rounded-t-2xl px-6 py-3 text-center">
            <p className="text-white text-xs tracking-widest uppercase font-medium">
              Ford Motor Company – Component Sales Division
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md bg-white rounded-b-2xl shadow-xl p-8">

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
              <svg
                className="w-10 h-10 text-[#003478]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
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

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-500 text-lg mt-0.5">❌</span>
              <div>
                <p className="text-red-700 font-medium text-sm">
                  Login Failed
                </p>
                <p className="text-red-600 text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#003478] focus:border-transparent focus:bg-white outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#003478] focus:border-transparent focus:bg-white outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 shadow-md ${
                loginLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#003478] to-blue-600 hover:from-blue-800 hover:to-blue-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-[#003478] font-medium hover:text-blue-800 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">OR</span>
              </div>
            </div>

                    {/* Admin + back links */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">
                Are you an Admin?{' '}
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/admin/dashboard' })}
                  className="text-[#003478] font-semibold hover:underline transition-colors"
                >
                  Admin Login →
                </button>
              </p>
              <Link
                href="/"
                className="block text-sm text-gray-400 hover:text-[#003478] hover:underline transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-300 mt-3">
            © {new Date().getFullYear()} Ford Motor Company. All rights reserved.
          </p>
        </div>
      </div>
    )
  }


        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-300 mt-3">
            © {new Date().getFullYear()} Ford Motor Company. All rights reserved.
          </p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // RENDER: PICKUP REQUEST FORM (after login)
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome, {currentUser?.full_name}!
            </h2>
            <p className="text-sm text-gray-600">
              {currentUser?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Page title bar */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">
              Scrap Pickup Request
            </h1>
            <p className="text-blue-100 mt-2">
              Fill out the details below to schedule your pickup
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePickupSubmit} className="p-8">

            {/* Error banner */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Success banner */}
            {submitSuccess && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 font-semibold">
                  ✅ Pickup request submitted successfully! Check your email for confirmation.
                </p>
              </div>
            )}

            <div className="space-y-8">

              {/* ── Section 1: RCRC Information ──────────── */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                    1
                  </span>
                  RCRC Information
                </h3>

                <div className="space-y-6 ml-11">

                  {/* RCRC Number + Name */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Number
                      </label>
                      <input
                        type="text"
                        name="rcrcNumber"
                        value={formData.rcrcNumber}
                        onChange={handleFormChange}
                        placeholder="RCRC-12345"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        onChange={handleFormChange}
                        placeholder="Center Name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Contact Person + Email */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RCRC Contact Person Name
                      </label>
                      <input
                        type="text"
                        name="rcrcContactPerson"
                        value={formData.rcrcContactPerson}
                        onChange={handleFormChange}
                        placeholder="Contact Person"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        onChange={handleFormChange}
                        placeholder="rcrc@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RCRC Phone Number
                    </label>
                    <input
                      type="tel"
                      name="rcrcPhoneNumber"
                      value={formData.rcrcPhoneNumber}
                      onChange={handleFormChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Address 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RCRC Address 1
                    </label>
                    <input
                      type="text"
                      name="rcrcAddress"
                      value={formData.rcrcAddress}
                      onChange={handleFormChange}
                      placeholder="Street Address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Address 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RCRC Address 2
                    </label>
                    <input
                      type="text"
                      name="rcrcAddress2"
                      value={formData.rcrcAddress2}
                      onChange={handleFormChange}
                      placeholder="Apt, Suite, Unit (optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* State + Zip */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
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
                        onChange={handleFormChange}
                        placeholder="12345"
                        maxLength={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Section 2: Pickup Schedule ────────────── */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                    2
                  </span>
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
                      onChange={handleFormChange}
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
                      onChange={handleFormChange}
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

              {/* ── Section 3: Quantities ─────────────────── */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                    3
                  </span>
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
                      onChange={handleFormChange}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                      onChange={handleFormChange}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 4: Notes ──────────────────────── */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                    4
                  </span>
                  Additional Information
                </h3>

                <div className="ml-11">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={5}
                    placeholder="Any special instructions or additional details..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>

              {/* ── Section 5: Attachments ────────────────── */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                    5
                  </span>
                  Attachments
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    (Optional)
                  </span>
                </h3>

                <div className="ml-11">

                  {/* Drop zone */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
                    <svg
                      className="mx-auto h-10 w-10 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold text-blue-600">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      JPEG images or Excel files — Max 3 files, 4MB each
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.xls,.xlsx"
                      id="file-upload"
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 3) {
                          setError('Maximum 3 files allowed.')
                          return
                        }
                        setError('')
                        setSelectedFiles(files)
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                    >
                      Choose Files
                    </label>
                  </div>

                  {/* Selected file list */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected Files ({selectedFiles.length}/3):
                      </p>
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {file.type.includes('image') ? '🖼️' : '📊'}
                            </span>
                            <span className="text-sm text-gray-700 truncate max-w-xs">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-400 hover:text-red-600 transition ml-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploadProgress && (
                    <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-blue-700">
                        Uploading files... Please wait.
                      </span>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Submit button */}
            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={submitLoading || uploadProgress}
                className="w-full bg-blue-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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
