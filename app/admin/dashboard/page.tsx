'use client'

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
  const [sortBy, setSortBy] = useState<'days' | 'value' | 'rcrc' | 'date'>('days')

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
    .filter(r => r.cycleDays !== null && config.filter(r.cycleDays!))
    .sort((a, b) => {
      switch (sortBy) {
        case 'days':  return (b.cycleDays ?? 0) - (a.cycleDays ?? 0)
        case 'value': return (b.fcsd_offer_amount ?? 0) - (a.fcsd_offer_amount ?? 0)
        case 'rcrc':  return (a.rcrc_name ?? '').localeCompare(b.rcrc_name ?? '')
        case 'date':  return (a.requested_pickup_date ?? '').localeCompare(
                              b.requested_pickup_date ?? '')
        default:      return 0
      }
    })

  const totalValue = mcls.reduce(
    (s, r) => s + (r.fcsd_offer_amount ?? 0), 0
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl
                   max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────── */}
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
              {mcls.length} MCLs • Total Value: {fmtMoney(totalValue)}
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

        {/* ── Sort Controls ──────────────────────────── */}
        <div
          className="px-6 py-3 border-b border-gray-100
                     flex items-center gap-2 flex-wrap bg-gray-50/50"
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

        {/* ── Table ──────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {mcls.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-semibold">No MCLs in this category!</p>
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
                      className={`${h.align} py-2.5 px-2 font-bold
                                 text-gray-500 whitespace-nowrap`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mcls.map((r, i) => {
                  const delayStage =
                    !r.date_sent_to_techemet  ? '⏳ Waiting → Techemet' :
                    !r.scheduled_pickup_date  ? '📅 Waiting → Schedule' :
                    !r.actual_pickup_date     ? '🚛 Waiting → Pickup'   :
                    !r.invoice_submitted_date ? '🧾 Waiting → Invoice'  :
                                               '✅ Complete'

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
                                 hover:bg-red-50/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-gray-400 font-bold">
                        {i + 1}
                      </td>
                      <td className="py-3 px-2 font-bold text-gray-800">
                        {r.mcl_number ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-700 font-semibold
                                     max-w-[120px] truncate">
                        {r.rcrc_name ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {r.rcrc_number ?? '—'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full
                                         font-semibold whitespace-nowrap ${
                          statusStyle[r.status] ?? 'bg-gray-100 text-gray-600'
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
                                         rounded-full text-xs ${config.badge}`}>
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
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td colSpan={7} className="py-2.5 px-2 text-gray-600">
                    Total — {mcls.length} MCLs
                  </td>
                  <td className="py-2.5 px-2 text-right text-emerald-700">
                    {fmtMoney(totalValue)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-gray-600">
                    {mcls
                      .reduce((s, r) => s + (r.total_pieces_quantity ?? 0), 0)
                      .toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`text-xs px-2 py-0.5
                                     rounded-full ${config.badge}`}>
                      avg{' '}
                      {Math.round(
                        mcls.reduce((s, r) => s + (r.cycleDays ?? 0), 0) /
                        (mcls.length || 1)
                      )}d
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
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
function AnalyticsDashboard({ requests }: { requests: PickupRequest[] }) {
  const dashboardRef                    = useRef<HTMLDivElement>(null)
  const [exporting,  setExporting]      = useState(false)
  const [slowModal,  setSlowModal]      = useState<'fast' | 'normal' | 'slow' | null>(null)
  const [rcrcSort,   setRcrcSort]       = useState<
    'value' | 'mcls' | 'days' | 'pieces' | 'completion'
  >('value')

  // ── Filter test records ──────────────────────────────────
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

  // ── Core Stats ───────────────────────────────────────────
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

  // ── Cycle Days ───────────────────────────────────────────
  const fullCycleDays   = realRequests.map(r =>
    daysBetween(r.requested_pickup_date, r.invoice_submitted_date)
  )
  const daysToTechemet  = realRequests.map(r =>
    daysBetween(r.requested_pickup_date, r.date_sent_to_techemet)
  )
  const daysToScheduled = realRequests.map(r =>
    daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date)
  )
  const daysToPickup    = realRequests.map(r =>
    daysBetween(r.scheduled_pickup_date, r.actual_pickup_date)
  )
  const daysToInvoice   = realRequests.map(r =>
    daysBetween(r.actual_pickup_date, r.invoice_submitted_date)
  )

  const avgFullCycle   = avgDays(fullCycleDays)
  const avgToTechemet  = avgDays(daysToTechemet)
  const avgToScheduled = avgDays(daysToScheduled)
  const avgToPickup    = avgDays(daysToPickup)
  const avgToInvoice   = avgDays(daysToInvoice)

  const validCycleDays = fullCycleDays.filter((v): v is number => v !== null)
  const minCycle       = validCycleDays.length > 0 ? Math.min(...validCycleDays) : 0
  const maxCycle       = validCycleDays.length > 0 ? Math.max(...validCycleDays) : 0

  // ── RCRC Map ─────────────────────────────────────────────
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

    rcrc.cycleDays.push(
      daysBetween(r.requested_pickup_date, r.invoice_submitted_date)
    )
    rcrc.techhemetDays.push(
      daysBetween(r.requested_pickup_date, r.date_sent_to_techemet)
    )
    rcrc.scheduledDays.push(
      daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date)
    )
    rcrc.pickupDays.push(
      daysBetween(r.scheduled_pickup_date, r.actual_pickup_date)
    )
    rcrc.invoiceDays.push(
      daysBetween(r.actual_pickup_date, r.invoice_submitted_date)
    )
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
    ...rcrcList
      .filter(r => r.avgCycleDays !== null)
      .map(r => r.avgCycleDays!),
    1
  )

  // ── Pipeline ─────────────────────────────────────────────
  const pipeline = [
    { key: 'total_requests',   label: 'New',        icon: '📋', count: newRequests.length,   color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    { key: 'sent_for_pickup',  label: 'Sent',       icon: '🚚', count: sentForPickup.length, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { key: 'in_transit',       label: 'In Transit', icon: '🔄', count: inTransit.length,     color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { key: 'shipment_arrived', label: 'Arrived',    icon: '✅', count: arrived.length,       color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    { key: 'closed',           label: 'Closed',     icon: '🧾', count: closed.length,        color: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  ]

  // ── PDF Export ───────────────────────────────────────────
  async function exportToPDF() {
    if (!dashboardRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF       = (await import('jspdf')).default
      const canvas      = await html2canvas(dashboardRef.current, {
        scale:           2,
        useCORS:         true,
        backgroundColor: '#f8fafc',
        logging:         false,
      })
      const imgData   = canvas.toDataURL('image/png')
      const pdf       = new jsPDF({
        orientation: 'landscape',
        unit:        'mm',
        format:      'a3',
      })
      const pdfWidth  = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(
        `ford-scrap-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`
      )
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  // ── Email Report ─────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────
  return (
    <div>
      {/* Export Buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600
                     hover:bg-blue-700 text-white text-sm font-semibold
                     rounded-xl shadow-sm transition-colors disabled:opacity-50"
        >
          {exporting ? '⏳ Generating...' : '📄 Export PDF'}
        </button>
        <button
          onClick={sendDailyEmail}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600
                     hover:bg-emerald-700 text-white text-sm font-semibold
                     rounded-xl shadow-sm transition-colors"
        >
          📧 Email Report
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-5 mb-8">

        {/* Slow MCLs Modal */}
        {slowModal && (
          <SlowMCLsModal
            requests={requests}
            band={slowModal}
            onClose={() => setSlowModal(null)}
          />
        )}

        {/* ── Row 1: KPI Cards ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            {
              label:  'Total MCLs',
              value:  total.toLocaleString(),
              icon:   '📋',
              color:  'text-blue-700',
              bg:     'bg-blue-50',
              border: 'border-blue-200',
              sub:    `${active.length} active`,
            },
            {
              label:  'Total Est. Value',
              value:  fmtMoney(totalValue),
              icon:   '💰',
              color:  'text-emerald-700',
              bg:     'bg-emerald-50',
              border: 'border-emerald-200',
              sub:    fmtMoney(closedValue) + ' closed',
            },
            {
              label:  'Avg Value / MCL',
              value:  fmtMoney(avgValuePerMCL),
              icon:   '📈',
              color:  'text-indigo-700',
              bg:     'bg-indigo-50',
              border: 'border-indigo-200',
              sub:    `from ${closed.length} closed`,
            },
            {
              label:  'Closed & Invoiced',
              value:  closed.length.toLocaleString(),
              icon:   '🧾',
              color:  'text-teal-700',
              bg:     'bg-teal-50',
              border: 'border-teal-200',
              sub:    `${total > 0
                ? Math.round((closed.length / total) * 100)
                : 0}% completion`,
            },
            {
              label:  'Total Pallets',
              value:  totalPallets.toLocaleString(),
              icon:   '📦',
              color:  'text-orange-700',
              bg:     'bg-orange-50',
              border: 'border-orange-200',
              sub:    'all MCLs',
            },
            {
              label:  'Total Pieces',
              value:  totalPieces.toLocaleString(),
              icon:   '🔩',
              color:  'text-purple-700',
              bg:     'bg-purple-50',
              border: 'border-purple-200',
              sub:    'all MCLs',
            },
            {
              label:  'Avg Cycle Days',
              value:  avgFullCycle !== null ? `${avgFullCycle}d` : '—',
              icon:   '⏱',
              color:  cycleColor(avgFullCycle),
              bg:     cycleBg(avgFullCycle),
              border: cycleBorder(avgFullCycle),
              sub:    'request → invoice',
            },
            {
              label:  'Fastest / Slowest',
              value:  validCycleDays.length > 0
                ? `${minCycle}d / ${maxCycle}d`
                : '—',
              icon:   '⚡',
              color:  'text-gray-700',
              bg:     'bg-gray-50',
              border: 'border-gray-200',
              sub:    'min / max cycle',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.bg} ${stat.border}
                          p-3 flex flex-col gap-1`}
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

        {/* ── Row 2: Pipeline ──────────────────────────── */}
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
                {total > 0
                  ? Math.round((closed.length / total) * 100)
                  : 0}%
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

        {/* ── Row 3: Avg Days Per Stage ─────────────────── */}
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

          {/* Cycle Distribution — Clickable */}
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

        {/* ── Row 4: RCRC Analytics Table ──────────────── */}
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
                      <td className="py-2.5 px-2 text-right font-bold
                                     text-emerald-700 whitespace-nowrap">
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
                        {rcrc.totalPallets > 0
                          ? rcrc.totalPallets.toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgTechhemetDays !== null ? (
                          <span className={`font-semibold ${cycleColor(rcrc.avgTechhemetDays)}`}>
                            {rcrc.avgTechhemetDays}d
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgScheduledDays !== null ? (
                          <span className={`font-semibold ${cycleColor(rcrc.avgScheduledDays)}`}>
                            {rcrc.avgScheduledDays}d
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgPickupDays !== null ? (
                          <span className={`font-semibold ${cycleColor(rcrc.avgPickupDays)}`}>
                            {rcrc.avgPickupDays}d
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgInvoiceDays !== null ? (
                          <span className={`font-semibold ${cycleColor(rcrc.avgInvoiceDays)}`}>
                            {rcrc.avgInvoiceDays}d
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {rcrc.avgCycleDays !== null ? (
                          <span className={`inline-flex items-center gap-1
                            px-2 py-0.5 rounded-full font-bold text-xs
                            ${cycleLabelBg(rcrc.avgCycleDays)}`}>
                            {rcrc.avgCycleDays}d
                          </span>
                        ) : <span className="text-gray-300">—</span>}
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
                  <td className="py-2.5 px-2 font-bold text-gray-700">
                    {rcrcList.length} RCRCs
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">
                    {total}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">
                    {closed.length}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">
                    {total > 0 ? Math.round((closed.length / total) * 100) : 0}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold
                                 text-emerald-700 whitespace-nowrap">
                    {fmtMoney(totalValue)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold
                                 text-gray-600 whitespace-nowrap">
                    {fmtMoney(avgValuePerMCL)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">
                    {totalPieces.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">
                    {totalPallets.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToTechemet)}>
                      {avgToTechemet !== null ? `${avgToTechemet}d` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToScheduled)}>
                      {avgToScheduled !== null ? `${avgToScheduled}d` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToPickup)}>
                      {avgToPickup !== null ? `${avgToPickup}d` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToInvoice)}>
                      {avgToInvoice !== null ? `${avgToInvoice}d` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgFullCycle)}>
                      {avgFullCycle !== null ? `${avgFullCycle}d avg` : '—'}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Row 5: Top Bar Charts ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Top 10 By Value */}
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
                    ? (rcrc.totalValue / maxValue) * 100
                    : 0
                  const barColors = [
                    'bg-emerald-500', 'bg-emerald-400',
                    'bg-teal-500',    'bg-teal-400',
                    'bg-blue-500',    'bg-blue-400',
                    'bg-indigo-500',  'bg-indigo-400',
                    'bg-purple-500',  'bg-purple-400',
                  ]
                  return (
                    <div key={`val-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">
                            {i + 1}.
                          </span>
                          <span className="text-xs font-semibold text-gray-700
                                           truncate max-w-[150px]">
                            {rcrc.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            #{rcrc.number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {rcrc.totalMCLs} MCLs
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            {fmtMoney(rcrc.totalValue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            barColors[i] ?? 'bg-gray-400'
                          } rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Fastest RCRCs by Avg Cycle Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              ⚡ Fastest RCRCs — Avg Cycle Time
            </h3>
            <div className="space-y-3">
              {[...rcrcList]
                .filter(r => r.avgCycleDays !== null && r.closedMCLs >= 2)
                .sort((a, b) =>
                  (a.avgCycleDays ?? 999) - (b.avgCycleDays ?? 999)
                )
                .slice(0, 10)
                .map((rcrc, i) => {
                  const days = rcrc.avgCycleDays ?? 0
                  const pct  = maxCycleForBar > 0
                    ? (days / maxCycleForBar) * 100
                    : 0
                  return (
                    <div key={`spd-${rcrc.number}-${i}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">
                            {i + 1}.
                          </span>
                          <span className="text-xs font-semibold text-gray-700
                                           truncate max-w-[150px]">
                            {rcrc.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({rcrc.closedMCLs} closed)
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5
                                          rounded-full ${cycleLabelBg(days)}`}>
                          {days}d avg
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            days <= 14
                              ? 'bg-green-500'
                              : days <= 21
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
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
// DeleteModal
// ─────────────────────────────────────────────────────────
function DeleteModal({
  req,
  onClose,
  onConfirm,
}: {
  req:       PickupRequest
  onClose:   () => void
  onConfirm: (
    id:           number,
    reason:       string,
    reasonDetail: string
  ) => Promise<void>
}) {
  const [reason,       setReason]       = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [deleting,     setDeleting]     = useState(false)
  const [confirmed,    setConfirmed]    = useState(false)

  const reasons = [
    { key: 'duplicate',         label: '🔁 Duplicate Request'               },
    { key: 'test_record',       label: '🧪 Test / Demo Record'              },
    { key: 'wrong_information', label: '❌ Incorrect Information Submitted'  },
    { key: 'cancelled_by_rcrc', label: '🚫 Cancelled by RCRC'              },
    { key: 'no_longer_needed',  label: '📭 No Longer Needed'                },
    { key: 'other',             label: '📝 Other'                           },
  ]

  async function handleConfirm() {
    if (!reason)    return
    if (!confirmed) return
    setDeleting(true)
    await onConfirm(req.id, reason, reasonDetail)
    setDeleting(false)
  }

  const canDelete = reason && confirmed && !deleting

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100
                        rounded-t-3xl px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗑️</span>
            <div>
              <h2 className="text-lg font-bold text-red-700">
                Delete Request
              </h2>
              <p className="text-xs text-red-400 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Request Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">MCL #</span>
              <span className="font-bold text-gray-700">
                {req.mcl_number ?? '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">RCRC</span>
              <span className="font-semibold text-gray-700">
                {req.rcrc_name ?? '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Status</span>
              <span className="font-semibold text-gray-700 capitalize">
                {req.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Requestor Email</span>
              <span className="font-semibold text-blue-600
                               truncate max-w-[180px]">
                {req.rcrc_email ?? req.email ?? '—'}
              </span>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-bold
                              text-gray-600 mb-2">
              Reason for Deletion{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {reasons.map(r => (
                <button
                  key={r.key}
                  onClick={() => setReason(r.key)}
                  className={`w-full text-left text-sm px-4 py-2.5
                             rounded-xl border font-medium
                             transition-all ${
                    reason === r.key
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {r.label}
                  {reason === r.key && (
                    <span className="float-right text-red-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold
                              text-gray-600 mb-1.5">
              Additional Notes{' '}
              <span className="text-gray-400 font-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              value={reasonDetail}
              onChange={e => setReasonDetail(e.target.value)}
              placeholder="Add any additional context..."
              rows={2}
              className="w-full text-sm border border-gray-200
                         rounded-xl px-3 py-2 resize-none
                         focus:outline-none focus:ring-2
                         focus:ring-red-300 bg-gray-50"
            />
          </div>

          {/* Email Notice */}
          <div className="flex items-start gap-2 bg-blue-50
                          border border-blue-100 rounded-xl p-3">
            <span className="text-base mt-0.5">📧</span>
            <p className="text-xs text-blue-700">
              An email will be sent to{' '}
              <strong>
                {req.rcrc_email ?? req.email ?? 'the requestor'}
              </strong>{' '}
              notifying them of this deletion and its reason.
            </p>
          </div>

          {/* Audit Notice */}
          <div className="flex items-start gap-2 bg-amber-50
                          border border-amber-100 rounded-xl p-3">
            <span className="text-base mt-0.5">📋</span>
            <p className="text-xs text-amber-700">
              This request will be permanently deleted from
              the main table but{' '}
              <strong>archived in Supabase</strong> under{' '}
              <code className="bg-amber-100 px-1 rounded text-xs">
                deleted_requests
              </code>{' '}
              for audit purposes.
            </p>
          </div>

          {/* Confirm Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer"
            />
            <span className="text-xs text-gray-600">
              I understand this will delete MCL{' '}
              <strong>
                {req.mcl_number ?? `#${req.id}`}
              </strong>{' '}
              and notify the requestor by email. This record
              will be archived for audit purposes.
            </span>
          </label>

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100
                       hover:bg-gray-200 text-gray-700
                       font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete}
            className={`flex-1 py-2.5 rounded-xl font-semibold
                       text-sm transition-all ${
              canDelete
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {deleting ? '⏳ Deleting...' : '🗑️ Delete & Notify'}
          </button>
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
    sent_for_pickup:  { key: 'in_transit',      label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived', label: 'Mark Arrived',   icon: '✅' },
    shipment_arrived: { key: 'closed',           label: 'Close MCL',      icon: '🧾' },
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

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-medium">MCL Number</p>
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

      {/* RCRC Info */}
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
      </div>

      {/* Dates */}
      <div className="text-xs space-y-1 pt-2 border-t border-gray-50">
        <div className="flex justify-between">
          <span className="text-gray-400">Requested</span>
          <span className="text-gray-600">
            {req.requested_pickup_date ?? '—'}
          </span>
        </div>
        {req.date_sent_to_techemet && (
          <div className="flex justify-between">
            <span className="text-gray-400">Sent to Techemet</span>
            <span className="text-yellow-600 font-semibold">
              {req.date_sent_to_techemet}
            </span>
          </div>
        )}
        {req.scheduled_pickup_date && (
          <div className="flex justify-between">
            <span className="text-gray-400">Scheduled</span>
            <span className="text-purple-600 font-semibold">
              {req.scheduled_pickup_date}
            </span>
          </div>
        )}
        {req.actual_pickup_date && (
          <div className="flex justify-between">
            <span className="text-gray-400">Picked Up</span>
            <span className="text-green-600 font-semibold">
              {req.actual_pickup_date}
            </span>
          </div>
        )}
        {req.invoice_submitted_date && (
          <div className="flex justify-between">
            <span className="text-gray-400">Invoiced</span>
            <span className="text-teal-600 font-semibold">
              {req.invoice_submitted_date}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">

        {/* View Button */}
        <button
          onClick={() => onView(req)}
          className="flex-1 py-2 px-3 rounded-xl bg-gray-100
                     hover:bg-gray-200 text-gray-700 text-xs
                     font-semibold transition-colors"
        >
          👁 View
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(req)}
          className="py-2 px-3 rounded-xl bg-red-50
                     hover:bg-red-100 text-red-500 text-xs
                     font-semibold transition-colors
                     border border-red-100"
        >
          🗑️
        </button>

        {/* Status Button */}
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
              : req.status === 'total_requests'
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {req.status === 'closed'
              ? '🧾 Closed'
              : req.status === 'total_requests'
                ? '⏳ Awaiting Techemet'
                : '✅ Completed'}
          </div>
        )}

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
  onStatusChange,
  onSave,
  onDelete,
}: {
  req:            PickupRequest
  onClose:        () => void
  onStatusChange: (id: number, newStatus: TabKey) => Promise<void>
  onSave:         (id: number, data: Partial<PickupRequest>) => Promise<void>
  onDelete:       () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState<Partial<PickupRequest>>({
    mcl_number:             req.mcl_number,
    fcsd_offer_amount:      req.fcsd_offer_amount,
    admin_notes:            req.admin_notes,
    rcrc_name:              req.rcrc_name,
    rcrc_number:            req.rcrc_number,
    rcrc_contact_person:    req.rcrc_contact_person,
    rcrc_email:             req.rcrc_email,
    rcrc_phone_number:      req.rcrc_phone_number,
    rcrc_address:           req.rcrc_address,
    city:                   req.city,
    state:                  req.state,
    rcrc_zip_code:          req.rcrc_zip_code,
    time_window:            req.time_window,
    pallet_quantity:        req.pallet_quantity,
    total_pieces_quantity:  req.total_pieces_quantity,
    requested_pickup_date:  req.requested_pickup_date,
    date_sent_to_techemet:  req.date_sent_to_techemet,
    scheduled_pickup_date:  req.scheduled_pickup_date,
    actual_pickup_date:     req.actual_pickup_date,
    invoice_submitted_date: req.invoice_submitted_date,
  })

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

  const next = nextMap[req.status as TabKey] ?? null

  async function handleSave() {
    setSaving(true)
    await onSave(req.id, form)
    setSaving(false)
    setEditing(false)
  }

  function Field({
    label,
    field,
    type = 'text',
  }: {
    label: string
    field: keyof PickupRequest
    type?: string
  }) {
    const val = form[field]
    return (
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {editing ? (
          <input
            type={type}
            value={val?.toString() ?? ''}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                [field]: type === 'number'
                  ? (e.target.value === ''
                      ? undefined
                      : Number(e.target.value))
                  : e.target.value || undefined,
              }))
            }
            className="w-full text-sm font-semibold text-gray-700
                       bg-white border border-blue-200 rounded-lg
                       px-2 py-1 focus:outline-none focus:ring-2
                       focus:ring-blue-300"
          />
        ) : (
          <p className="font-semibold text-gray-700 text-sm">
            {val?.toString() ?? '—'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl
                   max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              MCL #{req.mcl_number ?? '—'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {req.rcrc_name} • #{req.rcrc_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(prev => !prev)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold
                         transition-colors ${
                editing
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {editing ? '✕ Cancel' : '✏️ Edit'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600
                         text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Fields Grid ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Field label="MCL Number"          field="mcl_number"             />
          <Field label="Est. Value ($)"      field="fcsd_offer_amount"      type="number" />
          <Field label="RCRC Name"           field="rcrc_name"              />
          <Field label="RCRC Number"         field="rcrc_number"            />
          <Field label="Contact Person"      field="rcrc_contact_person"    />
          <Field label="Email"               field="rcrc_email"             />
          <Field label="Phone"               field="rcrc_phone_number"      />
          <Field label="Address"             field="rcrc_address"           />
          <Field label="City"               field="city"                    />
          <Field label="State"              field="state"                   />
          <Field label="ZIP"                field="rcrc_zip_code"           />
          <Field label="Time Window"        field="time_window"             />
          <Field label="Pallets"            field="pallet_quantity"         type="number" />
          <Field label="Pieces"             field="total_pieces_quantity"   type="number" />
          <Field label="Requested Date"     field="requested_pickup_date"   type="date"   />
          <Field label="Sent to Techemet"   field="date_sent_to_techemet"   type="date"   />
          <Field label="Scheduled Date"     field="scheduled_pickup_date"   type="date"   />
          <Field label="Actual Pickup"      field="actual_pickup_date"      type="date"   />
          <Field label="Invoice Submitted"  field="invoice_submitted_date"  type="date"   />
        </div>

        {/* ── Admin Notes ─────────────────────────────── */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5">
          <p className="text-xs text-gray-400 mb-1">Admin Notes</p>
          {editing ? (
            <textarea
              value={form.admin_notes ?? ''}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  admin_notes: e.target.value || undefined,
                }))
              }
              rows={3}
              className="w-full text-sm font-semibold text-gray-700
                         bg-white border border-blue-200 rounded-lg
                         px-2 py-1 focus:outline-none focus:ring-2
                         focus:ring-blue-300 resize-none"
            />
          ) : (
            <p className="text-sm font-semibold text-gray-700">
              {req.admin_notes ?? '—'}
            </p>
          )}
        </div>

        {/* ── Action Buttons ──────────────────────────── */}
        <div className="flex gap-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100
                           hover:bg-gray-200 text-gray-700
                           font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600
                           hover:bg-emerald-700 text-white font-semibold
                           text-sm transition-colors disabled:opacity-50"
              >
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </>
          ) : (
            <>
              {/* Close */}
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-100
                           hover:bg-gray-200 text-gray-700
                           font-semibold text-sm transition-colors"
              >
                Close
              </button>

              {/* Delete */}
              <button
                onClick={onDelete}
                className="py-2.5 px-4 rounded-xl bg-red-50
                           hover:bg-red-100 text-red-600
                           font-semibold text-sm transition-colors
                           border border-red-100"
              >
                🗑️ Delete
              </button>

              {/* Status Advance */}
              {next && (
                <button
                  onClick={() => {
                    onStatusChange(req.id, next.key)
                    onClose()
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600
                             hover:bg-blue-700 text-white font-semibold
                             text-sm transition-colors"
                >
                  {next.icon} {next.label}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────
// AdminDashboard — main export
// ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [requests,      setRequests]      = useState<PickupRequest[]>([])
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState<TabKey>('total_requests')
  const [search,        setSearch]        = useState('')
  const [viewReq,       setViewReq]       = useState<PickupRequest | null>(null)
  const [deleteReq,     setDeleteReq]     = useState<PickupRequest | null>(null)
  const [deleteMsg,     setDeleteMsg]     = useState('')
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

  // ── Real-time Subscription ────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('pickup_request_changes')
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'pickup_request',
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [
              payload.new as PickupRequest,
              ...prev,
            ])
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(r =>
                r.id === (payload.new as PickupRequest).id
                  ? (payload.new as PickupRequest)
                  : r
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev =>
              prev.filter(
                r => r.id !== (payload.old as PickupRequest).id
              )
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

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

  // ── Handle Delete ─────────────────────────────────────
  const handleDelete = useCallback(async (
    id:           number,
    reason:       string,
    reasonDetail: string
  ) => {
    try {
      const res = await fetch('/api/admin/delete-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, reason, reasonDetail }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Delete failed')

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== id))
      setDeleteReq(null)
      setViewReq(null)

      setDeleteMsg(
        `✅ Deleted & archived. Email sent: ${
          data.emailSent ? 'Yes' : 'No email on file'
        }`
      )
      setTimeout(() => setDeleteMsg(''), 6000)

    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }, [])

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
      setSyncMsg(
        `✅ Refreshed! ${new Date().toLocaleTimeString()}`
      )
    } catch (e) {
      setSyncMsg(
        e instanceof Error ? `❌ ${e.message}` : '❌ Sync failed'
      )
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }, [fetchRequests])

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

  // ── Export CSV ────────────────────────────────────────
  function exportCSV() {
    const headers = [
      'ID', 'MCL #', 'RCRC Name', 'RCRC #',
      'Contact', 'Email', 'Phone',
      'Address', 'City', 'State', 'ZIP',
      'Time Window', 'Pallets', 'Total Pieces', 'Est Value',
      'Requested Pickup', 'Sent to Techemet',
      'Scheduled Pickup', 'Actual Pickup',
      'Invoice Submitted',
      'Status', 'Admin Notes', 'Submitted',
    ]

    const rows = requests.map(r => [
      r.id,
      r.mcl_number             ?? '',
      r.rcrc_name              ?? '',
      r.rcrc_number            ?? '',
      r.rcrc_contact_person    ?? '',
      r.rcrc_email             ?? '',
      r.rcrc_phone_number      ?? '',
      r.rcrc_address           ?? '',
      r.city                   ?? '',
      r.state                  ?? '',
      r.rcrc_zip_code          ?? '',
      r.time_window            ?? '',
      r.pallet_quantity        ?? '',
      r.total_pieces_quantity  ?? '',
      r.fcsd_offer_amount      ?? '',
      r.requested_pickup_date  ?? '',
      r.date_sent_to_techemet  ?? '',
      r.scheduled_pickup_date  ?? '',
      r.actual_pickup_date     ?? '',
      r.invoice_submitted_date ?? '',
      r.status,
      r.admin_notes            ?? '',
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
    a.download = `mcl-requests-${
      new Date().toISOString().slice(0, 10)
    }.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ──────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100
                      sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between
                          gap-3 flex-wrap">

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
                <span className={`text-xs px-3 py-1.5 rounded-lg
                                 font-medium ${
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
                📊 {showAnalytics ? 'Hide Analytics' : 'Analytics'}
              </button>

              {/* Sync Excel */}
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
                {syncing ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span>
                    Syncing...
                  </>
                ) : (
                  <>🔄 Sync Excel</>
                )}
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
          <div className="mb-6">
            <AnalyticsDashboard requests={requests} />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200
                          rounded-xl p-4 mb-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Delete Success Banner */}
        {deleteMsg && (
          <div className="bg-green-50 border border-green-200
                          rounded-xl p-4 mb-4 text-sm text-green-700
                          flex justify-between items-center">
            <span>{deleteMsg}</span>
            <button
              onClick={() => setDeleteMsg('')}
              className="text-green-400 hover:text-green-600 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5
                        scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-2
                         px-4 py-2.5 rounded-xl text-sm font-semibold
                         transition-all duration-200 border ${
                activeTab === tab.key
                  ? `${tab.bg} ${tab.color} ${tab.border} shadow-sm`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full
                               font-bold ${
                activeTab === tab.key
                  ? `${tab.color} bg-white/70`
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Tab Description */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">
              {TABS.find(t => t.key === activeTab)?.icon}{' '}
              {TABS.find(t => t.key === activeTab)?.label}
            </p>
            <p className="text-xs text-gray-400">
              {TABS.find(t => t.key === activeTab)?.desc}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} record
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by MCL #, RCRC name, contact..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border
                       border-gray-200 rounded-xl text-sm
                       focus:ring-2 focus:ring-blue-500
                       focus:border-transparent outline-none
                       transition"
          />
          <span className="absolute left-3 top-1/2
                           -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2
                         -translate-y-1/2 text-gray-400
                         hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-600
                             border-t-transparent rounded-full
                             animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Loading requests...
              </p>
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
                : `No ${
                    TABS.find(t => t.key === activeTab)?.label
                  } yet`
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
                onDelete={setDeleteReq}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── View & Edit Modal ────────────────────────── */}
      {viewReq && (
        <ViewModal
          req={viewReq}
          onClose={() => setViewReq(null)}
          onSave={handleAdminSave}
          onStatusChange={handleStatusChange}
          onDelete={() => {
            setDeleteReq(viewReq)
            setViewReq(null)
          }}
        />
      )}

      {/* ── Delete Modal ──────────────────────────────── */}
      {deleteReq && (
        <DeleteModal
          req={deleteReq}
          onClose={() => setDeleteReq(null)}
          onConfirm={handleDelete}
        />
      )}

    </div>
  )
}
