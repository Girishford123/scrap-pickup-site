'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { 
  Search, 
  Download, 
  Filter, 
  RefreshCw, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react'
import { format } from 'date-fns'

interface PickupRequest {
  id: string
  rcrc_number: string
  rcrc_name: string
  rcrc_contact_person: string
  rcrc_email: string
  rcrc_phone_number: string
  rcrc_address: string
  rcrc_address_2: string
  state: string
  rcrc_zip_code: string
  preferred_date: string
  pickup_hours: string
  pallet_quantity: number
  total_pieces_quantity: number
  notes: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const itemsPerPage = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    filterAndSortRequests()
  }, [requests, searchTerm, statusFilter, sortConfig])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pickup_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortRequests = () => {
    let filtered = [...requests]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.rcrc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PickupRequest]
        const bValue = b[sortConfig.key as keyof PickupRequest]

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pickup_requests')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      fetchRequests()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      const { error } = await supabase
        .from('pickup_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'RCRC Number', 'RCRC Name', 'Contact Person', 'Email', 'Phone',
      'Address', 'Address 2', 'State', 'Zip Code', 'Preferred Date',
      'Pickup Hours', 'Pallet Qty', 'Total Pieces', 'Status', 'Notes', 'Created At'
    ]

    const csvData = filteredRequests.map(req => [
      req.rcrc_number,
      req.rcrc_name,
      req.rcrc_contact_person,
      req.rcrc_email,
      req.rcrc_phone_number,
      req.rcrc_address,
      req.rcrc_address_2,
      req.state,
      req.rcrc_zip_code,
      req.preferred_date,
      req.pickup_hours,
      req.pallet_quantity,
      req.total_pieces_quantity,
      req.status,
      req.notes,
      format(new Date(req.created_at), 'yyyy-MM-dd HH:mm:ss')
    ])

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pickup-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_progress': return <RefreshCw className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage scrap pickup requests</p>
            </div>
            <Link
              href="/"
              className="flex items-center text-blue-900 hover:text-blue-700 font-semibold"
            >
              <Home className="mr-2 h-5 w-5" />
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by RCRC number, name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={fetchRequests}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 text-blue-900 animate-spin" />
              <span className="ml-3 text-gray-600">Loading requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('rcrc_number')}
                          className="flex items-center text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-900"
                        >
                          RCRC Number
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('rcrc_name')}
                          className="flex items-center text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-900"
                        >
                          RCRC Name
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('preferred_date')}
                          className="flex items-center text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-900"
                        >
                          Pickup Date
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-900"
                        >
                          Status
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{request.rcrc_number || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{request.rcrc_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{request.rcrc_contact_person || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{request.rcrc_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.preferred_date ? format(new Date(request.preferred_date), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{request.pickup_hours || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={request.status}
                            onChange={(e) => updateStatus(request.id, e.target.value)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(request.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteRequest(request.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredRequests.length)}</span> of{' '}
                    <span className="font-medium">{filteredRequests.length}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-900 text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">RCRC Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Number:</span> {selectedRequest.rcrc_number || 'N/A'}</p>
                    <p><span className="font-medium">Name:</span> {selectedRequest.rcrc_name || 'N/A'}</p>
                    <p><span className="font-medium">Contact Person:</span> {selectedRequest.rcrc_contact_person || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.rcrc_email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedRequest.rcrc_phone_number || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
                  <div className="space-y-2 text-sm">
                    <p>{selectedRequest.rcrc_address || 'N/A'}</p>
                    {selectedRequest.rcrc_address_2 && <p>{selectedRequest.rcrc_address_2}</p>}
                    <p>{selectedRequest.state || 'N/A'} {selectedRequest.rcrc_zip_code || ''}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pickup Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Date:</span> {selectedRequest.preferred_date ? format(new Date(selectedRequest.preferred_date), 'MMMM dd, yyyy') : 'N/A'}</p>
                    <p><span className="font-medium">Time:</span> {selectedRequest.pickup_hours || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Quantities</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Pallets:</span> {selectedRequest.pallet_quantity || 0}</p>
                    <p><span className="font-medium">Total Pieces:</span> {selectedRequest.total_pieces_quantity || 0}</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedRequest.notes || 'No notes provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedRequest.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">
                    Created: {format(new Date(selectedRequest.created_at), 'MMMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}