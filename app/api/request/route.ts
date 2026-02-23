import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCustomerConfirmation, sendAdminNotification } from '../../../lib/sendEmail'  
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Save to database
    const { data, error } = await supabaseServer
      .from('pickup_requests')
      .insert([
        {
          customer_name: body.customer_name,
          phone: body.phone,
          email: body.email || null,
          address1: body.address1,
          address2: body.address2 || null,
          city: body.city,
          state: body.state,
          zip: body.zip,
          preferred_date: body.preferred_date,
          time_window: body.time_window,
          scrap_category: body.scrap_category,
          description: body.description || null,
          status: 'NEW',
        },
      ])
      .select()
      .single()
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    console.log('Request created:', data.id)
    // Prepare email data
    const fullAddress = `${body.address1}${body.address2 ? ', ' + body.address2 : ''}, ${body.city}, ${body.state} ${body.zip}`
    const emailData = {
      customerName: body.customer_name,
      customerEmail: body.email,
      phone: body.phone,
      address: fullAddress,
      preferredDate: body.preferred_date,
      timeWindow: body.time_window,
      scrapCategory: body.scrap_category,
      description: body.description || '',
      requestId: data.id,
    }
    // Send emails in background
    if (body.email) {
      sendCustomerConfirmation(emailData).then(result => {
        if (result.success) {
          console.log('✅ Customer email sent successfully')
        } else {
          console.error('❌ Failed to send customer email:', result.error)
        }
      })
    }
    sendAdminNotification(emailData).then(result => {
      if (result.success) {
        console.log('✅ Admin email sent successfully')
      } else {
        console.error('❌ Failed to send admin email:', result.error)
      }
    })
    return NextResponse.json({ 
      success: true,
      requestId: data.id,
      message: 'Request submitted successfully!'
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create request' }, 
      { status: 500 }
    )
  }
}