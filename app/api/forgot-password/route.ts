import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

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

    // Step 1: Check if email exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    // Always return success even if email not found
    // This is a security best practice
    if (!user || userError) {
      console.log('Email not found, returning success anyway')
      return NextResponse.json(
        { success: true },
        { status: 200 }
      )
    }

    // Step 2: Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // Step 3: Set expiry to 1 hour from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Step 4: Delete any existing tokens for this email
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email.toLowerCase().trim())

    // Step 5: Save new token to database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([{
        email: email.toLowerCase().trim(),
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      }])

    if (tokenError) {
      console.error('Token insert error:', tokenError)
      return NextResponse.json(
        { error: 'Failed to create reset token' },
        { status: 500 }
      )
    }

    // Step 6: Build reset link
    const resetLink =
      `https://www.fordcomponentsales.in/reset-password?token=${token}`

    // Step 7: Send email via Resend
    const { data: emailData, error: emailError } =
      await resend.emails.send({
        from: 'Ford Component Sales <noreply@fordcomponentsales.in>',
        to: [email],
        subject: 'Reset Your Password – Ford Component Sales',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" 
              content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; 
            background-color:#f3f4f6; 
            font-family: Arial, sans-serif;">

              <table width="100%" cellpadding="0" 
              cellspacing="0" 
              style="background-color:#f3f4f6; 
              padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" 
                    cellspacing="0" 
                    style="max-width:600px; width:100%;">

                      <!-- Ford Header -->
                      <tr>
                        <td style="background-color:#003478; 
                        padding: 20px 40px; 
                        border-radius: 12px 12px 0 0;
                        text-align: center;">
                          <p style="color:#ffffff; margin:0; 
                          font-size:12px; letter-spacing:2px; 
                          text-transform:uppercase; 
                          font-weight:600;">
                            Ford Motor Company –
                            Component Sales Division
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="background-color:#ffffff; 
                        padding: 40px; 
                        border-radius: 0 0 12px 12px;">

                          <!-- Icon -->
                          <div style="text-align:center; 
                          margin-bottom:24px;">
                            <div style="width:80px; height:80px; 
                            background-color:#dbeafe; 
                            border-radius:50%; margin:0 auto;
                            text-align:center; line-height:80px; 
                            font-size:36px;">
                              🔐
                            </div>
                          </div>

                          <!-- Title -->
                          <h1 style="color:#111827; 
                          font-size:26px; font-weight:700; 
                          text-align:center; margin:0 0 8px 0;">
                            Password Reset Request
                          </h1>

                          <p style="color:#6b7280; 
                          font-size:15px; text-align:center; 
                          margin:0 0 32px 0;">
                            We received a request to reset 
                            your password.
                          </p>

                          <!-- Greeting -->
                          <p style="color:#374151; 
                          font-size:15px; line-height:1.6; 
                          margin:0 0 24px 0;">
                            Hello ${user.full_name || 'User'},
                            <br><br>
                            Click the button below to reset 
                            your password. This link will 
                            expire in <strong>1 hour</strong>.
                          </p>

                          <!-- Reset Button -->
                          <div style="text-align:center; 
                          margin: 32px 0;">
                            <a href="${resetLink}" 
                            style="display:inline-block; 
                            background-color:#003478; 
                            color:#ffffff; padding:16px 40px; 
                            border-radius:8px; 
                            text-decoration:none; 
                            font-size:16px; font-weight:700;">
                              🔐 Reset My Password
                            </a>
                          </div>

                          <!-- Expiry Note -->
                          <div style="background-color:#f0f9ff; 
                          border:1px solid #bae6fd; 
                          border-radius:8px; padding:16px; 
                          margin:24px 0; text-align:center;">
                            <p style="color:#0369a1; 
                            font-size:13px; margin:0;">
                              ⏰ This link expires in 
                              <strong>1 hour</strong>.
                            </p>
                          </div>

                          <!-- Security Warning -->
                          <div style="background-color:#fef3c7; 
                          border:1px solid #fcd34d; 
                          border-radius:8px; padding:16px; 
                          margin:24px 0;">
                            <p style="color:#92400e; 
                            font-size:13px; margin:0;">
                              ⚠️ <strong>Security Notice:</strong>
                              If you did not request this, 
                              please ignore this email. 
                              Your password will NOT be changed.
                            </p>
                          </div>

                          <!-- Fallback Link -->
                          <p style="color:#6b7280; 
                          font-size:12px; margin:16px 0 0 0;">
                            If the button does not work, 
                            copy and paste this link:
                            <br>
                            <a href="${resetLink}" 
                            style="color:#003478; 
                            word-break:break-all; 
                            font-size:11px;">
                              ${resetLink}
                            </a>
                          </p>

                          <hr style="border:none; 
                          border-top:1px solid #e5e7eb; 
                          margin:32px 0;">

                          <p style="color:#9ca3af; 
                          font-size:12px; text-align:center; 
                          margin:0;">
                            © ${new Date().getFullYear()} 
                            Ford Motor Company.<br>
                            All rights reserved.
                          </p>

                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

            </body>
          </html>
        `
      })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    console.log('Reset email sent successfully:', emailData)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Forgot password API error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}