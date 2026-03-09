import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    console.log('📦 Server inserting:', body)

    const { data, error } = await supabase
      .from('pickup_requests')
      .insert([body])
      .select()

    if (error) {
      console.error('❌ DB Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    // ── Send Email Notification ──────────────── ← ADD THIS
    try {
      await sendPickupEmail({
        customerName:   body.contact_person     || body.rcrc_name || 'N/A',
        customerEmail:  body.email              || null,
        phone:          body.phone              || '',
        address:        body.pickup_address     || '',
        vehicleInfo:    body.quantity_details   || '',
        preferredDate:  body.requested_pickup_date || '',
        notes:          body.notes              || '',
        requestId:      data?.[0]?.id           || '',
        rcrcNumber:     body.rcrc_number        || '',
        rcrcName:       body.rcrc_name          || '',
        pickupHours:    body.pickup_hours       || '',
      })
      console.log('✅ Email sent successfully')
    } catch (emailErr) {
      // Don't fail the request if email fails
      console.error('⚠️ Email failed but request saved:', emailErr)
    }
    // ────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (err: any) {
    console.error('❌ Server Error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
