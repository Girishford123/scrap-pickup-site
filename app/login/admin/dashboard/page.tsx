'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// ✅ Real Supabase connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PickupRequest {
  id: number
  customer_name: string
  email: string
  phone: string
  address: string
  scrap_type: string
  quantity: string
  status: 'new' | 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  notes?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ✅ Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ✅ Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn')
    if (isLoggedIn !== 'true') {
      router.push('/login/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  // ✅ Fetch REAL data from Supabase
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pickup_requests')
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

  useEffect(() => {
    if (!isAuthenticated) return
    fetchRequests()

    // ✅ Real-time updates - auto refresh when new request comes in
    const channel = supabase
      .channel('pickup_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pickup_requests' },
        () => { fetchRequests() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, fetchRequests])

  // ✅ Update status in real Supabase
  const handleStatusChange = async (id: number, newStatus: 'approved' | 'rejected' | 'completed' | 'pending') => {
    try {
      setActionLoading(id)
      const { error } = await supabase
        .from('pickup_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
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

  // ✅ Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Customer Name', 'Email', 'Phone', 'Address', 'Scrap Type', 'Quantity', 'Status', 'Date']
    const rows = filteredRequests.map(r => [
      r.id,
      r.customer_name,
      r.email,
      r.phone,
      r.address,
      r.scrap_type,
      r.quantity,
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pickup-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported successfully!', 'success')
  }

  // ✅ Date filter logic
  const applyDateFilter = (req: PickupRequest) => {
    if (dateFilter === 'all') return true
    const created = new Date(req.created_at)
    const now = new Date()
    if (dateFilter === 'today') {
      return created.toDateString() === now.toDateString()
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return created >= weekAgo
    }
    if (dateFilter === 'month') {
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }
    return true
  }

  // ✅ Search + filter + sort combined
  const filteredRequests = requests
    .filter(req => filter === 'all' || req.status === filter)
    .filter(req => applyDateFilter(req))
    .filter(req => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        req.customer_name?.toLowerCase().includes(q) ||
        req.email?.toLowerCase().includes(q) ||
        req.phone?.includes(q) ||
        req.scrap_type?.toLowerCase().includes(q) ||
        req.address?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn')
    localStorage.removeItem('adminEmail')
    router.push('/')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      new: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ✅ Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* ✅ View Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="space-y-4">
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
                  <p className="text-sm text-gray-900">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                  <p className="text-sm text-gray-900">{selectedRequest.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                  <p className="text-sm text-gray-900">{selectedRequest.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Scrap Type</p>
                  <p className="text-sm text-gray-900">{selectedRequest.scrap_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Quantity</p>
                  <p className="text-sm text-gray-900">{selectedRequest.quantity}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Submitted On</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-6 flex gap-3 flex-wrap">
              {(selectedRequest.status === 'new' || selectedRequest.status === 'pending') && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {actionLoading === selectedRequest.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    {actionLoading === selectedRequest.id ? '...' : '✕ Reject'}
                  </button>
                </>
              )}
              {selectedRequest.status === 'approved' && (
                <button
                  onClick={() => handleStatusChange(selectedRequest.id, 'completed')}
                  disabled={actionLoading === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Scrap Pickup Management – Real Data from Supabase</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                🔄 Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                📊 Export CSV
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-100', icon: '📋' },
            { label: 'New', value: stats.new, color: 'text-purple-600', bg: 'bg-purple-100', icon: '🆕' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏳' },
            { label: 'Approved', value: stats.approved, color: 'text-blue-600', bg: 'bg-blue-100', icon: '✓' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Date Filter + Sort */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, phone, scrap type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >✕</button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">📅 Today</option>
              <option value="week">📅 This Week</option>
              <option value="month">📅 This Month</option>
            </select>

            {/* Sort */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">🔽 Newest First</option>
              <option value="oldest">🔼 Oldest First</option>
            </select>
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-500 mt-3">
            Showing <span className="font-bold text-gray-700">{filteredRequests.length}</span> of {requests.length} requests
            {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
              {(['all', 'new', 'pending', 'approved', 'rejected', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition ${
                    filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                    {tab === 'all' ? stats.total : requests.filter(r => r.status === tab).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scrap Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request, index) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">
                            {request.customer_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">{request.customer_name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{request.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{request.email}</p>
                      <p className="text-sm text-gray-500">{request.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{request.scrap_type}</p>
                      <p className="text-sm text-gray-500">{request.quantity}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(request.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Details Button */}
                        <button
                          onClick={() => { setSelectedRequest(request); setShowModal(true) }}
                          className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition"
                        >
                          👁️ View
                        </button>

                        {/* Action Buttons for NEW status */}
                        {request.status === 'new' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              disabled={actionLoading === request.id}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition"
                            >
                              {actionLoading === request.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              disabled={actionLoading === request.id}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition"
                            >
                              {actionLoading === request.id ? '...' : 'Reject'}
                            </button>
                          </>
                        )}

                        {/* Action Buttons for PENDING status */}
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              disabled={actionLoading === request.id}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition"
                            >
                              {actionLoading === request.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              disabled={actionLoading === request.id}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition"
                            >
                              {actionLoading === request.id ? '...' : 'Reject'}
                            </button>
                          </>
                        )}

                        {/* Mark Complete for APPROVED */}
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'completed')}
                            disabled={actionLoading === request.id}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs transition"
                          >
                            {actionLoading === request.id ? '...' : '✅ Complete'}
                          </button>
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
                <button onClick={() => setSearchQuery('')} className="mt-2 text-blue-600 text-sm hover:underline">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}