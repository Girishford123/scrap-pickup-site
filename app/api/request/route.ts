import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendAdminNotificationEmail,
  sendRequestorConfirmationEmail,
} from '@/lib/sendEmail'

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseServer     = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Step 1: Save to Supabase ───────────────────────
    const { data, error } = await supabaseServer
      .from('pickup_requests')
      .insert([
        {
          rcrc_number:          body.rcrcNumber,
          rcrc_name:            body.rcrcName,
          rcrc_contact_person:  body.rcrcContactPerson,
          rcrc_email:           body.rcrcEmail,
          rcrc_phone_number:    body.rcrcPhoneNumber,
          rcrc_address:         body.rcrcAddress,
          rcrc_address_2:       body.rcrcAddress2,
          state:                body.state,
          rcrc_zip_code:        body.rcrcZipCode,
          preferred_date:       body.preferredDate,
          pickup_hours:         body.pickupHours,
          pallet_quantity:      body.palletQuantity
                                  ? parseInt(body.palletQuantity)
                                  : null,
          total_pieces_quantity: body.totalPiecesQuantity
                                  ? parseInt(body.totalPiecesQuantity)
                                  : null,
          notes:                body.notes,
          status:               'pending',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // ── Step 2: Build email data from RCRC fields ──────
    const fullAddress = [
      body.rcrcAddress,
      body.rcrcAddress2,
      body.state,
      body.rcrcZipCode,
    ]
      .filter(Boolean)
      .join(', ')

    const vehicleInfo = [
      body.palletQuantity
        ? `Pallets: ${body.palletQuantity}`
        : null,
      body.totalPiecesQuantity
        ? `Total Pieces: ${body.totalPiecesQuantity}`
        : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const emailData = {
      customerName:  body.rcrcContactPerson || body.rcrcName,
      customerEmail: body.rcrcEmail         || null,
      phone:         body.rcrcPhoneNumber   || '',
      address:       fullAddress,
      vehicleInfo:   vehicleInfo            || 'Not specified',
      preferredDate: body.preferredDate     || '',
      notes:         body.notes             || '',
      requestId:     data?.id?.toString()   || '',
      rcrcNumber:    body.rcrcNumber        || '',
      rcrcName:      body.rcrcName          || '',
      pickupHours:   body.pickupHours       || '',
    }

    // ── Step 3: Send Admin Notification Email ──────────
    const adminEmailResult = await sendAdminNotificationEmail(emailData)

    if (!adminEmailResult.success) {
      console.error(
        'Admin email failed (non-blocking):',
        adminEmailResult.error
      )
    }

    // ── Step 4: Send Requestor Confirmation Email ──────
    if (body.rcrcEmail) {
      const requestorEmailResult =
        await sendRequestorConfirmationEmail(emailData)

      if (!requestorEmailResult.success) {
        console.error(
          'Requestor email failed (non-blocking):',
          requestorEmailResult.error
        )
      }
    }

    // ── Step 5: Return Success ─────────────────────────
    return NextResponse.json({
      success: true,
      data,
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create pickup request' },
      { status: 500 }
    )
  }
}