import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPickupEmail } from '../../../lib/sendEmail'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabaseServer
      .from('pickup_requests')
      .insert([
        {
          customer_name: body.customerName,
          customer_email: body.customerEmail,
          phone: body.phone,
          address: body.address,
          vehicle_info: body.vehicleInfo,
          rcrc_name: body.rcrcName,
          rcrc_email: body.rcrcEmail,
          rcrc_contact_person: body.rcrcContactPerson,
          rcrc_phone: body.rcrcPhone,
          rcrc_address: body.rcrcAddress,
          rcrc_phone_number: body.rcrcPhoneNumber,
          preferred_date: body.preferredDate,
          pickup_hours: body.pickupHours,
          pallet_quantity: body.palletQuantity ? parseInt(body.palletQuantity) : null,
          total_pieces_quantity: body.totalPiecesQuantity ? parseInt(body.totalPiecesQuantity) : null,
          notes: body.notes,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Send email notification
    try {
      await sendPickupEmail({
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        phone: body.phone,
        address: body.address,
        vehicleInfo: body.vehicleInfo,
        preferredDate: body.preferredDate,
        notes: body.notes
      })
    } catch (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      data 
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create pickup request' },
      { status: 500 }
    )
  }
}