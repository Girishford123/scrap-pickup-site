'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ✅ NO direct Supabase client here — all via API routes!

interface Attachment {
  url: string
  name: string
}

interface PickupRequest {
  id: number
  customer_name: string
  email: string
  phone: string
  address: string
  address1?: string
  address2?: string
  scrap_type: string
  quantity: string
  status: 'new' | 'NEW' | 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at?: string
  notes?: string
  rcrc_number?: string
  rcrc_name?: string
  rcrc_contact_person?: string
  rcrc_email?: string
  rcrc_phone_number?: string
  rcrc_address?: string
  rcrc_address2?: string
  rcrc_zip_code?: string
  preferred_date?: string
  time_window?: string
  pallet_quantity?: number
  total_pieces_quantity?: number
  special_instructions?: string
  state?: string
  city?: string
  attachments?: Attachment[]
}

interface Counts {
  all: number
  new: number
  pending: number
  approved: number
  rejected: number
  completed: number
}

export default function AdminDashboard() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requests,        setRequests]        = useState<PickupRequest[]>([])
  const [loading,         setLoading]         = useState(true)
  const [counts,          setCounts]          = useState<Counts>({
    all: 0, new: 0, pending: 0,
    approved: 0, rejected: 0, completed: 0,
  })

  const [filter,        setFilter]       = useState<'all' | 'new' | 'NEW' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [searchQuery,   setSearchQuery]  = useState('')
  const [dateFilter,    setDateFilter]   = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortOrder,     setSortOrder]    = useState<'newest' | 'oldest'>('newest')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const [selectedRequest,  setSelectedRequest]  = useState<PickupRequest | null>(null)
  const [showModal,        setShowModal]        = useState(false)
  const [showExportModal,  setShowExportModal]  = useState(false)
  const [fordLogoError,    setFordLogoError]    = useState(false)

  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | 'new' | 'NEW' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [exportDateFilter,   setExportDateFilter]   = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [exportPreview,      setExportPreview]      = useState<PickupRequest[]>([])

  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // ── Toast helper ───────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Auth check ─────────────────────────────────────
  useEffect(() => {
    // ✅ Check BOTH storage keys for compatibility
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn')
    const userSession     = localStorage.getItem('user_session')

    let isValid = false

    if (isAdminLoggedIn === 'true') {
      isValid = true
    }

    if (userSession) {
      try {
        const parsed = JSON.parse(userSession)
        if (parsed?.role === 'admin') isValid = true
      } catch {
        // ignore parse error
      }
    }

    if (!isValid) {
      router.push('/login/admin')
      return
    }

    setIsAuthenticated(true)
  }, [router])

  // ── Fetch requests via server API ──────────────────
  // ✅ NOT direct Supabase — goes through /api/admin/requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/admin/requests', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      let result: any = {}
      try {
        result = await res.json()
      } catch {
        showToast('Server returned invalid response', 'error')
        setLoading(false)
        return
      }

      if (!res.ok || !result.success) {
        console.error('❌ Fetch failed:', result)
        showToast(result.error || 'Failed to load requests', 'error')
        setLoading(false)
        return
      }

      setRequests(result.data   || [])
      setCounts(result.counts   || {
        all: 0, new: 0, pending: 0,
        approved: 0, rejected: 0, completed: 0,
      })

    } catch (err: any) {
      console.error('❌ Network error:', err)
      showToast('Network error — check your connection', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Load data when authenticated ───────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    fetchRequests()

    // ✅ Poll every 30 seconds instead of Supabase realtime
    // (realtime WebSocket is blocked on Ford network)
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchRequests])

  // ── Export preview filter ──────────────────────────
  useEffect(() => {
    const now = new Date()
    const filtered = requests.filter(req => {
      if (exportStatusFilter !== 'all') {
        const matchesNew =
          exportStatusFilter === 'new' || exportStatusFilter === 'NEW'
        if (matchesNew) {
          if (!isNewStatus(req.status)) return false
        } else {
          if (req.status !== exportStatusFilter) return false
        }
      }
      const created = new Date(req.created_at)
      if (exportDateFilter === 'today')
        return created.toDateString() === now.toDateString()
      if (exportDateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return created >= weekAgo
      }
      if (exportDateFilter === 'month') {
        return (
          created.getMonth()    === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        )
      }
      return true
    })
    setExportPreview(filtered)
  }, [exportStatusFilter, exportDateFilter, requests])

  // ── Status update via server API ───────────────────
  // ✅ NOT direct Supabase — goes through /api/admin/requests
  const handleStatusChange = async (
    id: number,
    newStatus: 'approved' | 'rejected' | 'completed' | 'pending'
  ) => {
    try {
      setActionLoading(id)

      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })

      let result: any = {}
      try {
        result = await res.json()
      } catch {
        showToast('Server returned invalid response', 'error')
        setActionLoading(null)
        return
      }

      if (!res.ok || !result.success) {
        showToast(result.error || 'Failed to update status', 'error')
        setActionLoading(null)
        return
      }

      // ✅ Update local state immediately (no refetch needed)
      setRequests(prev =>
        prev.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        )
      )

      // Update counts
      setCounts(prev => ({ ...prev }))

      showToast(`Request ${newStatus} successfully!`, 'success')
      if (showModal) setShowModal(false)

    } catch (err: any) {
      console.error('❌ Status update error:', err)
      showToast('Failed to update status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Logout ─────────────────────────────────────────
  const handleLogout = () => {
    // ✅ Clear BOTH storage keys
    localStorage.removeItem('isAdminLoggedIn')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('user_session')
    router.push('/')
  }

  // ── Helpers ────────────────────────────────────────
  const isNewStatus = (status: string) =>
    status === 'NEW' || status === 'new'

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      new:       'bg-purple-100 text-purple-800',
      NEW:       'bg-purple-100 text-purple-800',
      pending:   'bg-yellow-100 text-yellow-800',
      approved:  'bg-blue-100   text-blue-800',
      rejected:  'bg-red-100    text-red-800',
      completed: 'bg-green-100  text-green-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const applyDateFilter = (req: PickupRequest) => {
    if (dateFilter === 'all') return true
    const created = new Date(req.created_at)
    const now     = new Date()
    if (dateFilter === 'today')
      return created.toDateString() === now.toDateString()
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return created >= weekAgo
    }
    if (dateFilter === 'month') {
      return (
        created.getMonth()    === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      )
    }
    return true
  }

  // ── Filtered + sorted list ─────────────────────────
  const filteredRequests = requests
    .filter(req => {
      if (filter === 'all') return true
      if (filter === 'new' || filter === 'NEW') return isNewStatus(req.status)
      return req.status === filter
    })
    .filter(applyDateFilter)
    .filter(req => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        req.customer_name?.toLowerCase().includes(q) ||
        req.email?.toLowerCase().includes(q)          ||
        req.phone?.includes(q)                         ||
        req.rcrc_number?.toLowerCase().includes(q)    ||
        req.rcrc_name?.toLowerCase().includes(q)      ||
        req.rcrc_contact_person?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  // ── Stats (from counts returned by API) ────────────
  const stats = {
    total:     counts.all       || requests.length,
    new:       counts.new       || requests.filter(r => isNewStatus(r.status)).length,
    pending:   counts.pending   || requests.filter(r => r.status === 'pending').length,
    approved:  counts.approved  || requests.filter(r => r.status === 'approved').length,
    completed: counts.completed || requests.filter(r => r.status === 'completed').length,
    rejected:  counts.rejected  || requests.filter(r => r.status === 'rejected').length,
  }

  // ── CSV Export ─────────────────────────────────────
  const exportToCSV = () => {
    if (exportPreview.length === 0) {
      showToast('No data to export with selected filters', 'error')
      return
    }

    const grouped = exportPreview.reduce(
      (acc, req) => {
        const status = req.status.toUpperCase()
        if (!acc[status]) acc[status] = []
        acc[status].push(req)
        return acc
      },
      {} as Record<string, PickupRequest[]>
    )

    const headers = [
      'ID', 'RCRC Number', 'RCRC Name', 'Contact Person',
      'Email', 'Phone', 'Address', 'State', 'Zip Code',
      'Preferred Date', 'Pickup Hours',
      'Pallet Qty', 'Total Pieces', 'Status', 'Submitted Date',
    ]

    let csv = ''
    csv += `"FORD COMPONENT SALES - SCRAP PICKUP REQUESTS EXPORT"\n`
    csv += `"Exported On:","${new Date().toLocaleString()}"\n`
    csv += `"Total Records:","${exportPreview.length}"\n\n`

    csv += '"STATUS SUMMARY"\n"Status","Count"\n'
    Object.entries(grouped).forEach(([status, items]) => {
      csv += `"${status}","${items.length}"\n`
    })
    csv += '\n"ALL REQUESTS"\n'
    csv += headers.map(h => `"${h}"`).join(',') + '\n'

    exportPreview.forEach(r => {
      const row = [
        r.id,
        r.rcrc_number           || '',
        r.rcrc_name             || '',
        r.rcrc_contact_person   || r.customer_name || '',
        r.rcrc_email            || r.email         || '',
        r.rcrc_phone_number     || r.phone         || '',
        r.rcrc_address          || r.address        || '',
        r.state                 || '',
        r.rcrc_zip_code         || '',
        r.preferred_date        || '',
        r.time_window           || '',
        r.pallet_quantity       ?? '',
        r.total_pieces_quantity ?? '',
        r.status.toUpperCase(),
        new Date(r.created_at).toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
      ]
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `ford-pickup-${exportStatusFilter}-${exportDateFilter}-${
      new Date().toISOString().split('T')[0]
    }.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
    showToast(`Exported ${exportPreview.length} records!`, 'success')
  }

  // ── Attachment renderer ────────────────────────────
  const renderAttachments = (attachments?: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null
    return (
      <div className="mt-4">
        <p className="text-xs text-gray-500 uppercase font-medium mb-2">
          📎 Attachments ({attachments.length})
        </p>
        <div className="space-y-2">
          {attachments.map((file, idx) => {
            const isImage = file.name?.match(/\.(jpg|jpeg|png)$/i)
            return (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span>{isImage ? '🖼️' : '📊'}</span>
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">
                    {file.name || `File ${idx + 1}`}
                  </span>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium ml-2"
                >
                  View ↗
                </a>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Loading states ─────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">
            Fetching via secure server route...
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">📊 Export to CSV</h2>
                <p className="text-sm text-gray-500 mt-1">Choose filters before downloading</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >✕</button>
            </div>

            <div className="space-y-4">

              {/* Status filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all',       label: '📋 All',      count: stats.total     },
                    { value: 'new',       label: '🆕 New',      count: stats.new       },
                    { value: 'pending',   label: '⏳ Pending',  count: stats.pending   },
                    { value: 'approved',  label: '✓ Approved',  count: stats.approved  },
                    { value: 'rejected',  label: '✕ Rejected',  count: stats.rejected  },
                    { value: 'completed', label: '✅ Done',     count: stats.completed },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExportStatusFilter(opt.value as any)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition text-center ${
                        exportStatusFilter === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>{opt.label}</div>
                      <div className="text-lg font-bold mt-1">{opt.count}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'all',   label: 'All Time'   },
                    { value: 'today', label: 'Today'      },
                    { value: 'week',  label: 'This Week'  },
                    { value: 'month', label: 'This Month' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExportDateFilter(opt.value as any)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition text-center ${
                        exportDateFilter === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className={`rounded-xl p-4 border-2 ${
                exportPreview.length > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  📋 Export Preview
                </p>
                {exportPreview.length > 0 ? (
                  <p className="text-green-700 font-bold text-lg">
                    {exportPreview.length} records will be exported
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">
                    ⚠️ No records match selected filters
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={exportToCSV}
                disabled={exportPreview.length === 0}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                  exportPreview.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📥 Download ({exportPreview.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Customer</p>
                <p className="text-sm font-semibold text-gray-900">{selectedRequest.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                <p className="text-sm text-gray-900">{selectedRequest.rcrc_email || selectedRequest.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                <p className="text-sm text-gray-900">{selectedRequest.rcrc_phone_number || selectedRequest.phone}</p>
              </div>

              {selectedRequest.rcrc_number && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">RCRC Number</p>
                  <p className="text-sm text-gray-900">{selectedRequest.rcrc_number}</p>
                </div>
              )}
              {selectedRequest.rcrc_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">RCRC Name</p>
                  <p className="text-sm text-gray-900">{selectedRequest.rcrc_name}</p>
                </div>
              )}
              {selectedRequest.rcrc_contact_person && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Contact Person</p>
                  <p className="text-sm text-gray-900">{selectedRequest.rcrc_contact_person}</p>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                <p className="text-sm text-gray-900">
                  {[
                    selectedRequest.rcrc_address || selectedRequest.address1,
                    selectedRequest.rcrc_address2,
                    selectedRequest.city,
                    selectedRequest.state,
                    selectedRequest.rcrc_zip_code,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>

              {selectedRequest.preferred_date && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Preferred Date</p>
                  <p className="text-sm text-gray-900">{selectedRequest.preferred_date}</p>
                </div>
              )}
              {selectedRequest.time_window && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Pickup Hours</p>
                  <p className="text-sm text-gray-900">{selectedRequest.time_window}</p>
                </div>
              )}
              {selectedRequest.pallet_quantity !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Pallet Quantity</p>
                  <p className="text-sm text-gray-900">{selectedRequest.pallet_quantity}</p>
                </div>
              )}
              {selectedRequest.total_pieces_quantity !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total Pieces</p>
                  <p className="text-sm text-gray-900">{selectedRequest.total_pieces_quantity}</p>
                </div>
              )}
              {selectedRequest.special_instructions && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Notes</p>
                  <p className="text-sm text-gray-900">{selectedRequest.special_instructions}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-medium">Submitted On</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {renderAttachments(selectedRequest.attachments)}

            <div className="mt-6 flex gap-3 flex-wrap">
              {(isNewStatus(selectedRequest.status) || selectedRequest.status === 'pending') && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    {actionLoading === selectedRequest.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                  >
                    {actionLoading === selectedRequest.id ? '...' : '✕ Reject'}
                  </button>
                </>
              )}
              {selectedRequest.status === 'approved' && (
                <button
                  onClick={() => handleStatusChange(selectedRequest.id, 'completed')}
                  disabled={actionLoading === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {actionLoading === selectedRequest.id ? '...' : '✅ Mark Complete'}
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="bg-[#003478] px-4 sm:px-6 lg:px-8 py-1">
          <p className="text-white text-xs text-center tracking-widest font-medium uppercase">
            Ford Motor Company – Component Sales Division
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!fordLogoError ? (
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/2560px-Ford_logo_flat.svg.png"
                  alt="Ford Logo"
                  width={80}
                  height={32}
                  className="object-contain"
                  onError={() => setFordLogoError(true)}
                  unoptimized
                />
              ) : (
                <div className="w-20 h-10 bg-[#003478] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg italic">Ford</span>
                </div>
              )}
              <div className="w-px h-10 bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Scrap Pickup Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-[#003478] px-4 py-2 rounded-lg shadow">
                <div className="flex flex-col items-center">
                  <span className="text-white text-xs font-light tracking-widest uppercase">Ford</span>
                  <span className="text-[#c9a84c] text-sm font-bold tracking-wide uppercase leading-tight">Component</span>
                  <span className="text-[#c9a84c] text-sm font-bold tracking-wide uppercase leading-tight">Sales</span>
                </div>
                <div className="w-px h-10 bg-blue-400 opacity-50 mx-1" />
                <div className="w-8 h-8 bg-[#c9a84c] rounded-full flex items-center justify-center">
                  <span className="text-[#003478] font-bold text-xs">CS</span>
                </div>
              </div>
              <button
                onClick={fetchRequests}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => {
                  setExportStatusFilter('all')
                  setExportDateFilter('all')
                  setShowExportModal(true)
                }}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                📊 Export CSV
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total',     value: stats.total,     color: 'text-gray-900',   bg: 'bg-gray-100',   icon: '📋' },
            { label: 'New',       value: stats.new,       color: 'text-purple-600', bg: 'bg-purple-100', icon: '🆕' },
            { label: 'Pending',   value: stats.pending,   color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏳' },
            { label: 'Approved',  value: stats.approved,  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: '✓'  },
            { label: 'Completed', value: stats.completed, color: 'text-green-600',  bg: 'bg-green-100',  icon: '✅' },
            { label: 'Rejected',  value: stats.rejected,  color: 'text-red-600',    bg: 'bg-red-100',    icon: '❌' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center text-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, phone, RCRC number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >✕</button>
              )}
            </div>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">📅 Today</option>
              <option value="week">📅 This Week</option>
              <option value="month">📅 This Month</option>
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
            >
              <option value="newest">🔽 Newest First</option>
              <option value="oldest">🔼 Oldest First</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Showing <span className="font-bold text-gray-700">{filteredRequests.length}</span> of {requests.length} requests
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-x-auto">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 px-4 min-w-max">
              {[
                { key: 'all',       label: 'All',       count: stats.total     },
                { key: 'new',       label: 'New',       count: stats.new       },
                { key: 'pending',   label: 'Pending',   count: stats.pending   },
                { key: 'approved',  label: 'Approved',  count: stats.approved  },
                { key: 'rejected',  label: 'Rejected',  count: stats.rejected  },
                { key: 'completed', label: 'Completed', count: stats.completed },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#003478]">
                <tr>
                  {['#', 'RCRC Info', 'Contact', 'Schedule', 'Date', 'Status', 'Files', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request, index) => (
                  <tr key={request.id} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-4 text-sm text-gray-400">{index + 1}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-[#003478] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {(request.rcrc_name || request.customer_name)?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {request.rcrc_name || request.customer_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.rcrc_number || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">{request.rcrc_contact_person || request.customer_name}</p>
                      <p className="text-xs text-gray-500">{request.rcrc_email || request.email}</p>
                      <p className="text-xs text-gray-400">{request.rcrc_phone_number || request.phone}</p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">{request.preferred_date || '—'}</p>
                      <p className="text-xs text-gray-500">{request.time_window || '—'}</p>
                      <p className="text-xs text-gray-400">
                        {request.pallet_quantity != null ? `${request.pallet_quantity} pallets` : ''}
                        {request.total_pieces_quantity != null ? ` · ${request.total_pieces_quantity} pcs` : ''}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {request.attachments && request.attachments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {request.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <span>{file.name?.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' : '📊'}</span>
                              <span className="truncate max-w-[80px]">{file.name || `File ${idx + 1}`}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => { setSelectedRequest(request); setShowModal(true) }}
                          className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition"
                        >
                          👁️ View
                        </button>
                        {(isNewStatus(request.status) || request.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              disabled={actionLoading === request.id}
                              className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition disabled:opacity-50"
                            >
                              {actionLoading === request.id ? '...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              disabled={actionLoading === request.id}
                              className="text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition disabled:opacity-50"
                            >
                              {actionLoading === request.id ? '...' : '✕ Reject'}
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'completed')}
                            disabled={actionLoading === request.id}
                            className="text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs transition disabled:opacity-50"
                          >
                            {actionLoading === request.id ? '...' : '✅ Complete'}
                          </button>
                        )}
                        {(request.status === 'completed' || request.status === 'rejected') && (
                          <span className="text-gray-400 text-xs italic">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-500 font-medium">No requests found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Ford Motor Company – Component Sales Division. All rights reserved.
          </p>
        </div>

      </main>
    </div>
  )
}
