// app/admin/dashboard/page.tsx
'use client'

// ── Auth Imports ─────────────────────────────────────────
import { useSession, signOut } from 'next-auth/react'

// ── React & Supabase ─────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type TabKey =
  | 'total_requests'
  | 'sent_for_pickup'
  | 'in_transit'
  | 'shipment_arrived'
  | 'closed'

interface PickupRequest {
  id:                          number
  created_at:                  string
  updated_at?:                 string
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

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
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

// ── Whitelisted Admin Emails ─────────────────────────────
const ADMIN_EMAILS = [
  'gkulkara@ford.com',
  'mrideno2@ford.com',
]

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
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

function daysBetween(
  start?: string | null,
  end?:   string | null
): number | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
  const diff = Math.round(
    (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (Math.abs(diff) > 365) return null
  return diff >= 0 ? diff : null
}

function avgDays(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v !== null && v >= 0)
  if (valid.length === 0) return null
  return Math.round(
    valid.reduce((s, v) => s + v, 0) / valid.length
  )
}

function cycleColor(d: number | null): string {
  if (d === null) return 'text-gray-400'
  if (d <= 14)    return 'text-green-600'
  if (d <= 21)    return 'text-yellow-600'
  return 'text-red-600'
}

function cycleBg(d: number | null): string {
  if (d === null) return 'bg-gray-50'
  if (d <= 14)    return 'bg-green-50'
  if (d <= 21)    return 'bg-yellow-50'
  return 'bg-red-50'
}

function cycleBorder(d: number | null): string {
  if (d === null) return 'border-gray-200'
  if (d <= 14)    return 'border-green-200'
  if (d <= 21)    return 'border-yellow-200'
  return 'border-red-200'
}

function cycleLabel(d: number | null): string {
  if (d === null) return '—'
  if (d <= 14)    return '✅ Fast'
  if (d <= 21)    return '⚠️ Normal'
  return '🔴 Slow'
}

function cycleLabelBg(d: number | null): string {
  if (d === null) return 'bg-gray-100 text-gray-500'
  if (d <= 14)    return 'bg-green-100 text-green-700'
  if (d <= 21)    return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function normalizeRCRC(name?: string | null): string {
  if (!name) return 'Unknown'
  const lower = name.toLowerCase().trim()
  if (lower === 'aer')       return 'AER'
  if (lower === 'fredjones') return 'FredJones'
  if (lower === 'holman')    return 'Holman'
  return name.trim()
}

// ─────────────────────────────────────────────────────────
// SlowMCLsModal
// ─────────────────────────────────────────────────────────
function SlowMCLsModal({
  requests,
  band,
  onClose,
}: {
  requests: PickupRequest[]
  band:     'fast' | 'normal' | 'slow'
  onClose:  () => void
}) {
  const [sortBy, setSortBy] = useState<
    'days' | 'value' | 'rcrc' | 'date'
  >('days')

  const bandConfig = {
    fast: {
      label:  'Fast (0–14 days)',
      icon:   '⚡',
      color:  'text-green-700',
      bg:     'bg-green-50',
      border: 'border-green-200',
      badge:  'bg-green-100 text-green-700',
      filter: (d: number) => d >= 0 && d <= 14,
    },
    normal: {
      label:  'Normal (15–21 days)',
      icon:   '⏱',
      color:  'text-yellow-700',
      bg:     'bg-yellow-50',
      border: 'border-yellow-200',
      badge:  'bg-yellow-100 text-yellow-700',
      filter: (d: number) => d > 14 && d <= 21,
    },
    slow: {
      label:  'Slow (21+ days)',
      icon:   '🔴',
      color:  'text-red-700',
      bg:     'bg-red-50',
      border: 'border-red-200',
      badge:  'bg-red-100 text-red-700',
      filter: (d: number) => d > 21,
    },
  }

  const config = bandConfig[band]

  const statusStyle: Record<string, string> = {
    total_requests:   'bg-blue-100   text-blue-700',
    sent_for_pickup:  'bg-yellow-100 text-yellow-700',
    in_transit:       'bg-purple-100 text-purple-700',
    shipment_arrived: 'bg-green-100  text-green-700',
    closed:           'bg-teal-100   text-teal-700',
  }

  const statusLabel: Record<string, string> = {
    total_requests:   'New',
    sent_for_pickup:  'Sent',
    in_transit:       'In Transit',
    shipment_arrived: 'Arrived',
    closed:           'Closed',
  }

  const mcls = requests
    .map(r => ({
      ...r,
      cycleDays: r.invoice_submitted_date
        ? daysBetween(r.requested_pickup_date, r.invoice_submitted_date)
        : daysBetween(
            r.requested_pickup_date,
            new Date().toISOString().slice(0, 10)
          ),
    }))
    .filter(r =>
      r.cycleDays !== null && config.filter(r.cycleDays!)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'days':
          return (b.cycleDays ?? 0) - (a.cycleDays ?? 0)
        case 'value':
          return (b.fcsd_offer_amount ?? 0) - (a.fcsd_offer_amount ?? 0)
        case 'rcrc':
          return (a.rcrc_name ?? '').localeCompare(b.rcrc_name ?? '')
        case 'date':
          return (a.requested_pickup_date ?? '').localeCompare(
            b.requested_pickup_date ?? ''
          )
        default:
          return 0
      }
    })

