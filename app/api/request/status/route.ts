import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized — userId is required' },
        { status: 401 }
      )
    }

    // ✅ Read from Supabase instead of MongoDB
    const { data, error } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    // ✅ Map Supabase fields to match
    //    what track-pickup page expects
    const requests = (data || []).map(req => ({
      _id: req.id.toString(),
      id: req.id,
      status: req.status || 'pending',
      // RCRC Info
      rcrcNumber: req.rcrc_number || '',
      rcrcName: req.rcrc_name || '',
      rcrcContactPerson: req.rcrc_contact_person || '',
      rcrcEmail: req.rcrc_email || '',
      rcrcPhoneNumber: req.rcrc_phone_number || '',
      rcrcAddress: req.rcrc_address || '',
      rcrcAddress2: req.rcrc_address2 || '',
      rcrcZipCode: req.rcrc_zip_code || '',
      state: req.state || '',
      // Pickup details
      preferredDate: req.preferred_date || '',
      pickupHours: req.time_window || '',
      palletQuantity: req.pallet_quantity || 0,
      totalPiecesQuantity: req.total_pieces_quantity || 0,
      notes: req.special_instructions || '',
      // Contact
      customerName: req.customer_name || '',
      email: req.email || '',
      phone: req.phone || '',
      address: req.address1 || req.rcrc_address || '',
      // Timestamps
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      // ✅ Attachments
      attachments: req.attachments || [],
      // Cancel info
      cancelReason: req.cancel_reason || '',
      cancelledAt: req.cancelled_at || null,
    }))

    return NextResponse.json({ requests })

  } catch (error) {
    console.error('Status fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
