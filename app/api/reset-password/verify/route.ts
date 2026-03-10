import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    console.log('🔍 Verifying token:', token?.substring(0, 10) + '...')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token missing.' }
      )
    }

    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('id, expires_at, used')
      .eq('token', token)
      .single()

    console.log('📦 Token data:', data, 'Error:', error)

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: 'Invalid reset link.' }
      )
    }

    if (data.used) {
      return NextResponse.json(
        { valid: false, error: 'This link has already been used.' }
      )
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This reset link has expired.' }
      )
    }

    console.log('✅ Token is valid!')
    return NextResponse.json({ valid: true })

  } catch (err: any) {
    console.error('❌ Verify token error:', err)
    return NextResponse.json(
      { valid: false, error: err.message }
    )
  }
}
