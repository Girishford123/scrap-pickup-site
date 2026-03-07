import { NextResponse } from 'next/server'
import { createClient }  from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Auto Determine Status Based On Dates ─────────────────
function determineStatus(fields: Record<string, unknown>): string {
  // Priority order — highest first
  if (fields.invoice_submitted_date)  return 'closed'
  if (fields.actual_pickup_date)      return 'shipment_arrived'
  if (fields.scheduled_pickup_date)   return 'in_transit'
  if (fields.date_sent_to_techemet)   return 'sent_for_pickup'
  return 'total_requests'
}

// ── POST Handler ─────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('📥 Update request received:', JSON.stringify(body))

    const { id, ...fields } = body

    // ── Validate ID ──────────────────────────────────────
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing record ID' },
        { status: 400 }
      )
    }

    // ── Fetch Current Record ─────────────────────────────
    const { data: existing, error: fetchError } = await supabase
      .from('pickup_request')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError.message)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Record ID ${id} not found` },
        { status: 404 }
      )
    }

    // ── Build Update Payload ─────────────────────────────
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // ── MCL Number ───────────────────────────────────────
    if (fields.mcl_number !== undefined) {
      updateData.mcl_number = fields.mcl_number
        ? String(fields.mcl_number).replace(/\.0+$/, '').trim()
        : null
    }

    // ── Financial ────────────────────────────────────────
    if (fields.fcsd_offer_amount !== undefined) {
      const num = Number(fields.fcsd_offer_amount)
      updateData.fcsd_offer_amount = isNaN(num) ? null : num
    }

    // ── Admin Notes ──────────────────────────────────────
    if (fields.admin_notes !== undefined) {
      updateData.admin_notes = fields.admin_notes
        ? String(fields.admin_notes).trim()
        : null
    }

    // ── RCRC Fields ──────────────────────────────────────
    if (fields.rcrc_name !== undefined) {
      updateData.rcrc_name = fields.rcrc_name || null
    }
    if (fields.rcrc_number !== undefined) {
      updateData.rcrc_number = fields.rcrc_number
        ? String(fields.rcrc_number).replace(/\.0+$/, '').trim()
        : null
    }
    if (fields.rcrc_contact_person !== undefined) {
      updateData.rcrc_contact_person = fields.rcrc_contact_person || null
    }
    if (fields.rcrc_email !== undefined) {
      updateData.rcrc_email = fields.rcrc_email || null
    }
    if (fields.rcrc_phone_number !== undefined) {
      updateData.rcrc_phone_number = fields.rcrc_phone_number || null
    }
    if (fields.rcrc_address !== undefined) {
      updateData.rcrc_address = fields.rcrc_address || null
    }
    if (fields.city !== undefined) {
      updateData.city = fields.city || null
    }
    if (fields.state !== undefined) {
      updateData.state = fields.state || null
    }
    if (fields.rcrc_zip_code !== undefined) {
      updateData.rcrc_zip_code = fields.rcrc_zip_code || null
    }
    if (fields.time_window !== undefined) {
      updateData.time_window = fields.time_window || null
    }

    // ── Quantities ───────────────────────────────────────
    if (fields.pallet_quantity !== undefined) {
      const num = Number(fields.pallet_quantity)
      updateData.pallet_quantity = isNaN(num) ? null : num
    }
    if (fields.total_pieces_quantity !== undefined) {
      const num = Number(fields.total_pieces_quantity)
      updateData.total_pieces_quantity = isNaN(num) ? null : num
    }

    // ── Date Fields ──────────────────────────────────────
    // Helper to clean date values
    function cleanDate(val: unknown): string | null {
      if (!val)                         return null
      if (val === 'null')               return null
      if (val === 'undefined')          return null
      if (val === 'N/A')                return null
      if (val === '-')                  return null
      if (val === 'mm/dd/yyyy')         return null
      if (val === 'mm/dd/yyyy --:-- --') return null
      const s = String(val).trim()
      if (s === '')                     return null
      const d = new Date(s)
      if (isNaN(d.getTime()))           return null
      return s
    }

    if (fields.vendor_request_received_at !== undefined) {
      updateData.vendor_request_received_at =
        cleanDate(fields.vendor_request_received_at)
    }

    if (fields.techemet_request_sent_at !== undefined) {
      updateData.techemet_request_sent_at =
        cleanDate(fields.techemet_request_sent_at)
    }

    if (fields.requested_pickup_date !== undefined) {
      updateData.requested_pickup_date =
        cleanDate(fields.requested_pickup_date)
    }

    if (fields.scheduled_pickup_date !== undefined) {
      updateData.scheduled_pickup_date =
        cleanDate(fields.scheduled_pickup_date)
    }

    if (fields.actual_pickup_date !== undefined) {
      updateData.actual_pickup_date =
        cleanDate(fields.actual_pickup_date)
    }

    if (fields.date_sent_to_techemet !== undefined) {
      updateData.date_sent_to_techemet =
        cleanDate(fields.date_sent_to_techemet)
    }

    if (fields.invoice_submitted_date !== undefined) {
      updateData.invoice_submitted_date =
        cleanDate(fields.invoice_submitted_date)
    }

    // ── Auto Determine Status ────────────────────────────
    // Merge existing data with incoming changes
    // to get the full picture for status determination
    const mergedForStatus = {
      invoice_submitted_date:
        updateData.invoice_submitted_date  ??
        existing.invoice_submitted_date    ??
        null,

      actual_pickup_date:
        updateData.actual_pickup_date      ??
        existing.actual_pickup_date        ??
        null,

      scheduled_pickup_date:
        updateData.scheduled_pickup_date   ??
        existing.scheduled_pickup_date     ??
        null,

      date_sent_to_techemet:
        updateData.date_sent_to_techemet   ??
        existing.date_sent_to_techemet     ??
        null,
    }

    // If admin manually set status — respect it
    // Otherwise auto-determine from dates
    if (fields.status && fields.status !== '') {
      updateData.status            = fields.status
      updateData.status_updated_at = new Date().toISOString()
      console.log(
        `👤 Manual status set for ID ${id}: ${fields.status}`
      )
    } else {
      const autoStatus = determineStatus(mergedForStatus)
      updateData.status            = autoStatus
      updateData.status_updated_at = new Date().toISOString()
      console.log(
        `📊 Auto status for ID ${id}: ${autoStatus}`,
        '| Dates:',
        JSON.stringify(mergedForStatus)
      )
    }

    // ── Override: invoice date always closes ─────────────
    // Even if admin set status manually,
    // invoice date is the final authority
    if (
      mergedForStatus.invoice_submitted_date &&
      updateData.status !== 'closed'
    ) {
      updateData.status            = 'closed'
      updateData.status_updated_at = new Date().toISOString()
      console.log(
        `🧾 Force-closed ID ${id} — invoice date exists:`,
        mergedForStatus.invoice_submitted_date
      )
    }

    console.log(
      `📤 Updating ID ${id} with:`,
      JSON.stringify(updateData)
    )

    // ── Run Update ───────────────────────────────────────
    const { data: updated, error: updateError } = await supabase
      .from('pickup_request')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update error:', updateError.message)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully updated ID ${id}`)

    return NextResponse.json(
      {
        success:    true,
        data:       updated,
        auto_status: updateData.status,
        message:    `Record ${id} updated successfully`,
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    const message = err instanceof Error
      ? err.message
      : 'Unknown error'
    console.error('❌ Update request failed:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ── GET — Health Check ───────────────────────────────────
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Update Request API is running ✅',
    method:  'Use POST to update a record',
    auto_status_logic: {
      closed:           'invoice_submitted_date is set',
      shipment_arrived: 'actual_pickup_date is set',
      in_transit:       'scheduled_pickup_date is set',
      sent_for_pickup:  'date_sent_to_techemet is set',
      total_requests:   'no dates set',
    },
    example_body: {
      id:                     123,
      mcl_number:             '3616',
      fcsd_offer_amount:      16817,
      requested_pickup_date:  '2026-02-25',
      scheduled_pickup_date:  '2026-03-01',
      actual_pickup_date:     '2026-03-05',
      date_sent_to_techemet:  '2026-02-25',
      invoice_submitted_date: '2026-03-10',
      admin_notes:            'Notes here',
    },
  })
}
