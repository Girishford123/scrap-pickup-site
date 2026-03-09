import { NextRequest, NextResponse }  from 'next/server'
import { createClient }               from '@supabase/supabase-js'
import { sendPasswordResetEmail }     from '@/lib/sendemail'
import crypto                         from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      )
    }

    // ── Fetch requestor ──────────────────────────────
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Requestor not found.' },
        { status: 404 }
      )
    }

    // ── Delete old tokens ────────────────────────────
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', userId)

    // ── Generate new token ───────────────────────────
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // ── Save token to DB ─────────────────────────────
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([{
        user_id:    userId,
        token,
        expires_at: expiresAt.toISOString(),
        used:       false,
      }])

    if (tokenError) {
      return NextResponse.json(
        { error: tokenError.message },
        { status: 500 }
      )
    }

    // ── Build reset link ─────────────────────────────
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    // ── Send email via lib/sendemail ─────────────────
    const result = await sendPasswordResetEmail({
      fullName:  user.full_name,
      email:     user.email,
      resetLink,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send reset email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Reset link sent to ${user.email}`,
    })

  } catch (err: any) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
