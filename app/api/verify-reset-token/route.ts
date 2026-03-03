// app/api/verify-reset-token/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // ── Check token in database ───────────────────
    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error || !tokenData) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 200 }
      )
    }

    // ── Check expiry ──────────────────────────────
    const now       = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'Token has expired' },
        { status: 200 }
      )
    }

    // ── Token is valid ────────────────────────────
    return NextResponse.json(
      {
        valid: true,
        email: tokenData.email,
      },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Verify token error:', err)
    return NextResponse.json(
      { valid: false, error: err.message },
      { status: 500 }
    )
  }
}