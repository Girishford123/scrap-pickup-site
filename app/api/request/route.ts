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
          preferred_date: body.preferredDate,
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