import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Step 1: Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Step 2: Verify token exists and is not used
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Step 3: Check token not expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Step 4: Hash the new password with bcrypt
    // 12 salt rounds = very secure
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('Hashing password for:', tokenData.email)

    // Step 5: Update password in users table
    // Storing HASH not plain text ✅
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', tokenData.email)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Step 6: Mark token as used
    // So it cannot be reused again!
    const { error: tokenUpdateError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    if (tokenUpdateError) {
      console.error('Token update error:', tokenUpdateError)
    }

    console.log('Password reset successful for:', tokenData.email)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Reset password API error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}