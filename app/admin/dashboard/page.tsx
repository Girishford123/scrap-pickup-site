'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────
type TabKey =
  | 'total_requests'
  | 'sent_for_pickup'
  | 'in_transit'
  | 'shipment_arrived'

type Request = {
  id:                           number
  rcrc_number?:                 string
  rcrc_name?:                   string
  customer_name?:               string
  rcrc_contact_person?:         string
  email?:                       string
  phone?:                       string
  rcrc_phone_number?:           string
  address1?:                    string
  address2?:                    string
  city?:                        string
  state?:                       string
  zip?:                         string
  preferred_date?:              string
  time_window?:                 string
  pallet_quantity?:             number
  total_pieces_quantity?:       number
  special_instructions?:        string
  mcl_number?:                  string
  fcsd_offer_amount?:           number
  vendor_request_received_at?:  string
  techemet_request_sent_at?:    string
  requested_pickup_date?:       string
  scheduled_pickup_date?:       string
  actual_pickup_date?:          string
  admin_notes?:                 string
  status:                       TabKey
  status_updated_at?:           string
  created_at:                   string
}

type AdminEditForm = {
  mcl_number:                  string
  fcsd_offer_amount:           string
  vendor_request_received_at:  string
  techemet_request_sent_at:    string
  requested_pickup_date:       string
  scheduled_pickup_date:       string
  actual_pickup_date:          string
  admin_notes:                 string
  status:                      TabKey
}

// ── Tab Config ─────────────────────────────────────────────
const TABS = [
  {
    key:    'total_requests'   as TabKey,
    label:  'Total Requests',
    icon:   '📋',
    color:  'text-blue-700',
    bg:     'bg-blue-50',
    border: 'border-blue-300',
    desc:   'All incoming requests',
  },
  {
    key:    'sent_for_pickup'  as TabKey,
    label:  'Sent for Pickup',
    icon:   '🚚',
    color:  'text-yellow-700',
    bg:     'bg-yellow-50',
    border: 'border-yellow-300',
    desc:   'Dispatched to Techemet',
  },
  {
    key:    'in_transit'       as TabKey,
    label:  'In Transit',
    icon:   '🔄',
    color:  'text-purple-700',
    bg:     'bg-purple-50',
    border: 'border-purple-300',
    desc:   'Pickup completed, in transit',
  },
  {
    key:    'shipment_arrived' as TabKey,
    label:  'Shipment Arrived',
    icon:   '✅',
    color:  'text-green-700',
    bg:     'bg-green-50',
    border: 'border-green-300',
    desc:   'Arrived at destination',
  },
]

const STATUS_FLOW = [
  { key: 'total_requests'   as TabKey, label: 'New Request',     icon: '📋', color: 'bg-blue-500'   },
  { key: 'sent_for_pickup'  as TabKey, label: 'Sent for Pickup', icon: '🚚', color: 'bg-yellow-500' },
  { key: 'in_transit'       as TabKey, label: 'In Transit',      icon: '🔄', color: 'bg-purple-500' },
  { key: 'shipment_arrived' as TabKey, label: 'Arrived',         icon: '✅', color: 'bg-green-500'  },
]

// ── Helpers ────────────────────────────────────────────────
function fmtDate(val?: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDateTime(val?: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Aging Helpers ──────────────────────────────────────────
function getDaysOld(createdAt: string): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime())
    / (1000 * 60 * 60 * 24)
  )
}

function getAgingColor(days: number): {
  bg:     string
  text:   string
  border: string
  badge:  string
  dot:    string
} {
  if (days <= 3) return {
    bg:     'bg-green-50',
    text:   'text-green-700',
    border: 'border-green-200',
    badge:  'bg-green-100 text-green-700',
    dot:    'bg-green-500',
  }
  if (days <= 7) return {
    bg:     'bg-yellow-50',
    text:   'text-yellow-700',
    border: 'border-yellow-200',
    badge:  'bg-yellow-100 text-yellow-700',
    dot:    'bg-yellow-500',
  }
  if (days <= 14) return {
    bg:     'bg-orange-50',
    text:   'text-orange-700',
    border: 'border-orange-200',
    badge:  'bg-orange-100 text-orange-700',
    dot:    'bg-orange-500',
  }
  return {
    bg:     'bg-red-50',
    text:   'text-red-700',
    border: 'border-red-200',
    badge:  'bg-red-100 text-red-700',
    dot:    'bg-red-500',
  }
}

function getAgingLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day old'
  return `${days} days old`
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: TabKey }) {
  const map = {
    total_requests:   { label: 'New Request',     icon: '📋', bg: 'bg-blue-100',   text: 'text-blue-700'   },
    sent_for_pickup:  { label: 'Sent for Pickup', icon: '🚚', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    in_transit:       { label: 'In Transit',      icon: '🔄', bg: 'bg-purple-100', text: 'text-purple-700' },
    shipment_arrived: { label: 'Arrived',         icon: '✅', bg: 'bg-green-100',  text: 'text-green-700'  },
  }
  const s = map[status] ?? map.total_requests
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  )
}

// ── Analytics Dashboard ────────────────────────────────────
function AnalyticsDashboard({
  requests,
  onSelectRequest,
}: {
  requests:        Request[]
  onSelectRequest: (r: Request) => void
}) {
  const activeRequests = requests.filter(
    r => r.status !== 'shipment_arrived'
  )

  const totalActive    = activeRequests.length
  const totalCompleted = requests.filter(r => r.status === 'shipment_arrived').length
  const totalValue     = requests.reduce((sum, r) => sum + (r.fcsd_offer_amount || 0), 0)
  const avgDays        = activeRequests.length > 0
    ? (activeRequests.reduce((sum, r) => sum + getDaysOld(r.created_at), 0) / activeRequests.length).toFixed(1)
    : '0'

  const fresh    = activeRequests.filter(r => getDaysOld(r.created_at) <= 3)
  const aging    = activeRequests.filter(r => { const d = getDaysOld(r.created_at); return d >= 4 && d <= 7 })
  const overdue  = activeRequests.filter(r => { const d = getDaysOld(r.created_at); return d >= 8 && d <= 14 })
  const critical = activeRequests.filter(r => getDaysOld(r.created_at) >= 15)

  const sortedByAge = [...activeRequests].sort(
    (a, b) => getDaysOld(b.created_at) - getDaysOld(a.created_at)
  )

  const maxCount = Math.max(fresh.length, aging.length, overdue.length, critical.length, 1)

  const statusLabel: Record<string, string> = {
    total_requests:   '📋 New Request',
    sent_for_pickup:  '🚚 Sent for Pickup',
    in_transit:       '🔄 In Transit',
    shipment_arrived: '✅ Arrived',
  }

  const quickStats = [
    {
      label:  'Active Requests',
      value:  totalActive,
      icon:   '📋',
      color:  'text-blue-700',
      bg:     'bg-blue-50',
      border: 'border-blue-200',
      isMonetary: false,
      suffix: '',
    },
    {
      label:  'Completed',
      value:  totalCompleted,
      icon:   '✅',
      color:  'text-green-700',
      bg:     'bg-green-50',
      border: 'border-green-200',
      isMonetary: false,
      suffix: '',
    },
    {
      label:  'Total FCSD Value',
      value:  totalValue,
      icon:   '💰',
      color:  'text-purple-700',
      bg:     'bg-purple-50',
      border: 'border-purple-200',
      isMonetary: true,
      suffix: '',
    },
    {
      label:  'Avg. Age',
      value:  avgDays,
      icon:   '⏱️',
      color:  Number(avgDays) > 7 ? 'text-red-700'     : 'text-gray-700',
      bg:     Number(avgDays) > 7 ? 'bg-red-50'        : 'bg-gray-50',
      border: Number(avgDays) > 7 ? 'border-red-200'   : 'border-gray-200',
      isMonetary: false,
      suffix: ' days',
    },
  ]

  const agingBuckets = [
    {
      label:  '🟢 Fresh',
      range:  '0 – 3 days',
      count:  fresh.length,
      bg:     'bg-green-50',
      border: 'border-green-200',
      text:   'text-green-700',
      numCol: 'text-green-600',
      barCol: 'bg-green-400',
      tip:    'On track ✅',
    },
    {
      label:  '🟡 Aging',
      range:  '4 – 7 days',
      count:  aging.length,
      bg:     'bg-yellow-50',
      border: 'border-yellow-200',
      text:   'text-yellow-700',
      numCol: 'text-yellow-600',
      barCol: 'bg-yellow-400',
      tip:    'Needs attention',
    },
    {
      label:  '🟠 Overdue',
      range:  '8 – 14 days',
      count:  overdue.length,
      bg:     'bg-orange-50',
      border: 'border-orange-200',
      text:   'text-orange-700',
      numCol: 'text-orange-600',
      barCol: 'bg-orange-400',
      tip:    'Action required ⚠️',
    },
    {
      label:  '🔴 Critical',
      range:  '15+ days',
      count:  critical.length,
      bg:     'bg-red-50',
      border: 'border-red-200',
      text:   'text-red-700',
      numCol: 'text-red-600',
      barCol: 'bg-red-500',
      tip:    'Urgent! Follow up now 🚨',
    },
  ]

  return (
    <div className="space-y-6 mb-8">

      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
          📊 Analytics &amp; Aging Overview
        </h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Row 1 — Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickStats.map(stat => (
          <div
            key={stat.label}
            className={`rounded-2xl p-4 border-2 ${stat.bg} ${stat.border} flex flex-col gap-1`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>
              {stat.isMonetary
                ? `$${Number(stat.value).toLocaleString()}`
                : `${stat.value}${stat.suffix}`
              }
            </p>
            <p className="text-xs font-semibold text-gray-500 leading-tight">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Row 2 — Aging Buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {agingBuckets.map(bucket => (
          <div
            key={bucket.label}
            className={`rounded-2xl p-4 border-2 ${bucket.bg} ${bucket.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${bucket.text}`}>
                {bucket.label}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${bucket.bg} ${bucket.text} border ${bucket.border}`}>
                {bucket.range}
              </span>
            </div>

            <p className={`text-5xl font-black mb-2 ${bucket.numCol}`}>
              {bucket.count}
            </p>

            {/* Progress Bar */}
            <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bucket.barCol}`}
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </div>

            <p className={`text-xs font-medium ${bucket.text}`}>
              {bucket.count === 0 ? '✅ All clear!' : bucket.tip}
            </p>
          </div>
        ))}
      </div>

      {/* Row 3 — Request Age Tracker */}
      {sortedByAge.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tracker Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                ⏳ Request Age Tracker
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Sorted oldest first — click any row to view &amp; edit
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[
                { dot: 'bg-green-500',  label: '0-3d'  },
                { dot: 'bg-yellow-500', label: '4-7d'  },
                { dot: 'bg-orange-500', label: '8-14d' },
                { dot: 'bg-red-500',    label: '15d+'  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
                  <span className="text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracker Rows */}
          <div className="divide-y divide-gray-50">
            {sortedByAge.map((req, index) => {
              const days   = getDaysOld(req.created_at)
              const colors = getAgingColor(days)
              const pct    = Math.min((days / 20) * 100, 100)

              return (
                <button
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="w-full px-5 py-3.5 hover:bg-gray-50 transition-all duration-150 flex items-center gap-4 text-left group"
                >
                  {/* Rank */}
                  <div className="w-6 text-xs font-bold text-gray-300 flex-shrink-0">
                    #{index + 1}
                  </div>

                  {/* Color Dot */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">
                        #{req.id} — {req.rcrc_name || 'N/A'}
                      </span>
                      {req.mcl_number ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {req.mcl_number}
                        </span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          ⚠️ No MCL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {statusLabel[req.status] || req.status}
                      </span>
                      {req.preferred_date && (
                        <span className="text-xs text-gray-400">
                          📅 {req.preferred_date}
                        </span>
                      )}
                      {req.city && (
                        <span className="text-xs text-gray-400">
                          📍 {req.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="hidden sm:block w-32 flex-shrink-0">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {pct.toFixed(0)}% of 20d limit
                    </p>
                  </div>

                  {/* Age Badge */}
                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${colors.badge} border ${colors.border}`}>
                    {getAgingLabel(days)}
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-300 group-hover:text-gray-500 transition text-sm flex-shrink-0">
                    →
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tracker Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {sortedByAge.length} active request{sortedByAge.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-600 font-semibold">🟢 {fresh.length} fresh</span>
              <span className="text-yellow-600 font-semibold">🟡 {aging.length} aging</span>
              <span className="text-orange-600 font-semibold">🟠 {overdue.length} overdue</span>
              <span className="text-red-600 font-semibold">🔴 {critical.length} critical</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedByAge.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-green-700 font-bold text-lg mb-1">All Clear!</h3>
          <p className="text-green-600 text-sm">No active requests pending right now.</p>
        </div>
      )}

    </div>
  )
}

// ── View & Edit Modal ──────────────────────────────────────
function ViewModal({
  req,
  onClose,
  onStatusChange,
  onAdminUpdate,
}: {
  req:            Request
  onClose:        () => void
  onStatusChange: (id: number, s: TabKey) => void
  onAdminUpdate:  (id: number, f: AdminEditForm) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [tab,    setTab]    = useState<'admin' | 'info'>('admin')

  const [form, setForm] = useState<AdminEditForm>({
    mcl_number:                 req.mcl_number ?? '',
    fcsd_offer_amount:          req.fcsd_offer_amount != null ? String(req.fcsd_offer_amount) : '',
    vendor_request_received_at: req.vendor_request_received_at ? req.vendor_request_received_at.slice(0, 16) : '',
    techemet_request_sent_at:   req.techemet_request_sent_at   ? req.techemet_request_sent_at.slice(0, 16)   : '',
    requested_pickup_date:      req.requested_pickup_date ?? '',
    scheduled_pickup_date:      req.scheduled_pickup_date ?? '',
    actual_pickup_date:         req.actual_pickup_date    ?? '',
    admin_notes:                req.admin_notes           ?? '',
    status:                     req.status,
  })

  const contact    = req.rcrc_contact_person || req.customer_name || 'N/A'
  const phone      = req.rcrc_phone_number   || req.phone         || 'N/A'
  const address    = [req.address1, req.address2, req.city, req.state, req.zip].filter(Boolean).join(', ') || 'N/A'
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === form.status)

  const handleSave = async () => {
    setSaving(true)
    await onAdminUpdate(req.id, form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inp = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition'
  const lbl = 'block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#003478] px-6 py-4 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-white font-bold text-lg">
              Request #{req.id} — Full Details
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {req.rcrc_name || 'N/A'} • {req.rcrc_number || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-lg text-white hover:bg-white/30 transition flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Progress Tracker */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-4">📊 Shipment Progress</p>
            <div className="flex items-center">
              {STATUS_FLOW.map((s, idx) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, status: s.key }))
                        onStatusChange(req.id, s.key)
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-110 ${idx <= currentIdx ? `${s.color} text-white shadow-md` : 'bg-gray-100 text-gray-400'}`}
                    >
                      {idx <= currentIdx ? s.icon : idx + 1}
                    </button>
                    <p className={`text-xs mt-1.5 text-center leading-tight font-medium max-w-16 ${idx <= currentIdx ? 'text-gray-800' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className={`h-1.5 flex-1 mb-6 rounded-full transition-all ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'admin' ? 'bg-[#003478] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🔐 Admin Fields
            </button>
            <button
              onClick={() => setTab('info')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'info' ? 'bg-[#003478] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📝 Requestor Info
            </button>
          </div>

          {/* Admin Tab */}
          {tab === 'admin' && (
            <div className="space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>🔖 MCL Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MCL-2025-001"
                    value={form.mcl_number}
                    onChange={e => setForm(f => ({ ...f, mcl_number: e.target.value }))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>💰 FCSD Offer Amount ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500.00"
                    value={form.fcsd_offer_amount}
                    onChange={e => setForm(f => ({ ...f, fcsd_offer_amount: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>📥 Vendor Request Received by FCSD</label>
                  <input
                    type="datetime-local"
                    value={form.vendor_request_received_at}
                    onChange={e => setForm(f => ({ ...f, vendor_request_received_at: e.target.value }))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>📤 Techemet Request Sent by FCSD</label>
                  <input
                    type="datetime-local"
                    value={form.techemet_request_sent_at}
                    onChange={e => setForm(f => ({ ...f, techemet_request_sent_at: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>📆 Requested Pickup Date (FCSD to Techemet)</label>
                  <input
                    type="date"
                    value={form.requested_pickup_date}
                    onChange={e => setForm(f => ({ ...f, requested_pickup_date: e.target.value }))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>📅 Scheduled Pickup Date (by Techemet)</label>
                  <input
                    type="date"
                    value={form.scheduled_pickup_date}
                    onChange={e => setForm(f => ({ ...f, scheduled_pickup_date: e.target.value }))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>🚛 Actual Pickup Date (by Techemet)</label>
                  <input
                    type="date"
                    value={form.actual_pickup_date}
                    onChange={e => setForm(f => ({ ...f, actual_pickup_date: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>📊 Update Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_FLOW.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, status: s.key }))
                        onStatusChange(req.id, s.key)
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border-2 ${form.status === s.key ? `${s.color} text-white border-transparent shadow-md` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {s.icon} {s.label}
                      {form.status === s.key && (
                        <span className="bg-white/30 text-xs rounded px-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>📝 Admin Notes</label>
                <textarea
                  rows={3}
                  placeholder="Internal notes about this request..."
                  value={form.admin_notes}
                  onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                  className={`${inp} resize-none`}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all shadow-md ${saving ? 'bg-gray-400 cursor-not-allowed' : saved ? 'bg-green-500' : 'bg-[#003478] hover:bg-blue-900 active:scale-95'}`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : saved ? '✅ Saved Successfully!' : '💾 Save Admin Details'}
              </button>

            </div>
          )}

          {/* Requestor Info Tab */}
          {tab === 'info' && (
            <div className="space-y-5">

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                🏢 RCRC Information
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['RCRC Number',    req.rcrc_number  || '—'],
                  ['RCRC Name',      req.rcrc_name    || '—'],
                  ['Contact Person', contact],
                  ['Phone',          phone],
                  ['Email',          req.email        || '—'],
                  ['Time Window',    req.time_window  || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">📍 Pickup Address</p>
                  <p className="text-sm font-semibold text-gray-800">{address}</p>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                📦 Paycat Details
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Preferred Date</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{req.preferred_date || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Pallets</p>
                  <p className="text-2xl font-black text-[#003478] mt-0.5">{req.pallet_quantity ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Total Pieces</p>
                  <p className="text-2xl font-black text-[#003478] mt-0.5">{req.total_pieces_quantity ?? 0}</p>
                </div>
              </div>

              {req.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-yellow-700 mb-1">📝 Special Instructions</p>
                  <p className="text-sm text-yellow-800">{req.special_instructions}</p>
                </div>
              )}

              <div className="text-xs text-gray-400 text-right pt-3 border-t border-gray-100">
                Submitted: {fmtDateTime(req.created_at)}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Request Card ───────────────────────────────────────────
function RequestCard({
  req,
  onView,
  onStatusChange,
}: {
  req:            Request
  onView:         (r: Request) => void
  onStatusChange: (id: number, s: TabKey) => void
}) {
  const contact = req.rcrc_contact_person || req.customer_name || 'N/A'
  const phone   = req.rcrc_phone_number   || req.phone         || 'N/A'
  const days    = getDaysOld(req.created_at)

  const nextMap: Record<TabKey, { key: TabKey; label: string; icon: string } | null> = {
    total_requests:   { key: 'sent_for_pickup',  label: 'Send for Pickup', icon: '🚚' },
    sent_for_pickup:  { key: 'in_transit',        label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived',  label: 'Mark Arrived',    icon: '✅' },
    shipment_arrived: null,
  }
  const next = nextMap[req.status]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#003478] rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            #{req.id}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">
              {req.rcrc_name || 'N/A'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              RCRC: {req.rcrc_number || 'N/A'}
            </p>
          </div>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* MCL + Offer */}
      <div className={`rounded-xl p-3 border ${req.mcl_number ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-400">🔖 MCL Number</p>
            <p className={`text-sm font-bold ${req.mcl_number ? 'text-blue-700' : 'text-orange-500 italic'}`}>
              {req.mcl_number || '⚠️ Not assigned'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">💰 FCSD Offer</p>
            <p className={`text-sm font-bold ${req.fcsd_offer_amount ? 'text-green-700' : 'text-gray-300'}`}>
              {req.fcsd_offer_amount
                ? `$${Number(req.fcsd_offer_amount).toLocaleString()}`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400">👤 Contact</p>
          <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">{contact}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400">📞 Phone</p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">{phone}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400">📦 Plt / Pcs</p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">
            {req.pallet_quantity ?? 0} / {req.total_pieces_quantity ?? 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400">📅 Pref. Date</p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">
            {req.preferred_date || '—'}
          </p>
        </div>
      </div>

      {/* Timestamps */}
      <div className="space-y-1.5 text-xs">
        {([
          ['📥 Received',         req.vendor_request_received_at, 'text-gray-700' ],
          ['📤 Sent to Techemet', req.techemet_request_sent_at,   'text-gray-700' ],
          ['📅 Scheduled',        req.scheduled_pickup_date,      'text-blue-700' ],
          ['🚛 Actual Pickup',    req.actual_pickup_date,         'text-green-700'],
        ] as [string, string | undefined, string][]).map(([label, val, col]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-gray-400">{label}</span>
            <span className={`font-semibold ${val ? col : 'text-gray-300'}`}>
              {fmtDate(val)}
            </span>
          </div>
        ))}
      </div>

      {/* Age Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span>Submitted: {fmtDate(req.created_at)}</span>
        <span className={`font-semibold ${days > 7 ? 'text-red-500' : days > 2 ? 'text-orange-500' : 'text-gray-400'}`}>
          {days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`}
          {days > 7 && ' 🔴'}
          {days > 2 && days <= 7 && ' ⚠️'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(req)}
          className="flex-1 py-2.5 px-3 rounded-xl border-2 border-[#003478] text-[#003478] text-xs font-semibold hover:bg-[#003478] hover:text-white transition-all"
        >
          👁️ View &amp; Edit
        </button>
        {next ? (
          <button
            onClick={() => onStatusChange(req.id, next.key)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#003478] text-white text-xs font-semibold hover:bg-blue-900 transition shadow-sm"
          >
            {next.icon} {next.label}
          </button>
        ) : (
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-green-50 text-green-700 text-xs font-semibold text-center border border-green-200">
            ✅ Completed
          </div>
        )}
      </div>

    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()

  const [requests,    setRequests]    = useState<Request[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<TabKey>('total_requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReq, setSelectedReq] = useState<Request | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/admin/requests')
      const data = await res.json()
      if (data.success) {
        const normalized = (data.data || []).map((r: Request) => ({
          ...r,
          status: r.status || 'total_requests',
        }))
        setRequests(normalized)
      } else {
        setError(data.error || 'Failed to fetch requests')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error — could not load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // ── Toast ──────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Status Change ──────────────────────────────────────
  const handleStatusChange = async (id: number, status: TabKey) => {
    try {
      const res  = await fetch('/api/admin/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
        showToast('✅ Status updated!')
      } else {
        showToast('❌ Failed to update status')
      }
    } catch {
      showToast('❌ Network error')
    }
  }

  // ── Admin Update ───────────────────────────────────────
  const handleAdminUpdate = async (id: number, form: AdminEditForm) => {
    try {
      console.log('💾 Saving admin update for ID:', id, form)

      const res  = await fetch('/api/admin/update-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, ...form }),
      })
      const data = await res.json()
      console.log('💾 Save response:', data)

      if (data.success) {
        setRequests(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  mcl_number:                 form.mcl_number                 || r.mcl_number,
                  fcsd_offer_amount:          form.fcsd_offer_amount          ? Number(form.fcsd_offer_amount) : r.fcsd_offer_amount,
                  vendor_request_received_at: form.vendor_request_received_at || r.vendor_request_received_at,
                  techemet_request_sent_at:   form.techemet_request_sent_at   || r.techemet_request_sent_at,
                  requested_pickup_date:      form.requested_pickup_date      || r.requested_pickup_date,
                  scheduled_pickup_date:      form.scheduled_pickup_date      || r.scheduled_pickup_date,
                  actual_pickup_date:         form.actual_pickup_date         || r.actual_pickup_date,
                  admin_notes:                form.admin_notes                || r.admin_notes,
                  status:                     form.status,
                }
              : r
          )
        )
        showToast('✅ Admin details saved successfully!')
        setTimeout(() => fetchRequests(), 1000)
      } else {
        console.error('Save failed:', data.error)
        showToast(`❌ Failed to save: ${data.error}`)
      }
    } catch (err) {
      console.error('Save error:', err)
      showToast('❌ Network error — could not save')
    }
  }

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login/admin')
  }

  // ── Export CSV ─────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      'ID', 'MCL Number', 'RCRC Number', 'RCRC Name',
      'Contact', 'Phone', 'Email', 'City', 'State',
      'Preferred Date', 'Pallets', 'Pieces',
      'FCSD Offer', 'Vendor Request Received',
      'Techemet Request Sent', 'Requested Pickup Date',
      'Scheduled Pickup Date', 'Actual Pickup Date',
      'Status', 'Admin Notes', 'Submitted',
    ]
    const rows = filteredRequests.map(r => [
      r.id,
      r.mcl_number                || '',
      r.rcrc_number               || '',
      r.rcrc_name                 || '',
      r.rcrc_contact_person       || r.customer_name || '',
      r.rcrc_phone_number         || r.phone         || '',
      r.email                     || '',
      r.city                      || '',
      r.state                     || '',
      r.preferred_date            || '',
      r.pallet_quantity           ?? 0,
      r.total_pieces_quantity     ?? 0,
      r.fcsd_offer_amount         ?? '',
      fmtDateTime(r.vendor_request_received_at),
      fmtDateTime(r.techemet_request_sent_at),
      fmtDate(r.requested_pickup_date),
      fmtDate(r.scheduled_pickup_date),
      fmtDate(r.actual_pickup_date),
      r.status,
      `"${(r.admin_notes || '').replace(/"/g, '""')}"`,
      fmtDateTime(r.created_at),
    ])
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `paycat-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📥 CSV downloaded!')
  }

  // ── Computed ───────────────────────────────────────────
  const counts = {
    total_requests:   requests.filter(r => r.status === 'total_requests').length,
    sent_for_pickup:  requests.filter(r => r.status === 'sent_for_pickup').length,
    in_transit:       requests.filter(r => r.status === 'in_transit').length,
    shipment_arrived: requests.filter(r => r.status === 'shipment_arrived').length,
  }

  const filteredRequests = requests.filter(r => {
    const matchTab    = r.status === activeTab
    const q           = searchQuery.toLowerCase()
    const matchSearch = !q
      || (r.rcrc_name           || '').toLowerCase().includes(q)
      || (r.rcrc_number         || '').toLowerCase().includes(q)
      || (r.rcrc_contact_person || '').toLowerCase().includes(q)
      || (r.customer_name       || '').toLowerCase().includes(q)
      || (r.mcl_number          || '').toLowerCase().includes(q)
      || (r.city                || '').toLowerCase().includes(q)
      || String(r.id).includes(q)
    return matchTab && matchSearch
  })

  const overdueReqs = requests.filter(r => {
    const days = getDaysOld(r.created_at)
    return days > 2 && r.status !== 'shipment_arrived'
  })

  const missingMCL = requests.filter(
    r => !r.mcl_number && r.status !== 'shipment_arrived'
  ).length

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Modal */}
      {selectedReq && (
        <ViewModal
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status)
            setSelectedReq(prev => prev ? { ...prev, status } : null)
          }}
          onAdminUpdate={handleAdminUpdate}
        />
      )}

      {/* Navbar */}
      <nav className="bg-[#003478] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏭</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                Ford Component Sales
              </h1>
              <p className="text-blue-200 text-xs">Paycat Pickup Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {new Date().getHours() < 12
              ? 'Good Morning'
              : new Date().getHours() < 17
              ? 'Good Afternoon'
              : 'Good Evening'}, Girish! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric',
              month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 font-bold text-sm">❌ {error}</p>
            <button
              onClick={fetchRequests}
              className="text-red-600 underline text-xs mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {/* Alert Banners */}
        <div className="space-y-3 mb-6">
          {overdueReqs.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-700 font-bold text-sm mb-2">
                ⚠️ {overdueReqs.length} request{overdueReqs.length > 1 ? 's' : ''} pending more than 2 days!
              </p>
              <div className="space-y-1.5">
                {overdueReqs.slice(0, 3).map(r => {
                  const d = getDaysOld(r.created_at)
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs bg-red-100 rounded-lg px-3 py-1.5 text-red-700"
                    >
                      <span>#{r.id} — {r.rcrc_name || 'N/A'}</span>
                      <span className="font-bold">{d} days</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {missingMCL > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-orange-700 font-bold text-sm">
                🔖 {missingMCL} request{missingMCL > 1 ? 's' : ''} missing
                MCL Number — click View &amp; Edit to assign!
              </p>
            </div>
          )}
        </div>

        {/* ── ANALYTICS DASHBOARD ── */}
        {!loading && (
          <AnalyticsDashboard
            requests={requests}
            onSelectRequest={setSelectedReq}
          />
        )}

        {/* 4 Tab Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl p-4 text-left transition-all duration-200 border-2 ${
                activeTab === tab.key
                  ? `${tab.bg} ${tab.border} shadow-md scale-105`
                  : 'bg-white border-transparent shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{tab.icon}</span>
                {activeTab === tab.key && (
                  <span className={`text-xs font-bold ${tab.color} bg-white/70 px-2 py-0.5 rounded-full`}>
                    Active
                  </span>
                )}
              </div>
              <p className={`text-4xl font-black mb-1 ${
                activeTab === tab.key ? tab.color : 'text-gray-800'
              }`}>
                {counts[tab.key]}
              </p>
              <p className="text-xs font-semibold text-gray-500 leading-tight">{tab.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{tab.desc}</p>
            </button>
          ))}
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by RCRC name, MCL number, contact, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none shadow-sm"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#003478] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition shadow-sm"
          >
            📥 Export CSV
          </button>
          <button
            onClick={fetchRequests}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm border border-gray-200"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tab Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            {TABS.find(t => t.key === activeTab)?.icon}
            {TABS.find(t => t.key === activeTab)?.label}
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {filteredRequests.length}
            </span>
          </h3>
          <p className="text-xs text-gray-400">
            Click View &amp; Edit to fill admin details
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-80 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-12 bg-gray-100 rounded-xl mb-2" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">
              {TABS.find(t => t.key === activeTab)?.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              No {TABS.find(t => t.key === activeTab)?.label}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchQuery
                ? <>No results for &ldquo;{searchQuery}&rdquo;</>
                : 'No requests in this category yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm text-[#003478] hover:underline font-semibold"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Request Cards Grid */}
        {!loading && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onView={setSelectedReq}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
