import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Body received:', JSON.stringify(body))

    const { id, ...fields } = body

    if (!id) {
      console.error('❌ No ID provided')
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Check record exists first
    const { data: existing, error: findError } = await supabase
      .from('pickup_request')
      .select('id, mcl_number, status')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      console.error('❌ Record not found:', id, findError)
      return NextResponse.json(
        {
          success: false,
          error:   `Record with ID ${id} not found`,
          detail:  findError?.message,
        },
        { status: 404 }
      )
    }

    console.log('✅ Found existing record:', existing)

    // Build update payload
    const updateData: Record<string, unknown> = {
      status_updated_at: new Date().toISOString(),
    }

    if (fields.mcl_number !== undefined && fields.mcl_number !== '') {
      updateData.mcl_number = String(fields.mcl_number).trim()
    }

    if (fields.fcsd_offer_amount !== undefined && fields.fcsd_offer_amount !== '') {
      updateData.fcsd_offer_amount = Number(fields.fcsd_offer_amount)
    }

    if (
      fields.vendor_request_received_at !== undefined &&
      fields.vendor_request_received_at !== ''
    ) {
      updateData.vendor_request_received_at =
        new Date(fields.vendor_request_received_at).toISOString()
    }

    if (
      fields.techemet_request_sent_at !== undefined &&
      fields.techemet_request_sent_at !== ''
    ) {
      updateData.techemet_request_sent_at =
        new Date(fields.techemet_request_sent_at).toISOString()
    }

    if (
      fields.requested_pickup_date !== undefined &&
      fields.requested_pickup_date !== ''
    ) {
      updateData.requested_pickup_date = fields.requested_pickup_date
    }

    if (
      fields.scheduled_pickup_date !== undefined &&
      fields.scheduled_pickup_date !== ''
    ) {
      updateData.scheduled_pickup_date = fields.scheduled_pickup_date
    }

    if (
      fields.actual_pickup_date !== undefined &&
      fields.actual_pickup_date !== ''
    ) {
      updateData.actual_pickup_date = fields.actual_pickup_date
    }

    if (fields.admin_notes !== undefined) {
      updateData.admin_notes = fields.admin_notes || null
    }

    if (fields.status !== undefined && fields.status !== '') {
      updateData.status = fields.status
    }

    console.log('📤 Updating Supabase with:', JSON.stringify(updateData))

    const { data, error } = await supabase
      .from('pickup_request')
      .update(updateData)
      .eq('id', Number(id))
      .select()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return NextResponse.json(
        {
          success: false,
          error:   error.message,
          code:    error.code,
          detail:  error.details,
          hint:    error.hint,
        },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ 0 rows updated for ID:', id)
      return NextResponse.json(
        {
          success: false,
          error:   'Update ran but no rows were changed',
          detail:  'Check RLS policies in Supabase',
        },
        { status: 400 }
      )
    }

    console.log('✅ Update success:', JSON.stringify(data[0]))

    return NextResponse.json(
      { success: true, data: data[0] },
      { status: 200 }
    )

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Unhandled error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}