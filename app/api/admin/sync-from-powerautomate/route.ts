import { NextResponse } from 'next/server'
import { createClient }  from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Convert Excel Serial Date → YYYY-MM-DD ──────────────
function excelDateToISO(value: unknown): string | null {
  if (!value && value !== 0) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '') return null
    if (isNaN(Number(trimmed))) {
      const d = new Date(trimmed)
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
    }
    value = Number(trimmed)
  }

  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const msPerDay   = 86400000
    const date       = new Date(excelEpoch.getTime() + value * msPerDay)
    if (isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  }

  return null
}

// ── Clean string helper ─────────────────────────────────
function clean(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' ? null : s
}

// ── Clean number helper ─────────────────────────────────
function cleanNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

// ── Map one Excel row → Supabase record ─────────────────
function mapRow(row: Record<string, unknown>) {
  return {
    mcl_number: clean(row['mcl_number'])
      || clean(row['MCL Number'])
      || clean(row['MCL_Number'])
      || null,

    requested_pickup_date: excelDateToISO(
      row['requested_pickup_date']
      ?? row['Requested Pickup Date']
      ?? row['RequestedPickupDate']
    ),

    rcrc_number: clean(row['RCRC Number'])
      || clean(row['rcrc_number'])
      || clean(row['RCRCNumber'])
      || null,

    rcrc_name: clean(row['rcrc_name'])
      || clean(row['RCRC Name'])
      || clean(row['RCRCName'])
      || null,

    rcrc_contact_person: clean(row['rcrc_contact_person'])
      || clean(row['RCRC Contact Person'])
      || null,

    rcrc_email: clean(row['rcrc_email'])
      || clean(row['RCRC Email'])
      || null,

    rcrc_phone_number: clean(row['phone'])
      || clean(row['Phone'])
      || clean(row['rcrc_phone_number'])
      || null,

    rcrc_address: clean(row['RCRC Address'])
      || clean(row['rcrc_address'])
      || clean(row['RCRCAddress'])
      || null,

    city: clean(row['city'])
      || clean(row['City'])
      || null,

    state: clean(row['state'])
      || clean(row['State'])
      || null,

    rcrc_zip_code: clean(row['zip'])
      || clean(row['Zip'])
      || clean(row['ZIP'])
      || null,

    time_window: clean(row['Pickup Hours'])
      || clean(row['time_window'])
      || clean(row['PickupHours'])
      || null,

    pallet_quantity: cleanNum(
      row['Pallet Quantity']
      ?? row['pallet_quantity']
      ?? row['PalletQuantity']
    ),

    total_pieces_quantity: cleanNum(
      row['Total Pieces Quantity']
      ?? row['total_pieces_quantity']
      ?? row['TotalPiecesQuantity']
    ),

    fcsd_offer_amount: cleanNum(
      row['Ounce Calculator Est Amount']
      ?? row['fcsd_offer_amount']
      ?? row['OunceCalculatorEstAmount']
    ),

    date_sent_to_techemet: excelDateToISO(
      row['Date sent to techemet']
      ?? row['date_sent_to_techemet']
      ?? row['DateSentToTechemet']
    ),

    // Column S in Excel
    invoice_submitted_date: excelDateToISO(
      row['invoice submitted']
      ?? row['Invoice Submitted']
      ?? row['invoice_submitted']
      ?? row['InvoiceSubmitted']
      ?? row['Invoice Submitted Date']
    ),

    scheduled_pickup_date: excelDateToISO(
      row['Scheduled Pickup Date (by Techemet)']
      ?? row['scheduled_pickup_date']
      ?? row['ScheduledPickupDate']
    ),

    actual_pickup_date: excelDateToISO(
      row['Shipment Arrived Date']
      ?? row['actual_pickup_date']
      ?? row['ShipmentArrivedDate']
    ),

    admin_notes: clean(row['Comments'])
      || clean(row['admin_notes'])
      || null,
  }
}

