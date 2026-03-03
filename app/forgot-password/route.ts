// app/api/forgot-password/route.ts
import { NextResponse }    from 'next/server'
import { createClient }    from '@supabase/supabase-js'
import { Resend }          from 'resend'
import crypto              from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // ── Step 1: Check if user exists ─────────────
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .single()

    // ⚠️ Always return success even if user not found
    // (security best practice - don't reveal if email exists)
    if (userError || !user) {
      console.log('User not found for reset:', normalizedEmail)
      return NextResponse.json(
        { success: true },
        { status: 200 }
      )
    }

    // ── Step 2: Generate secure token ────────────
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // ── Step 3: Delete old unused tokens ─────────
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', normalizedEmail)
      .eq('used', false)

    // ── Step 4: Save new token ────────────────────
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert([{
        email:      normalizedEmail,
        token,
        used:       false,
        expires_at: expiresAt.toISOString(),
      }])

    if (insertError) {
      console.error('Token insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      )
    }

    // ── Step 5: Build reset link ──────────────────
    const baseUrl   = process.env.NEXT_PUBLIC_APP_URL
                   || 'https://fordcomponentsales.in'
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    console.log('Reset link generated:', resetLink)

    // ── Step 6: Send reset email ──────────────────
    const { error: emailError } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',
      to:      [normalizedEmail],
      subject: 'Reset Your Password — Ford Component Sales',
      html: `
        <div style="font-family: Arial, sans-serif;
                    max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background-color: #003478;
                      padding: 24px 20px;
                      text-align: center;
                      border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0;
                       font-size: 22px; font-weight: bold;">
              🔐 Password Reset Request
            </h1>
            <p style="color: #a7c4f0; margin: 6px 0 0 0;
                      font-size: 13px;">
              Ford Component Sales — Scrap Pickup System
            </p>
          </div>

          <!-- Body -->
          <div style="border: 1px solid #e5e7eb;
                      border-top: none;
                      padding: 32px 24px;
                      border-radius: 0 0 8px 8px;
                      background: #ffffff;">

            <p style="color: #374151; font-size: 15px;
                      margin-top: 0;">
              Hi <strong>${user.full_name || normalizedEmail}</strong>,
            </p>

            <p style="color: #374151; font-size: 15px;">
              We received a request to reset your password.
              Click the button below to create a new password.
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="display: inline-block;
                        background-color: #003478;
                        color: #ffffff;
                        padding: 14px 36px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 15px;">
                🔐 Reset My Password
              </a>
            </div>

            <!-- Warning Box -->
            <div style="background-color: #fffbeb;
                        border: 1px solid #fcd34d;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px;
                        color: #92400e;">
                ⚠️ This link expires in <strong>1 hour</strong>.
                If you did not request a password reset,
                please ignore this email.
              </p>
            </div>

            <!-- Manual Link -->
            <p style="color: #6b7280; font-size: 12px;
                      word-break: break-all;">
              If the button doesn't work, copy this link:
              <br/>
              <a href="${resetLink}"
                 style="color: #003478;">${resetLink}</a>
            </p>

          </div>

          <!-- Footer -->
          <p style="text-align: center; color: #9ca3af;
                    font-size: 12px; margin-top: 16px;">
            © ${new Date().getFullYear()} Ford Motor Company —
            Component Sales Division
          </p>

        </div>
      `,
    })

    if (emailError) {
      console.error('Email send error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      )
    }

    console.log('✅ Password reset email sent to:', normalizedEmail)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Forgot password API error:', err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}