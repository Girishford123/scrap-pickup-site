// app/api/pickup-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminNotificationEmail, sendRequestorConfirmationEmail } from '@/lib/sendemail'

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'pickup-request API is alive. Use POST to submit.',
    },
    { status: 200 }
  )
}

export async function POST(req: NextRequest) {
  try {
    // ── Check env vars ──────────────────────────
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing SUPABASE_URL env var' },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' },
        { status: 500 }
      )
    }

    // ── Create Supabase client ───────────────────
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession:   false,
        autoRefreshToken: false,
      },
    })

    // ── Parse request body ──────────────────────
    let payload: Record<string, unknown>
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    console.log('📦 Server received payload:', payload)

    // ── Insert into Supabase ────────────────────
    const { data, error } = await supabase
      .from('pickup_request')
      .insert([payload])
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        {
          success:  false,
          error:    error.message,
          code:     error.code,
          hint:     error.hint,
          details:  error.details,
        },
        { status: 500 }
      )
    }

    console.log('✅ Insert success:', data)

    // ── Send Emails ─────────────────────────────
    const inserted = data?.[0]

    if (inserted) {
      const emailData = {
        customerName:  inserted.customer_name  || inserted.rcrc_contact_person || 'N/A',
        customerEmail: inserted.email          || null,
        phone:         inserted.phone          || inserted.rcrc_phone_number   || 'N/A',
        address:       [
                         inserted.address1,
                         inserted.address2,
                         inserted.city,
                         inserted.state,
                         inserted.zip,
                       ].filter(Boolean).join(', ') || 'N/A',
        vehicleInfo:   `Pallets: ${inserted.pallet_quantity ?? 0}, Pieces: ${inserted.total_pieces_quantity ?? 0}`,
        preferredDate: inserted.preferred_date || 'N/A',
        notes:         inserted.special_instructions || inserted.description || 'N/A',
        requestId:     String(inserted.id),
        rcrcNumber:    inserted.rcrc_number    || 'N/A',
        rcrcName:      inserted.rcrc_name      || 'N/A',
        pickupHours:   inserted.time_window    || 'N/A',
      }

      // ✅ Send admin notification
      const adminResult = await sendAdminNotificationEmail(emailData)
      console.log('📧 Admin email result:', adminResult)

      // ✅ Send requestor confirmation
      const requestorResult = await sendRequestorConfirmationEmail(emailData)
      console.log('📧 Requestor email result:', requestorResult)
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error:   err?.message || 'Unknown server error',
      },
      { status: 500 }
    )
  }
}
