import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required.' },
        { status: 400 }
      )
    }

    // ── Verify token ──────────────────────────────
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, email, user_id, expires_at, used')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid reset link.' },
        { status: 400 }
      )
    }

    if (tokenData.used) {
      return NextResponse.json(
        { error: 'This link has already been used.' },
        { status: 400 }
      )
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired.' },
        { status: 400 }
      )
    }

    // ── Hash new password ─────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── Update user password ──────────────────────
    let updateError

    if (tokenData.user_id) {
      const { error } = await supabase
        .from('users')
        .update({
          password:   hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenData.user_id)
      updateError = error
    } else {
      const { error } = await supabase
        .from('users')
        .update({
          password:   hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('email', tokenData.email)
      updateError = error
    }

    if (updateError) {
      console.error('❌ Password update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // ── Mark token as used ────────────────────────
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id)

    console.log('✅ Password reset successful for:', tokenData.email)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('❌ Reset confirm error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
