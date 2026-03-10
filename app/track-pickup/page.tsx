'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import { createClient }                      from '@supabase/supabase-js'
import Image                                 from 'next/image'
import * as XLSX                             from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ───────────────────────────────────────────────
interface Attachment {
  url:  string
  name: string
}

interface PickupRequest {
  id:            number
  customer_name: string
  email:         string
  phone:         string
  address:       string
  scrap_type:    string
  quantity:      string
  status:        'NEW' | 'new' | 'pending' | 'approved' | 'rejected' | 'completed'
  created_at:    string
  notes?:        string
  rcrc_number?:           string
  rcrc_name?:             string
  rcrc_contact_person?:   string
  rcrc_email?:            string
  rcrc_phone_number?:     string
  rcrc_address?:          string
  rcrc_address2?:         string
  rcrc_zip_code?:         string
  preferred_date?:        string
  time_window?:           string
  pallet_quantity?:       number
  total_pieces_quantity?: number
  special_instructions?:  string
  state?:                 string
  attachments?:           Attachment[]
  category?:              string
}

// ── Upload Result Type ──────────────────────────────────
interface UploadResult {
  success:    number
  duplicates: number
  skipped:    number
  failed:     number
  details: {
    successful: { email: string; name: string }[]
    duplicate:  { email: string; name: string }[]
    skipped:    { row: number; reason: string; data: string }[]
    failed:     { email: string; error: string }[]
  }
}

