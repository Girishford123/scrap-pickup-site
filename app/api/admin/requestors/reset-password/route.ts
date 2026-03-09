import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'
import nodemailer                    from 'nodemailer'

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

    // ── Generate secure token ────────────────────────
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

    // ── Send email via Nodemailer ────────────────────
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from:    `"Ford MCL System" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject: '🔐 Reset Your Ford MCL Password',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; 
                        border-radius: 16px; overflow: hidden; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <div style="background: #003478; padding: 32px 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">
                  🏭 Ford MCL System
                </h1>
                <p style="color: #93c5fd; margin: 8px 0 0; font-size: 14px;">
                  Scrap Pickup Portal
                </p>
              </div>

              <!-- Body -->
              <div style="padding: 40px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">
                  Hello <strong>${user.full_name}</strong>,
                </p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  An admin has requested a password reset for your account. 
                  Click the button below to set a new password.
                </p>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetLink}"
                     style="display: inline-block; background: #003478; 
                            color: white; text-decoration: none; 
                            padding: 14px 36px; border-radius: 10px; 
                            font-size: 15px; font-weight: bold;">
                    🔐 Reset My Password
                  </a>
                </div>

                <!-- Expiry Warning -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; 
                            border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px;">
                    ⏰ This link expires in <strong>1 hour</strong>.
                    If you did not request this, please ignore this email.
                  </p>
                </div>

                <!-- Fallback Link -->
                <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
                  If the button doesn't work, copy and paste this link:<br/>
                  <a href="${resetLink}" 
                     style="color: #003478; word-break: break-all;">
                    ${resetLink}
                  </a>
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f9fafb; padding: 20px 40px; 
                          border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  Ford Motor Company — MCL Scrap Pickup System<br/>
                  This is an automated message. Please do not reply.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Reset link sent to ${user.email}`,
    })

  } catch (err: any) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