// ── POST Handler ────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Sync received. Keys:', Object.keys(body))

    const rows: Record<string, unknown>[] =
      Array.isArray(body)       ? body       :
      Array.isArray(body.rows)  ? body.rows  :
      Array.isArray(body.data)  ? body.data  :
      Array.isArray(body.value) ? body.value :
      []

    if (rows.length === 0) {
      console.warn('⚠️ No rows received')
      console.log('📦 Body received:', JSON.stringify(body).slice(0, 500))
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
    console.log('🔍 First row sample:', JSON.stringify(rows[0]))

    let inserted    = 0
    let updated     = 0
    let skipped     = 0
    let error_count = 0
    const errors:   string[] = []

    for (const row of rows) {
      try {
        const mapped = mapRow(row)

        console.log(
          `Processing → MCL: ${mapped.mcl_number} | ` +
          `RCRC: ${mapped.rcrc_number} | ` +
          `Name: ${mapped.rcrc_name} | ` +
          `Invoice: ${mapped.invoice_submitted_date}`
        )

        if (!mapped.mcl_number && !mapped.rcrc_number) {
          console.log('⏭️ Skipping row — no MCL or RCRC number')
          skipped++
          continue
        }

        // ── Check if record exists ───────────────────────
        let existing = null

        if (mapped.mcl_number) {
          const { data } = await supabase
            .from('pickup_request')
            .select('id, status')
            .eq('mcl_number', mapped.mcl_number)
            .maybeSingle()
          existing = data
        }

        if (!existing && mapped.rcrc_number && mapped.requested_pickup_date) {
          const { data } = await supabase
            .from('pickup_request')
            .select('id, status')
            .eq('rcrc_number', mapped.rcrc_number)
            .eq('requested_pickup_date', mapped.requested_pickup_date)
            .maybeSingle()
          existing = data
        }

        if (existing) {
          // ── UPDATE existing record ─────────────────────
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }

          if (mapped.mcl_number)            updatePayload.mcl_number            = mapped.mcl_number
          if (mapped.rcrc_number)           updatePayload.rcrc_number           = mapped.rcrc_number
          if (mapped.rcrc_name)             updatePayload.rcrc_name             = mapped.rcrc_name
          if (mapped.rcrc_contact_person)   updatePayload.rcrc_contact_person   = mapped.rcrc_contact_person
          if (mapped.rcrc_email)            updatePayload.rcrc_email            = mapped.rcrc_email
          if (mapped.rcrc_phone_number)     updatePayload.rcrc_phone_number     = mapped.rcrc_phone_number
          if (mapped.rcrc_address)          updatePayload.rcrc_address          = mapped.rcrc_address
          if (mapped.city)                  updatePayload.city                  = mapped.city
          if (mapped.state)                 updatePayload.state                 = mapped.state
          if (mapped.rcrc_zip_code)         updatePayload.rcrc_zip_code         = mapped.rcrc_zip_code
          if (mapped.time_window)           updatePayload.time_window           = mapped.time_window
          if (mapped.pallet_quantity)       updatePayload.pallet_quantity       = mapped.pallet_quantity
          if (mapped.total_pieces_quantity) updatePayload.total_pieces_quantity = mapped.total_pieces_quantity
          if (mapped.fcsd_offer_amount)     updatePayload.fcsd_offer_amount     = mapped.fcsd_offer_amount
          if (mapped.requested_pickup_date) updatePayload.requested_pickup_date = mapped.requested_pickup_date
          if (mapped.scheduled_pickup_date) updatePayload.scheduled_pickup_date = mapped.scheduled_pickup_date
          if (mapped.actual_pickup_date)    updatePayload.actual_pickup_date    = mapped.actual_pickup_date
          if (mapped.date_sent_to_techemet) updatePayload.date_sent_to_techemet = mapped.date_sent_to_techemet
          if (mapped.invoice_submitted_date) updatePayload.invoice_submitted_date = mapped.invoice_submitted_date
          if (mapped.admin_notes)           updatePayload.admin_notes           = mapped.admin_notes

          // ── Auto-close if invoice date exists ──────────
          if (mapped.invoice_submitted_date) {
            updatePayload.status            = 'closed'
            updatePayload.status_updated_at = new Date().toISOString()
            console.log(
              `🧾 Auto-closing MCL ${mapped.mcl_number} — invoice date: ${mapped.invoice_submitted_date}`
            )
          }

          const { error } = await supabase
            .from('pickup_request')
            .update(updatePayload)
            .eq('id', existing.id)

          if (error) {
            console.error(`❌ Update error for ID ${existing.id}:`, error.message)
            errors.push(`Update ID ${existing.id}: ${error.message}`)
            error_count++
          } else {
            console.log(`✅ Updated ID: ${existing.id}`)
            updated++
          }

        } else {
          // ── INSERT new record ──────────────────────────
          // Auto-close if invoice date already exists
          const insertStatus = mapped.invoice_submitted_date
            ? 'closed'
            : 'total_requests'

          if (insertStatus === 'closed') {
            console.log(
              `🧾 Inserting as closed — MCL ${mapped.mcl_number} has invoice date`
            )
          }

          const insertPayload = {
            ...mapped,
            status:     insertStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('pickup_request')
            .insert(insertPayload)

          if (error) {
            console.error(
              `❌ Insert error:`,
              error.message,
              '| Row:',
              JSON.stringify(mapped)
            )
            errors.push(`Insert MCL ${mapped.mcl_number}: ${error.message}`)
            error_count++
          } else {
            console.log(
              `✅ Inserted MCL: ${mapped.mcl_number} | Status: ${insertStatus}`
            )
            inserted++
          }
        }

      } catch (rowErr) {
        const msg = rowErr instanceof Error ? rowErr.message : 'Unknown row error'
        console.error('❌ Row processing error:', msg)
        errors.push(`Row error: ${msg}`)
        error_count++
      }
    }

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Sync failed:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ── GET — Health Check ──────────────────────────────────
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sync API is running ✅',
    method:  'Use POST to sync data',
    columns_expected: [
      'mcl_number',
      'requested_pickup_date',
      'RCRC Number',
      'rcrc_name',
      'rcrc_contact_person',
      'rcrc_email',
      'phone',
      'RCRC Address',
      'city', 'state', 'zip',
      'Pickup Hours',
      'Pallet Quantity',
      'Total Pieces Quantity',
      'Ounce Calculator Est Amount',
      'Date sent to techemet',
      'Scheduled Pickup Date (by Techemet)',
      'Shipment Arrived Date',
      'invoice submitted',
      'Comments',
    ],
  })
}
