// app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing environment variables',
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceKey,
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Get query params for filtering
    const { searchParams } = new URL(req.url)
    const status    = searchParams.get('status')
    const search    = searchParams.get('search')
    const dateFrom  = searchParams.get('dateFrom')
    const dateTo    = searchParams.get('dateTo')

    let query = supabase
      .from('pickup_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `phone.ilike.%${search}%,` +
        `rcrc_number.ilike.%${search}%`
      )
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      )
    }

    // Count by status
    const counts = {
      all:       data?.length || 0,
      new:       data?.filter(r => r.status === 'new').length       || 0,
      pending:   data?.filter(r => r.status === 'pending').length   || 0,
      approved:  data?.filter(r => r.status === 'approved').length  || 0,
      rejected:  data?.filter(r => r.status === 'rejected').length  || 0,
      completed: data?.filter(r => r.status === 'completed').length || 0,
    }

    return NextResponse.json(
      { success: true, data, counts },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('❌ Server error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// Update request status
export async function PATCH(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing env vars' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing id or status' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pickup_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    )
  }
}