import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Auto Determine Status Based On Dates ─────────────────
// Priority: invoice → shipment_arrived → in_transit
//         → sent_for_pickup → total_requests
function determineStatus(
  mapped: ReturnType<typeof mapRow>
): string {
  if (mapped.invoice_submitted_date)  return 'closed'
  if (mapped.actual_pickup_date)      return 'shipment_arrived'
  if (mapped.scheduled_pickup_date)   return 'in_transit'
  if (mapped.date_sent_to_techemet)   return 'sent_for_pickup'
  return 'total_requests'
}

// ── Convert Excel Serial Date → YYYY-MM-DD ───────────────
function excelDateToISO(value: unknown): string | null {
  if (!value && value !== 0)  return null
  if (value === 'null')       return null
  if (value === 'undefined')  return null
  if (value === 'N/A')        return null
  if (value === '-')          return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '')             return null
    if (trimmed.toLowerCase() === 'null')       return null

    if (isNaN(Number(trimmed))) {
      const d = new Date(trimmed)
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
    }
    value = Number(trimmed)
  }

  if (typeof value === 'number') {
    if (value <= 0) return null
    const excelEpoch = new Date(1899, 11, 30)
    const msPerDay   = 86400000
    const date       = new Date(
      excelEpoch.getTime() + value * msPerDay
    )
    if (isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  }

  return null
}

// ── Clean string helper ──────────────────────────────────
function clean(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  if (s === '')      return null
  if (s === 'null')  return null
  if (s === 'N/A')   return null
  if (s === '-')     return null
  return s
}

// ── Clean number helper ──────────────────────────────────
function cleanNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (
    val === 'null' ||
    val === 'N/A'  ||
    val === '-'
  ) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

// ── Clean MCL / RCRC numbers ─────────────────────────────
// Removes Excel trailing ".0"  e.g. "3616.0" → "3616"
function cleanID(val: unknown): string | null {
  const s = clean(val)
  if (!s) return null
  return s.replace(/\.0+$/, '')
}

// ── Find key — handles leading/trailing spaces & case ────
function findKey(
  row:  Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    // Exact match first
    if (key in row) return row[key]

    // Trim + lowercase fallback
    const found = Object.keys(row).find(
      k => k.trim().toLowerCase() === key.trim().toLowerCase()
    )
    if (found !== undefined) return row[found]
  }
  return undefined
}

// ── Map one Excel row → Supabase record ──────────────────
function mapRow(row: Record<string, unknown>) {

  console.log(
    '📋 Row keys:',
    Object.keys(row).map(k => `"${k}"`).join(', ')
  )

  return {
    mcl_number: cleanID(
      findKey(row,
        'mcl_number',
        'MCL Number',
        'MCL_Number',
        'MCL#',
        'MCL #',
      )
    ),

    rcrc_number: cleanID(
      findKey(row,
        'RCRC Number',
        'rcrc_number',
        'RCRCNumber',
        'RCRC#',
      )
    ),

    rcrc_name: clean(
      findKey(row,
        'rcrc_name',
        'RCRC Name',
        'RCRCName',
      )
    ),

    rcrc_contact_person: clean(
      findKey(row,
        'rcrc_contact_person',
        'RCRC Contact Person',
        'Contact Person',
      )
    ),

    rcrc_email: clean(
      findKey(row,
        'rcrc_email',
        'RCRC Email',
        'Email',
      )
    ),

    rcrc_phone_number: clean(
      findKey(row,
        'phone',
        'Phone',
        'rcrc_phone_number',
        'RCRC Phone',
      )
    ),

    rcrc_address: clean(
      findKey(row,
        'RCRC Address',
        'rcrc_address',
        'RCRCAddress',
        'Address',
      )
    ),

    city: clean(
      findKey(row, 'city', 'City')
    ),

    state: clean(
      findKey(row, 'state', 'State')
    ),

    rcrc_zip_code: clean(
      findKey(row,
        'zip',
        'Zip',
        'ZIP',
        'rcrc_zip_code',
      )
    ),

    time_window: clean(
      findKey(row,
        'Pickup Hours',
        'time_window',
        'PickupHours',
        'Time Window',
      )
    ),

    pallet_quantity: cleanNum(
      findKey(row,
        'Pallet Quantity',
        'pallet_quantity',
        'PalletQuantity',
        'Pallets',
      )
    ),

    total_pieces_quantity: cleanNum(
      findKey(row,
        'Total Pieces Quantity',
        'total_pieces_quantity',
        'TotalPiecesQuantity',
        'Total Pieces',
      )
    ),

    fcsd_offer_amount: cleanNum(
      findKey(row,
        'Ounce Calculator Est Amount',
        'fcsd_offer_amount',
        'OunceCalculatorEstAmount',
        'Est Amount',
      )
    ),

    requested_pickup_date: excelDateToISO(
      findKey(row,
        'requested_pickup_date',
        'Requested Pickup Date',
        'RequestedPickupDate',
      )
    ),

    date_sent_to_techemet: excelDateToISO(
      findKey(row,
        'Date sent to techemet',
        'date_sent_to_techemet',
        'DateSentToTechemet',
        'Date Sent to Techemet',
      )
    ),

    scheduled_pickup_date: excelDateToISO(
      findKey(row,
        'Scheduled Pickup Date (by Techemet)',
        'scheduled_pickup_date',
        'ScheduledPickupDate',
        'Scheduled Pickup Date',
      )
    ),

    actual_pickup_date: excelDateToISO(
      findKey(row,
        'Shipment Arrived Date',
        'actual_pickup_date',
        'ShipmentArrivedDate',
        'Shipment Arrived',
      )
    ),

    // ── Column S — leading space in Excel header ─────────
    invoice_submitted_date: excelDateToISO(
      findKey(row,
        ' Invoice submitted',        // exact Excel header (leading space)
        'Invoice submitted',         // without leading space
        'invoice submitted',         // lowercase
        ' invoice submitted',        // lowercase with leading space
        'Invoice Submitted',         // title case
        ' Invoice Submitted',        // title case with leading space
        'Invoice Submitted Date',    // with Date suffix
        'invoice_submitted',         // underscore
        'invoice_submitted_date',    // full supabase name
      )
    ),

    admin_notes: clean(
      findKey(row,
        'Comments',
        'admin_notes',
        'Notes',
      )
    ),
  }
}

