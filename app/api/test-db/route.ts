import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({
      success: false,
      error: 'Missing env vars',
      hasUrl: !!url,
      hasKey: !!key,
    })
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data, error } = await supabase
      .from('pickup_requests')
      .select('id, customer_name, status')
      .limit(2)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'DB connected!',
      rows: data,
    })

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message,
    })
  }
}