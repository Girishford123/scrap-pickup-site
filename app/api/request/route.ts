import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
          rcrc_number: body.rcrcNumber,
          rcrc_name: body.rcrcName,
          rcrc_contact_person: body.rcrcContactPerson,
          rcrc_email: body.rcrcEmail,
          rcrc_phone_number: body.rcrcPhoneNumber,
          rcrc_address: body.rcrcAddress,
          rcrc_address_2: body.rcrcAddress2,
          state: body.state,
          rcrc_zip_code: body.rcrcZipCode,
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