'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUserSession } from '@/lib/auth'

interface Attachment {
  url: string
  name: string
}

interface PickupRequest {
  _id: string
  id: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected'
  rcrcNumber: string
  rcrcName: string
  rcrcContactPerson: string
  rcrcEmail: string
  rcrcPhoneNumber: string
  rcrcAddress: string
  rcrcAddress2: string
  rcrcZipCode: string
  state: string
  preferredDate: string
  pickupHours: string
  palletQuantity: number
  totalPiecesQuantity: number
  notes: string
  customerName: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  cancelReason: string
  cancelledAt: string | null
}

// ✅ Status configuration
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
    step: 1,
    description: 'Your request has been received'
  },
  approved: {
    label: 'Approved',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '✅',
    step: 2,
    description: 'Your pickup has been approved'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🎉',
    step: 3,
    description: 'Pickup has been completed'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    step: 0,
    description: 'Your request was rejected'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🚫',
    step: 0,
    description: 'This request was cancelled'
  }
}

const steps = ['Submitted', 'Approved', 'Completed']

export default function TrackPickupPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  // Cancel modal states
  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Expanded request detail
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ✅ Fetch requests from Supabase via API
  const fetchRequests = useCallback(async (uid: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/request/status?userId=${uid}`)
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Failed to load requests', 'error')
        return
      }

      setRequests(data.requests || [])
    } catch {
      showToast('Failed to load requests. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ Auth check on load
  useEffect(() => {
    const user = getUserSession()
    if (!user) {
      router.push('/login/requestor')
      return
    }
    setUserId(user.id)
    setUserName(user.full_name || user.email)
    fetchRequests(user.id)
  }, [router, fetchRequests])

  // ✅ Handle cancel
  const handleCancel = async (requestId: string) => {
    if (!cancelReason.trim()) {
      setCancelError('Please enter a reason for cancellation.')
      return
    }

    const user = getUserSession()
    if (!user) {
      showToast('Session expired, please login again', 'error')
      router.push('/login/requestor')
      return
    }

    setCancelling(true)
    setCancelError('')

    try {
      const res = await fetch('/api/request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          cancelReason,
          userId: user.id
        })
      })

      const data = await res.json()

      if (res.ok) {
        showToast('Pickup cancelled successfully', 'success')
        setCancelModal(null)
        setCancelReason('')
        fetchRequests(user.id)
      } else {
        setCancelError(data.error || 'Failed to cancel pickup')
      }
    } catch {
      setCancelError('Something went wrong. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // ✅ Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(
      r => r.status === 'cancelled' || r.status === 'rejected'
    ).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14
          border-b-4 border-[#003478] mx-auto mb-4"/>
          <p className="text-gray-600 font-medium">
            Loading your pickup requests...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br
    from-blue-50 to-blue-100">

      {/* ✅ Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3
        rounded-xl shadow-lg text-white font-medium
        transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* ✅ Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50
        flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md
          w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Cancel Pickup Request
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Please tell us why you are cancelling this request.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value)
                setCancelError('')
              }}
              placeholder="Reason for cancellation..."
              className="w-full border border-gray-300 rounded-xl
              p-3 text-sm h-28 resize-none focus:outline-none
              focus:ring-2 focus:ring-red-300 transition"
            />
            {cancelError && (
              <p className="text-red-600 text-sm mt-2 flex
              items-center gap-1">
                ⚠️ {cancelError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setCancelModal(null)
                  setCancelReason('')
                  setCancelError('')
                }}
                className="flex-1 border border-gray-300 text-gray-700
                py-2.5 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Go Back
              </button>
              <button
                onClick={() => handleCancel(cancelModal)}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-2.5
                rounded-xl hover:bg-red-600 transition font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white
                    border-t-transparent rounded-full animate-spin"/>
                    Cancelling...
                  </span>
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="bg-[#003478] px-4 py-1 text-center">
          <p className="text-white text-xs tracking-widest
          font-medium uppercase">
            Ford Motor Company – Component Sales Division
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8
        py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003478] rounded-full
            flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Track My Pickups
              </h1>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => userId && fetchRequests(userId)}
              className="px-3 py-2 bg-gray-100 text-gray-700
              rounded-lg hover:bg-gray-200 transition text-sm
              font-medium"
            >
              🔄 Refresh
            </button>
            <Link
              href="/login/requestor"
              className="px-3 py-2 bg-[#003478] text-white
              rounded-lg hover:bg-blue-900 transition text-sm
              font-medium"
            >
              + New Request
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ✅ Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: 'Total',
              value: stats.total,
              color: 'text-gray-900',
              bg: 'bg-gray-100',
              icon: '📋'
            },
            {
              label: 'Pending',
              value: stats.pending,
              color: 'text-yellow-600',
              bg: 'bg-yellow-100',
              icon: '⏳'
            },
            {
              label: 'Approved',
              value: stats.approved,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
              icon: '✅'
            },
            {
              label: 'Completed',
              value: stats.completed,
              color: 'text-green-600',
              bg: 'bg-green-100',
              icon: '🎉'
            },
            {
              label: 'Cancelled',
              value: stats.cancelled,
              color: 'text-red-600',
              bg: 'bg-red-100',
              icon: '🚫'
            }
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${stat.bg} rounded-lg
                flex items-center justify-center text-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ No Requests State */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center
          shadow-md">
            <p className="text-6xl mb-4">📦</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              No Pickup Requests Yet
            </h2>
            <p className="text-gray-500 mb-6">
              You have not submitted any scrap pickup requests.
            </p>
            <Link
              href="/login/requestor"
              className="inline-flex items-center gap-2 bg-[#003478]
              text-white px-6 py-3 rounded-xl hover:bg-blue-900
              transition font-medium"
            >
              + Submit Your First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const config =
                statusConfig[request.status] || statusConfig.pending
              const isExpanded = expandedId === request._id

              return (
                <div
                  key={request._id}
                  className="bg-white rounded-2xl shadow-sm
                  overflow-hidden border border-gray-100
                  hover:shadow-md transition-shadow"
                >
                  {/* ✅ Card Header — Always Visible */}
                  <div className="p-6">
                    <div className="flex justify-between
                    items-start gap-4">
                      <div className="flex-1">

                        {/* Request ID + Status */}
                        <div className="flex items-center
                        gap-3 mb-3 flex-wrap">
                          <span className="text-xs font-medium
                          text-gray-400">
                            Request #{request.id || request._id}
                          </span>
                          <span className={`px-3 py-1 rounded-full
                          text-xs font-semibold border
                          ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                          {request.attachments?.length > 0 && (
                            <span className="px-2 py-1 rounded-full
                            text-xs font-medium bg-purple-100
                            text-purple-700 border border-purple-200">
                              📎 {request.attachments.length} file
                              {request.attachments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* RCRC Info */}
                        <h2 className="text-lg font-bold text-gray-900
                        mb-1">
                          {request.rcrcName || request.customerName ||
                            'Pickup Request'}
                        </h2>
                        {request.rcrcNumber && (
                          <p className="text-sm text-gray-500 mb-1">
                            RCRC: {request.rcrcNumber}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          📍 {request.rcrcAddress}
                          {request.rcrcAddress2
                            ? `, ${request.rcrcAddress2}`
                            : ''}
                          {request.state ? `, ${request.state}` : ''}
                          {request.rcrcZipCode
                            ? ` ${request.rcrcZipCode}`
                            : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted:{' '}
                          {new Date(request.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            setExpandedId(
                              isExpanded ? null : request._id
                            )
                          }
                          className="px-4 py-2 bg-gray-100 text-gray-700
                          rounded-lg hover:bg-gray-200 transition
                          text-sm font-medium"
                        >
                          {isExpanded ? '▲ Hide' : '▼ Details'}
                        </button>
                        {!['completed', 'cancelled', 'rejected'].includes(
                          request.status
                        ) && (
                          <button
                            onClick={() => setCancelModal(request._id)}
                            className="px-4 py-2 border border-red-300
                            text-red-500 rounded-lg hover:bg-red-50
                            transition text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ✅ Progress Bar */}
                    {!['cancelled', 'rejected'].includes(
                      request.status
                    ) && (
                      <div className="mt-4">
                        <div className="flex justify-between mb-2">
                          {steps.map((step, idx) => (
                            <span
                              key={step}
                              className={`text-xs font-semibold ${
                                idx + 1 <= config.step
                                  ? 'text-[#003478]'
                                  : 'text-gray-300'
                              }`}
                            >
                              {step}
                            </span>
                          ))}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-[#003478] h-2 rounded-full
                            transition-all duration-700"
                            style={{
                              width: `${
                                (config.step / steps.length) * 100
                              }%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {config.description}
                        </p>
                      </div>
                    )}

                    {/* Cancelled/Rejected Banner */}
                    {['cancelled', 'rejected'].includes(
                      request.status
                    ) && (
                      <div className="mt-4 bg-red-50 border border-red-200
                      rounded-xl p-3">
                        <p className="text-sm text-red-600 font-medium">
                          {config.icon} This request was{' '}
                          {request.status}
                          {request.cancelReason &&
                            `: "${request.cancelReason}"`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ✅ Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100
                    bg-gray-50 p-6">
                      <div className="grid md:grid-cols-2 gap-6">

                        {/* Column 1 */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold
                          text-gray-900 uppercase tracking-wide">
                            📋 RCRC Details
                          </h3>

                          {request.rcrcContactPerson && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Contact Person</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.rcrcContactPerson}
                              </p>
                            </div>
                          )}
                          {request.rcrcEmail && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Email</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.rcrcEmail}
                              </p>
                            </div>
                          )}
                          {request.rcrcPhoneNumber && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Phone</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.rcrcPhoneNumber}
                              </p>
                            </div>
                          )}
                          {request.preferredDate && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Preferred Date</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                📅 {request.preferredDate}
                              </p>
                            </div>
                          )}
                          {request.pickupHours && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Pickup Hours</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                🕐 {request.pickupHours}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold
                          text-gray-900 uppercase tracking-wide">
                            📦 Pickup Details
                          </h3>

                          {request.palletQuantity > 0 && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Pallet Quantity</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.palletQuantity} pallets
                              </p>
                            </div>
                          )}
                          {request.totalPiecesQuantity > 0 && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Total Pieces</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.totalPiecesQuantity} pieces
                              </p>
                            </div>
                          )}
                          {request.notes && (
                            <div>
                              <p className="text-xs text-gray-400
                              uppercase font-medium">Notes</p>
                              <p className="text-sm text-gray-800 mt-0.5">
                                {request.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ✅ Attachments Section */}
                      {request.attachments &&
                        request.attachments.length > 0 && (
                          <div className="mt-6 pt-4 border-t
                          border-gray-200">
                            <h3 className="text-sm font-bold
                            text-gray-900 uppercase tracking-wide mb-3">
                              📎 Attached Files
                            </h3>
                            <div className="grid grid-cols-1
                            sm:grid-cols-2 gap-2">
                              {request.attachments.map((file, idx) => {
                                const isImage = file.name?.match(
                                  /\.(jpg|jpeg|png)$/i
                                )
                                return (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3
                                    bg-white border border-gray-200
                                    rounded-xl px-4 py-3 hover:border-blue-300
                                    hover:bg-blue-50 transition group"
                                  >
                                    <div className="w-9 h-9 rounded-lg
                                    flex items-center justify-center
                                    flex-shrink-0 text-lg
                                    bg-gray-100 group-hover:bg-blue-100">
                                      {isImage ? '🖼️' : '📊'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium
                                      text-gray-800 truncate">
                                        {file.name || `File ${idx + 1}`}
                                      </p>
                                      <p className="text-xs text-blue-600
                                      group-hover:underline">
                                        Click to view ↗
                                      </p>
                                    </div>
                                  </a>
                                )
                              })}
                            </div>
                          </div>
                        )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400
