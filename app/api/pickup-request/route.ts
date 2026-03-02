// app/api/pickup-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
        {
          success: false,
          error: 'Missing SUPABASE_URL env var',
        },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var',
        },
        { status: 500 }
      )
    }

    // ── Create server Supabase client ───────────
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
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
          details: error.details,
        },
        { status: 500 }
      )
    }

    console.log('✅ Insert success:', data)
    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unknown server error',
      },
      { status: 500 }
    )
  }
}