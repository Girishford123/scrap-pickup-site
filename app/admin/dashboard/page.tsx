'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ────────────────────────────────────────────────
type TabKey =
  | 'total_requests'
  | 'sent_for_pickup'
  | 'in_transit'
  | 'shipment_arrived'
  | 'closed'

interface PickupRequest {
  id:                          number
  created_at:                  string
  updated_at:                  string
  customer_name?:              string
  phone?:                      string
  email?:                      string
  address1?:                   string
  address2?:                   string
  city?:                       string
  state?:                      string
  zip?:                        string
  preferred_date?:             string
  time_window?:                string
  scrap_category?:             string
  description?:                string
  rcrc_number?:                string
  rcrc_name?:                  string
  rcrc_contact_person?:        string
  rcrc_email?:                 string
  rcrc_phone_number?:          string
  rcrc_address?:               string
  rcrc_address2?:              string
  rcrc_zip_code?:              string
  pallet_quantity?:            number
  total_pieces_quantity?:      number
  special_instructions?:       string
  notes?:                      string
  status:                      TabKey
  attachments?:                { url: string; name: string }[]
  cancel_reason?:              string
  cancelled_at?:               string
  mcl_number?:                 string
  fcsd_offer_amount?:          number
  vendor_request_received_at?: string
  techemet_request_sent_at?:   string
  requested_pickup_date?:      string
  scheduled_pickup_date?:      string
  actual_pickup_date?:         string
  status_updated_at?:          string
  admin_notes?:                string
  date_sent_to_techemet?:      string
  invoice_submitted_date?:     string
}

interface AdminEditForm {
  mcl_number:                  string
  fcsd_offer_amount:           string
  vendor_request_received_at:  string
  techemet_request_sent_at:    string
  requested_pickup_date:       string
  scheduled_pickup_date:       string
  actual_pickup_date:          string
  date_sent_to_techemet:       string
  invoice_submitted_date:      string
  admin_notes:                 string
  status:                      TabKey
}

// ── Constants ────────────────────────────────────────────
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
  {
    key:    'closed'           as TabKey,
    label:  'Closed',
    icon:   '🧾',
    color:  'text-teal-700',
    bg:     'bg-teal-50',
    border: 'border-teal-300',
    desc:   'Invoice submitted — MCL closed',
  },
]

const STATUS_FLOW = [
  { key: 'total_requests'   as TabKey, label: 'New Request',     icon: '📋', color: 'bg-blue-500'   },
  { key: 'sent_for_pickup'  as TabKey, label: 'Sent for Pickup', icon: '🚚', color: 'bg-yellow-500' },
  { key: 'in_transit'       as TabKey, label: 'In Transit',      icon: '🔄', color: 'bg-purple-500' },
  { key: 'shipment_arrived' as TabKey, label: 'Arrived',         icon: '✅', color: 'bg-green-500'  },
  { key: 'closed'           as TabKey, label: 'Closed',          icon: '🧾', color: 'bg-teal-500'   },
]

// ── Helpers ──────────────────────────────────────────────
function fmtDate(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

function fmtMoney(val?: number | null): string {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    maximumFractionDigits: 0,
  }).format(val)
}

// ── StatusBadge ──────────────────────────────────────────
function StatusBadge({ status }: { status: TabKey }) {
  const map: Record<TabKey, {
    label: string
    icon:  string
    bg:    string
    text:  string
  }> = {
    total_requests:   { label: 'New Request',     icon: '📋', bg: 'bg-blue-100',   text: 'text-blue-700'   },
    sent_for_pickup:  { label: 'Sent for Pickup', icon: '🚚', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    in_transit:       { label: 'In Transit',      icon: '🔄', bg: 'bg-purple-100', text: 'text-purple-700' },
    shipment_arrived: { label: 'Arrived',         icon: '✅', bg: 'bg-green-100',  text: 'text-green-700'  },
    closed:           { label: 'Closed',          icon: '🧾', bg: 'bg-teal-100',   text: 'text-teal-700'   },
  }
  const s = map[status] ?? map.total_requests
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  )
}

