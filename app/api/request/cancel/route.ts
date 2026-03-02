import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { requestId, cancelReason, userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized — userId is required' },
        { status: 401 }
      )
    }

    if (!requestId || !cancelReason) {
      return NextResponse.json(
        { error: 'requestId and cancelReason are required' },
        { status: 400 }
      )
    }

    // ✅ Check request exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // ✅ Block cancellation of completed/cancelled
    if (['completed', 'cancelled'].includes(existing.status)) {
      return NextResponse.json(
        {
          error:
            'Cannot cancel a completed or already cancelled pickup'
        },
        { status: 400 }
      )
    }

    // ✅ Update status in Supabase
    const { error: updateError } = await supabase
      .from('pickup_requests')
      .update({
        status: 'cancelled',
        cancel_reason: cancelReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Supabase cancel error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel pickup' },
        { status: 500 }
      )
    }

    // ✅ Send cancellation email notification
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/pickup-notification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: existing.email,
            subject: 'Pickup Request Cancelled - Ford Component Sales',
            requestorName: existing.customer_name,
            requestId: requestId,
            cancelReason: cancelReason,
            isCancellation: true
          })
        }
      )
    } catch (emailError) {
      console.error('Failed to send cancel email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Pickup cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel pickup' },
      { status: 500 }
    )
  }
}
