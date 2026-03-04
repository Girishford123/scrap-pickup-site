// app/api/admin/update-request/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID required' },
        { status: 400 }
      )
    }

    // Build update object — only include non-empty values
    const updateData: Record<string, any> = {
      status_updated_at: new Date().toISOString(),
    }

    if (fields.mcl_number !== undefined)
      updateData.mcl_number = fields.mcl_number || null

    if (fields.fcsd_offer_amount !== undefined)
      updateData.fcsd_offer_amount =
        fields.fcsd_offer_amount
          ? Number(fields.fcsd_offer_amount)
          : null

    if (fields.vendor_request_received_at !== undefined)
      updateData.vendor_request_received_at =
        fields.vendor_request_received_at || null

    if (fields.techemet_request_sent_at !== undefined)
      updateData.techemet_request_sent_at =
        fields.techemet_request_sent_at || null

    if (fields.requested_pickup_date !== undefined)
      updateData.requested_pickup_date =
        fields.requested_pickup_date || null

    if (fields.scheduled_pickup_date !== undefined)
      updateData.scheduled_pickup_date =
        fields.scheduled_pickup_date || null

    if (fields.actual_pickup_date !== undefined)
      updateData.actual_pickup_date =
        fields.actual_pickup_date || null

    if (fields.admin_notes !== undefined)
      updateData.admin_notes = fields.admin_notes || null

    if (fields.status !== undefined)
      updateData.status = fields.status

    const { data, error } = await supabase
      .from('pickup_request')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Admin update saved for request:', id)

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Admin update API error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}