// ── Main Component ──────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()

  // ── Existing States ───────────────────────────────────
  const [isAuthenticated,    setIsAuthenticated]    = useState(false)
  const [requests,           setRequests]           = useState<PickupRequest[]>([])
  const [loading,            setLoading]            = useState(true)
  const [filter,             setFilter]             = useState<
    'all' | 'NEW' | 'new' | 'pending' | 'approved' | 'rejected' | 'completed'
  >('all')
  const [searchQuery,        setSearchQuery]        = useState('')
  const [dateFilter,         setDateFilter]         = useState<
    'all' | 'today' | 'week' | 'month'
  >('all')
  const [selectedRequest,    setSelectedRequest]    = useState<PickupRequest | null>(null)
  const [showModal,          setShowModal]          = useState(false)
  const [showExportModal,    setShowExportModal]    = useState(false)
  const [actionLoading,      setActionLoading]      = useState<number | null>(null)
  const [sortOrder,          setSortOrder]          = useState<'newest' | 'oldest'>('newest')
  const [toast,              setToast]              = useState<{
    message: string
    type:    'success' | 'error'
  } | null>(null)
  const [fordLogoError,      setFordLogoError]      = useState(false)
  const [exportStatusFilter, setExportStatusFilter] = useState<
    'all' | 'NEW' | 'pending' | 'approved' | 'rejected' | 'completed'
  >('all')
  const [exportDateFilter,   setExportDateFilter]   = useState<
    'all' | 'today' | 'week' | 'month'
  >('all')
  const [exportPreview,      setExportPreview]      = useState<PickupRequest[]>([])

  // ── NEW Upload States ─────────────────────────────────
  const [showUploadModal,  setShowUploadModal]  = useState(false)
  const [uploadFile,       setUploadFile]       = useState<File | null>(null)
  const [uploadLoading,    setUploadLoading]    = useState(false)
  const [uploadResult,     setUploadResult]     = useState<UploadResult | null>(null)
  const [uploadStep,       setUploadStep]       = useState<
    'upload' | 'preview' | 'result'
  >('upload')
  const [previewData,      setPreviewData]      = useState<any[]>([])
  // ── Toast ─────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Auth Check ────────────────────────────────────────
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn')
    if (isLoggedIn !== 'true') {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  // ── Fetch Requests ────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pickup_request')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      showToast('Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Realtime Subscription ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    fetchRequests()
    const channel = supabase
      .channel('pickup_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pickup_request' },
        () => { fetchRequests() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, fetchRequests])

  // ── Export Preview Filter ─────────────────────────────
  useEffect(() => {
    const now      = new Date()
    const filtered = requests.filter(req => {
      if (exportStatusFilter !== 'all') {
        if (exportStatusFilter === 'NEW') {
          if (!isNewStatus(req.status)) return false
        } else {
          if (req.status !== exportStatusFilter) return false
        }
      }
      const created = new Date(req.created_at)
      if (exportDateFilter === 'today')
        return created.toDateString() === now.toDateString()
      if (exportDateFilter === 'week') {
        const weekAgo = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        )
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

  // ── Status Change ─────────────────────────────────────
  const handleStatusChange = async (
    id:        number,
    newStatus: 'approved' | 'rejected' | 'completed' | 'pending'
  ) => {
    try {
      setActionLoading(id)
      const { error } = await supabase
        .from('pickup_request')
        .update({
          status:     newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      setRequests(prev =>
        prev.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        )
      )
      showToast(`Request ${newStatus} successfully!`, 'success')
      if (showModal) setShowModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Export CSV ────────────────────────────────────────
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
      'ID', 'Customer Name', 'Email', 'Phone',
      'Address', 'Scrap Type', 'Quantity',
      'Category', 'Status', 'Submitted Date',
    ]
    let csvContent = ''
    csvContent += `"FORD COMPONENT SALES - SCRAP PICKUP REQUESTS EXPORT"\n`
    csvContent += `"Exported On:","${new Date().toLocaleString()}"\n`
    csvContent += `"Total Records:","${exportPreview.length}"\n`
    csvContent += `"Status Filter:","${
      exportStatusFilter === 'all' ? 'All Statuses' : exportStatusFilter
    }"\n`
    csvContent += `"Date Filter:","${
      exportDateFilter === 'all' ? 'All Dates' : exportDateFilter
    }"\n\n`
    csvContent += '"STATUS SUMMARY"\n"Status","Count"\n'
    Object.entries(grouped).forEach(([status, items]) => {
      csvContent += `"${status}","${items.length}"\n`
    })
    csvContent += '\n"ALL REQUESTS DATA"\n'
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
    const sortedData = [...exportPreview].sort((a, b) => {
      if (a.status < b.status) return -1
      if (a.status > b.status) return  1
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )
    })
    sortedData.forEach(r => {
      const row = [
        r.id,
        r.customer_name || '',
        r.email         || '',
        r.phone         || '',
        r.address       || '',
        r.scrap_type    || '',
        r.quantity      || '',
        r.category      || '',
        r.status.toUpperCase(),
        new Date(r.created_at).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
      ]
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
    })
    csvContent += '\n"SECTION-WISE BREAKDOWN"\n'
    Object.entries(grouped).forEach(([status, items]) => {
      csvContent += `\n"--- ${status} REQUESTS (${items.length}) ---"\n`
      csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
      items.forEach(r => {
        const row = [
          r.id,
          r.customer_name || '',
          r.email         || '',
          r.phone         || '',
          r.address       || '',
          r.scrap_type    || '',
          r.quantity      || '',
          r.category      || '',
          r.status.toUpperCase(),
          new Date(r.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          }),
        ]
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })
    })
    const blob        = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url         = URL.createObjectURL(blob)
    const a           = document.createElement('a')
    a.href            = url
    const statusLabel = exportStatusFilter === 'all'
      ? 'all-statuses'
      : exportStatusFilter.toLowerCase()
    const dateLabel   = exportDateFilter === 'all'
      ? 'all-dates'
      : exportDateFilter
    a.download = `ford-pickup-request-${statusLabel}-${dateLabel}-${
      new Date().toISOString().split('T')[0]
    }.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
    showToast(
      `Exported ${exportPreview.length} records successfully!`,
      'success'
    )
  }

  // ── Date Filter Helper ────────────────────────────────
  const applyDateFilter = (req: PickupRequest) => {
    if (dateFilter === 'all') return true
    const created = new Date(req.created_at)
    const now     = new Date()
    if (dateFilter === 'today')
      return created.toDateString() === now.toDateString()
    if (dateFilter === 'week') {
      const weekAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      )
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

  const isNewStatus = (status: string) =>
    status === 'NEW' || status === 'new'

  // ── Filtered + Sorted Requests ────────────────────────
  const filteredRequests = requests
    .filter(req => {
      if (filter === 'all') return true
      if (filter === 'NEW') return isNewStatus(req.status)
      return req.status === filter
    })
    .filter(req => applyDateFilter(req))
    .filter(req => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        req.customer_name?.toLowerCase().includes(q) ||
        req.email?.toLowerCase().includes(q)         ||
        req.phone?.includes(q)                       ||
        req.scrap_type?.toLowerCase().includes(q)    ||
        req.address?.toLowerCase().includes(q)       ||
        req.rcrc_number?.toLowerCase().includes(q)   ||
        req.rcrc_name?.toLowerCase().includes(q)     ||
        req.category?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  // ── Logout ────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn')
    localStorage.removeItem('adminEmail')
    router.push('/')
  }

  // ── Status Badge ──────────────────────────────────────
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

  // ── Stats ─────────────────────────────────────────────
  const stats = {
    total:     requests.length,
    new:       requests.filter(r => isNewStatus(r.status)).length,
    pending:   requests.filter(r => r.status === 'pending').length,
    approved:  requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
  }

  // ── Render Attachments ────────────────────────────────
  const renderAttachments = (attachments?: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null
    return (
      <div className="mt-4">
        <p className="text-xs text-gray-500 uppercase
        font-medium mb-2">
          Attachments ({attachments.length})
        </p>
        <div className="space-y-2">
          {attachments.map((file, idx) => {
            const isImage =
              file.name?.match(/\.(jpg|jpeg|png)$/i) ||
              file.url?.includes('image')
            return (
              <div
                key={idx}
                className="flex items-center justify-between
                bg-gray-50 border border-gray-200
                rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span>{isImage ? '🖼️' : '📊'}</span>
                  <span className="text-sm text-gray-700
                  truncate max-w-[200px]">
                    {file.name || `File ${idx + 1}`}
                  </span>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600
                  hover:text-blue-800 hover:underline
                  font-medium flex-shrink-0 ml-2"
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

  // ══════════════════════════════════════════════════════
  // NEW — Upload Functions
  // ══════════════════════════════════════════════════════

  // ── Download CSV Template ─────────────────────────
const downloadTemplate = () => {
  const headers = [
    'First Name',
    'Last Name',
    'RCRC Email',
    'RCRC Number',
    'RCRC Name',
    'RCRC Address',
    'Phone Number',
    'RCRC Contact Person',
    'State',
    'Zip Code',
    'Role',
  ]

  const sampleRow = [
    'John',
    'Doe',
    'john.doe@example.com',
    'RCRC001',
    'Ford RCRC Center',
    '123 Main St',
    '9876543210',
    'Jane Smith',
    'Michigan',
    '48126',
    'requestor',
  ]

  const csvContent =
    headers.join(',') + '\n' +
    sampleRow.join(',') + '\n'

  const blob     = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = 'ford-users-upload-template.csv'
  a.click()
  URL.revokeObjectURL(url)
  showToast('Template downloaded!', 'success')
}


  // ── Handle CSV File Select & Preview ─────────────
const handleFileSelect = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate CSV
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a valid CSV file (.csv)', 'error')
    return
  }

  setUploadFile(file)

  // Read CSV content
  const text = await file.text()
  const rows = parseCSV(text)

  // Preview first 5 data rows
  setPreviewData(rows.slice(0, 5))
  setUploadStep('preview')
}

// ── CSV Parser Helper ─────────────────────────────
const parseCSV = (text: string): any[] => {
  const lines   = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    const values = line
      .split(',')
      .map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    return row
  })
}


  // ── Handle Upload ─────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) return
    try {
      setUploadLoading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      const response = await fetch('/api/admin/upload-users', {
        method: 'POST',
        body:   formData,
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Upload failed', 'error')
        return
      }
      setUploadResult(data.result)
      setUploadStep('result')
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setUploadLoading(false)
    }
  }

  // ── Reset Upload Modal ────────────────────────────────
  const resetUploadModal = () => {
    setShowUploadModal(false)
    setUploadFile(null)
    setUploadResult(null)
    setUploadStep('upload')
    setPreviewData([])
  }

  // ── Loading States ────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex
      items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12
          border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex
      items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12
          border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3
        rounded-lg shadow-lg text-white font-medium
        transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          EXPORT MODAL
      ════════════════════════════════════════════════ */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50
        z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl
          max-w-md w-full p-6">

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Export to CSV
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose filters before downloading
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600
                text-2xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold
                text-gray-700 mb-2">
                  Filter by Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all',       label: 'All',      count: stats.total     },
                    { value: 'NEW',       label: 'New',      count: stats.new       },
                    { value: 'pending',   label: 'Pending',  count: stats.pending   },
                    { value: 'approved',  label: 'Approved', count: stats.approved  },
                    { value: 'rejected',  label: 'Rejected', count: stats.rejected  },
                    { value: 'completed', label: 'Done',     count: stats.completed },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setExportStatusFilter(
                          option.value as typeof exportStatusFilter
                        )
                      }
                      className={`p-2 rounded-lg border-2
                      text-xs font-medium transition text-center ${
                        exportStatusFilter === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>{option.label}</div>
                      <div className="text-lg font-bold mt-1">
                        {option.count}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-semibold
                text-gray-700 mb-2">
                  Filter by Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'all',   label: 'All Time'   },
                    { value: 'today', label: 'Today'      },
                    { value: 'week',  label: 'This Week'  },
                    { value: 'month', label: 'This Month' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setExportDateFilter(
                          option.value as typeof exportDateFilter
                        )
                      }
                      className={`p-2 rounded-lg border-2
                      text-xs font-medium transition text-center ${
                        exportDateFilter === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Preview */}
              <div className={`rounded-xl p-4 border-2 ${
                exportPreview.length > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50   border-red-200'
              }`}>
                <p className="text-sm font-semibold
                text-gray-700 mb-2">
                  Export Preview
                </p>
                {exportPreview.length > 0 ? (
                  <div>
                    <p className="text-green-700 font-bold text-lg">
                      {exportPreview.length} records will be exported
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(
                        exportPreview.reduce(
                          (acc, req) => {
                            const s = req.status.toUpperCase()
                            acc[s]  = (acc[s] || 0) + 1
                            return acc
                          },
                          {} as Record<string, number>
                        )
                      ).map(([status, count]) => (
                        <span
                          key={status}
                          className={`px-2 py-1 text-xs
                          rounded-full font-medium
                          ${getStatusBadge(status)}`}
                        >
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 font-medium">
                    No records match selected filters
                  </p>
                )}
              </div>

            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100
                text-gray-700 rounded-xl hover:bg-gray-200
                transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={exportToCSV}
                disabled={exportPreview.length === 0}
                className={`flex-1 px-4 py-3 rounded-xl
                font-medium transition ${
                  exportPreview.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Download ({exportPreview.length})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VIEW DETAILS MODAL
      ════════════════════════════════════════════════ */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50
        z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl
          max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Request Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600
                text-2xl"
              >
                ✕
              </button>
            </div>

            {selectedRequest.category && (
              <div className="flex flex-wrap gap-2 mb-4 p-3
              bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col items-start">
                  <p className="text-xs text-gray-400 mb-1">
                    Category
                  </p>
                  <span className="inline-flex items-center
                  px-3 py-1 rounded-full text-xs font-semibold
                  bg-purple-100 text-purple-800">
                    {selectedRequest.category}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Customer</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedRequest.customer_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Status</p>
                <span className={`px-2 py-1 text-xs font-semibold
                rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Email</p>
                <p className="text-sm text-gray-900">
                  {selectedRequest.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Phone</p>
                <p className="text-sm text-gray-900">
                  {selectedRequest.phone}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500
                uppercase font-medium">Address</p>
                <p className="text-sm text-gray-900">
                  {selectedRequest.address}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Scrap Type</p>
                <p className="text-sm text-gray-900">
                  {selectedRequest.scrap_type}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500
                uppercase font-medium">Quantity</p>
                <p className="text-sm text-gray-900">
                  {selectedRequest.quantity}
                </p>
              </div>

              {selectedRequest.rcrc_number && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">RCRC Number</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_number}
                  </p>
                </div>
              )}

              {selectedRequest.rcrc_name && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">RCRC Name</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_name}
                  </p>
                </div>
              )}

              {selectedRequest.rcrc_contact_person && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Contact Person</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_contact_person}
                  </p>
                </div>
              )}

              {selectedRequest.rcrc_email && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">RCRC Email</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_email}
                  </p>
                </div>
              )}

              {selectedRequest.rcrc_phone_number && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">RCRC Phone</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_phone_number}
                  </p>
                </div>
              )}

              {selectedRequest.rcrc_address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500
                  uppercase font-medium">RCRC Address</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.rcrc_address}
                    {selectedRequest.rcrc_address2 &&
                      `, ${selectedRequest.rcrc_address2}`}
                    {selectedRequest.state &&
                      `, ${selectedRequest.state}`}
                    {selectedRequest.rcrc_zip_code &&
                      ` ${selectedRequest.rcrc_zip_code}`}
                  </p>
                </div>
              )}

              {selectedRequest.preferred_date && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Preferred Date</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.preferred_date}
                  </p>
                </div>
              )}

              {selectedRequest.time_window && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Pickup Hours</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.time_window}
                  </p>
                </div>
              )}

              {selectedRequest.pallet_quantity !== undefined && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Pallet Quantity</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.pallet_quantity}
                  </p>
                </div>
              )}

              {selectedRequest.total_pieces_quantity !== undefined && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Total Pieces</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.total_pieces_quantity}
                  </p>
                </div>
              )}

              {selectedRequest.category && (
                <div>
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Category</p>
                  <span className="inline-flex items-center
                  px-2 py-1 rounded-full text-xs font-medium mt-1
                  bg-purple-100 text-purple-800">
                    {selectedRequest.category}
                  </span>
                </div>
              )}

              {selectedRequest.special_instructions && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500
                  uppercase font-medium">Notes</p>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.special_instructions}
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-xs text-gray-500
                uppercase font-medium">Submitted On</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRequest.created_at)
                    .toLocaleString()}
                </p>
              </div>

            </div>

            {renderAttachments(selectedRequest.attachments)}

            <div className="mt-6 flex gap-3 flex-wrap">
              {(isNewStatus(selectedRequest.status) ||
                selectedRequest.status === 'pending') && (
                <>
                  <button
                    onClick={() =>
                      handleStatusChange(selectedRequest.id, 'approved')
                    }
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-blue-600
                    text-white rounded-lg hover:bg-blue-700
                    transition font-medium"
                  >
                    {actionLoading === selectedRequest.id
                      ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(selectedRequest.id, 'rejected')
                    }
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-red-600
                    text-white rounded-lg hover:bg-red-700
                    transition font-medium"
                  >
                    {actionLoading === selectedRequest.id
                      ? '...' : '✕ Reject'}
                  </button>
                </>
              )}
              {selectedRequest.status === 'approved' && (
                <button
                  onClick={() =>
                    handleStatusChange(selectedRequest.id, 'completed')
                  }
                  disabled={actionLoading === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-green-600
                  text-white rounded-lg hover:bg-green-700
                  transition font-medium"
                >
                  {actionLoading === selectedRequest.id
                    ? '...' : '✅ Mark Complete'}
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100
                text-gray-700 rounded-lg hover:bg-gray-200
                transition font-medium"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          UPLOAD USERS MODAL
      ════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50
        z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl
          max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  📤 Upload Users
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload Excel file to create requestor accounts
                </p>
              </div>
              <button
                onClick={resetUploadModal}
                className="text-gray-400 hover:text-gray-600
                text-2xl font-light"
              >
                ✕
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              {['Upload', 'Preview', 'Result'].map((step, idx) => {
                const stepKey = ['upload', 'preview', 'result'][idx]
                const isActive = uploadStep === stepKey
                const isDone =
                  ['upload', 'preview', 'result'].indexOf(uploadStep) > idx
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex
                    items-center justify-center text-xs font-bold
                    transition-all ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                    {idx < 2 && (
                      <div className={`h-px w-8 ${
                        isDone ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── STEP 1: UPLOAD ── */}
            {uploadStep === 'upload' && (
              <div className="space-y-4">

                {/* Download Template */}
                <div className="bg-blue-50 border border-blue-200
                rounded-xl p-4 flex items-center
                justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      📋 Need the template?
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Download the Excel template with correct
                      column headers
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2
                    rounded-lg text-sm font-medium
                    hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    ⬇️ Download Template
                  </button>
                </div>

                {/* File Upload Area */}
<div
  className="border-2 border-dashed border-gray-300
  rounded-xl p-8 text-center hover:border-blue-400
  transition cursor-pointer"
  onClick={() =>
    document.getElementById('excel-upload')?.click()
  }
>
  <div className="text-5xl mb-3">📄</div>
  <p className="text-sm font-semibold text-gray-700">
    Click to upload CSV file
  </p>
  <p className="text-xs text-gray-500 mt-1">
    Supports .csv files only
  </p>
  <input
    id="excel-upload"
    type="file"
    accept=".csv"
    className="hidden"
    onChange={handleFileSelect}
  />
</div>

                {/* Required Columns Info */}
                <div className="bg-gray-50 border border-gray-200
                rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700
                  mb-2 uppercase">
                    Required Columns in Excel:
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      'First Name',
                      'Last Name',
                      'RCRC Email',
                      'RCRC Number',
                      'RCRC Name',
                      'RCRC Address',
                      'Phone Number',
                      'RCRC Contact Person',
                      'State',
                      'Zip Code',
                      'Role',
                    ].map((col, idx) => (
                      <div key={col} className="flex items-center
                      gap-1 text-xs text-gray-600">
                        <span className="text-blue-500 font-bold">
                          {idx + 1}.
                        </span>
                        {col}
                        {['First Name', 'Last Name',
                          'RCRC Email', 'RCRC Number'].includes(col) && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-500 mt-2">
                    * Required fields
                  </p>
                </div>

              </div>
            )}

            {/* ── STEP 2: PREVIEW ── */}
            {uploadStep === 'preview' && (
              <div className="space-y-4">

                <div className="bg-green-50 border border-green-200
                rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      File loaded: {uploadFile?.name}
                    </p>
                    <p className="text-xs text-green-700">
                      Showing first 5 rows preview
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto rounded-xl border
                border-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-[#003478]">
                      <tr>
                        {[
                          'First Name',
                          'Last Name',
                          'RCRC Email',
                          'RCRC Number',
                          'Role',
                        ].map(h => (
                          <th key={h} className="px-3 py-2 text-left
                          text-white font-medium whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map((row: any, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">
                            {row['First Name'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['Last Name'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['RCRC Email'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['RCRC Number'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['Role'] || 'requestor'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Each user will receive an email invite from
                  Supabase to set their own password
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUploadStep('upload')
                      setUploadFile(null)
                      setPreviewData([])
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100
                    text-gray-700 rounded-xl hover:bg-gray-200
                    transition font-medium text-sm"
                  >
                    ← Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadLoading}
                    className="flex-1 px-4 py-3 bg-[#003478]
                    text-white rounded-xl hover:bg-blue-800
                    transition font-medium text-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadLoading ? (
                      <span className="flex items-center
                      justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      '📤 Upload & Create Users'
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* ── STEP 3: RESULT ── */}
            {uploadStep === 'result' && uploadResult && (
              <div className="space-y-4">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 border border-green-200
                  rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {uploadResult.success}
                    </p>
                    <p className="text-xs text-green-700
                    font-medium mt-1">✅ Created</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200
                  rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {uploadResult.duplicates}
                    </p>
                    <p className="text-xs text-yellow-700
                    font-medium mt-1">⚠️ Duplicate</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200
                  rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {uploadResult.skipped}
                    </p>
                    <p className="text-xs text-orange-700
                    font-medium mt-1">⏭️ Skipped</p>
                  </div>
                  <div className="bg-red-50 border border-red-200
                  rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {uploadResult.failed}
                    </p>
                    <p className="text-xs text-red-700
                    font-medium mt-1">❌ Failed</p>
                  </div>
                </div>

                {/* Successful */}
                {uploadResult.details.successful.length > 0 && (
                  <div className="bg-green-50 border border-green-200
                  rounded-xl p-4">
                    <p className="text-sm font-semibold
                    text-green-800 mb-2">
                      ✅ Successfully Created (
                      {uploadResult.details.successful.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.details.successful.map((u, idx) => (
                        <div key={idx} className="flex items-center
                        gap-2 text-xs text-green-700">
                          <span>•</span>
                          <span className="font-medium">{u.name}</span>
                          <span className="text-green-500">
                            ({u.email})
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-600 mt-2 italic">
                      📧 Invite emails sent — users can set
                      their own password
                    </p>
                  </div>
                )}

                {/* Duplicates */}
                {uploadResult.details.duplicate.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200
                  rounded-xl p-4">
                    <p className="text-sm font-semibold
                    text-yellow-800 mb-2">
                      ⚠️ Duplicate Emails Skipped (
                      {uploadResult.details.duplicate.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.details.duplicate.map((u, idx) => (
                        <div key={idx} className="flex items-center
                        gap-2 text-xs text-yellow-700">
                          <span>•</span>
                          <span className="font-medium">{u.name}</span>
                          <span>— {u.email} already exists</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped */}
                {uploadResult.details.skipped.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200
                  rounded-xl p-4">
                    <p className="text-sm font-semibold
                    text-orange-800 mb-2">
                      ⏭️ Skipped Rows (
                      {uploadResult.details.skipped.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.details.skipped.map((s, idx) => (
                        <div key={idx} className="text-xs
                        text-orange-700">
                          • Row {s.row}: {s.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed */}
                {uploadResult.details.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200
                  rounded-xl p-4">
                    <p className="text-sm font-semibold
                    text-red-800 mb-2">
                      ❌ Failed ({uploadResult.details.failed.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.details.failed.map((f, idx) => (
                        <div key={idx} className="text-xs text-red-700">
                          • {f.email}: {f.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetUploadModal}
                  className="w-full px-4 py-3 bg-[#003478]
                  text-white rounded-xl hover:bg-blue-800
                  transition font-medium text-sm"
                >
                  ✅ Done — Close
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════ */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="bg-[#003478] px-4 sm:px-6 lg:px-8 py-1">
          <p className="text-white text-xs text-center
          tracking-widest font-medium uppercase">
            Ford Motor Company – Component Sales Division
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6
        lg:px-8 py-4">
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
                <div className="w-20 h-10 bg-[#003478]
                rounded-full flex items-center justify-center
                border-4 border-[#003478] shadow-md">
                  <span className="text-white font-bold
                  text-lg italic">Ford</span>
                </div>
              )}
              <div className="w-px h-10 bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900
                leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">
                  Scrap Pickup Management
                </p>
              </div>
            </div>

            {/* ── Header Buttons ── */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRequests}
                className="px-3 py-2 bg-gray-100 text-gray-700
                rounded-lg hover:bg-gray-200 transition
                text-sm font-medium"
              >
                🔄 Refresh
              </button>

              {/* ✅ NEW — Upload Users Button */}
              <button
                onClick={() => {
                  setUploadStep('upload')
                  setUploadResult(null)
                  setUploadFile(null)
                  setPreviewData([])
                  setShowUploadModal(true)
                }}
                className="px-3 py-2 bg-[#003478] text-white
                rounded-lg hover:bg-blue-800 transition
                text-sm font-medium"
              >
                👥 Upload Users
              </button>

              <button
                onClick={() => {
                  setExportStatusFilter('all')
                  setExportDateFilter('all')
                  setShowExportModal(true)
                }}
                className="px-3 py-2 bg-green-600 text-white
                rounded-lg hover:bg-green-700 transition
                text-sm font-medium"
              >
                📊 Export CSV
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white
                rounded-lg hover:bg-red-700 transition
                text-sm font-medium"
              >
                🚪 Logout
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6
      lg:px-8 py-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-6
        gap-4 mb-8">
          {[
            { label: 'Total',     value: stats.total,     color: 'text-gray-900',   bg: 'bg-gray-100',   icon: '📋' },
            { label: 'New',       value: stats.new,       color: 'text-purple-600', bg: 'bg-purple-100', icon: '🆕' },
            { label: 'Pending',   value: stats.pending,   color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏳' },
            { label: 'Approved',  value: stats.approved,  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: '✓'  },
            { label: 'Completed', value: stats.completed, color: 'text-green-600',  bg: 'bg-green-100',  icon: '✅' },
            { label: 'Rejected',  value: stats.rejected,  color: 'text-red-600',    bg: 'bg-red-100',    icon: '❌' },
          ].map(stat => (
            <div key={stat.label}
                 className="bg-white rounded-xl shadow-sm p-4">
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

        {/* ── Search + Date + Sort ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">

            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2
              -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name, email, RCRC, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border
                border-gray-300 rounded-lg text-sm
                focus:ring-2 focus:ring-blue-500
                focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2
                  -translate-y-1/2 text-gray-400
                  hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={dateFilter}
              onChange={e =>
                setDateFilter(e.target.value as typeof dateFilter)
              }
              className="px-3 py-2 border border-gray-300
              rounded-lg text-sm focus:ring-2
              focus:ring-blue-500 outline-none min-w-[140px]"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">📅 Today</option>
              <option value="week">📅 This Week</option>
              <option value="month">📅 This Month</option>
            </select>

            <select
              value={sortOrder}
              onChange={e =>
                setSortOrder(e.target.value as 'newest' | 'oldest')
              }
              className="px-3 py-2 border border-gray-300
              rounded-lg text-sm focus:ring-2
              focus:ring-blue-500 outline-none min-w-[150px]"
            >
              <option value="newest">🔽 Newest First</option>
              <option value="oldest">🔼 Oldest First</option>
            </select>

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Showing{' '}
            <span className="font-bold text-gray-700">
              {filteredRequests.length}
            </span>{' '}
            of {requests.length} requests
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="bg-white rounded-xl shadow-sm mb-6
        overflow-x-auto">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 px-4 min-w-max">
              {[
                { key: 'all',       label: 'All',       count: stats.total     },
                { key: 'NEW',       label: 'New',       count: stats.new       },
                { key: 'pending',   label: 'Pending',   count: stats.pending   },
                { key: 'approved',  label: 'Approved',  count: stats.approved  },
                { key: 'rejected',  label: 'Rejected',  count: stats.rejected  },
                { key: 'completed', label: 'Completed', count: stats.completed },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setFilter(tab.key as typeof filter)
                  }
                  className={`py-4 px-3 border-b-2 font-medium
                  text-sm whitespace-nowrap transition ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 py-0.5 px-2 rounded-full
                  text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Requests Table ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-[#003478]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Scrap Details</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Files</th>
                  <th className="px-4 py-3 text-left text-xs
                  font-medium text-white uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    className="hover:bg-blue-50 transition"
                  >

                    <td className="px-4 py-4 text-sm text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-[#003478]
                        rounded-full flex items-center
                        justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {request.customer_name
                              ?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold
                          text-gray-900">
                            {request.customer_name}
                          </p>
                          <p className="text-xs text-gray-500
                          max-w-[150px] truncate">
                            {request.rcrc_name || request.address}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">
                        {request.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.phone}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {request.scrap_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.quantity}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {request.category ? (
                        <span className="inline-flex items-center
                        px-2 py-1 rounded-full text-xs font-medium
                        bg-purple-100 text-purple-800 whitespace-nowrap">
                          {request.category}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm
                    text-gray-500 whitespace-nowrap">
                      {new Date(request.created_at)
                        .toLocaleDateString('en-IN', {
                          day:   '2-digit',
                          month: 'short',
                          year:  'numeric',
                        })}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 inline-flex
                      text-xs font-semibold rounded-full
                      ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {request.attachments &&
                      request.attachments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {request.attachments.map((file, idx) => {
                            const isImage =
                              file.name?.match(/\.(jpg|jpeg|png)$/i) ||
                              file.url?.includes('image')
                            return (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1
                                text-xs text-blue-600
                                hover:text-blue-800 hover:underline"
                              >
                                <span>
                                  {isImage ? '🖼️' : '📊'}
                                </span>
                                <span className="truncate max-w-[80px]">
                                  {file.name || `File ${idx + 1}`}
                                </span>
                              </a>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          None
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center
                      gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowModal(true)
                          }}
                          className="text-gray-600
                          hover:text-gray-900 bg-gray-100
                          hover:bg-gray-200 px-2 py-1
                          rounded text-xs transition"
                        >
                          👁️ View
                        </button>

                        {(isNewStatus(request.status) ||
                          request.status === 'pending') && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  request.id, 'approved'
                                )
                              }
                              disabled={actionLoading === request.id}
                              className="text-blue-600
                              hover:text-blue-900 bg-blue-50
                              hover:bg-blue-100 px-2 py-1
                              rounded text-xs transition
                              disabled:opacity-50"
                            >
                              {actionLoading === request.id
                                ? '...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  request.id, 'rejected'
                                )
                              }
                              disabled={actionLoading === request.id}
                              className="text-red-600
                              hover:text-red-900 bg-red-50
                              hover:bg-red-100 px-2 py-1
                              rounded text-xs transition
                              disabled:opacity-50"
                            >
                              {actionLoading === request.id
                                ? '...' : '✕ Reject'}
                            </button>
                          </>
                        )}

                        {request.status === 'approved' && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                request.id, 'completed'
                              )
                            }
                            disabled={actionLoading === request.id}
                            className="text-green-600
                            hover:text-green-900 bg-green-50
                            hover:bg-green-100 px-2 py-1
                            rounded text-xs transition
                            disabled:opacity-50"
                          >
                            {actionLoading === request.id
                              ? '...' : '✅ Complete'}
                          </button>
                        )}

                        {(request.status === 'completed' ||
                          request.status === 'rejected') && (
                          <span className="text-gray-400
                          text-xs italic">
                            No actions
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-500 font-medium">
                No requests found
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-blue-600 text-sm
                  hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Ford Motor Company –
            Component Sales Division. All rights reserved.
          </p>
        </div>

      </main>
    </div>
  )
}