// ── ProgressBar ──────────────────────────────────────────
function ProgressBar({ status }: { status: TabKey }) {
  const idx   = STATUS_FLOW.findIndex(s => s.key === status)
  const total = STATUS_FLOW.length

  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_FLOW.map((step, i) => (
        <div key={step.key} className="flex-1 flex items-center gap-1">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i <= idx ? step.color : 'bg-gray-200'
          }`} />
          {i < total - 1 && (
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              i < idx ? STATUS_FLOW[i + 1].color : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── AnalyticsDashboard ───────────────────────────────────
function AnalyticsDashboard({ requests }: { requests: PickupRequest[] }) {
  const activeRequests = requests.filter(
    r => r.status !== 'shipment_arrived' && r.status !== 'closed'
  )
  const totalActive    = activeRequests.length
  const totalArrived   = requests.filter(r => r.status === 'shipment_arrived').length
  const totalClosed    = requests.filter(r => r.status === 'closed').length

  const totalPallets   = requests.reduce((s, r) => s + (r.pallet_quantity        ?? 0), 0)
  const totalPieces    = requests.reduce((s, r) => s + (r.total_pieces_quantity   ?? 0), 0)
  const totalValue     = requests.reduce((s, r) => s + (r.fcsd_offer_amount       ?? 0), 0)

  const quickStats = [
    {
      label:      'Total MCLs',
      value:      requests.length,
      icon:       '📋',
      color:      'text-blue-700',
      bg:         'bg-blue-50',
      border:     'border-blue-200',
      isMonetary: false,
    },
    {
      label:      'Active',
      value:      totalActive,
      icon:       '⚡',
      color:      'text-yellow-700',
      bg:         'bg-yellow-50',
      border:     'border-yellow-200',
      isMonetary: false,
    },
    {
      label:      'Arrived',
      value:      totalArrived,
      icon:       '✅',
      color:      'text-green-700',
      bg:         'bg-green-50',
      border:     'border-green-200',
      isMonetary: false,
    },
    {
      label:      'Closed & Invoiced',
      value:      totalClosed,
      icon:       '🧾',
      color:      'text-teal-700',
      bg:         'bg-teal-50',
      border:     'border-teal-200',
      isMonetary: false,
    },
    {
      label:      'Total Pallets',
      value:      totalPallets,
      icon:       '📦',
      color:      'text-purple-700',
      bg:         'bg-purple-50',
      border:     'border-purple-200',
      isMonetary: false,
    },
    {
      label:      'Total Pieces',
      value:      totalPieces,
      icon:       '🔩',
      color:      'text-indigo-700',
      bg:         'bg-indigo-50',
      border:     'border-indigo-200',
      isMonetary: false,
    },
    {
      label:      'Est. Total Value',
      value:      totalValue,
      icon:       '💰',
      color:      'text-emerald-700',
      bg:         'bg-emerald-50',
      border:     'border-emerald-200',
      isMonetary: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
      {quickStats.map(stat => (
        <div
          key={stat.label}
          className={`rounded-xl border ${stat.bg} ${stat.border} p-3 flex flex-col gap-1`}
        >
          <span className="text-lg">{stat.icon}</span>
          <p className={`text-xl font-bold ${stat.color}`}>
            {stat.isMonetary
              ? fmtMoney(stat.value)
              : stat.value.toLocaleString()
            }
          </p>
          <p className="text-xs text-gray-500 font-medium leading-tight">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── RequestCard ──────────────────────────────────────────
function RequestCard({
  req,
  onView,
  onStatusChange,
}: {
  req:            PickupRequest
  onView:         (r: PickupRequest) => void
  onStatusChange: (id: number, status: TabKey) => void
}) {
  const nextMap: Record<TabKey, { key: TabKey; label: string; icon: string } | null> = {
    total_requests:   { key: 'sent_for_pickup',  label: 'Send for Pickup', icon: '🚚' },
    sent_for_pickup:  { key: 'in_transit',        label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived',  label: 'Mark Arrived',    icon: '✅' },
    shipment_arrived: { key: 'closed',            label: 'Close MCL',       icon: '🧾' },
    closed:           null,
  }

  const next = nextMap[req.status]

  const dates: [string, string | undefined, string][] = [
    ['📥 Received',              req.vendor_request_received_at, 'text-gray-700'  ],
    ['📤 Sent to Techemet',      req.techemet_request_sent_at,   'text-gray-700'  ],
    ['📬 Date Sent to Techemet', req.date_sent_to_techemet,      'text-blue-700'  ],
    ['📅 Scheduled',             req.scheduled_pickup_date,      'text-blue-700'  ],
    ['🚛 Actual Pickup',         req.actual_pickup_date,         'text-green-700' ],
    ['🧾 Invoice Submitted',     req.invoice_submitted_date,     'text-teal-700'  ],
  ]

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md
                     transition-all duration-200 overflow-hidden ${
      req.status === 'closed'
        ? 'border-teal-200'
        : 'border-gray-100'
    }`}>

      {/* Card Header */}
      <div className={`px-4 pt-4 pb-3 flex items-start justify-between gap-2 ${
        req.status === 'closed' ? 'bg-teal-50/50' : ''
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {req.mcl_number && (
              <span className="text-xs font-bold text-white bg-gray-800
                               px-2 py-0.5 rounded-lg">
                MCL {req.mcl_number}
              </span>
            )}
            <StatusBadge status={req.status} />
            {req.invoice_submitted_date && (
              <span className="text-xs font-bold text-teal-700 bg-teal-100
                               px-2 py-0.5 rounded-lg">
                🧾 Invoiced
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
            {req.rcrc_name || req.customer_name || 'Unknown RCRC'}
          </p>
          {req.rcrc_number && (
            <p className="text-xs text-gray-400">RCRC #{req.rcrc_number}</p>
          )}
        </div>
        {req.fcsd_offer_amount != null && (
          <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
            {fmtMoney(req.fcsd_offer_amount)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <ProgressBar status={req.status} />
      </div>

      {/* Key Dates */}
      <div className="px-4 pb-3 space-y-1">
        {dates.map(([label, val, cls]) =>
          val ? (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-gray-400">{label}</span>
              <span className={`font-medium ${cls}`}>{fmtDate(val)}</span>
            </div>
          ) : null
        )}
      </div>

      {/* Quantities */}
      {(req.pallet_quantity || req.total_pieces_quantity) && (
        <div className="px-4 pb-3 flex gap-3 flex-wrap">
          {req.pallet_quantity ? (
            <span className="text-xs text-gray-500">
              📦 {req.pallet_quantity.toLocaleString()} pallets
            </span>
          ) : null}
          {req.total_pieces_quantity ? (
            <span className="text-xs text-gray-500">
              🔩 {req.total_pieces_quantity.toLocaleString()} pcs
            </span>
          ) : null}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onView(req)}
          className="flex-1 py-2 px-3 rounded-xl bg-gray-100
                     hover:bg-gray-200 text-gray-700 text-xs
                     font-semibold transition-colors"
        >
          👁 View &amp; Edit
        </button>

        {next ? (
          <button
            onClick={() => onStatusChange(req.id, next.key)}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600
                       hover:bg-blue-700 text-white text-xs
                       font-semibold transition-colors"
          >
            {next.icon} {next.label}
          </button>
        ) : (
          <div className={`flex-1 py-2 px-3 rounded-xl text-xs
                          font-semibold text-center border ${
            req.status === 'closed'
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {req.status === 'closed' ? '🧾 Closed' : '✅ Completed'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ViewModal ────────────────────────────────────────────
function ViewModal({
  req,
  onClose,
  onSave,
  onStatusChange,
}: {
  req:            PickupRequest
  onClose:        () => void
  onSave:         (id: number, data: Partial<PickupRequest>) => Promise<void>
  onStatusChange: (id: number, status: TabKey) => void
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'admin' | 'attachments'>('info')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const [form, setForm] = useState<AdminEditForm>({
    mcl_number:                 req.mcl_number                    ?? '',
    fcsd_offer_amount:          req.fcsd_offer_amount?.toString() ?? '',
    vendor_request_received_at: req.vendor_request_received_at    ?? '',
    techemet_request_sent_at:   req.techemet_request_sent_at      ?? '',
    requested_pickup_date:      req.requested_pickup_date         ?? '',
    scheduled_pickup_date:      req.scheduled_pickup_date         ?? '',
    actual_pickup_date:         req.actual_pickup_date            ?? '',
    date_sent_to_techemet:      req.date_sent_to_techemet         ?? '',
    invoice_submitted_date:     req.invoice_submitted_date        ?? '',
    admin_notes:                req.admin_notes                   ?? '',
    status:                     req.status,
  })

  const nextMap: Record<TabKey, { key: TabKey; label: string; icon: string } | null> = {
    total_requests:   { key: 'sent_for_pickup',  label: 'Send for Pickup', icon: '🚚' },
    sent_for_pickup:  { key: 'in_transit',        label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived',  label: 'Mark Arrived',    icon: '✅' },
    shipment_arrived: { key: 'closed',            label: 'Close MCL',       icon: '🧾' },
    closed:           null,
  }

  const next = nextMap[form.status]

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Partial<PickupRequest> = {
        mcl_number:                 form.mcl_number                 || undefined,
        fcsd_offer_amount:          form.fcsd_offer_amount
                                      ? Number(form.fcsd_offer_amount)
                                      : undefined,
        vendor_request_received_at: form.vendor_request_received_at || undefined,
        techemet_request_sent_at:   form.techemet_request_sent_at   || undefined,
        requested_pickup_date:      form.requested_pickup_date      || undefined,
        scheduled_pickup_date:      form.scheduled_pickup_date      || undefined,
        actual_pickup_date:         form.actual_pickup_date         || undefined,
        date_sent_to_techemet:      form.date_sent_to_techemet      || undefined,
        invoice_submitted_date:     form.invoice_submitted_date     || undefined,
        admin_notes:                form.admin_notes                || undefined,
        status:                     form.status,
      }

      // Auto-close if invoice date is set
      if (form.invoice_submitted_date && form.status !== 'closed') {
        payload.status = 'closed'
        setForm(f => ({ ...f, status: 'closed' }))
      }

      await onSave(req.id, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const modalTabs = [
    { key: 'info'        as const, label: 'Info',         icon: '📋' },
    { key: 'admin'       as const, label: 'Admin Fields', icon: '⚙️' },
    { key: 'attachments' as const, label: 'Attachments',  icon: '📎' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center
                    p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl
                      sm:rounded-3xl shadow-2xl max-h-[92vh]
                      flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className={`px-5 py-4 flex items-start justify-between
                         gap-3 border-b ${
          form.status === 'closed'
            ? 'bg-teal-50 border-teal-100'
            : 'bg-gray-50 border-gray-100'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {req.mcl_number && (
                <span className="text-xs font-bold text-white bg-gray-800
                                 px-2 py-0.5 rounded-lg">
                  MCL {req.mcl_number}
                </span>
              )}
              <StatusBadge status={form.status} />
              {form.invoice_submitted_date && (
                <span className="text-xs font-bold text-teal-700
                                 bg-teal-100 px-2 py-0.5 rounded-lg">
                  🧾 Invoiced &amp; Closed
                </span>
              )}
            </div>
            <p className="text-base font-bold text-gray-900 mt-1">
              {req.rcrc_name || req.customer_name || 'Unknown RCRC'}
            </p>
            {req.rcrc_number && (
              <p className="text-xs text-gray-400">RCRC #{req.rcrc_number}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg
                       hover:bg-gray-100 transition-colors flex-shrink-0 mt-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <ProgressBar status={form.status} />
        </div>

        {/* Modal Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-white">
          {modalTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-xs font-semibold
                         transition-colors ${
                activeTab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INFO TAB ───────────────────────────────── */}
          {activeTab === 'info' && (
            <div className="p-5 space-y-4">

              {/* Closed Banner */}
              {form.status === 'closed' && (
                <div className="bg-teal-50 border-2 border-teal-300
                                rounded-xl p-4 flex items-center gap-3">
                  <span className="text-3xl">🧾</span>
                  <div>
                    <p className="text-teal-700 font-bold text-sm">
                      MCL Closed — Invoice Submitted
                    </p>
                    <p className="text-teal-600 text-xs mt-0.5">
                      Invoice date: {fmtDate(form.invoice_submitted_date) || '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* RCRC Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-gray-500
                               uppercase tracking-wide">
                  RCRC Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['RCRC Name',   req.rcrc_name           ],
                    ['RCRC #',      req.rcrc_number         ],
                    ['Contact',     req.rcrc_contact_person ],
                    ['Email',       req.rcrc_email          ],
                    ['Phone',       req.rcrc_phone_number   ],
                    ['Address',     req.rcrc_address        ],
                    ['City',        req.city                ],
                    ['State',       req.state               ],
                    ['ZIP',         req.rcrc_zip_code       ],
                    ['Time Window', req.time_window         ],
                  ] as [string, string | undefined][]).map(([label, val]) =>
                    val ? (
                      <div key={label}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-800 break-words">
                          {val}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Customer Info */}
              {(req.customer_name || req.email || req.phone) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-gray-500
                                 uppercase tracking-wide">
                    Customer
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['Name',  req.customer_name ],
                      ['Email', req.email         ],
                      ['Phone', req.phone         ],
                    ] as [string, string | undefined][]).map(([label, val]) =>
                      val ? (
                        <div key={label}>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm font-medium text-gray-800">
                            {val}
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Quantities */}
              {(req.pallet_quantity ||
                req.total_pieces_quantity ||
                req.fcsd_offer_amount) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-gray-500
                                 uppercase tracking-wide mb-2">
                    Quantities &amp; Value
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {req.pallet_quantity != null && (
                      <div>
                        <p className="text-xs text-gray-400">Pallets</p>
                        <p className="text-sm font-bold text-gray-800">
                          {req.pallet_quantity.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {req.total_pieces_quantity != null && (
                      <div>
                        <p className="text-xs text-gray-400">Total Pieces</p>
                        <p className="text-sm font-bold text-gray-800">
                          {req.total_pieces_quantity.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {req.fcsd_offer_amount != null && (
                      <div>
                        <p className="text-xs text-gray-400">Est. Value</p>
                        <p className="text-sm font-bold text-emerald-700">
                          {fmtMoney(req.fcsd_offer_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Dates */}
              <div>
                <h3 className="text-xs font-bold text-gray-500
                               uppercase tracking-wide mb-2">
                  Key Dates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {req.date_sent_to_techemet && (
                    <div className="bg-blue-50 border border-blue-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-600 mb-0.5">
                        📬 Date Sent to Techemet
                      </p>
                      <p className="text-sm font-semibold text-blue-800">
                        {fmtDate(req.date_sent_to_techemet)}
                      </p>
                    </div>
                  )}
                  {req.invoice_submitted_date && (
                    <div className="bg-teal-50 border border-teal-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-teal-600 mb-0.5">
                        🧾 Invoice Submitted
                      </p>
                      <p className="text-sm font-semibold text-teal-800">
                        {fmtDate(req.invoice_submitted_date)}
                      </p>
                    </div>
                  )}
                  {req.requested_pickup_date && (
                    <div className="bg-gray-50 border border-gray-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-600 mb-0.5">
                        📅 Requested Pickup
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {fmtDate(req.requested_pickup_date)}
                      </p>
                    </div>
                  )}
                  {req.scheduled_pickup_date && (
                    <div className="bg-gray-50 border border-gray-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-600 mb-0.5">
                        🗓 Scheduled Pickup
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {fmtDate(req.scheduled_pickup_date)}
                      </p>
                    </div>
                  )}
                  {req.actual_pickup_date && (
                    <div className="bg-green-50 border border-green-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-green-600 mb-0.5">
                        🚛 Actual Pickup
                      </p>
                      <p className="text-sm font-semibold text-green-800">
                        {fmtDate(req.actual_pickup_date)}
                      </p>
                    </div>
                  )}
                  {req.vendor_request_received_at && (
                    <div className="bg-gray-50 border border-gray-200
                                    rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-600 mb-0.5">
                        📥 Vendor Received
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {fmtDate(req.vendor_request_received_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {req.admin_notes && (
                <div className="bg-amber-50 border border-amber-200
                                rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 mb-1">
                    📝 Admin Notes
                  </p>
                  <p className="text-sm text-gray-800">{req.admin_notes}</p>
                </div>
              )}

              {/* Next Status Action */}
              {next && form.status !== 'closed' && (
                <button
                  onClick={() => {
                    onStatusChange(req.id, next.key)
                    setForm(f => ({ ...f, status: next.key }))
                    onClose()
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600
                             hover:bg-blue-700 text-white font-semibold
                             text-sm transition-colors"
                >
                  {next.icon} {next.label}
                </button>
              )}
            </div>
          )}

          {/* ── ADMIN TAB ──────────────────────────────── */}
          {activeTab === 'admin' && (
            <div className="p-5 space-y-4">

              {/* Closed Banner — Admin Tab Top */}
              {form.status === 'closed' && (
                <div className="bg-teal-50 border-2 border-teal-300
                                rounded-xl p-4 flex items-center gap-3">
                  <span className="text-3xl">🧾</span>
                  <div>
                    <p className="text-teal-700 font-bold text-sm">
                      MCL Closed — Invoice Submitted
                    </p>
                    <p className="text-teal-600 text-xs mt-0.5">
                      Invoice date: {fmtDate(form.invoice_submitted_date) || '—'}
                    </p>
                    <p className="text-teal-500 text-xs mt-0.5">
                      This MCL is fully complete. Edit fields below if needed.
                    </p>
                  </div>
                </div>
              )}

              {/* MCL Number */}
              <div>
                <label className="block text-xs font-bold text-gray-600
                                  mb-1 uppercase tracking-wide">
                  MCL Number
                </label>
                <input
                  type="text"
                  value={form.mcl_number}
                  onChange={e =>
                    setForm(f => ({ ...f, mcl_number: e.target.value }))
                  }
                  placeholder="e.g. 3255"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200
                             rounded-xl text-sm text-gray-800 focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             outline-none transition"
                />
              </div>

              {/* Est. Offer Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-600
                                  mb-1 uppercase tracking-wide">
                  Est. Offer Amount ($)
                </label>
                <input
                  type="number"
                  value={form.fcsd_offer_amount}
                  onChange={e =>
                    setForm(f => ({ ...f, fcsd_offer_amount: e.target.value }))
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200
                             rounded-xl text-sm text-gray-800 focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             outline-none transition"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600
                                  mb-1 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e =>
                    setForm(f => ({ ...f, status: e.target.value as TabKey }))
                  }
                  className="w-full px-3 py-2.5 bg-white border border-gray-200
                             rounded-xl text-sm text-gray-800 focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             outline-none transition"
                >
                  {TABS.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    key:   'vendor_request_received_at' as keyof AdminEditForm,
                    label: '📥 Vendor Request Received',
                    type:  'datetime-local',
                  },
                  {
                    key:   'techemet_request_sent_at' as keyof AdminEditForm,
                    label: '📤 Techemet Request Sent',
                    type:  'datetime-local',
                  },
                  {
                    key:   'requested_pickup_date' as keyof AdminEditForm,
                    label: '📅 Requested Pickup Date',
                    type:  'date',
                  },
                  {
                    key:   'scheduled_pickup_date' as keyof AdminEditForm,
                    label: '🗓 Scheduled Pickup Date',
                    type:  'date',
                  },
                  {
                    key:   'actual_pickup_date' as keyof AdminEditForm,
                    label: '🚛 Actual Pickup Date',
                    type:  'date',
                  },
                ]).map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={form[field.key] as string}
                      onChange={e =>
                        setForm(f => ({ ...f, [field.key]: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-white border border-gray-200
                                 rounded-xl text-sm text-gray-800 focus:ring-2
                                 focus:ring-blue-500 focus:border-transparent
                                 outline-none transition"
                    />
                  </div>
                ))}
              </div>

              {/* Date Sent to Techemet + Invoice Submitted */}
              <div className="grid grid-cols-2 gap-4">

                {/* Date Sent to Techemet */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <label className="block text-xs font-bold text-blue-600
                                    mb-1 uppercase tracking-wide">
                    📬 Date Sent to Techemet
                  </label>
                  <input
                    type="date"
                    value={form.date_sent_to_techemet}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        date_sent_to_techemet: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 bg-white border border-blue-300
                               rounded-xl text-sm text-gray-800 focus:ring-2
                               focus:ring-blue-600 focus:border-transparent
                               outline-none transition"
                  />
                  <p className="text-xs text-blue-500 mt-1.5">
                    Synced from Excel
                  </p>
                </div>

                {/* Invoice Submitted Date */}
                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                  <label className="block text-xs font-bold text-teal-600
                                    mb-1 uppercase tracking-wide">
                    🧾 Invoice Submitted Date
                  </label>
                  <input
                    type="date"
                    value={form.invoice_submitted_date}
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => ({
                        ...f,
                        invoice_submitted_date: val,
                        status: val ? 'closed' : f.status,
                      }))
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-teal-300
                               rounded-xl text-sm text-gray-800 focus:ring-2
                               focus:ring-teal-600 focus:border-transparent
                               outline-none transition"
                  />
                  <p className="text-xs text-teal-500 mt-1.5">
                    ⚡ Setting date auto-closes MCL
                  </p>
                </div>

              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-600
                                  mb-1 uppercase tracking-wide">
                  📝 Admin Notes
                </label>
                <textarea
                  value={form.admin_notes}
                  onChange={e =>
                    setForm(f => ({ ...f, admin_notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2.5 bg-white border border-gray-200
                             rounded-xl text-sm text-gray-800 focus:ring-2
                             focus:ring-blue-500 focus:border-transparent
                             outline-none transition resize-none"
                />
              </div>

              {/* Closed Confirmation Banner — before Save */}
              {form.status === 'closed' && (
                <div className="bg-teal-50 border-2 border-teal-300
                                rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <p className="text-teal-700 font-bold text-sm">
                      This MCL will be saved as Closed
                    </p>
                    <p className="text-teal-600 text-xs mt-0.5">
                      Invoice date: {fmtDate(form.invoice_submitted_date) || '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3 rounded-xl font-semibold text-sm
                           transition-all duration-200 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : saved
                      ? 'bg-green-500 text-white'
                      : form.status === 'closed'
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving
                  ? '⏳ Saving...'
                  : saved
                    ? '✅ Saved!'
                    : form.status === 'closed'
                      ? '🧾 Save & Close MCL'
                      : '💾 Save Changes'
                }
              </button>
            </div>
          )}

          {/* ── ATTACHMENTS TAB ────────────────────────── */}
          {activeTab === 'attachments' && (
            <div className="p-5">
              {req.attachments && req.attachments.length > 0 ? (
                <div className="space-y-3">
                  {req.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50
                                 border border-gray-200 rounded-xl
                                 hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-2xl">📎</span>
                      <span className="text-sm text-gray-700
                                       group-hover:text-blue-600
                                       font-medium flex-1 truncate">
                        {att.name}
                      </span>
                      <span className="text-xs text-blue-500">Open ↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">📎</p>
                  <p className="text-sm">No attachments</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Main AdminDashboard ──────────────────────────────────
export default function AdminDashboard() {
  const [requests,      setRequests]      = useState<PickupRequest[]>([])
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState<TabKey>('total_requests')
  const [search,        setSearch]        = useState('')
  const [viewReq,       setViewReq]       = useState<PickupRequest | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [syncing,       setSyncing]       = useState(false)
  const [syncMsg,       setSyncMsg]       = useState('')
  const [error,         setError]         = useState('')

  // ── Fetch All Requests ────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('pickup_request')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setRequests((data as PickupRequest[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // ── Status Change ─────────────────────────────────────
  const handleStatusChange = useCallback(async (
    id:     number,
    status: TabKey
  ) => {
    try {
      const { error: err } = await supabase
        .from('pickup_request')
        .update({
          status,
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (err) throw err

      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Status update failed')
    }
  }, [])

  // ── Admin Save ────────────────────────────────────────
  const handleAdminSave = useCallback(async (
    id:   number,
    data: Partial<PickupRequest>
  ) => {
    const res = await fetch('/api/admin/update-request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, ...data }),
    })

    if (!res.ok) {
      const j = await res.json()
      throw new Error(j.error ?? 'Save failed')
    }

    const { data: updated } = await res.json()
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, ...updated } : r)
    )
    if (viewReq?.id === id) {
      setViewReq(prev => prev ? { ...prev, ...updated } : null)
    }
  }, [viewReq])

  // ── Sync Button ───────────────────────────────────────
  const handleSync = useCallback(async () => {
    setSyncing(true)
    setSyncMsg('🔄 Checking sync API...')

    try {
      const healthRes = await fetch(
        '/api/admin/sync-from-powerautomate',
        { method: 'GET' }
      )
      const health = await healthRes.json()

      if (!health.success) {
        setSyncMsg('❌ Sync API not responding')
        return
      }

      await fetchRequests()
      setSyncMsg(`✅ Refreshed! ${new Date().toLocaleTimeString()}`)
    } catch (e) {
      setSyncMsg(
        e instanceof Error ? `❌ ${e.message}` : '❌ Sync failed'
      )
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }, [fetchRequests])

  // ── Export CSV ────────────────────────────────────────
  function exportCSV() {
    const headers = [
      'ID', 'MCL #', 'RCRC Name', 'RCRC #',
      'Contact', 'Email', 'Phone',
      'Address', 'City', 'State', 'ZIP',
      'Time Window', 'Pallets', 'Total Pieces', 'Est Value',
      'Requested Pickup', 'Scheduled Pickup', 'Actual Pickup',
      'Date Sent to Techemet', 'Invoice Submitted Date',
      'Status', 'Admin Notes', 'Submitted',
    ]

    const rows = filtered.map(r => [
      r.id,
      r.mcl_number              ?? '',
      r.rcrc_name               ?? '',
      r.rcrc_number             ?? '',
      r.rcrc_contact_person     ?? '',
      r.rcrc_email              ?? '',
      r.rcrc_phone_number       ?? '',
      r.rcrc_address            ?? '',
      r.city                    ?? '',
      r.state                   ?? '',
      r.rcrc_zip_code           ?? '',
      r.time_window             ?? '',
      r.pallet_quantity         ?? '',
      r.total_pieces_quantity   ?? '',
      r.fcsd_offer_amount       ?? '',
      fmtDate(r.requested_pickup_date),
      fmtDate(r.scheduled_pickup_date),
      fmtDate(r.actual_pickup_date),
      fmtDate(r.date_sent_to_techemet),
      fmtDate(r.invoice_submitted_date),
      r.status,
      r.admin_notes             ?? '',
      fmtDate(r.created_at),
    ])

    const csv = [headers, ...rows]
      .map(row =>
        row
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `mcl-requests-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Counts ────────────────────────────────────────────
  const counts: Record<TabKey, number> = {
    total_requests:   requests.filter(r => r.status === 'total_requests').length,
    sent_for_pickup:  requests.filter(r => r.status === 'sent_for_pickup').length,
    in_transit:       requests.filter(r => r.status === 'in_transit').length,
    shipment_arrived: requests.filter(r => r.status === 'shipment_arrived').length,
    closed:           requests.filter(r => r.status === 'closed').length,
  }

  // ── Filtered Records ──────────────────────────────────
  const filtered = requests.filter(r => {
    if (r.status !== activeTab) return false
    if (!search.trim())         return true
    const q = search.toLowerCase()
    return (
      r.mcl_number?.toLowerCase().includes(q)          ||
      r.rcrc_name?.toLowerCase().includes(q)           ||
      r.rcrc_number?.toLowerCase().includes(q)         ||
      r.customer_name?.toLowerCase().includes(q)       ||
      r.rcrc_contact_person?.toLowerCase().includes(q) ||
      false
    )
  })

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ──────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0
                      z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                🏭 MCL Admin
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                Scrap Pickup Dashboard
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Sync Message */}
              {syncMsg && (
                <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  syncMsg.startsWith('✅')
                    ? 'bg-green-100 text-green-700'
                    : syncMsg.startsWith('❌')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {syncMsg}
                </span>
              )}

              {/* Analytics Toggle */}
              <button
                onClick={() => setShowAnalytics(s => !s)}
                className="text-xs font-semibold px-3 py-2 rounded-xl
                           bg-gray-100 hover:bg-gray-200 text-gray-700
                           transition-colors whitespace-nowrap"
              >
                📊 {showAnalytics ? 'Hide' : 'Analytics'}
              </button>

              {/* Sync Excel Button */}
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`text-xs font-semibold px-4 py-2 rounded-xl
                           text-white transition-colors whitespace-nowrap
                           flex items-center gap-1.5 ${
                  syncing
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {syncing
                  ? (<><span className="animate-spin inline-block">⏳</span> Syncing...</>)
                  : <>🔄 Sync Excel</>
                }
              </button>

              {/* Export CSV */}
              <button
                onClick={exportCSV}
                className="text-xs font-semibold px-3 py-2 rounded-xl
                           bg-emerald-600 hover:bg-emerald-700 text-white
                           transition-colors whitespace-nowrap"
              >
                📥 Export CSV
              </button>

              {/* Refresh */}
              <button
                onClick={fetchRequests}
                disabled={loading}
                className="text-xs font-semibold px-3 py-2 rounded-xl
                           bg-gray-100 hover:bg-gray-200 text-gray-700
                           transition-colors whitespace-nowrap"
              >
                {loading ? '⏳' : '↺'} Refresh
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Analytics Panel */}
        {showAnalytics && (
          <AnalyticsDashboard requests={requests} />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl
                          p-4 mb-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5
                         rounded-xl text-sm font-semibold transition-all
                         duration-200 border ${
                activeTab === tab.key
                  ? `${tab.bg} ${tab.color} ${tab.border} shadow-sm`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key
                  ? `${tab.color} bg-white/70`
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by MCL #, RCRC name, contact..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200
                       rounded-xl text-sm focus:ring-2 focus:ring-blue-500
                       focus:border-transparent outline-none transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Record Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            {TABS.find(t => t.key === activeTab)?.desc} •{' '}
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-600
                             border-t-transparent rounded-full
                             animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading requests...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">
              {TABS.find(t => t.key === activeTab)?.icon}
            </p>
            <p className="text-base font-semibold text-gray-500 mb-1">
              No records found
            </p>
            <p className="text-sm">
              {search
                ? 'Try a different search term'
                : `No ${TABS.find(t => t.key === activeTab)?.label} yet`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2
                          lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onView={setViewReq}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

      </div>

      {/* View & Edit Modal */}
      {viewReq && (
        <ViewModal
          req={viewReq}
          onClose={() => setViewReq(null)}
          onSave={handleAdminSave}
          onStatusChange={handleStatusChange}
        />
      )}

    </div>
  )
}
