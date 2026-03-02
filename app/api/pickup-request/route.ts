import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
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

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const payload = await req.json()
    console.log('📦 Server inserting:', payload)

    const { data, error } = await supabase
      .from('pickup_requests')
      .insert([payload])
      .select()

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

    console.log('✅ Insert success:', data)
    return NextResponse.json({
      success: true,
      data,
    })

  } catch (err: any) {
    console.error('❌ Server error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
