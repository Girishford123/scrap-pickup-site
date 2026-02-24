'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession, clearUserSession, isAdmin } from '@/lib/auth'
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
  Home,
  LogOut
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
  const router = useRouter()
  const [user, setUser] = useState(getUserSession())
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
    if (!user || !isAdmin(user)) {
      router.push('/login/admin')
      return
    }
    fetchRequests()
  }, [])

  useEffect(() => {
    filterAndSortRequests()
  }, [requests, searchTerm, statusFilter, sortConfig])

  const handleLogout = () => {
    clearUserSession()
    router.push('/login/admin')
  }

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

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.rcrc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rcrc_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

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

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

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

  if (!user || !isAdmin(user)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {user.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center text-blue-900 hover:text-blue-700 font-semibold"
              >
                <Home className="mr-2 h-5 w-5" />
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 font-semibold"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
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

        {/* Simple message for now */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600">Dashboard features will be loaded here</p>
        </div>
      </div>
    </div>
  )
}