// ── POST Handler ─────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Sync received. Keys:', Object.keys(body))

    // ── Parse rows from any payload shape ────────────────
    const rows: Record<string, unknown>[] =
      Array.isArray(body)       ? body       :
      Array.isArray(body.rows)  ? body.rows  :
      Array.isArray(body.data)  ? body.data  :
      Array.isArray(body.value) ? body.value :
      []

    if (rows.length === 0) {
      console.warn('⚠️ No rows received')
      console.log(
        '📦 Body received:',
        JSON.stringify(body).slice(0, 500)
      )
      return NextResponse.json(
        {
          success:  false,
          error:    'No rows received',
          received: JSON.stringify(body).slice(0, 200),
        },
        { status: 400 }
      )
    }

    console.log(`📊 Total rows received: ${rows.length}`)

    // ── Log exact column names from first row ─────────────
    if (rows.length > 0) {
      console.log('🔑 EXACT column names from Power Automate:')
      Object.keys(rows[0]).forEach(k => {
        console.log(`  → "${k}" (length: ${k.length})`)
      })
    }

    let inserted    = 0
    let updated     = 0
    let skipped     = 0
    let error_count = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const mapped = mapRow(row)

        console.log(
          `🔍 Processing → MCL: ${mapped.mcl_number} | ` +
          `RCRC: ${mapped.rcrc_number} | ` +
          `Name: ${mapped.rcrc_name} | ` +
          `Date Sent: ${mapped.date_sent_to_techemet} | ` +
          `Scheduled: ${mapped.scheduled_pickup_date} | ` +
          `Actual: ${mapped.actual_pickup_date} | ` +
          `Invoice: ${mapped.invoice_submitted_date}`
        )

        // ── Skip rows with no identifying info ───────────
        if (!mapped.mcl_number && !mapped.rcrc_number) {
          console.log('⏭️ Skipping row — no MCL or RCRC number')
          skipped++
          continue
        }

        // ── Check if record already exists ───────────────
        let existing: { id: number; status: string } | null = null

        // Try find by MCL number first
        if (mapped.mcl_number) {
          const { data } = await supabase
            .from('pickup_request')
            .select('id, status')
            .eq('mcl_number', mapped.mcl_number)
            .maybeSingle()
          existing = data
        }

        // Fallback — find by RCRC + requested date
        if (
          !existing            &&
          mapped.rcrc_number   &&
          mapped.requested_pickup_date
        ) {
          const { data } = await supabase
            .from('pickup_request')
            .select('id, status')
            .eq('rcrc_number',          mapped.rcrc_number)
            .eq('requested_pickup_date', mapped.requested_pickup_date)
            .maybeSingle()
          existing = data
        }

        // ── Determine auto status from dates ─────────────
        const autoStatus = determineStatus(mapped)
        console.log(
          `📊 Auto status for MCL ${mapped.mcl_number}: ` +
          `${autoStatus}`
        )

        if (existing) {
          // ── UPDATE existing record ──────────────────────
          const updatePayload: Record<string, unknown> = {
            updated_at:       new Date().toISOString(),
            status:           autoStatus,
            status_updated_at: new Date().toISOString(),
          }

          // Only update fields that have values
          // (never overwrite existing data with null)
          if (mapped.mcl_number)
            updatePayload.mcl_number             = mapped.mcl_number
          if (mapped.rcrc_number)
            updatePayload.rcrc_number            = mapped.rcrc_number
          if (mapped.rcrc_name)
            updatePayload.rcrc_name              = mapped.rcrc_name
          if (mapped.rcrc_contact_person)
            updatePayload.rcrc_contact_person    = mapped.rcrc_contact_person
          if (mapped.rcrc_email)
            updatePayload.rcrc_email             = mapped.rcrc_email
          if (mapped.rcrc_phone_number)
            updatePayload.rcrc_phone_number      = mapped.rcrc_phone_number
          if (mapped.rcrc_address)
            updatePayload.rcrc_address           = mapped.rcrc_address
          if (mapped.city)
            updatePayload.city                   = mapped.city
          if (mapped.state)
            updatePayload.state                  = mapped.state
          if (mapped.rcrc_zip_code)
            updatePayload.rcrc_zip_code          = mapped.rcrc_zip_code
          if (mapped.time_window)
            updatePayload.time_window            = mapped.time_window
          if (mapped.pallet_quantity != null)
            updatePayload.pallet_quantity        = mapped.pallet_quantity
          if (mapped.total_pieces_quantity != null)
            updatePayload.total_pieces_quantity  = mapped.total_pieces_quantity
          if (mapped.fcsd_offer_amount != null)
            updatePayload.fcsd_offer_amount      = mapped.fcsd_offer_amount
          if (mapped.requested_pickup_date)
            updatePayload.requested_pickup_date  = mapped.requested_pickup_date
          if (mapped.date_sent_to_techemet)
            updatePayload.date_sent_to_techemet  = mapped.date_sent_to_techemet
          if (mapped.scheduled_pickup_date)
            updatePayload.scheduled_pickup_date  = mapped.scheduled_pickup_date
          if (mapped.actual_pickup_date)
            updatePayload.actual_pickup_date     = mapped.actual_pickup_date
          if (mapped.invoice_submitted_date)
            updatePayload.invoice_submitted_date = mapped.invoice_submitted_date
          if (mapped.admin_notes)
            updatePayload.admin_notes            = mapped.admin_notes

          const { error: updateError } = await supabase
            .from('pickup_request')
            .update(updatePayload)
            .eq('id', existing.id)

          if (updateError) {
            console.error(
              `❌ Update error for ID ${existing.id}:`,
              updateError.message
            )
            errors.push(
              `Update ID ${existing.id}: ${updateError.message}`
            )
            error_count++
          } else {
            console.log(
              `✅ Updated ID: ${existing.id} | ` +
              `MCL: ${mapped.mcl_number} | ` +
              `Status: ${autoStatus}`
            )
            updated++
          }

        } else {
          // ── INSERT new record ───────────────────────────
          const insertPayload = {
            ...mapped,
            status:            autoStatus,
            status_updated_at: new Date().toISOString(),
            created_at:        new Date().toISOString(),
            updated_at:        new Date().toISOString(),
          }

          const { error: insertError } = await supabase
            .from('pickup_request')
            .insert(insertPayload)

          if (insertError) {
            console.error(
              `❌ Insert error | MCL: ${mapped.mcl_number}:`,
              insertError.message
            )
            errors.push(
              `Insert MCL ${mapped.mcl_number}: ${insertError.message}`
            )
            error_count++
          } else {
            console.log(
              `✅ Inserted MCL: ${mapped.mcl_number} | ` +
              `Status: ${autoStatus}`
            )
            inserted++
          }
        }

      } catch (rowErr) {
        const msg = rowErr instanceof Error
          ? rowErr.message
          : 'Unknown row error'
        console.error('❌ Row processing error:', msg)
        errors.push(`Row error: ${msg}`)
        error_count++
      }
    }

    // ── Summary ───────────────────────────────────────────
    const summary = {
      success:     true,
      synced_at:   new Date().toISOString(),
      total_rows:  rows.length,
      inserted,
      updated,
      skipped,
      error_count,
      errors:      errors.slice(0, 10),
    }

    console.log('✅ Sync complete:', JSON.stringify(summary))
    return NextResponse.json(summary, { status: 200 })

  } catch (err: unknown) {
    const message = err instanceof Error
      ? err.message
      : 'Unknown error'
    console.error('❌ Sync failed:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ── GET — Health Check ────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sync API is running ✅',
    method:  'Use POST to sync Excel data',
    auto_status_logic: {
      closed:           'invoice_submitted_date is set',
      shipment_arrived: 'actual_pickup_date is set',
      in_transit:       'scheduled_pickup_date is set',
      sent_for_pickup:  'date_sent_to_techemet is set',
      total_requests:   'no dates set',
    },
    note: 'findKey handles leading spaces in Excel column names',
    columns_expected: [
      'mcl_number',
      'RCRC Number',
      'rcrc_name',
      'rcrc_contact_person',
      'rcrc_email',
      'phone',
      'RCRC Address',
      'city',
      'state',
      'zip',
      'Pickup Hours',
      'Pallet Quantity',
      'Total Pieces Quantity',
      'Ounce Calculator Est Amount',
      'requested_pickup_date',
      'Date sent to techemet',
      'Scheduled Pickup Date (by Techemet)',
      'Shipment Arrived Date',
      ' Invoice submitted',  // ← leading space intentional!
      'Comments',
    ],
  })
}
