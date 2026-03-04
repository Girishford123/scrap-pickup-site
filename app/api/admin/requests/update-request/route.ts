Typescript

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Admin update received:', body)

    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Build update object carefully
    const updateData: Record<string, unknown> = {
      status_updated_at: new Date().toISOString(),
    }

    // MCL Number
    if (fields.mcl_number !== undefined && fields.mcl_number !== '') {
      updateData.mcl_number = fields.mcl_number
    }

    // FCSD Offer Amount
    if (fields.fcsd_offer_amount !== undefined && fields.fcsd_offer_amount !== '') {
      updateData.fcsd_offer_amount = Number(fields.fcsd_offer_amount)
    }

    // Vendor Request Received
    if (fields.vendor_request_received_at !== undefined && fields.vendor_request_received_at !== '') {
      updateData.vendor_request_received_at = new Date(fields.vendor_request_received_at).toISOString()
    }

    // Techemet Request Sent
    if (fields.techemet_request_sent_at !== undefined && fields.techemet_request_sent_at !== '') {
      updateData.techemet_request_sent_at = new Date(fields.techemet_request_sent_at).toISOString()
    }

    // Requested Pickup Date
    if (fields.requested_pickup_date !== undefined && fields.requested_pickup_date !== '') {
      updateData.requested_pickup_date = fields.requested_pickup_date
    }

    // Scheduled Pickup Date
    if (fields.scheduled_pickup_date !== undefined && fields.scheduled_pickup_date !== '') {
      updateData.scheduled_pickup_date = fields.scheduled_pickup_date
    }

    // Actual Pickup Date
    if (fields.actual_pickup_date !== undefined && fields.actual_pickup_date !== '') {
      updateData.actual_pickup_date = fields.actual_pickup_date
    }

    // Admin Notes
    if (fields.admin_notes !== undefined) {
      updateData.admin_notes = fields.admin_notes || null
    }

    // Status
    if (fields.status !== undefined && fields.status !== '') {
      updateData.status = fields.status
    }

    console.log('📤 Sending to Supabase:', { id, updateData })

    const { data, error } = await supabase
      .from('pickup_request')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ No rows updated — ID not found:', id)
      return NextResponse.json(
        { success: false, error: `No record found with ID ${id}` },
        { status: 404 }
      )
    }

    console.log('✅ Successfully updated request:', id, data)

    return NextResponse.json(
      { success: true, data: data[0] },
      { status: 200 }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Update request API error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}