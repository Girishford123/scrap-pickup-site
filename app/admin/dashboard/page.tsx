'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  url: string
  name: string
}

interface PickupRequest {
  id: number
  created_at: string
  updated_at?: string
  customer_name: string
  phone: string | null
  email: string
  user_id?: string
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  preferred_date?: string | null
  time_window?: string | null
  scrap_category?: string | null
  description?: string | null
  rcrc_number?: string | null
  rcrc_name?: string | null
  rcrc_contact_person?: string | null
  rcrc_email?: string | null
  rcrc_phone_number?: string | null
  rcrc_address?: string | null
  rcrc_address2?: string | null
  rcrc_zip_code?: string | null
  pallet_quantity?: number | null
  total_pieces_quantity?: number | null
  special_instructions?: string | null
  notes?: string | null
  status: 'new' | 'NEW' | 'pending' | 'approved' | 'rejected' | 'completed'
  attachments?: Attachment[]
  cancel_reason?: string | null
  cancelled_at?: string | null
}

interface Counts {
  all: number
  new: number
  pending: number
  approved: number
  rejected: number
  completed: number
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new:       'bg-blue-100 text-blue-800',
  NEW:       'bg-blue-100 text-blue-800',
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
}

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'completed']

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function fullAddress(r: PickupRequest): string {
  return [r.address1, r.address2, r.city, r.state, r.zip]
    .filter(Boolean)
    .join(', ') || '—'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [requests, setRequests]             = useState<PickupRequest[]>([])
  const [counts, setCounts]                 = useState<Counts>({
    all: 0, new: 0, pending: 0, approved: 0, rejected: 0, completed: 0,
  })
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [activeTab, setActiveTab]           = useState<string>('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const [updatingId, setUpdatingId]         = useState<number | null>(null)
  const [updateMessage, setUpdateMessage]   = useState<string | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchRequests() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/admin/requests', { cache: 'no-store' })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Failed to load requests')
        return
      }

      setRequests(json.data || [])
      setCounts(json.counts || {
        all: 0, new: 0, pending: 0,
        approved: 0, rejected: 0, completed: 0,
      })
    } catch (err: any) {
      setError(err?.message || 'Network error — could not reach API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  // ── Update Status ────────────────────────────────────────────────────────

  async function updateStatus(id: number, status: string) {
    try {
      setUpdatingId(id)
      setUpdateMessage(null)

      const res = await fetch('/api/admin/requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      })

      const json = await res.json()

      if (!json.success) {
        setUpdateMessage(`Error: ${json.error}`)
        return
      }

      setUpdateMessage(`Request #${id} updated to "${status}"`)
      await fetchRequests()

      if (selectedRequest?.id === id) {
        setSelectedRequest(prev =>
          prev ? { ...prev, status: status as PickupRequest['status'] } : null
        )
      }

      setTimeout(() => setUpdateMessage(null), 3000)
    } catch (err: any) {
      setUpdateMessage(`Error: ${err?.message || 'Unknown error'}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = requests
    .filter(r => {
      if (activeTab === 'all') return true
      if (activeTab === 'new') return r.status === 'new' || r.status === 'NEW'
      return r.status === activeTab
    })
    .filter(r => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        r.customer_name?.toLowerCase().includes(q)  ||
        r.email?.toLowerCase().includes(q)           ||
        r.phone?.includes(q)                         ||
        r.rcrc_number?.toLowerCase().includes(q)    ||
        r.rcrc_name?.toLowerCase().includes(q)      ||
        r.scrap_category?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q)           ||
        r.address1?.toLowerCase().includes(q)
      )
    })

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const tabs = [
    { key: 'all',       label: 'All',       count: counts.all       },
    { key: 'new',       label: 'New',       count: counts.new       },
    { key: 'pending',   label: 'Pending',   count: counts.pending   },
    { key: 'approved',  label: 'Approved',  count: counts.approved  },
    { key: 'rejected',  label: 'Rejected',  count: counts.rejected  },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Scrap Pickup Requests Management
            </p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                       rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm
                       font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Update Message ── */}
        {updateMessage && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium
            ${updateMessage.startsWith('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {updateMessage}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error loading requests</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg
                         text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`p-4 rounded-xl border-2 text-left transition-all
                ${activeTab === tab.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
              <p className="text-xs text-gray-500 mt-1">{tab.label}</p>
            </button>
          ))}
        </div>

        {/* ── Search + Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Tabs Row */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Row */}
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search by name, email, phone, city, RCRC, scrap category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500
                              border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 mt-3">Loading requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">No requests found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'No requests in this category'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RCRC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scrap Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pallets / Pieces</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(req => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-4 font-mono text-gray-500">
                        #{req.id}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {req.customer_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500">{req.email}</p>
                        <p className="text-xs text-gray-400">{req.phone || '—'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">
                          {[req.city, req.state].filter(Boolean).join(', ') || '—'}
                        </p>
                      </td>

                      {/* RCRC */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {req.rcrc_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          #{req.rcrc_number || '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.rcrc_contact_person || '—'}
                        </p>
                      </td>

                      {/* Scrap Category */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {req.scrap_category || '—'}
                        </p>
                        <p className="text-xs text-gray-500 max-w-[140px] truncate">
                          {req.description || '—'}
                        </p>
                      </td>

                      {/* Pickup Date */}
                      <td className="px-4 py-4">
                        <p className="text-gray-900">
                          {formatDate(req.preferred_date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.time_window || '—'}
                        </p>
                      </td>

                      {/* Pallets / Pieces */}
                      <td className="px-4 py-4">
                        <p className="text-gray-900">
                          {req.pallet_quantity ?? 0} pallets
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.total_pieces_quantity ?? 0} pieces
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-800'}`}>
                          {req.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-3 py-1 bg-blue-600 text-white rounded
                                       text-xs hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          <select
                            value={req.status}
                            disabled={updatingId === req.id}
                            onChange={e => updateStatus(req.id, e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded
                                       text-xs focus:outline-none focus:ring-1
                                       focus:ring-blue-500 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          {updatingId === req.id && (
                            <span className="text-xs text-blue-500">Saving...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Showing {filtered.length} of {counts.all} total requests
            </div>
          )}
        </div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────────────────── */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start
                     justify-center p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedRequest(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl
                          my-8 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Request #{selectedRequest.id}
                </h2>
                <p className="text-sm text-gray-500">
                  Submitted {formatDateTime(selectedRequest.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${STATUS_STYLES[selectedRequest.status] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedRequest.status}
                </span>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

              {/* Customer Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase
                               tracking-wide mb-3 pb-1 border-b border-gray-100">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Name</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.customer_name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.email || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.phone || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {fullAddress(selectedRequest)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Pickup Details */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase
                               tracking-wide mb-3 pb-1 border-b border-gray-100">
                  Pickup Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Preferred Date</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {formatDate(selectedRequest.preferred_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Time Window</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.time_window || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Scrap Category</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.scrap_category || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Description</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.description || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Pallet Quantity</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.pallet_quantity ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Pieces</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.total_pieces_quantity ?? 0}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Special Instructions
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.special_instructions || '—'}
                    </p>
                  </div>
                </div>
              </section>

              {/* RCRC Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase
                               tracking-wide mb-3 pb-1 border-b border-gray-100">
                  RCRC Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">RCRC Name</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.rcrc_name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">RCRC Number</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.rcrc_number || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Contact Person</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.rcrc_contact_person || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">RCRC Email</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.rcrc_email || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">RCRC Phone</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {selectedRequest.rcrc_phone_number || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">RCRC Address</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {[
                        selectedRequest.rcrc_address,
                        selectedRequest.rcrc_address2,
                        selectedRequest.rcrc_zip_code,
                      ].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Attachments */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase
                                 tracking-wide mb-3 pb-1 border-b border-gray-100">
                    Attachments ({selectedRequest.attachments.length})
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedRequest.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50
                                   border border-blue-200 rounded-lg text-blue-700
                                   text-sm hover:bg-blue-100 transition-colors"
                      >
                        📎 {att.name || `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase
                                 tracking-wide mb-3 pb-1 border-b border-gray-100">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 bg-yellow-50 border
                                border-yellow-200 rounded-lg p-3">
                    {selectedRequest.notes}
                  </p>
                </section>
              )}

              {/* Update Status */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase
                               tracking-wide mb-3 pb-1 border-b border-gray-100">
                  Update Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedRequest.id, s)}
                      disabled={
                        updatingId === selectedRequest.id ||
                        selectedRequest.status === s
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium
                        transition-colors disabled:opacity-50
                        ${selectedRequest.status === s
                          ? 'bg-gray-800 text-white cursor-default'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {updatingId === selectedRequest.id
                        ? 'Saving...'
                        : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50
                            flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 bg-gray-800 text-white rounded-lg
                           text-sm hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
