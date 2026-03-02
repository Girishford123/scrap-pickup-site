import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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
          error:   'Missing environment variables',
          hasUrl:  !!supabaseUrl,
          hasKey:  !!serviceKey,
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession:   false,
        autoRefreshToken: false,
      },
    })

    const { data, error } = await supabase
      .from('pickup_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error:   error.message,
          code:    error.code,
          hint:    error.hint,
        },
        { status: 500 }
      )
    }

    const counts = {
      all:       data?.length || 0,
      new:       data?.filter(r =>
                   r.status === 'new' || r.status === 'NEW'
                 ).length || 0,
      pending:   data?.filter(r => r.status === 'pending').length   || 0,
      approved:  data?.filter(r => r.status === 'approved').length  || 0,
      rejected:  data?.filter(r => r.status === 'rejected').length  || 0,
      completed: data?.filter(r => r.status === 'completed').length || 0,
    }

    console.log(`✅ Fetched ${data?.length} requests from Supabase`)

    return NextResponse.json(
      { success: true, data, counts },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

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
        persistSession:   false,
        autoRefreshToken: false,
      },
    })

    let body: { id: number; status: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing id or status' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pickup_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 500 }
      )
    }

    console.log(`✅ Updated request ${id} → ${status}`)

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}