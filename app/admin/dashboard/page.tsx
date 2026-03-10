// app/admin/dashboard/page.tsx
'use client'
export const dynamic = 'force-dynamic'

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

const ADMIN_EMAILS = [
  'girishtrainer@gmail.com',
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

        {/* Sort Controls */}
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

        {/* Table */}
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
  const [rcrcSort, setRcrcSort] = useState<
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

  const fullCycleDays   = realRequests.map(r =>
    daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
  const daysToTechemet  = realRequests.map(r =>
    daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
  const daysToScheduled = realRequests.map(r =>
    daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
  const daysToPickup    = realRequests.map(r =>
    daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
  const daysToInvoice   = realRequests.map(r =>
    daysBetween(r.actual_pickup_date, r.invoice_submitted_date))

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

    rcrc.cycleDays.push(
      daysBetween(r.requested_pickup_date, r.invoice_submitted_date))
    rcrc.techhemetDays.push(
      daysBetween(r.requested_pickup_date, r.date_sent_to_techemet))
    rcrc.scheduledDays.push(
      daysBetween(r.date_sent_to_techemet, r.scheduled_pickup_date))
    rcrc.pickupDays.push(
      daysBetween(r.scheduled_pickup_date, r.actual_pickup_date))
    rcrc.invoiceDays.push(
      daysBetween(r.actual_pickup_date, r.invoice_submitted_date))
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

        {/* ── Row 1: KPI Cards ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Total MCLs',        value: total.toLocaleString(),                                            icon: '📋', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    sub: `${active.length} active`                                                     },
            { label: 'Total Est. Value',  value: fmtMoney(totalValue),                                              icon: '💰', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', sub: fmtMoney(closedValue) + ' closed'                                            },
            { label: 'Avg Value / MCL',   value: fmtMoney(avgValuePerMCL),                                          icon: '📈', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  sub: `from ${closed.length} closed`                                               },
            { label: 'Closed & Invoiced', value: closed.length.toLocaleString(),                                    icon: '🧾', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    sub: `${total > 0 ? Math.round((closed.length / total) * 100) : 0}% completion` },
            { label: 'Total Pallets',     value: totalPallets.toLocaleString(),                                     icon: '📦', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  sub: 'all MCLs'                                                                   },
            { label: 'Total Pieces',      value: totalPieces.toLocaleString(),                                      icon: '🔩', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  sub: 'all MCLs'                                                                   },
            { label: 'Avg Cycle Days',    value: avgFullCycle !== null ? `${avgFullCycle}d` : '—',                  icon: '⏱', color: cycleColor(avgFullCycle), bg: cycleBg(avgFullCycle), border: cycleBorder(avgFullCycle), sub: 'request → invoice'                                    },
            { label: 'Fastest / Slowest', value: validCycleDays.length > 0 ? `${minCycle}d / ${maxCycle}d` : '—',  icon: '⚡', color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200',    sub: 'min / max cycle'                                                            },
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

        {/* ── Row 2: Pipeline ──────────────────────── */}
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
                  <div className="w-full bg-white/60 rounded-full
                                  h-1.5 overflow-hidden">
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

        {/* ── Row 3: Avg Days Per Stage ─────────────── */}
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

        {/* ── Row 4: RCRC Analytics Table ──────────── */}
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
                { key: 'value'      as const, label: '💰 Value'      },
                { key: 'mcls'       as const, label: '📋 MCLs'       },
                { key: 'pieces'     as const, label: '🔩 Pieces'     },
                { key: 'days'       as const, label: '⏱ Fastest'    },
                { key: 'completion' as const, label: '✅ Completion'  },
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
                        <p className="text-gray-400 text-xs">#{rcrc.number}</p>
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
                                rcrc.completionRate >= 80 ? 'bg-teal-500'
                                : rcrc.completionRate >= 50 ? 'bg-yellow-500'
                                : 'bg-red-400'
                              }`}
                              style={{ width: `${rcrc.completionRate}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            rcrc.completionRate >= 80 ? 'text-teal-600'
                            : rcrc.completionRate >= 50 ? 'text-yellow-600'
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
                        {rcrc.closedMCLs > 0 ? fmtMoney(rcrc.totalValue / rcrc.closedMCLs) : '—'}
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
                          ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${cycleLabelBg(rcrc.avgCycleDays)}`}>
                              {rcrc.avgCycleDays}d
                            </span>
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
                  <td className="py-2.5 px-2 text-right font-bold text-teal-600">
                    {total > 0 ? Math.round((closed.length / total) * 100) : 0}%
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-700 whitespace-nowrap">{fmtMoney(totalValue)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-600 whitespace-nowrap">{fmtMoney(avgValuePerMCL)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPieces.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-gray-700">{totalPallets.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToTechemet)}>{avgToTechemet !== null ? `${avgToTechemet}d` : '—'}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToScheduled)}>{avgToScheduled !== null ? `${avgToScheduled}d` : '—'}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToPickup)}>{avgToPickup !== null ? `${avgToPickup}d` : '—'}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgToInvoice)}>{avgToInvoice !== null ? `${avgToInvoice}d` : '—'}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={cycleColor(avgFullCycle)}>{avgFullCycle !== null ? `${avgFullCycle}d avg` : '—'}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Row 5: Top Bar Charts ─────────────────── */}
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
                  const pct = maxValue > 0 ? (rcrc.totalValue / maxValue) * 100 : 0
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
                  const pct  = maxCycleForBar > 0 ? (days / maxCycleForBar) * 100 : 0
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
    { key: 'duplicate',         label: '🔁 Duplicate Request'              },
    { key: 'test_record',       label: '🧪 Test / Demo Record'             },
    { key: 'wrong_information', label: '❌ Incorrect Information Submitted' },
    { key: 'cancelled_by_rcrc', label: '🚫 Cancelled by RCRC'             },
    { key: 'no_longer_needed',  label: '📭 No Longer Needed'               },
    { key: 'other',             label: '📝 Other'                          },
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
      className="fixed inset-0 z-50 flex items-center
                 justify-center bg-black/50
                 backdrop-blur-sm p-4"
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
              <strong>{req.mcl_number ?? `#${req.id}`}</strong>{' '}
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
    total_requests:   { key: 'sent_for_pickup',  label: 'Send for Pickup', icon: '🚚' },
    sent_for_pickup:  { key: 'in_transit',        label: 'Mark In Transit', icon: '🔄' },
    in_transit:       { key: 'shipment_arrived',  label: 'Mark Arrived',    icon: '✅' },
    shipment_arrived: { key: 'closed',            label: 'Close MCL',       icon: '🧾' },
    closed:           null,
  }

  const statusStyle: Record<TabKey, string> = {
    total_requests:   'bg-blue-100   text-blue-700   border-blue-200',
    sent_for_pickup:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_transit:       'bg-purple-100 text-purple-700 border-purple-200',
    shipment_arrived: 'bg-green-100  text-green-700  border-green-200',
    closed:           'bg-teal-100   text-teal-700   border-teal-200',
  }

  const next = nextMap[req.status]

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm hover:shadow-md transition-all
                    duration-200 overflow-hidden">

      {/* Card Top Bar */}
      <div className={`h-1 w-full ${
        req.status === 'total_requests'   ? 'bg-blue-400'   :
        req.status === 'sent_for_pickup'  ? 'bg-yellow-400' :
        req.status === 'in_transit'       ? 'bg-purple-400' :
        req.status === 'shipment_arrived' ? 'bg-green-400'  :
        'bg-teal-400'
      }`} />

      <div className="p-4">

        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-medium">
                MCL Number
              </span>
              {req.mcl_number && (
                <span className="text-xs bg-blue-50 text-blue-600
                                 border border-blue-200 px-2 py-0.5
                                 rounded-full font-bold">
                  {req.mcl_number}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              ID #{req.id} •{' '}
              {new Date(req.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day:   'numeric',
                year:  'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs px-2.5 py-1 rounded-full
                             font-semibold border ${statusStyle[req.status]}`}>
              {req.status.replace(/_/g, ' ')}
            </span>
            {next && (
              <button
                onClick={() => onStatusChange(req.id, next.key)}
                title={next.label}
                className="text-xs px-2.5 py-1 rounded-full
                           bg-gray-100 hover:bg-gray-200
                           text-gray-600 font-semibold
                           transition-colors border border-gray-200"
              >
                {next.icon} {next.label}
              </button>
            )}
          </div>
        </div>

        {/* RCRC Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">RCRC Name</p>
            <p className="text-sm font-bold text-gray-800 truncate">
              {req.rcrc_name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">RCRC #</p>
            <p className="text-sm font-bold text-gray-800">
              {req.rcrc_number ?? '—'}
            </p>
          </div>
        </div>

        {/* Value & Pieces */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-emerald-600 font-medium mb-0.5">
              Est. Value
            </p>
            <p className="text-sm font-bold text-emerald-700">
              {req.fcsd_offer_amount
                ? fmtMoney(req.fcsd_offer_amount)
                : '—'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-purple-600 font-medium mb-0.5">
              Pieces
            </p>
            <p className="text-sm font-bold text-purple-700">
              {req.total_pieces_quantity?.toLocaleString() ?? '—'}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-orange-600 font-medium mb-0.5">
              Pallets
            </p>
            <p className="text-sm font-bold text-orange-700">
              {req.pallet_quantity ?? '—'}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-1.5 mb-3">
          {[
            { label: 'Requested',  value: req.requested_pickup_date  },
            { label: 'Scheduled',  value: req.scheduled_pickup_date  },
            { label: 'Actual Pickup', value: req.actual_pickup_date  },
            { label: 'Invoice Submitted', value: req.invoice_submitted_date },
          ].map(d => (
            <div
              key={d.label}
              className="flex justify-between items-center text-xs"
            >
              <span className="text-gray-400">{d.label}</span>
              <span className={`font-medium ${
                d.value ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {d.value ? fmtDate(d.value) : '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-50">
          <button
            onClick={() => onView(req)}
            className="flex-1 flex items-center justify-center
                       gap-1.5 py-2 rounded-xl bg-blue-50
                       hover:bg-blue-100 text-blue-700
                       text-xs font-semibold transition-colors
                       border border-blue-200"
          >
            ✏️ View / Edit
          </button>
          {next && (
            <button
              onClick={() => onStatusChange(req.id, next.key)}
              className="flex-1 flex items-center justify-center
                         gap-1.5 py-2 rounded-xl bg-green-50
                         hover:bg-green-100 text-green-700
                         text-xs font-semibold transition-colors
                         border border-green-200"
            >
              {next.icon} Send for Pickup
            </button>
          )}
          <button
            onClick={() => onDelete(req)}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100
                       text-red-500 transition-colors
                       border border-red-200"
            title="Delete Request"
          >
            🗑
          </button>
        </div>

      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: session, status } = useSession()

  // ── Core States ──────────────────────────────────────
  const [requests,     setRequests]     = useState<PickupRequest[]>([])
  const [loading,      setLoading]      = useState(true)
  const [syncing,      setSyncing]      = useState(false)
  const [activeTab,    setActiveTab]    = useState<TabKey>('total_requests')
  const [activeNav,    setActiveNav]    = useState<
    'dashboard' | 'analytics' | 'requestors'
  >('dashboard')
  const [viewReq,      setViewReq]      = useState<PickupRequest | null>(null)
  const [deleteReq,    setDeleteReq]    = useState<PickupRequest | null>(null)
  const [toast,        setToast]        = useState<string | null>(null)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [lastSynced,   setLastSynced]   = useState<Date | null>(null)

  // ── Upload Modal States ───────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile,      setUploadFile]      = useState<File | null>(null)
  const [uploadStep,      setUploadStep]      = useState<
    'upload' | 'preview' | 'result'
  >('upload')
  const [previewData,   setPreviewData]   = useState<any[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult,  setUploadResult]  = useState<{
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
  } | null>(null)

  // ── Toast Helper ─────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch Requests ────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pickup_request')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data ?? [])
      setLastSynced(new Date())
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      showToast('❌ Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchRequests()
  }, [status, fetchRequests])

  // ── Sync ─────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true)
    try {
      const res  = await fetch('/api/admin/sync-from-powerautomate',
        { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast(`✅ Synced ${data.count ?? ''} records`)
        fetchRequests()
      } else {
        showToast('❌ Sync failed')
      }
    } catch {
      showToast('❌ Sync error')
    } finally {
      setSyncing(false)
    }
  }

  // ── Status Change ─────────────────────────────────────
  async function handleStatusChange(id: number, newStatus: TabKey) {
    try {
      const res  = await fetch('/api/admin/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`✅ Status updated to ${newStatus.replace(/_/g, ' ')}`)
        fetchRequests()
      } else {
        showToast('❌ Failed to update status')
      }
    } catch {
      showToast('❌ Error updating status')
    }
  }

  // ── Save (View/Edit Modal) ────────────────────────────
  async function handleSave(
    id:      number,
    updates: Partial<PickupRequest>
  ) {
    try {
      const res  = await fetch('/api/admin/update-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, updates }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Request saved successfully')
        setViewReq(null)
        fetchRequests()
      } else {
        showToast('❌ Failed to save request')
      }
    } catch {
      showToast('❌ Error saving request')
    }
  }

  // ── Delete ────────────────────────────────────────────
  async function handleDelete(
    id:           number,
    reason:       string,
    reasonDetail: string
  ) {
    try {
      const res  = await fetch('/api/admin/delete-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, reason, reasonDetail }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Request deleted & archived')
        setDeleteReq(null)
        fetchRequests()
      } else {
        showToast('❌ Failed to delete request')
      }
    } catch {
      showToast('❌ Error deleting request')
    }
  }

  // ── Upload Users Functions ────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      'First Name', 'Last Name', 'RCRC Email',
      'RCRC Number', 'RCRC Name', 'RCRC Address',
      'Phone Number', 'RCRC Contact Person',
      'State', 'Zip Code', 'Role',
    ]
    const sampleRow = [
      'John', 'Doe', 'john.doe@example.com',
      'RCRC001', 'Ford RCRC Center', '123 Main St',
      '9876543210', 'Jane Smith',
      'Michigan', '48126', 'requestor',
    ]
    const csvContent =
      headers.join(',') + '\n' + sampleRow.join(',') + '\n'
    const blob   = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href       = url
    a.download   = 'ford-users-upload-template.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('✅ Template downloaded!')
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n')
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

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      showToast('❌ Please upload a .csv file only')
      return
    }
    setUploadFile(file)
    const text = await file.text()
    const rows = parseCSV(text)
    setPreviewData(rows.slice(0, 5))
    setUploadStep('preview')
  }

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
        showToast(data.error || '❌ Upload failed')
        return
      }
      setUploadResult(data.result)
      setUploadStep('result')
    } catch (error) {
      console.error('Upload error:', error)
      showToast('❌ Upload failed. Please try again.')
    } finally {
      setUploadLoading(false)
    }
  }

  const resetUploadModal = () => {
    setShowUploadModal(false)
    setUploadFile(null)
    setUploadResult(null)
    setUploadStep('upload')
    setPreviewData([])
  }

  // ── Filtered Requests ─────────────────────────────────
  const tabRequests = requests.filter(r => r.status === activeTab)
  const filteredRequests = searchQuery.trim()
    ? tabRequests.filter(r => {
        const q = searchQuery.toLowerCase()
        return (
          r.mcl_number?.toLowerCase().includes(q)       ||
          r.rcrc_name?.toLowerCase().includes(q)        ||
          r.rcrc_number?.toLowerCase().includes(q)      ||
          r.rcrc_email?.toLowerCase().includes(q)       ||
          r.customer_name?.toLowerCase().includes(q)
        )
      })
    : tabRequests

  // ── Tab Counts ────────────────────────────────────────
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = requests.filter(r => r.status === tab.key).length
    return acc
  }, {} as Record<TabKey, number>)

  // ── Auth Guards ───────────────────────────────────────
  if (status === 'loading') return <AuthLoadingScreen />
  if (!session)             return <NotSignedInScreen />
  if (!ADMIN_EMAILS.includes(session.user?.email ?? '')) {
    return <UnauthorizedScreen email={session.user?.email ?? ''} />
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50
                        bg-gray-900 text-white text-sm
                        font-semibold px-5 py-3 rounded-2xl
                        shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200
                         sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl
                              flex items-center justify-center
                              shadow-sm shrink-0">
                <span className="text-lg">🏭</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900
                               leading-tight">
                  Ford MCL Admin
                </h1>
                <p className="text-xs text-gray-400 leading-tight">
                  {lastSynced
                    ? `Synced ${lastSynced.toLocaleTimeString()}`
                    : 'Not synced yet'}
                </p>
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">

              {/* Sync */}
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors bg-blue-600
                           hover:bg-blue-700 text-white
                           disabled:opacity-50 flex items-center gap-1.5"
              >
                {syncing ? '⏳' : '🔄'}
                <span className="hidden sm:inline">
                  {syncing ? 'Syncing...' : 'Sync'}
                </span>
              </button>

              {/* Analytics */}
              <button
                onClick={() => setActiveNav(
                  activeNav === 'analytics' ? 'dashboard' : 'analytics'
                )}
                className={`px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors flex items-center gap-1.5 ${
                  activeNav === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                📊
                <span className="hidden sm:inline">Analytics</span>
              </button>

              {/* Requestors */}
              <a
                href="/admin/requestors"
                className="px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors bg-purple-50
                           hover:bg-purple-100 text-purple-700
                           border border-purple-200
                           flex items-center gap-1.5"
              >
                👥
                <span className="hidden sm:inline">Requestors</span>
              </a>

              {/* ✅ Upload Users Button */}
              <button
                onClick={() => {
                  setUploadStep('upload')
                  setUploadResult(null)
                  setUploadFile(null)
                  setPreviewData([])
                  setShowUploadModal(true)
                }}
                className="px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors bg-green-50
                           hover:bg-green-100 text-green-700
                           border border-green-200
                           flex items-center gap-1.5"
              >
                📤
                <span className="hidden sm:inline">Upload Users</span>
              </button>

              {/* Admins */}
              <a
                href="/admin/admins"
                className="px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors bg-gray-50
                           hover:bg-gray-100 text-gray-700
                           border border-gray-200
                           flex items-center gap-1.5"
              >
                🛡️
                <span className="hidden sm:inline">Admins</span>
              </a>

              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="px-3 py-2 text-sm font-semibold
                           whitespace-nowrap rounded-xl
                           transition-colors bg-red-50
                           hover:bg-red-100 text-red-600
                           border border-red-200
                           flex items-center gap-1.5"
              >
                🚪
                <span className="hidden sm:inline">Sign Out</span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">

        {/* ── Analytics View ─────────────────────────── */}
        {activeNav === 'analytics' && (
          <AnalyticsDashboard requests={requests} />
        )}

        {/* ── Dashboard View ─────────────────────────── */}
        {activeNav === 'dashboard' && (
          <>
            {/* Tab Bar */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5
                             rounded-xl text-sm font-semibold
                             whitespace-nowrap transition-all
                             border shrink-0 ${
                    activeTab === tab.key
                      ? `${tab.bg} ${tab.color} ${tab.border} shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                                   font-bold ${
                    activeTab === tab.key
                      ? `${tab.color} bg-white/70`
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Tab Header */}
            {(() => {
              const tab = TABS.find(t => t.key === activeTab)!
              return (
                <div className={`${tab.bg} border ${tab.border}
                                rounded-2xl p-4 mb-5
                                flex items-center justify-between
                                flex-wrap gap-3`}>
                  <div>
                    <h2 className={`text-lg font-bold ${tab.color}
                                   flex items-center gap-2`}>
                      {tab.icon} {tab.label}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tab.desc} •{' '}
                      {tabCounts[tab.key]} record
                      {tabCounts[tab.key] !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2
                                     -translate-y-1/2 text-gray-400
                                     text-sm">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search MCL, RCRC, email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-4 py-2 text-sm border
                                 border-gray-200 rounded-xl
                                 focus:outline-none focus:ring-2
                                 focus:ring-blue-300 bg-white
                                 w-64 shadow-sm"
                    />
                  </div>
                </div>
              )
            })()}

            {/* Request Cards Grid */}
            {loading ? (
              <div className="flex items-center justify-center
                              py-24">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-blue-600
                                  border-t-transparent rounded-full
                                  animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Loading requests...
                  </p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-lg font-bold text-gray-400">
                  No requests found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'No records in this category yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2
                              lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRequests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onStatusChange={handleStatusChange}
                    onView={setViewReq}
                    onDelete={setDeleteReq}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────── */}

      {/* Delete Modal */}
      {deleteReq && (
        <DeleteModal
          req={deleteReq}
          onClose={() => setDeleteReq(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ✅ Upload Users Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm
                        z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl
                          max-w-2xl w-full p-6
                          max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  📤 Upload Users
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload CSV file to create requestor accounts
                </p>
              </div>
              <button
                onClick={resetUploadModal}
                className="text-gray-400 hover:text-gray-600
                           text-3xl font-light leading-none"
              >
                ×
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              {['Upload', 'Preview', 'Result'].map((step, idx) => {
                const stepKey  = ['upload', 'preview', 'result'][idx]
                const isActive = uploadStep === stepKey
                const isDone   =
                  ['upload', 'preview', 'result']
                    .indexOf(uploadStep) > idx
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex
                                    items-center justify-center
                                    text-xs font-bold
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
                                rounded-2xl p-4 flex items-center
                                justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      📋 Need the template?
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Download CSV template with correct headers
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2
                               rounded-xl text-sm font-semibold
                               hover:bg-blue-700 transition
                               whitespace-nowrap"
                  >
                    ⬇️ Download Template
                  </button>
                </div>

                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-300
                             rounded-2xl p-8 text-center
                             hover:border-blue-400 transition
                             cursor-pointer"
                  onClick={() =>
                    document
                      .getElementById('csv-upload-dashboard')
                      ?.click()
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
                    id="csv-upload-dashboard"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Required Columns */}
                <div className="bg-gray-50 border border-gray-200
                                rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-600
                                mb-2 uppercase">
                    Required Columns:
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      'First Name', 'Last Name',
                      'RCRC Email', 'RCRC Number',
                      'RCRC Name', 'RCRC Address',
                      'Phone Number', 'RCRC Contact Person',
                      'State', 'Zip Code', 'Role',
                    ].map((col, idx) => (
                      <div
                        key={col}
                        className="flex items-center gap-1
                                   text-xs text-gray-600"
                      >
                        <span className="text-blue-500 font-bold">
                          {idx + 1}.
                        </span>
                        {col}
                        {['First Name', 'Last Name',
                          'RCRC Email', 'RCRC Number']
                          .includes(col) && (
                          <span className="text-red-500">*</span>
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
                                rounded-2xl p-3 flex items-center
                                gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      File: {uploadFile?.name}
                    </p>
                    <p className="text-xs text-green-700">
                      Showing first 5 rows preview
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl
                                border border-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-blue-600">
                      <tr>
                        {[
                          'First Name', 'Last Name',
                          'RCRC Email', 'RCRC Number', 'Role',
                        ].map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left
                                       text-white font-semibold
                                       whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map((row: any, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">
                            {row['First Name']  || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['Last Name']   || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row['RCRC Email']  || '—'}
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
                  Each user will receive an email invite
                  to set their own password
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUploadStep('upload')
                      setUploadFile(null)
                      setPreviewData([])
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100
                               text-gray-700 rounded-2xl
                               hover:bg-gray-200 transition
                               font-semibold text-sm"
                  >
                    ← Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadLoading}
                    className="flex-1 px-4 py-3 bg-blue-600
                               text-white rounded-2xl
                               hover:bg-blue-700 transition
                               font-semibold text-sm
                               disabled:opacity-50
                               disabled:cursor-not-allowed"
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
                            d="M4 12a8 8 0 018-8V0C5.373
                            0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Uploading...
                      </span>
                    ) : '📤 Upload & Create Users'}
                  </button>
                </div>

              </div>
            )}

            {/* ── STEP 3: RESULT ── */}
            {uploadStep === 'result' && uploadResult && (
              <div className="space-y-4">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Created',   value: uploadResult.success,    bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  icon: '✅' },
                    { label: 'Duplicate', value: uploadResult.duplicates, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', icon: '⚠️' },
                    { label: 'Skipped',   value: uploadResult.skipped,    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', icon: '⏭️' },
                    { label: 'Failed',    value: uploadResult.failed,     bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    icon: '❌' },
                  ].map(s => (
                    <div
                      key={s.label}
                      className={`${s.bg} border ${s.border}
                                 rounded-2xl p-3 text-center`}
                    >
                      <p className={`text-2xl font-bold ${s.text}`}>
                        {s.value}
                      </p>
                      <p className={`text-xs font-semibold
                                    ${s.text} mt-1`}>
                        {s.icon} {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Successful */}
                {uploadResult.details.successful.length > 0 && (
                  <div className="bg-green-50 border border-green-200
                                  rounded-2xl p-4">
                    <p className="text-sm font-bold text-green-800 mb-2">
                      ✅ Created (
                      {uploadResult.details.successful.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.details.successful.map((u, idx) => (
                        <div key={idx} className="text-xs text-green-700">
                          • <strong>{u.name}</strong> ({u.email})
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-600 mt-2 italic">
                      📧 Invite emails sent to all users
                    </p>
                  </div>
                )}

                {/* Duplicates */}
                {uploadResult.details.duplicate.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200
                                  rounded-2xl p-4">
                    <p className="text-sm font-bold text-yellow-800 mb-2">
                      ⚠️ Duplicates (
                      {uploadResult.details.duplicate.length})
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {uploadResult.details.duplicate.map((u, idx) => (
                        <div key={idx} className="text-xs text-yellow-700">
                          • {u.name} — {u.email} already exists
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped */}
                {uploadResult.details.skipped.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200
                                  rounded-2xl p-4">
                    <p className="text-sm font-bold text-orange-800 mb-2">
                      ⏭️ Skipped (
                      {uploadResult.details.skipped.length})
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {uploadResult.details.skipped.map((s, idx) => (
                        <div key={idx} className="text-xs text-orange-700">
                          • Row {s.row}: {s.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed */}
                {uploadResult.details.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200
                                  rounded-2xl p-4">
                    <p className="text-sm font-bold text-red-800 mb-2">
                      ❌ Failed ({uploadResult.details.failed.length})
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {uploadResult.details.failed.map((f, idx) => (
                        <div key={idx} className="text-xs text-red-700">
                          • {f.email}: {f.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Done Button */}
                <button
                  onClick={resetUploadModal}
                  className="w-full px-4 py-3 bg-blue-600
                             text-white rounded-2xl
                             hover:bg-blue-700 transition
                             font-semibold text-sm"
                >
                  ✅ Done — Close
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
