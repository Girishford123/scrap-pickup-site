'use client'

import { useEffect, useState } from 'react'
import { useSession }          from 'next-auth/react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'

// ── Types ─────────────────────────────────────────────
interface Requestor {
  id:          string
  full_name:   string
  email:       string
  phone:       string
  rcrc_number: string
  rcrc_name:   string
  status:      string
  created_at:  string
}

interface FormState {
  full_name:   string
  email:       string
  password:    string
  phone:       string
  rcrc_number: string
  rcrc_name:   string
}

const EMPTY_FORM: FormState = {
  full_name:   '',
  email:       '',
  password:    '',
  phone:       '',
  rcrc_number: '',
  rcrc_name:   '',
}

function generatePassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `Ford@${digits}`
}

// ── Main Component ────────────────────────────────────
export default function RequestorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requestors,   setRequestors]   = useState<Requestor[]>([])
  const [loading,      setLoading]      = useState(true)
  const [pageError,    setPageError]    = useState('')
  const [pageSuccess,  setPageSuccess]  = useState('')
  const [modalError,   setModalError]   = useState('')
  const [searchTerm,   setSearchTerm]   = useState('')

  const [showAddModal,    setShowAddModal]    = useState(false)
  const [showEditModal,   setShowEditModal]   = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetModal,  setShowResetModal]  = useState(false)

  const [selectedRequestor, setSelectedRequestor] = useState<Requestor | null>(null)
  const [form,              setForm]              = useState<FormState>(EMPTY_FORM)
  const [formLoading,       setFormLoading]       = useState(false)
  const [copiedPassword,    setCopiedPassword]    = useState(false)

  // ── Auth Guard ───────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchRequestors()
  }, [status])

  // ── Fetch ────────────────────────────────────────────
  const fetchRequestors = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/requestors')
      const data = await res.json()
      if (data.success) setRequestors(data.data || [])
      else setPageError(data.error || 'Failed to fetch requestors')
    } catch {
      setPageError('Failed to fetch requestors')
    } finally {
      setLoading(false)
    }
  }

  // ── Filter ───────────────────────────────────────────
  const filtered = requestors.filter(r =>
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase())   ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())       ||
    r.rcrc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rcrc_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const showPageSuccess = (msg: string) => {
    setPageSuccess(msg)
    setTimeout(() => setPageSuccess(''), 4000)
  }

  // ── ADD ──────────────────────────────────────────────
  const handleAdd = async () => {
    setFormLoading(true)
    setModalError('')
    try {
      const res    = await fetch('/api/admin/requestors', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const result = await res.json()
      if (result.success) {
        showPageSuccess(`✅ Requestor "${form.full_name}" added successfully!`)
        setShowAddModal(false)
        setModalError('')
        setForm(EMPTY_FORM)
        fetchRequestors()
      } else {
        setModalError(result.error || 'Failed to add requestor')
      }
    } catch {
      setModalError('Failed to add requestor. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── EDIT ─────────────────────────────────────────────
  const openEdit = (r: Requestor) => {
    setSelectedRequestor(r)
    setModalError('')
    setForm({
      full_name:   r.full_name   || '',
      email:       r.email       || '',
      password:    '',
      phone:       r.phone       || '',
      rcrc_number: r.rcrc_number || '',
      rcrc_name:   r.rcrc_name   || '',
    })
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedRequestor) return
    setFormLoading(true)
    setModalError('')
    try {
      const res    = await fetch(`/api/admin/requestors/${selectedRequestor.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const result = await res.json()
      if (result.success) {
        showPageSuccess(`✅ Requestor "${form.full_name}" updated!`)
        setShowEditModal(false)
        setModalError('')
        setSelectedRequestor(null)
        fetchRequestors()
      } else {
        setModalError(result.error || 'Failed to update requestor')
      }
    } catch {
      setModalError('Failed to update requestor.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── DELETE ───────────────────────────────────────────
  const openDelete = (r: Requestor) => {
    setSelectedRequestor(r)
    setModalError('')
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedRequestor) return
    setFormLoading(true)
    try {
      const res    = await fetch(`/api/admin/requestors/${selectedRequestor.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (result.success) {
        showPageSuccess(`✅ Requestor "${selectedRequestor.full_name}" deleted.`)
        setShowDeleteModal(false)
        setSelectedRequestor(null)
        fetchRequestors()
      } else {
        setModalError(result.error || 'Failed to delete')
      }
    } catch {
      setModalError('Failed to delete requestor.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── RESET PASSWORD ───────────────────────────────────
  const openReset = (r: Requestor) => {
    setSelectedRequestor(r)
    setModalError('')
    setShowResetModal(true)
  }

  const handleResetPassword = async () => {
    if (!selectedRequestor) return
    setFormLoading(true)
    setModalError('')
    try {
      const res    = await fetch('/api/admin/requestors/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: selectedRequestor.id }),
      })
      const result = await res.json()
      if (result.success) {
        showPageSuccess(
          `✅ Password reset email sent to "${selectedRequestor.email}"!`
        )
        setShowResetModal(false)
        setSelectedRequestor(null)
      } else {
        setModalError(result.error || 'Failed to send reset email.')
      }
    } catch {
      setModalError('Failed to send reset email.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading requestors...</p>
        </div>
      </div>
    )
  }

  // ── RENDER ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-[#003478] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
                        flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-blue-200 hover:text-white transition-colors text-sm"
            >
              ← Dashboard
            </Link>
            <div className="h-5 w-px bg-blue-400" />
            <h1 className="text-xl font-bold text-white">
              Requestor Management
            </h1>
          </div>
          <span className="text-blue-200 text-sm">{session?.user?.email}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Success */}
        {pageSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <p className="text-green-700 font-medium">{pageSuccess}</p>
          </div>
        )}

        {/* Page Error */}
        {pageError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 font-medium">{pageError}</p>
          </div>
        )}

        {/* Stats + Actions */}
        <div className="flex flex-col sm:flex-row justify-between
                        items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900">{requestors.length}</p>
            </div>
            <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {requestors.filter(r => r.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inactive</p>
              <p className="text-2xl font-bold text-red-500">
                {requestors.filter(r => r.status !== 'active').length}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalError('')
              setForm({ ...EMPTY_FORM, password: generatePassword() })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 bg-[#003478] text-white
                       px-5 py-2.5 rounded-xl hover:bg-blue-800
                       transition-all shadow-md font-medium"
          >
            <span className="text-lg">+</span>
            Add Requestor
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, RCRC number or RCRC name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200
                         rounded-xl text-sm focus:ring-2 focus:ring-blue-500
                         focus:border-transparent outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#','Full Name','Email','Phone','RCRC Number','RCRC Name','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <p className="text-4xl mb-2">👥</p>
                      <p className="font-medium">No requestors found</p>
                      <p className="text-xs mt-1">Add your first requestor above</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, index) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{r.full_name}</td>
                      <td className="px-6 py-4 text-gray-600">{r.email}</td>
                      <td className="px-6 py-4 text-gray-600">{r.phone       || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{r.rcrc_number || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{r.rcrc_name   || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5
                                         rounded-full text-xs font-medium ${
                          r.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {r.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(r)}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            ✏️
                          </button>
                          {/* Reset Password */}
                          <button
                            onClick={() => openReset(r)}
                            title="Reset Password"
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            🔑
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => openDelete(r)}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ADD MODAL ─────────────────────────────────── */}
      {showAddModal && (
        <Modal
          title="Add New Requestor"
          onClose={() => { setShowAddModal(false); setModalError('') }}
        >
          <RequestorForm
            form={form}
            onChange={handleFormChange}
            showPasswordField
            onGeneratePassword={() =>
              setForm(prev => ({ ...prev, password: generatePassword() }))
            }
            loading={formLoading}
            onSubmit={handleAdd}
            onCancel={() => { setShowAddModal(false); setModalError('') }}
            submitLabel="Add Requestor"
            error={modalError}
          />
        </Modal>
      )}

      {/* ── EDIT MODAL ────────────────────────────────── */}
      {showEditModal && (
        <Modal
          title="Edit Requestor"
          onClose={() => { setShowEditModal(false); setModalError('') }}
        >
          <RequestorForm
            form={form}
            onChange={handleFormChange}
            showPasswordField={false}
            loading={formLoading}
            onSubmit={handleEdit}
            onCancel={() => { setShowEditModal(false); setModalError('') }}
            submitLabel="Save Changes"
            error={modalError}
          />
        </Modal>
      )}

      {/* ── DELETE MODAL ──────────────────────────────── */}
      {showDeleteModal && selectedRequestor && (
        <Modal
          title="Delete Requestor"
          onClose={() => { setShowDeleteModal(false); setModalError('') }}
        >
          <div className="space-y-4">
            {modalError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-red-700 text-sm font-medium">❌ {modalError}</p>
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">
                Are you sure you want to delete this requestor?
              </p>
              <p className="text-red-600 text-sm mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-900">{selectedRequestor.full_name}</p>
              <p className="text-gray-500 text-sm">{selectedRequestor.email}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setModalError('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl
                           text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl
                           hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── RESET PASSWORD MODAL ──────────────────────── */}
      {showResetModal && selectedRequestor && (
        <Modal
          title="Reset Password"
          onClose={() => { setShowResetModal(false); setModalError('') }}
        >
          <div className="space-y-4">
            {modalError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-red-700 text-sm font-medium">❌ {modalError}</p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-700 font-medium text-sm">
                📧 A password reset link will be emailed to:
              </p>
              <p className="text-blue-900 font-bold mt-1">
                {selectedRequestor.email}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-900">{selectedRequestor.full_name}</p>
              <p className="text-gray-500 text-sm">{selectedRequestor.email}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 text-sm">
                ⏰ The reset link will expire in <strong>1 hour</strong>.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowResetModal(false); setModalError('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl
                           text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={formLoading}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl
                           hover:bg-amber-600 transition font-medium disabled:opacity-50"
              >
                {formLoading ? '⏳ Sending...' : '📧 Send Reset Link'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

// ── MODAL WRAPPER ─────────────────────────────────────
function Modal({
  title,
  children,
  onClose,
}: {
  title:    string
  children: React.ReactNode
  onClose:  () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md
                      max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors
                       text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── REQUESTOR FORM ────────────────────────────────────
function RequestorForm({
  form,
  onChange,
  showPasswordField,
  onGeneratePassword,
  loading,
  onSubmit,
  onCancel,
  submitLabel,
  error,
}: {
  form:                FormState
  onChange:            (e: React.ChangeEvent<HTMLInputElement>) => void
  showPasswordField:   boolean
  onGeneratePassword?: () => void
  loading:             boolean
  onSubmit:            () => void
  onCancel:            () => void
  submitLabel:         string
  error?:              string
}) {
  const fields = [
    { label: 'Full Name *', name: 'full_name',  type: 'text',  placeholder: 'John Doe'         },
    { label: 'Email *',     name: 'email',       type: 'email', placeholder: 'john@example.com' },
    { label: 'Phone',       name: 'phone',       type: 'tel',   placeholder: '(555) 123-4567'   },
    { label: 'RCRC Number', name: 'rcrc_number', type: 'text',  placeholder: 'RCRC-12345'       },
    { label: 'RCRC Name',   name: 'rcrc_name',   type: 'text',  placeholder: 'Center Name'      },
  ]

  return (
    <div className="space-y-4">

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
        </div>
      )}

      {fields.map(f => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {f.label}
          </label>
          <input
            type={f.type}
            name={f.name}
            value={(form as any)[f.name]}
            onChange={onChange}
            placeholder={f.placeholder}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                       text-sm focus:ring-2 focus:ring-blue-500
                       focus:border-transparent outline-none transition"
          />
        </div>
      ))}

      {/* Password */}
      {showPasswordField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Ford@1234"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl
                         text-sm font-mono focus:ring-2 focus:ring-blue-500
                         focus:border-transparent outline-none transition"
            />
            <button
              type="button"
              onClick={onGeneratePassword}
              title="Generate password"
              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200
                         rounded-xl text-gray-600 transition"
            >
              🔄
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(form.password)
              }}
              title="Copy password"
              className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100
                         rounded-xl text-blue-600 transition"
            >
              📋
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Share this password manually with the requestor.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl
                     text-gray-600 hover:bg-gray-50 transition font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#003478] text-white rounded-xl
                     hover:bg-blue-800 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