  const totalValue = mcls.reduce(
    (s, r) => s + (r.fcsd_offer_amount ?? 0), 0
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center
                 justify-center bg-black/50
                 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl
                   w-full max-w-5xl max-h-[90vh]
                   flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`${config.bg} border-b ${config.border}
                      rounded-t-3xl px-6 py-4
                      flex items-start justify-between`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              <h2 className={`text-xl font-bold ${config.color}`}>
                {config.label}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {mcls.length} MCLs • Total Value:{' '}
              {fmtMoney(totalValue)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600
                       text-3xl leading-none font-light mt-1"
          >
            ×
          </button>
        </div>

        {/* Sort Controls */}
        <div
          className="px-6 py-3 border-b border-gray-100
                     flex items-center gap-2 flex-wrap
                     bg-gray-50/50"
        >
          <span className="text-xs text-gray-400 font-medium mr-1">
            Sort by:
          </span>
          {([
            { key: 'days'  as const, label: '📅 Most Delayed' },
            { key: 'value' as const, label: '💰 Value'        },
            { key: 'rcrc'  as const, label: '🏢 RCRC Name'    },
            { key: 'date'  as const, label: '🗓 Request Date'  },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg
                         font-semibold transition-colors ${
                sortBy === s.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <span className="text-xs bg-gray-100 text-gray-600
                             px-2.5 py-1 rounded-full font-semibold">
              {mcls.length} MCLs
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-700
                             px-2.5 py-1 rounded-full font-semibold">
              {fmtMoney(totalValue)}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {mcls.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-semibold">
                No MCLs in this category!
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b-2 border-gray-100">
                  {[
                    { label: '#',           align: 'text-left'  },
                    { label: 'MCL #',       align: 'text-left'  },
                    { label: 'RCRC Name',   align: 'text-left'  },
                    { label: 'RCRC #',      align: 'text-left'  },
                    { label: 'Status',      align: 'text-left'  },
                    { label: 'Requested',   align: 'text-left'  },
                    { label: 'Last Update', align: 'text-left'  },
                    { label: 'Est. Value',  align: 'text-right' },
                    { label: 'Pieces',      align: 'text-right' },
                    { label: 'Cycle Days',  align: 'text-right' },
                    { label: 'Delay Stage', align: 'text-left'  },
                  ].map(h => (
                    <th
                      key={h.label}
                      className={`${h.align} py-2.5 px-2
                                 font-bold text-gray-500
                                 whitespace-nowrap`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mcls.map((r, i) => {
                  const delayStage =
                    !r.date_sent_to_techemet
                      ? '⏳ Waiting → Techemet'
                      : !r.scheduled_pickup_date
                        ? '📅 Waiting → Schedule'
                        : !r.actual_pickup_date
                          ? '🚛 Waiting → Pickup'
                          : !r.invoice_submitted_date
                            ? '🧾 Waiting → Invoice'
                            : '✅ Complete'

                  const lastUpdate =
                    r.invoice_submitted_date ??
                    r.actual_pickup_date     ??
                    r.scheduled_pickup_date  ??
                    r.date_sent_to_techemet  ??
                    r.requested_pickup_date  ?? '—'

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50
                                 hover:bg-red-50/30
                                 transition-colors"
                    >
                      <td className="py-3 px-2 text-gray-400 font-bold">
                        {i + 1}
                      </td>
                      <td className="py-3 px-2 font-bold text-gray-800">
                        {r.mcl_number ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-700
                                     font-semibold max-w-[120px] truncate">
                        {r.rcrc_name ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {r.rcrc_number ?? '—'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full
                                         font-semibold whitespace-nowrap ${
                          statusStyle[r.status] ??
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {statusLabel[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                        {r.requested_pickup_date ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                        {lastUpdate}
                      </td>
                      <td className="py-3 px-2 text-right font-bold
                                     text-emerald-700 whitespace-nowrap">
                        {r.fcsd_offer_amount
                          ? fmtMoney(r.fcsd_offer_amount)
                          : '—'}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">
                        {r.total_pieces_quantity?.toLocaleString() ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold px-2.5 py-1
                                         rounded-full text-xs
                                         ${config.badge}`}>
                          {r.cycleDays}d
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                        {delayStage}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200
                               bg-gray-50 font-bold">
                  <td colSpan={7}
                      className="py-2.5 px-2 text-gray-600">
                    Total — {mcls.length} MCLs
                  </td>
                  <td className="py-2.5 px-2 text-right
                                 text-emerald-700">
                    {fmtMoney(totalValue)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-gray-600">
                    {mcls
                      .reduce(
                        (s, r) => s + (r.total_pieces_quantity ?? 0),
                        0
                      )
                      .toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`text-xs px-2 py-0.5
                                     rounded-full ${config.badge}`}>
                      avg{' '}
                      {Math.round(
                        mcls.reduce(
                          (s, r) => s + (r.cycleDays ?? 0), 0
                        ) / (mcls.length || 1)
                      )}d
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-gray-100
                     rounded-b-3xl bg-gray-50/50 flex justify-end"
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-200
                       hover:bg-gray-300 text-gray-700
                       font-semibold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────
// AnalyticsDashboard
// ─────────────────────────────────────────────────────────
function AnalyticsDashboard({
  requests,
}: {
  requests: PickupRequest[]
}) {
  const dashboardRef               = useRef<HTMLDivElement>(null)
  const [exporting,  setExporting] = useState(false)
  const [slowModal,  setSlowModal] = useState<
    'fast' | 'normal' | 'slow' | null
  >(null)
  const [rcrcSort, setRcrcSort]    = useState<
    'value' | 'mcls' | 'days' | 'pieces' | 'completion'
  >('value')

  const realRequests = requests.filter(r =>
    r.rcrc_number !== '9999'        &&
    r.rcrc_name   !== 'Test RCRC'   &&
    r.rcrc_name   !== 'Girish RCRC' &&
    r.rcrc_name   !== 'Girish load' &&
    r.rcrc_name   !== 'Girish'      &&
    r.rcrc_name   !== 'GIrish'      &&
    r.rcrc_name   !== 'Siva'        &&
    r.rcrc_name   !== 'FMC'
  )

  const total         = realRequests.length
  const closed        = realRequests.filter(r => r.status === 'closed')
  const active        = realRequests.filter(r => r.status !== 'closed')
  const inTransit     = realRequests.filter(r => r.status === 'in_transit')
  const arrived       = realRequests.filter(r => r.status === 'shipment_arrived')
  const sentForPickup = realRequests.filter(r => r.status === 'sent_for_pickup')
  const newRequests   = realRequests.filter(r => r.status === 'total_requests')

  const totalValue     = realRequests.reduce((s, r) => s + (r.fcsd_offer_amount     ?? 0), 0)
  const closedValue    = closed.reduce(      (s, r) => s + (r.fcsd_offer_amount     ?? 0), 0)
  const totalPallets   = realRequests.reduce((s, r) => s + (r.pallet_quantity       ?? 0), 0)
  const totalPieces    = realRequests.reduce((s, r) => s + (r.total_pieces_quantity ?? 0), 0)
  const avgValuePerMCL = closed.length > 0 ? closedValue / closed.length : 0

  const fullCycleDays   = realRequests.map(r => daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
  const daysToTechemet  = realRequests.map(r => daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
  const daysToScheduled = realRequests.map(r => daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
  const daysToPickup    = realRequests.map(r => daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
  const daysToInvoice   = realRequests.map(r => daysBetween(r.actual_pickup_date,    r.invoice_submitted_date))

  const avgFullCycle   = avgDays(fullCycleDays)
  const avgToTechemet  = avgDays(daysToTechemet)
  const avgToScheduled = avgDays(daysToScheduled)
  const avgToPickup    = avgDays(daysToPickup)
  const avgToInvoice   = avgDays(daysToInvoice)

  const validCycleDays = fullCycleDays.filter((v): v is number => v !== null)
  const minCycle       = validCycleDays.length > 0 ? Math.min(...validCycleDays) : 0
  const maxCycle       = validCycleDays.length > 0 ? Math.max(...validCycleDays) : 0

  const rcrcMap = new Map<string, {
    name:          string
    number:        string
    totalMCLs:     number
    closedMCLs:    number
    totalValue:    number
    totalPieces:   number
    totalPallets:  number
    cycleDays:     (number | null)[]
    techhemetDays: (number | null)[]
    scheduledDays: (number | null)[]
    pickupDays:    (number | null)[]
    invoiceDays:   (number | null)[]
  }>()

  realRequests.forEach(r => {
    const normalName = normalizeRCRC(r.rcrc_name)
    const key        = r.rcrc_number
      ? `${normalName}-${r.rcrc_number}`
      : normalName

    if (!rcrcMap.has(key)) {
      rcrcMap.set(key, {
        name:          normalName,
        number:        r.rcrc_number ?? '—',
        totalMCLs:     0,
        closedMCLs:    0,
        totalValue:    0,
        totalPieces:   0,
        totalPallets:  0,
        cycleDays:     [],
        techhemetDays: [],
        scheduledDays: [],
        pickupDays:    [],
        invoiceDays:   [],
      })
    }

    const rcrc = rcrcMap.get(key)!
    rcrc.totalMCLs++
    rcrc.totalValue   += r.fcsd_offer_amount     ?? 0
    rcrc.totalPieces  += r.total_pieces_quantity ?? 0
    rcrc.totalPallets += r.pallet_quantity       ?? 0
    if (r.status === 'closed') rcrc.closedMCLs++
    rcrc.cycleDays.push(    daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
    rcrc.techhemetDays.push(daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
    rcrc.scheduledDays.push(daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
    rcrc.pickupDays.push(   daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
    rcrc.invoiceDays.push(  daysBetween(r.actual_pickup_date,    r.invoice_submitted_date))
  })

  const rcrcList = Array.from(rcrcMap.values())
    .map(r => ({
      ...r,
      avgCycleDays:     avgDays(r.cycleDays),
      avgTechhemetDays: avgDays(r.techhemetDays),
      avgScheduledDays: avgDays(r.scheduledDays),
      avgPickupDays:    avgDays(r.pickupDays),
      avgInvoiceDays:   avgDays(r.invoiceDays),
      completionRate:   r.totalMCLs > 0
        ? Math.round((r.closedMCLs / r.totalMCLs) * 100)
        : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)

  const sortedRCRC = [...rcrcList].sort((a, b) => {
    switch (rcrcSort) {
      case 'value':      return b.totalValue     - a.totalValue
      case 'mcls':       return b.totalMCLs      - a.totalMCLs
      case 'pieces':     return b.totalPieces    - a.totalPieces
      case 'completion': return b.completionRate - a.completionRate
      case 'days': {
        const aD = a.avgCycleDays ?? 9999
        const bD = b.avgCycleDays ?? 9999
        return aD - bD
      }
      default: return 0
    }
  })

  const maxValue       = Math.max(...rcrcList.map(r => r.totalValue), 1)
  const maxCycleForBar = Math.max(
    ...rcrcList.filter(r => r.avgCycleDays !== null).map(r => r.avgCycleDays!),
    1
  )

  const pipeline = [
    { key: 'total_requests',   label: 'New',        icon: '📋', count: newRequests.length,   color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    { key: 'sent_for_pickup',  label: 'Sent',       icon: '🚚', count: sentForPickup.length, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { key: 'in_transit',       label: 'In Transit', icon: '🔄', count: inTransit.length,     color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { key: 'shipment_arrived', label: 'Arrived',    icon: '✅', count: arrived.length,       color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    { key: 'closed',           label: 'Closed',     icon: '🧾', count: closed.length,        color: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  ]

  async function exportToPDF() {
    if (!dashboardRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF       = (await import('jspdf')).default
      const canvas      = await html2canvas(dashboardRef.current, {
        scale: 2, useCORS: true,
        backgroundColor: '#f8fafc', logging: false,
      })
      const imgData  = canvas.toDataURL('image/png')
      const pdf      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`ford-scrap-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  async function sendDailyEmail() {
    try {
      const res  = await fetch('/api/send-report', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`✅ Report sent to ${data.sent_to.join(', ')}`)
      } else {
        alert(`❌ Failed: ${data.error}`)
      }
    } catch {
      alert('❌ Failed to send email report')
    }
  }

  return (
    <div>
      {/* Export Buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2
                     bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-xl shadow-sm
                     transition-colors disabled:opacity-50"
        >
          {exporting ? '⏳ Generating...' : '📄 Export PDF'}
        </button>
        <button
          onClick={sendDailyEmail}
          className="flex items-center gap-2 px-4 py-2
                     bg-emerald-600 hover:bg-emerald-700
                     text-white text-sm font-semibold
                     rounded-xl shadow-sm transition-colors"
        >
          📧 Email Report
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-5 mb-8">

        {slowModal && (
          <SlowMCLsModal
            requests={requests}
            band={slowModal}
            onClose={() => setSlowModal(null)}
          />
        )}

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Total MCLs',       value: total.toLocaleString(),                                          icon: '📋', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    sub: `${active.length} active`                                                                   },
            { label: 'Total Est. Value', value: fmtMoney(totalValue),                                            icon: '💰', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', sub: fmtMoney(closedValue) + ' closed'                                                          },
            { label: 'Avg Value / MCL',  value: fmtMoney(avgValuePerMCL),                                        icon: '📈', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  sub: `from ${closed.length} closed`                                                             },
            { label: 'Closed & Invoiced',value: closed.length.toLocaleString(),                                  icon: '🧾', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    sub: `${total > 0 ? Math.round((closed.length / total) * 100) : 0}% completion`               },
            { label: 'Total Pallets',    value: totalPallets.toLocaleString(),                                   icon: '📦', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  sub: 'all MCLs'                                                                                 },
            { label: 'Total Pieces',     value: totalPieces.toLocaleString(),                                    icon: '🔩', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  sub: 'all MCLs'                                                                                 },
            { label: 'Avg Cycle Days',   value: avgFullCycle !== null ? `${avgFullCycle}d` : '—',                icon: '⏱', color: cycleColor(avgFullCycle), bg: cycleBg(avgFullCycle), border: cycleBorder(avgFullCycle), sub: 'request → invoice'                                                      },
            { label: 'Fastest / Slowest',value: validCycleDays.length > 0 ? `${minCycle}d / ${maxCycle}d` : '—',icon: '⚡', color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200',    sub: 'min / max cycle'                                                                          },
          ].map(stat => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.bg}
                          ${stat.border} p-3 flex flex-col gap-1`}
            >
              <span className="text-base">{stat.icon}</span>
              <p className={`text-lg font-bold ${stat.color} leading-tight`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 font-medium leading-tight">
                {stat.label}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2: Pipeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">
              📊 MCL Pipeline Overview
            </h3>
            <span className="text-xs text-gray-400">
              {total} total records
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-5">
            {pipeline.map(stage => {
              const pct = total > 0
                ? Math.round((stage.count / total) * 100)
                : 0
              return (
                <div
                  key={stage.key}
                  className={`${stage.light} border ${stage.border}
                              rounded-xl p-3 flex flex-col
                              items-center text-center gap-1.5`}
                >
                  <span className="text-2xl">{stage.icon}</span>
                  <span className={`text-2xl font-bold ${stage.text}`}>
                    {stage.count}
                  </span>
                  <span className={`text-xs font-semibold ${stage.text}`}>
                    {stage.label}
                  </span>
                  <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              )
            })}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">
                Overall Completion Rate
              </span>
              <span className="font-bold text-teal-600">
                {total > 0 ? Math.round((closed.length / total) * 100) : 0}%
                {' '}({closed.length} / {total} MCLs)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400
                           to-teal-600 rounded-full transition-all duration-700"
                style={{
                  width: `${total > 0
                    ? Math.round((closed.length / total) * 100)
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Avg Days Per Stage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">
              ⏱ Average Days Per Stage — Full MCL Lifecycle
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Fast ≤14d
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                Normal 15–21d
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Slow 21d+
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {([
              { label: 'Request → Techemet',    value: avgToTechemet,  icon: '📤', from: 'Requested Date',   to: 'Date Sent to Techemet' },
              { label: 'Techemet → Scheduled',  value: avgToScheduled, icon: '📅', from: 'Sent to Techemet', to: 'Scheduled Pickup'      },
              { label: 'Scheduled → Picked Up', value: avgToPickup,    icon: '🚛', from: 'Scheduled Date',   to: 'Actual Pickup'         },
              { label: 'Pickup → Invoice',      value: avgToInvoice,   icon: '🧾', from: 'Actual Pickup',    to: 'Invoice Submitted'     },
              { label: 'Total Cycle Time',      value: avgFullCycle,   icon: '⏱', from: 'Request Date',     to: 'Invoice Submitted'     },
            ] as { label: string; value: number | null; icon: string; from: string; to: string }[])
              .map(stage => (
                <div
                  key={stage.label}
                  className={`rounded-xl p-4 border flex flex-col gap-2
                             ${cycleBg(stage.value)}
                             ${cycleBorder(stage.value)}`}
                >
                  <span className="text-xl">{stage.icon}</span>
                  <p className={`text-4xl font-bold ${cycleColor(stage.value)}`}>
                    {stage.value !== null ? `${stage.value}d` : '—'}
                  </p>
                  <div>
                    <p className="text-xs font-bold text-gray-700">
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stage.from} →
                    </p>
                    <p className="text-xs text-gray-400">{stage.to}</p>
                  </div>
                  {stage.value !== null && (
                    <span className={`text-xs font-bold px-2 py-0.5
                                     rounded-full self-start
                                     ${cycleLabelBg(stage.value)}`}>
                      {cycleLabel(stage.value)}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {validCycleDays.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500
                            uppercase tracking-wide mb-3">
                Cycle Time Distribution (Closed MCLs)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'fast'   as const, label: 'Fast (0–14 days)',    count: validCycleDays.filter(d => d <= 14).length,           color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  hover: 'hover:bg-green-100 hover:shadow-md',  border: 'border-green-200'  },
                  { key: 'normal' as const, label: 'Normal (15–21 days)', count: validCycleDays.filter(d => d > 14 && d <= 21).length, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', hover: 'hover:bg-yellow-100 hover:shadow-md', border: 'border-yellow-200' },
                  { key: 'slow'   as const, label: 'Slow (21+ days)',     count: validCycleDays.filter(d => d > 21).length,            color: 'bg-red-500',    light: 'bg-red-50',    text: 'text-red-700',    hover: 'hover:bg-red-100 hover:shadow-md',    border: 'border-red-200'    },
                ]).map(band => {
                  const pct = validCycleDays.length > 0
                    ? Math.round((band.count / validCycleDays.length) * 100)
                    : 0
                  return (
                    <button
                      key={band.key}
                      onClick={() => setSlowModal(band.key)}
                      className={`${band.light} border ${band.border}
                                  rounded-xl p-3 text-left w-full
                                  transition-all cursor-pointer ${band.hover}`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold ${band.text}`}>
                          {band.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${band.text}`}>
                            {band.count}
                          </span>
                          <span className="text-xs bg-white/80 border
                                           px-1.5 py-0.5 rounded-md
                                           opacity-60 font-medium">
                            View →
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${band.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${band.text}`}>
                        {pct}% of closed MCLs
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Row 4: RCRC Analytics Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700">
                🏢 RCRC Performance Analytics
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {rcrcList.length} unique RCRCs • Test records excluded
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'value'      as const, label: '💰 Value'     },
                { key: 'mcls'       as const, label: '📋 MCLs'      },
                { key: 'pieces'     as const, label: '🔩 Pieces'    },
                { key: 'days'       as const, label: '⏱ Fastest'   },
                { key: 'completion' as const, label: '✅ Completion' },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setRcrcSort(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg
                             font-semibold transition-colors ${
                    rcrcSort === s.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {[
                    { label: '#',           align: 'text-left'  },
                    { label: 'RCRC',        align: 'text-left'  },
                    { label: 'MCLs',        align: 'text-right' },
                    { label: 'Closed',      align: 'text-right' },
                    { label: 'Complete%',   align: 'text-right' },
                    { label: 'Est. Value',  align: 'text-right' },
                    { label: 'Avg / MCL',   align: 'text-right' },
                    { label: 'Pieces',      align: 'text-right' },
                    { label: 'Pallets',     align: 'text-right' },
                    { label: '→ Techemet',  align: 'text-right' },
                    { label: '→ Scheduled', align: 'text-right' },
                    { label: '→ Pickup',    align: 'text-right' },
                    { label: '→ Invoice',   align: 'text-right' },
                    { label: 'Full Cycle',  align: 'text-right' },
                    { label: 'Value Bar',   align: 'text-left'  },
                  ].map(h => (
                    <th
                      key={h.label}
                      className={`${h.align} py-2 px-2 font-bold
                                 text-gray-500 whitespace-nowrap`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRCRC.map((rcrc, i) => {
                  const valueBarPct = maxValue > 0
                    ? (rcrc.totalValue / maxValue) * 100
                    : 0
                  const rowColors = [
                    'bg-yellow-50/60',
                    'bg-gray-50/40',
                    'bg-orange-50/40',
                  ]
                  return (
                    <tr
                      key={`${rcrc.number}-${i}`}
                      className={`border-b border-gray-50
                                 hover:bg-blue-50/30 transition-colors ${
                        i < 3 ? rowColors[i] : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 font-bold text-gray-400 text-center">
                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <p className="font-bold text-gray-800 whitespace-nowrap">
                          {rcrc.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          #{rcrc.number}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-gray-700">
                        {rcrc.totalMCLs}
                      </td>
                      <td className="py-2.5 px-2 text-right text-teal-600 font-semibold">
                        {rcrc.closedMCLs}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rcrc.completionRate >= 80
                                  ? 'bg-teal-500'
                                  : rcrc.completionRate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-400'
                              }`}
                              style={{ width: `${rcrc.completionRate}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            rcrc.completionRate >= 80
                              ? 'text-teal-600'
                              : rcrc.completionRate >= 50
                                ? 'text-yellow-600'
                                : 'text-red-500'
                          }`}>
                            {rcrc.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {fmtMoney(rcrc.totalValue)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">
                        {rcrc.closedMCLs > 0
                          ? fmtMoney(rcrc.totalValue / rcrc.closedMCLs)
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">
                        {rcrc.totalPieces.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">
                        {rcrc.totalPallets > 0 ? rcrc.totalPallets.toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgTechhemetDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgTechhemetDays)}`}>{rcrc.avgTechhemetDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgScheduledDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgScheduledDays)}`}>{rcrc.avgScheduledDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgPickupDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgPickupDays)}`}>{rcrc.avgPickupDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgInvoiceDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgInvoiceDays)}`}>{rcrc.avgInvoiceDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgCycleDays !== null
                          ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${cycleLabelBg(rcrc.avgCycleDays)}`}>{rcrc.avgCycleDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 w-28">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${valueBarPct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="py-2.5 px-2 font-bold text-gray-400 text-center">Σ</td>
                  <td className="py-2.5 px-2 font-bold text-gray-700">{rcrcList.length} RCRCs</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{total}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">{closed.length}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">{total > 0 ? Math.round((closed.length / total) * 100) : 0}%</td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-700 whitespace-nowrap">{fmtMoney(totalValue)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-600 whitespace-nowrap">{fmtMoney(avgValuePerMCL)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPieces.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPallets.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToTechemet)}>{avgToTechemet !== null ? `${avgToTechemet}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToScheduled)}>{avgToScheduled !== null ? `${avgToScheduled}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToPickup)}>{avgToPickup !== null ? `${avgToPickup}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToInvoice)}>{avgToInvoice !== null ? `${avgToInvoice}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgFullCycle)}>{avgFullCycle !== null ? `${avgFullCycle}d avg` : '—'}</span></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Row 5: Top Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              💰 Top 10 RCRCs by Value
            </h3>
            <div className="space-y-3">
              {[...rcrcList]
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 10)
                .map((rcrc, i) => {
                  const pct = maxValue > 0
                    ? (rcrc.totalValue / maxValue) * 100 : 0
                  const barColors = [
                    'bg-emerald-500','bg-emerald-400',
                    'bg-teal-500',   'bg-teal-400',
                    'bg-blue-500',   'bg-blue-400',
                    'bg-indigo-500', 'bg-indigo-400',
                    'bg-purple-500', 'bg-purple-400',
                  ]
                  return (
                    <div key={`val-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{rcrc.name}</span>
                          <span className="text-xs text-gray-400">#{rcrc.number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{rcrc.totalMCLs} MCLs</span>
                          <span className="text-xs font-bold text-emerald-700">{fmtMoney(rcrc.totalValue)}</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColors[i] ?? 'bg-gray-400'} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              ⚡ Fastest RCRCs — Avg Cycle Time
            </h3>
            <div className="space-y-3">
              {[...rcrcList]
                .filter(r => r.avgCycleDays !== null && r.closedMCLs >= 2)
                .sort((a, b) => (a.avgCycleDays ?? 999) - (b.avgCycleDays ?? 999))
                .slice(0, 10)
                .map((rcrc, i) => {
                  const days = rcrc.avgCycleDays ?? 0
                  const pct  = maxCycleForBar > 0
                    ? (days / maxCycleForBar) * 100 : 0
                  return (
                    <div key={`spd-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{rcrc.name}</span>
                          <span className="text-xs text-gray-400">({rcrc.closedMCLs} closed)</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cycleLabelBg(days)}`}>
                          {days}d avg
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            days <= 14 ? 'bg-green-500' : days <= 21 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// AuthLoadingScreen
// ─────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 to-gray-100
                    flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🏭</span>
        </div>
        <div className="w-8 h-8 border-4 border-blue-600
                        border-t-transparent rounded-full
                        animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">
          Verifying your access...
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Ford MCL Admin Dashboard
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// NotSignedInScreen
// ─────────────────────────────────────────────────────────
function NotSignedInScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 to-gray-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl
                      w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🏭</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          Ford MCL Admin
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Sign in to access the dashboard
        </p>
        <div className="bg-amber-50 border border-amber-100
                        rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">
                Restricted Access
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Only authorized Ford admin accounts
                can access this dashboard.
              </p>
            </div>
          </div>
        </div>
        <a
          href="/admin/login"
          className="w-full flex items-center justify-center
                     gap-2 py-3.5 bg-blue-600 hover:bg-blue-700
                     text-white font-semibold rounded-2xl
                     transition-colors shadow-sm"
        >
          🔐 Go to Login Page
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Ford Motor Company — MCL Scrap Pickup System
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// UnauthorizedScreen
// ─────────────────────────────────────────────────────────
function UnauthorizedScreen({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-red-50 to-gray-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl
                      w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your account is not authorized to access this dashboard.
        </p>
        <div className="bg-gray-50 border border-gray-200
                        rounded-2xl p-4 mb-4 text-left">
          <p className="text-xs font-bold text-gray-500 mb-1">
            Signed in as:
          </p>
          <p className="text-sm text-gray-700 font-semibold">{email}</p>
          <p className="text-xs text-red-500 mt-1">❌ Not authorized</p>
        </div>
        <div className="bg-red-50 border border-red-100
                        rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-red-600 mb-2">
            🔒 Authorized Accounts Only:
          </p>
          {ADMIN_EMAILS.map(e => (
            <div key={e} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-300" />
              <p className="text-xs text-red-500">{e}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100
                        rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-blue-600 leading-relaxed">
            💡 If you believe you should have access,
            contact: <strong>gkulkara@ford.com</strong>
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full py-3.5 rounded-2xl bg-red-500
                       hover:bg-red-600 text-white font-semibold
                       transition-colors"
          >
            Sign Out & Try Another Account
          </button>
          <a
            href="/admin/login"
            className="block w-full py-3.5 rounded-2xl bg-gray-100
                       hover:bg-gray-200 text-gray-600 font-semibold
                       transition-colors"
          >
            ← Back to Login
          </a>
        </div>
        <div className="border-t border-gray-100 mt-6 pt-4">
          <p className="text-xs text-gray-300">
            Ford Motor Company — MCL Scrap Pickup System
          </p>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────
// AnalyticsDashboard
// ─────────────────────────────────────────────────────────
function AnalyticsDashboard({
  requests,
}: {
  requests: PickupRequest[]
}) {
  const dashboardRef               = useRef<HTMLDivElement>(null)
  const [exporting,  setExporting] = useState(false)
  const [slowModal,  setSlowModal] = useState<
    'fast' | 'normal' | 'slow' | null
  >(null)
  const [rcrcSort, setRcrcSort]    = useState<
    'value' | 'mcls' | 'days' | 'pieces' | 'completion'
  >('value')

  const realRequests = requests.filter(r =>
    r.rcrc_number !== '9999'        &&
    r.rcrc_name   !== 'Test RCRC'   &&
    r.rcrc_name   !== 'Girish RCRC' &&
    r.rcrc_name   !== 'Girish load' &&
    r.rcrc_name   !== 'Girish'      &&
    r.rcrc_name   !== 'GIrish'      &&
    r.rcrc_name   !== 'Siva'        &&
    r.rcrc_name   !== 'FMC'
  )

  const total         = realRequests.length
  const closed        = realRequests.filter(r => r.status === 'closed')
  const active        = realRequests.filter(r => r.status !== 'closed')
  const inTransit     = realRequests.filter(r => r.status === 'in_transit')
  const arrived       = realRequests.filter(r => r.status === 'shipment_arrived')
  const sentForPickup = realRequests.filter(r => r.status === 'sent_for_pickup')
  const newRequests   = realRequests.filter(r => r.status === 'total_requests')

  const totalValue     = realRequests.reduce((s, r) => s + (r.fcsd_offer_amount     ?? 0), 0)
  const closedValue    = closed.reduce(      (s, r) => s + (r.fcsd_offer_amount     ?? 0), 0)
  const totalPallets   = realRequests.reduce((s, r) => s + (r.pallet_quantity       ?? 0), 0)
  const totalPieces    = realRequests.reduce((s, r) => s + (r.total_pieces_quantity ?? 0), 0)
  const avgValuePerMCL = closed.length > 0 ? closedValue / closed.length : 0

  const fullCycleDays   = realRequests.map(r => daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
  const daysToTechemet  = realRequests.map(r => daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
  const daysToScheduled = realRequests.map(r => daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
  const daysToPickup    = realRequests.map(r => daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
  const daysToInvoice   = realRequests.map(r => daysBetween(r.actual_pickup_date,    r.invoice_submitted_date))

  const avgFullCycle   = avgDays(fullCycleDays)
  const avgToTechemet  = avgDays(daysToTechemet)
  const avgToScheduled = avgDays(daysToScheduled)
  const avgToPickup    = avgDays(daysToPickup)
  const avgToInvoice   = avgDays(daysToInvoice)

  const validCycleDays = fullCycleDays.filter((v): v is number => v !== null)
  const minCycle       = validCycleDays.length > 0 ? Math.min(...validCycleDays) : 0
  const maxCycle       = validCycleDays.length > 0 ? Math.max(...validCycleDays) : 0

  const rcrcMap = new Map<string, {
    name:          string
    number:        string
    totalMCLs:     number
    closedMCLs:    number
    totalValue:    number
    totalPieces:   number
    totalPallets:  number
    cycleDays:     (number | null)[]
    techhemetDays: (number | null)[]
    scheduledDays: (number | null)[]
    pickupDays:    (number | null)[]
    invoiceDays:   (number | null)[]
  }>()

  realRequests.forEach(r => {
    const normalName = normalizeRCRC(r.rcrc_name)
    const key        = r.rcrc_number
      ? `${normalName}-${r.rcrc_number}`
      : normalName

    if (!rcrcMap.has(key)) {
      rcrcMap.set(key, {
        name:          normalName,
        number:        r.rcrc_number ?? '—',
        totalMCLs:     0,
        closedMCLs:    0,
        totalValue:    0,
        totalPieces:   0,
        totalPallets:  0,
        cycleDays:     [],
        techhemetDays: [],
        scheduledDays: [],
        pickupDays:    [],
        invoiceDays:   [],
      })
    }

    const rcrc = rcrcMap.get(key)!
    rcrc.totalMCLs++
    rcrc.totalValue   += r.fcsd_offer_amount     ?? 0
    rcrc.totalPieces  += r.total_pieces_quantity ?? 0
    rcrc.totalPallets += r.pallet_quantity       ?? 0
    if (r.status === 'closed') rcrc.closedMCLs++
    rcrc.cycleDays.push(    daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
    rcrc.techhemetDays.push(daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
    rcrc.scheduledDays.push(daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
    rcrc.pickupDays.push(   daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
    rcrc.invoiceDays.push(  daysBetween(r.actual_pickup_date,    r.invoice_submitted_date))
  })

  const rcrcList = Array.from(rcrcMap.values())
    .map(r => ({
      ...r,
      avgCycleDays:     avgDays(r.cycleDays),
      avgTechhemetDays: avgDays(r.techhemetDays),
      avgScheduledDays: avgDays(r.scheduledDays),
      avgPickupDays:    avgDays(r.pickupDays),
      avgInvoiceDays:   avgDays(r.invoiceDays),
      completionRate:   r.totalMCLs > 0
        ? Math.round((r.closedMCLs / r.totalMCLs) * 100)
        : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)

  const sortedRCRC = [...rcrcList].sort((a, b) => {
    switch (rcrcSort) {
      case 'value':      return b.totalValue     - a.totalValue
      case 'mcls':       return b.totalMCLs      - a.totalMCLs
      case 'pieces':     return b.totalPieces    - a.totalPieces
      case 'completion': return b.completionRate - a.completionRate
      case 'days': {
        const aD = a.avgCycleDays ?? 9999
        const bD = b.avgCycleDays ?? 9999
        return aD - bD
      }
      default: return 0
    }
  })

  const maxValue       = Math.max(...rcrcList.map(r => r.totalValue), 1)
  const maxCycleForBar = Math.max(
    ...rcrcList.filter(r => r.avgCycleDays !== null).map(r => r.avgCycleDays!),
    1
  )

  const pipeline = [
    { key: 'total_requests',   label: 'New',        icon: '📋', count: newRequests.length,   color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    { key: 'sent_for_pickup',  label: 'Sent',       icon: '🚚', count: sentForPickup.length, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { key: 'in_transit',       label: 'In Transit', icon: '🔄', count: inTransit.length,     color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { key: 'shipment_arrived', label: 'Arrived',    icon: '✅', count: arrived.length,       color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    { key: 'closed',           label: 'Closed',     icon: '🧾', count: closed.length,        color: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  ]

  async function exportToPDF() {
    if (!dashboardRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF       = (await import('jspdf')).default
      const canvas      = await html2canvas(dashboardRef.current, {
        scale: 2, useCORS: true,
        backgroundColor: '#f8fafc', logging: false,
      })
      const imgData  = canvas.toDataURL('image/png')
      const pdf      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`ford-scrap-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  async function sendDailyEmail() {
    try {
      const res  = await fetch('/api/send-report', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`✅ Report sent to ${data.sent_to.join(', ')}`)
      } else {
        alert(`❌ Failed: ${data.error}`)
      }
    } catch {
      alert('❌ Failed to send email report')
    }
  }

  return (
    <div>
      {/* Export Buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2
                     bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-xl shadow-sm
                     transition-colors disabled:opacity-50"
        >
          {exporting ? '⏳ Generating...' : '📄 Export PDF'}
        </button>
        <button
          onClick={sendDailyEmail}
          className="flex items-center gap-2 px-4 py-2
                     bg-emerald-600 hover:bg-emerald-700
                     text-white text-sm font-semibold
                     rounded-xl shadow-sm transition-colors"
        >
          📧 Email Report
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-5 mb-8">

        {slowModal && (
          <SlowMCLsModal
            requests={requests}
            band={slowModal}
            onClose={() => setSlowModal(null)}
          />
        )}

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Total MCLs',       value: total.toLocaleString(),                                          icon: '📋', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    sub: `${active.length} active`                                                                   },
            { label: 'Total Est. Value', value: fmtMoney(totalValue),                                            icon: '💰', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', sub: fmtMoney(closedValue) + ' closed'                                                          },
            { label: 'Avg Value / MCL',  value: fmtMoney(avgValuePerMCL),                                        icon: '📈', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  sub: `from ${closed.length} closed`                                                             },
            { label: 'Closed & Invoiced',value: closed.length.toLocaleString(),                                  icon: '🧾', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    sub: `${total > 0 ? Math.round((closed.length / total) * 100) : 0}% completion`               },
            { label: 'Total Pallets',    value: totalPallets.toLocaleString(),                                   icon: '📦', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  sub: 'all MCLs'                                                                                 },
            { label: 'Total Pieces',     value: totalPieces.toLocaleString(),                                    icon: '🔩', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  sub: 'all MCLs'                                                                                 },
            { label: 'Avg Cycle Days',   value: avgFullCycle !== null ? `${avgFullCycle}d` : '—',                icon: '⏱', color: cycleColor(avgFullCycle), bg: cycleBg(avgFullCycle), border: cycleBorder(avgFullCycle), sub: 'request → invoice'                                                      },
            { label: 'Fastest / Slowest',value: validCycleDays.length > 0 ? `${minCycle}d / ${maxCycle}d` : '—',icon: '⚡', color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200',    sub: 'min / max cycle'                                                                          },
          ].map(stat => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.bg}
                          ${stat.border} p-3 flex flex-col gap-1`}
            >
              <span className="text-base">{stat.icon}</span>
              <p className={`text-lg font-bold ${stat.color} leading-tight`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 font-medium leading-tight">
                {stat.label}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2: Pipeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">
              📊 MCL Pipeline Overview
            </h3>
            <span className="text-xs text-gray-400">
              {total} total records
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-5">
            {pipeline.map(stage => {
              const pct = total > 0
                ? Math.round((stage.count / total) * 100)
                : 0
              return (
                <div
                  key={stage.key}
                  className={`${stage.light} border ${stage.border}
                              rounded-xl p-3 flex flex-col
                              items-center text-center gap-1.5`}
                >
                  <span className="text-2xl">{stage.icon}</span>
                  <span className={`text-2xl font-bold ${stage.text}`}>
                    {stage.count}
                  </span>
                  <span className={`text-xs font-semibold ${stage.text}`}>
                    {stage.label}
                  </span>
                  <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              )
            })}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">
                Overall Completion Rate
              </span>
              <span className="font-bold text-teal-600">
                {total > 0 ? Math.round((closed.length / total) * 100) : 0}%
                {' '}({closed.length} / {total} MCLs)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400
                           to-teal-600 rounded-full transition-all duration-700"
                style={{
                  width: `${total > 0
                    ? Math.round((closed.length / total) * 100)
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Avg Days Per Stage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">
              ⏱ Average Days Per Stage — Full MCL Lifecycle
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Fast ≤14d
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                Normal 15–21d
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Slow 21d+
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {([
              { label: 'Request → Techemet',    value: avgToTechemet,  icon: '📤', from: 'Requested Date',   to: 'Date Sent to Techemet' },
              { label: 'Techemet → Scheduled',  value: avgToScheduled, icon: '📅', from: 'Sent to Techemet', to: 'Scheduled Pickup'      },
              { label: 'Scheduled → Picked Up', value: avgToPickup,    icon: '🚛', from: 'Scheduled Date',   to: 'Actual Pickup'         },
              { label: 'Pickup → Invoice',      value: avgToInvoice,   icon: '🧾', from: 'Actual Pickup',    to: 'Invoice Submitted'     },
              { label: 'Total Cycle Time',      value: avgFullCycle,   icon: '⏱', from: 'Request Date',     to: 'Invoice Submitted'     },
            ] as { label: string; value: number | null; icon: string; from: string; to: string }[])
              .map(stage => (
                <div
                  key={stage.label}
                  className={`rounded-xl p-4 border flex flex-col gap-2
                             ${cycleBg(stage.value)}
                             ${cycleBorder(stage.value)}`}
                >
                  <span className="text-xl">{stage.icon}</span>
                  <p className={`text-4xl font-bold ${cycleColor(stage.value)}`}>
                    {stage.value !== null ? `${stage.value}d` : '—'}
                  </p>
                  <div>
                    <p className="text-xs font-bold text-gray-700">
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stage.from} →
                    </p>
                    <p className="text-xs text-gray-400">{stage.to}</p>
                  </div>
                  {stage.value !== null && (
                    <span className={`text-xs font-bold px-2 py-0.5
                                     rounded-full self-start
                                     ${cycleLabelBg(stage.value)}`}>
                      {cycleLabel(stage.value)}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {validCycleDays.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500
                            uppercase tracking-wide mb-3">
                Cycle Time Distribution (Closed MCLs)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'fast'   as const, label: 'Fast (0–14 days)',    count: validCycleDays.filter(d => d <= 14).length,           color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  hover: 'hover:bg-green-100 hover:shadow-md',  border: 'border-green-200'  },
                  { key: 'normal' as const, label: 'Normal (15–21 days)', count: validCycleDays.filter(d => d > 14 && d <= 21).length, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', hover: 'hover:bg-yellow-100 hover:shadow-md', border: 'border-yellow-200' },
                  { key: 'slow'   as const, label: 'Slow (21+ days)',     count: validCycleDays.filter(d => d > 21).length,            color: 'bg-red-500',    light: 'bg-red-50',    text: 'text-red-700',    hover: 'hover:bg-red-100 hover:shadow-md',    border: 'border-red-200'    },
                ]).map(band => {
                  const pct = validCycleDays.length > 0
                    ? Math.round((band.count / validCycleDays.length) * 100)
                    : 0
                  return (
                    <button
                      key={band.key}
                      onClick={() => setSlowModal(band.key)}
                      className={`${band.light} border ${band.border}
                                  rounded-xl p-3 text-left w-full
                                  transition-all cursor-pointer ${band.hover}`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold ${band.text}`}>
                          {band.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${band.text}`}>
                            {band.count}
                          </span>
                          <span className="text-xs bg-white/80 border
                                           px-1.5 py-0.5 rounded-md
                                           opacity-60 font-medium">
                            View →
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${band.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${band.text}`}>
                        {pct}% of closed MCLs
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Row 4: RCRC Analytics Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700">
                🏢 RCRC Performance Analytics
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {rcrcList.length} unique RCRCs • Test records excluded
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'value'      as const, label: '💰 Value'     },
                { key: 'mcls'       as const, label: '📋 MCLs'      },
                { key: 'pieces'     as const, label: '🔩 Pieces'    },
                { key: 'days'       as const, label: '⏱ Fastest'   },
                { key: 'completion' as const, label: '✅ Completion' },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setRcrcSort(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg
                             font-semibold transition-colors ${
                    rcrcSort === s.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {[
                    { label: '#',           align: 'text-left'  },
                    { label: 'RCRC',        align: 'text-left'  },
                    { label: 'MCLs',        align: 'text-right' },
                    { label: 'Closed',      align: 'text-right' },
                    { label: 'Complete%',   align: 'text-right' },
                    { label: 'Est. Value',  align: 'text-right' },
                    { label: 'Avg / MCL',   align: 'text-right' },
                    { label: 'Pieces',      align: 'text-right' },
                    { label: 'Pallets',     align: 'text-right' },
                    { label: '→ Techemet',  align: 'text-right' },
                    { label: '→ Scheduled', align: 'text-right' },
                    { label: '→ Pickup',    align: 'text-right' },
                    { label: '→ Invoice',   align: 'text-right' },
                    { label: 'Full Cycle',  align: 'text-right' },
                    { label: 'Value Bar',   align: 'text-left'  },
                  ].map(h => (
                    <th
                      key={h.label}
                      className={`${h.align} py-2 px-2 font-bold
                                 text-gray-500 whitespace-nowrap`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRCRC.map((rcrc, i) => {
                  const valueBarPct = maxValue > 0
                    ? (rcrc.totalValue / maxValue) * 100
                    : 0
                  const rowColors = [
                    'bg-yellow-50/60',
                    'bg-gray-50/40',
                    'bg-orange-50/40',
                  ]
                  return (
                    <tr
                      key={`${rcrc.number}-${i}`}
                      className={`border-b border-gray-50
                                 hover:bg-blue-50/30 transition-colors ${
                        i < 3 ? rowColors[i] : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 font-bold text-gray-400 text-center">
                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <p className="font-bold text-gray-800 whitespace-nowrap">
                          {rcrc.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          #{rcrc.number}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-gray-700">
                        {rcrc.totalMCLs}
                      </td>
                      <td className="py-2.5 px-2 text-right text-teal-600 font-semibold">
                        {rcrc.closedMCLs}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rcrc.completionRate >= 80
                                  ? 'bg-teal-500'
                                  : rcrc.completionRate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-400'
                              }`}
                              style={{ width: `${rcrc.completionRate}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            rcrc.completionRate >= 80
                              ? 'text-teal-600'
                              : rcrc.completionRate >= 50
                                ? 'text-yellow-600'
                                : 'text-red-500'
                          }`}>
                            {rcrc.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {fmtMoney(rcrc.totalValue)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">
                        {rcrc.closedMCLs > 0
                          ? fmtMoney(rcrc.totalValue / rcrc.closedMCLs)
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">
                        {rcrc.totalPieces.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">
                        {rcrc.totalPallets > 0 ? rcrc.totalPallets.toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgTechhemetDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgTechhemetDays)}`}>{rcrc.avgTechhemetDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgScheduledDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgScheduledDays)}`}>{rcrc.avgScheduledDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgPickupDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgPickupDays)}`}>{rcrc.avgPickupDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgInvoiceDays !== null
                          ? <span className={`font-semibold ${cycleColor(rcrc.avgInvoiceDays)}`}>{rcrc.avgInvoiceDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgCycleDays !== null
                          ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${cycleLabelBg(rcrc.avgCycleDays)}`}>{rcrc.avgCycleDays}d</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 w-28">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${valueBarPct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="py-2.5 px-2 font-bold text-gray-400 text-center">Σ</td>
                  <td className="py-2.5 px-2 font-bold text-gray-700">{rcrcList.length} RCRCs</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{total}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">{closed.length}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">{total > 0 ? Math.round((closed.length / total) * 100) : 0}%</td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-700 whitespace-nowrap">{fmtMoney(totalValue)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-600 whitespace-nowrap">{fmtMoney(avgValuePerMCL)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPieces.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPallets.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToTechemet)}>{avgToTechemet !== null ? `${avgToTechemet}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToScheduled)}>{avgToScheduled !== null ? `${avgToScheduled}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToPickup)}>{avgToPickup !== null ? `${avgToPickup}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgToInvoice)}>{avgToInvoice !== null ? `${avgToInvoice}d` : '—'}</span></td>
                  <td className="py-2.5 px-2 text-right font-bold"><span className={cycleColor(avgFullCycle)}>{avgFullCycle !== null ? `${avgFullCycle}d avg` : '—'}</span></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Row 5: Top Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              💰 Top 10 RCRCs by Value
            </h3>
            <div className="space-y-3">
              {[...rcrcList]
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 10)
                .map((rcrc, i) => {
                  const pct = maxValue > 0
                    ? (rcrc.totalValue / maxValue) * 100 : 0
                  const barColors = [
                    'bg-emerald-500','bg-emerald-400',
                    'bg-teal-500',   'bg-teal-400',
                    'bg-blue-500',   'bg-blue-400',
                    'bg-indigo-500', 'bg-indigo-400',
                    'bg-purple-500', 'bg-purple-400',
                  ]
                  return (
                    <div key={`val-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{rcrc.name}</span>
                          <span className="text-xs text-gray-400">#{rcrc.number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{rcrc.totalMCLs} MCLs</span>
                          <span className="text-xs font-bold text-emerald-700">{fmtMoney(rcrc.totalValue)}</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColors[i] ?? 'bg-gray-400'} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              ⚡ Fastest RCRCs — Avg Cycle Time
            </h3>
            <div className="space-y-3">
              {[...rcrcList]
                .filter(r => r.avgCycleDays !== null && r.closedMCLs >= 2)
                .sort((a, b) => (a.avgCycleDays ?? 999) - (b.avgCycleDays ?? 999))
                .slice(0, 10)
                .map((rcrc, i) => {
                  const days = rcrc.avgCycleDays ?? 0
                  const pct  = maxCycleForBar > 0
                    ? (days / maxCycleForBar) * 100 : 0
                  return (
                    <div key={`spd-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{rcrc.name}</span>
                          <span className="text-xs text-gray-400">({rcrc.closedMCLs} closed)</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cycleLabelBg(days)}`}>
                          {days}d avg
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            days <= 14 ? 'bg-green-500' : days <= 21 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// AuthLoadingScreen
// ─────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 to-gray-100
                    flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🏭</span>
        </div>
        <div className="w-8 h-8 border-4 border-blue-600
                        border-t-transparent rounded-full
                        animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">
          Verifying your access...
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Ford MCL Admin Dashboard
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// NotSignedInScreen
// ─────────────────────────────────────────────────────────
function NotSignedInScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-blue-50 to-gray-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl
                      w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🏭</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          Ford MCL Admin
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Sign in to access the dashboard
        </p>
        <div className="bg-amber-50 border border-amber-100
                        rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">
                Restricted Access
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Only authorized Ford admin accounts
                can access this dashboard.
              </p>
            </div>
          </div>
        </div>
        <a
          href="/admin/login"
          className="w-full flex items-center justify-center
                     gap-2 py-3.5 bg-blue-600 hover:bg-blue-700
                     text-white font-semibold rounded-2xl
                     transition-colors shadow-sm"
        >
          🔐 Go to Login Page
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Ford Motor Company — MCL Scrap Pickup System
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// UnauthorizedScreen
// ─────────────────────────────────────────────────────────
function UnauthorizedScreen({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br
                    from-red-50 to-gray-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl
                      w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl
                        flex items-center justify-center
                        mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your account is not authorized to access this dashboard.
        </p>
        <div className="bg-gray-50 border border-gray-200
                        rounded-2xl p-4 mb-4 text-left">
          <p className="text-xs font-bold text-gray-500 mb-1">
            Signed in as:
          </p>
          <p className="text-sm text-gray-700 font-semibold">{email}</p>
          <p className="text-xs text-red-500 mt-1">❌ Not authorized</p>
        </div>
        <div className="bg-red-50 border border-red-100
                        rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-red-600 mb-2">
            🔒 Authorized Accounts Only:
          </p>
          {ADMIN_EMAILS.map(e => (
            <div key={e} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-300" />
              <p className="text-xs text-red-500">{e}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100
                        rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-blue-600 leading-relaxed">
            💡 If you believe you should have access,
            contact: <strong>gkulkara@ford.com</strong>
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full py-3.5 rounded-2xl bg-red-500
                       hover:bg-red-600 text-white font-semibold
                       transition-colors"
          >
            Sign Out & Try Another Account
          </button>
          <a
            href="/admin/login"
            className="block w-full py-3.5 rounded-2xl bg-gray-100
                       hover:bg-gray-200 text-gray-600 font-semibold
                       transition-colors"
          >
            ← Back to Login
          </a>
        </div>
        <div className="border-t border-gray-100 mt-6 pt-4">
          <p className="text-xs text-gray-300">
            Ford Motor Company — MCL Scrap Pickup System
          </p>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────
// RequestCard
// ─────────────────────────────────────────────────────────
function RequestCard({
  req,
  onStatusChange,
  onView,
  onDelete,
}: {
  req:            PickupRequest
  onStatusChange: (id: number, newStatus: TabKey) => void
  onView:         (req: PickupRequest) => void
  onDelete:       (req: PickupRequest) => void
}) {
  const nextMap: Record<
    TabKey,
    { key: TabKey; label: string; icon: string } | null
  > = {
    total_requests:   null,
    sent_for_pickup:  { key: 'in_transit',       label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived',  label: 'Mark Arrived',    icon: '✅' },
    shipment_arrived: { key: 'closed',            label: 'Close MCL',       icon: '🧾' },
    closed:           null,
  }

  const next = nextMap[req.status as TabKey] ?? null

  const statusStyle: Record<string, string> = {
    total_requests:   'bg-blue-100   text-blue-700',
    sent_for_pickup:  'bg-yellow-100 text-yellow-700',
    in_transit:       'bg-purple-100 text-purple-700',
    shipment_arrived: 'bg-green-100  text-green-700',
    closed:           'bg-teal-100   text-teal-700',
  }

  const statusLabel: Record<string, string> = {
    total_requests:   '📋 New Request',
    sent_for_pickup:  '🚚 Sent for Pickup',
    in_transit:       '🔄 In Transit',
    shipment_arrived: '✅ Shipment Arrived',
    closed:           '🧾 Closed',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-4 flex flex-col gap-3
                    hover:shadow-md transition-shadow">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-medium">
            MCL Number
          </p>
          <p className="text-base font-bold text-gray-800">
            {req.mcl_number ?? '—'}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1
                         rounded-full whitespace-nowrap ${
          statusStyle[req.status] ?? 'bg-gray-100 text-gray-600'
        }`}>
          {statusLabel[req.status] ?? req.status}
        </span>
      </div>

      {/* ── RCRC Info ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">RCRC Name</p>
          <p className="font-semibold text-gray-700 truncate">
            {req.rcrc_name ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">RCRC #</p>
          <p className="font-semibold text-gray-700">
            {req.rcrc_number ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Est. Value</p>
          <p className="font-semibold text-emerald-600">
            {req.fcsd_offer_amount
              ? fmtMoney(req.fcsd_offer_amount)
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Pieces</p>
          <p className="font-semibold text-gray-700">
            {req.total_pieces_quantity?.toLocaleString() ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Pallets</p>
          <p className="font-semibold text-gray-700">
            {req.pallet_quantity ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Requested Date</p>
          <p className="font-semibold text-gray-700">
            {req.requested_pickup_date ?? '—'}
          </p>
        </div>
      </div>

      {/* ── Dates Row ──────────────────────────────── */}
      {(req.date_sent_to_techemet ||
        req.scheduled_pickup_date ||
        req.actual_pickup_date    ||
        req.invoice_submitted_date) && (
        <div className="border-t border-gray-50 pt-2
                        grid grid-cols-2 gap-1.5 text-xs">
          {req.date_sent_to_techemet && (
            <div>
              <p className="text-gray-400">Sent to Techemet</p>
              <p className="font-medium text-gray-600">
                {req.date_sent_to_techemet}
              </p>
            </div>
          )}
          {req.scheduled_pickup_date && (
            <div>
              <p className="text-gray-400">Scheduled Pickup</p>
              <p className="font-medium text-gray-600">
                {req.scheduled_pickup_date}
              </p>
            </div>
          )}
          {req.actual_pickup_date && (
            <div>
              <p className="text-gray-400">Actual Pickup</p>
              <p className="font-medium text-gray-600">
                {req.actual_pickup_date}
              </p>
            </div>
          )}
          {req.invoice_submitted_date && (
            <div>
              <p className="text-gray-400">Invoice Submitted</p>
              <p className="font-medium text-gray-600">
                {req.invoice_submitted_date}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Cycle Days Badge ───────────────────────── */}
      {(() => {
        const cd = daysBetween(
          req.requested_pickup_date,
          req.invoice_submitted_date ??
            new Date().toISOString().slice(0, 10)
        )
        if (cd === null) return null
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5
                          rounded-xl border text-xs font-semibold
                          ${cycleBg(cd)} ${cycleBorder(cd)}`}>
            <span className={cycleColor(cd)}>
              ⏱ {cd} days
            </span>
            <span className={`ml-auto px-2 py-0.5 rounded-full
                             text-xs ${cycleLabelBg(cd)}`}>
              {cycleLabel(cd)}
            </span>
          </div>
        )
      })()}

      {/* ── Admin Notes Preview ────────────────────── */}
      {req.admin_notes && (
        <div className="bg-amber-50 border border-amber-100
                        rounded-xl px-3 py-2 text-xs">
          <p className="text-amber-600 font-semibold mb-0.5">
            📝 Admin Notes
          </p>
          <p className="text-amber-700 line-clamp-2">
            {req.admin_notes}
          </p>
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────── */}
      <div className="flex gap-2 pt-1">

        {/* View / Edit */}
        <button
          onClick={() => onView(req)}
          className="flex-1 py-2 rounded-xl bg-blue-50
                     hover:bg-blue-100 text-blue-700
                     text-xs font-semibold transition-colors
                     border border-blue-100"
        >
          👁 View / Edit
        </button>

        {/* Next Status */}
        {next && (
          <button
            onClick={() => onStatusChange(req.id, next.key)}
            className="flex-1 py-2 rounded-xl bg-gray-50
                       hover:bg-gray-100 text-gray-700
                       text-xs font-semibold transition-colors
                       border border-gray-200"
          >
            {next.icon} {next.label}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(req)}
          className="py-2 px-3 rounded-xl bg-red-50
                     hover:bg-red-100 text-red-400
                     hover:text-red-600 text-xs
                     font-semibold transition-colors
                     border border-red-100"
        >
          🗑
        </button>

      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────
// ViewModal
// ─────────────────────────────────────────────────────────
function ViewModal({
  req,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
}: {
  req:            PickupRequest
  onClose:        () => void
  onSave:         (id: number, data: Partial<PickupRequest>) => Promise<void>
  onStatusChange: (id: number, newStatus: TabKey) => void
  onDelete:       () => void
}) {
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [adminNotes, setAdminNotes] = useState(req.admin_notes ?? '')
  const [mclNumber,  setMclNumber]  = useState(req.mcl_number  ?? '')
  const [offerAmt,   setOfferAmt]   = useState(
    req.fcsd_offer_amount?.toString() ?? ''
  )

  // ── Date Fields ───────────────────────────────────────
  const [dateSentToTechemet,  setDateSentToTechemet]  =
    useState(req.date_sent_to_techemet  ?? '')
  const [scheduledPickupDate, setScheduledPickupDate] =
    useState(req.scheduled_pickup_date  ?? '')
  const [actualPickupDate,    setActualPickupDate]    =
    useState(req.actual_pickup_date     ?? '')
  const [invoiceSubmittedDate,setInvoiceSubmittedDate]=
    useState(req.invoice_submitted_date ?? '')
  const [requestedPickupDate, setRequestedPickupDate] =
    useState(req.requested_pickup_date  ?? '')

  const nextMap: Record<
    TabKey,
    { key: TabKey; label: string; icon: string } | null
  > = {
    total_requests:   null,
    sent_for_pickup:  { key: 'in_transit',      label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived', label: 'Mark Arrived',   icon: '✅' },
    shipment_arrived: { key: 'closed',           label: 'Close MCL',      icon: '🧾' },
    closed:           null,
  }

  const next = nextMap[req.status] ?? null

  const statusStyle: Record<string, string> = {
    total_requests:   'bg-blue-100   text-blue-700',
    sent_for_pickup:  'bg-yellow-100 text-yellow-700',
    in_transit:       'bg-purple-100 text-purple-700',
    shipment_arrived: 'bg-green-100  text-green-700',
    closed:           'bg-teal-100   text-teal-700',
  }

  const statusLabel: Record<string, string> = {
    total_requests:   '📋 New Request',
    sent_for_pickup:  '🚚 Sent for Pickup',
    in_transit:       '🔄 In Transit',
    shipment_arrived: '✅ Shipment Arrived',
    closed:           '🧾 Closed',
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      await onSave(req.id, {
        admin_notes:          adminNotes          || undefined,
        mcl_number:           mclNumber           || undefined,
        fcsd_offer_amount:    offerAmt
          ? parseFloat(offerAmt)
          : undefined,
        date_sent_to_techemet:  dateSentToTechemet  || undefined,
        scheduled_pickup_date:  scheduledPickupDate || undefined,
        actual_pickup_date:     actualPickupDate    || undefined,
        invoice_submitted_date: invoiceSubmittedDate|| undefined,
        requested_pickup_date:  requestedPickupDate || undefined,
      })
      setSaveMsg('✅ Saved successfully!')
      setEditing(false)
    } catch (e) {
      setSaveMsg(
        e instanceof Error ? `❌ ${e.message}` : '❌ Save failed'
      )
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  // ── Cycle Days ────────────────────────────────────────
  const cycleDays = daysBetween(
    requestedPickupDate || req.requested_pickup_date,
    invoiceSubmittedDate || req.invoice_submitted_date ||
      new Date().toISOString().slice(0, 10)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full
                   max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Modal Header ───────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700
                        rounded-t-3xl px-6 py-4
                        flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              MCL Details
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {req.mcl_number ?? `Request #${req.id}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit Toggle */}
            <button
              onClick={() => setEditing(e => !e)}
              className={`text-xs font-semibold px-3 py-1.5
                         rounded-lg transition-colors ${
                editing
                  ? 'bg-white text-blue-700'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }`}
            >
              {editing ? '✕ Cancel Edit' : '✏️ Edit'}
            </button>
            {/* Delete */}
            <button
              onClick={onDelete}
              className="text-xs font-semibold px-3 py-1.5
                         rounded-lg bg-red-500 hover:bg-red-400
                         text-white transition-colors"
            >
              🗑 Delete
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white
                         text-2xl leading-none ml-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Status + Cycle */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5
                             rounded-full ${
              statusStyle[req.status] ?? 'bg-gray-100 text-gray-600'
            }`}>
              {statusLabel[req.status] ?? req.status}
            </span>

            {cycleDays !== null && (
              <span className={`text-xs font-bold px-3 py-1.5
                               rounded-full border
                               ${cycleBg(cycleDays)}
                               ${cycleBorder(cycleDays)}
                               ${cycleColor(cycleDays)}`}>
                ⏱ {cycleDays}d — {cycleLabel(cycleDays)}
              </span>
            )}

            <span className="text-xs text-gray-400 ml-auto">
              Submitted: {fmtDate(req.created_at)}
            </span>
          </div>

          {/* Save Message */}
          {saveMsg && (
            <div className={`text-xs px-4 py-2.5 rounded-xl
                            font-semibold ${
              saveMsg.startsWith('✅')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMsg}
            </div>
          )}

          {/* ── Admin Edit Section ─────────────────── */}
          {editing && (
            <div className="bg-blue-50 border border-blue-200
                            rounded-2xl p-4 space-y-4">
              <p className="text-xs font-bold text-blue-700
                            uppercase tracking-wide">
                ✏️ Admin Edit Fields
              </p>

              {/* MCL Number + Offer Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold
                                   text-gray-600 mb-1">
                    MCL Number
                  </label>
                  <input
                    type="text"
                    value={mclNumber}
                    onChange={e => setMclNumber(e.target.value)}
                    placeholder="e.g. MCL-2024-001"
                    className="w-full text-sm border border-gray-200
                               rounded-xl px-3 py-2 bg-white
                               focus:outline-none focus:ring-2
                               focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold
                                   text-gray-600 mb-1">
                    FCSD Offer Amount ($)
                  </label>
                  <input
                    type="number"
                    value={offerAmt}
                    onChange={e => setOfferAmt(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full text-sm border border-gray-200
                               rounded-xl px-3 py-2 bg-white
                               focus:outline-none focus:ring-2
                               focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Requested Pickup Date',
                    value: requestedPickupDate,
                    setter: setRequestedPickupDate,
                  },
                  {
                    label: 'Date Sent to Techemet',
                    value: dateSentToTechemet,
                    setter: setDateSentToTechemet,
                  },
                  {
                    label: 'Scheduled Pickup Date',
                    value: scheduledPickupDate,
                    setter: setScheduledPickupDate,
                  },
                  {
                    label: 'Actual Pickup Date',
                    value: actualPickupDate,
                    setter: setActualPickupDate,
                  },
                  {
                    label: 'Invoice Submitted Date',
                    value: invoiceSubmittedDate,
                    setter: setInvoiceSubmittedDate,
                  },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-bold
                                     text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="date"
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      className="w-full text-sm border border-gray-200
                                 rounded-xl px-3 py-2 bg-white
                                 focus:outline-none focus:ring-2
                                 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold
                                 text-gray-600 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="w-full text-sm border border-gray-200
                             rounded-xl px-3 py-2 resize-none
                             bg-white focus:outline-none
                             focus:ring-2 focus:ring-blue-400"
                />
              </div>

            </div>
          )}

          {/* ── RCRC Details ───────────────────────── */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500
                          uppercase tracking-wide mb-3">
              🏢 RCRC Information
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {[
                { label: 'RCRC Name',    value: req.rcrc_name            },
                { label: 'RCRC #',       value: req.rcrc_number          },
                { label: 'Contact',      value: req.rcrc_contact_person  },
                { label: 'Email',        value: req.rcrc_email           },
                { label: 'Phone',        value: req.rcrc_phone_number    },
                { label: 'Address',      value: req.rcrc_address         },
                { label: 'Address 2',    value: req.rcrc_address2        },
                { label: 'ZIP',          value: req.rcrc_zip_code        },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-gray-400">{f.label}</p>
                  <p className="font-semibold text-gray-700
                                truncate">
                    {f.value ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Shipment Details ───────────────────── */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500
                          uppercase tracking-wide mb-3">
              📦 Shipment Details
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {[
                { label: 'Scrap Category',  value: req.scrap_category            },
                { label: 'Pallets',         value: req.pallet_quantity           },
                { label: 'Total Pieces',    value: req.total_pieces_quantity     },
                { label: 'Est. Value',      value: fmtMoney(req.fcsd_offer_amount) },
                { label: 'Time Window',     value: req.time_window               },
                { label: 'Special Instruct',value: req.special_instructions      },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-gray-400">{f.label}</p>
                  <p className="font-semibold text-gray-700">
                    {f.value ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline / Dates ───────────────────── */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500
                          uppercase tracking-wide mb-3">
              📅 MCL Timeline
            </p>
            <div className="space-y-2">
              {[
                {
                  label: 'Requested Pickup',
                  value: req.requested_pickup_date,
                  icon:  '📋',
                },
                {
                  label: 'Sent to Techemet',
                  value: req.date_sent_to_techemet,
                  icon:  '📤',
                },
                {
                  label: 'Scheduled Pickup',
                  value: req.scheduled_pickup_date,
                  icon:  '📅',
                },
                {
                  label: 'Actual Pickup',
                  value: req.actual_pickup_date,
                  icon:  '🚛',
                },
                {
                  label: 'Invoice Submitted',
                  value: req.invoice_submitted_date,
                  icon:  '🧾',
                },
              ].map(f => (
                <div
                  key={f.label}
                  className="flex items-center justify-between
                             text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span className="text-gray-500">{f.label}</span>
                  </div>
                  <span className={`font-semibold ${
                    f.value ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {f.value ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Admin Notes Display ────────────────── */}
          {req.admin_notes && !editing && (
            <div className="bg-amber-50 border border-amber-100
                            rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">
                📝 Admin Notes
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {req.admin_notes}
              </p>
            </div>
          )}

        </div>

        {/* ── Modal Footer ───────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100
                        rounded-b-3xl bg-gray-50/50
                        flex flex-wrap gap-2 justify-between
                        items-center">

          {/* Left → Next Status */}
          <div className="flex gap-2">
            {next && (
              <button
                onClick={() => {
                  onStatusChange(req.id, next.key)
                  onClose()
                }}
                className="text-xs font-semibold px-4 py-2
                           rounded-xl bg-gray-800 hover:bg-gray-900
                           text-white transition-colors"
              >
                {next.icon} {next.label}
              </button>
            )}
          </div>

          {/* Right → Save / Close */}
          <div className="flex gap-2 ml-auto">
            {editing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`text-xs font-semibold px-5 py-2
                           rounded-xl text-white transition-colors ${
                  saving
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2
                         rounded-xl bg-gray-200 hover:bg-gray-300
                         text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
