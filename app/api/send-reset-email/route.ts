import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

// ── Nodemailer transporter using cPanel SMTP ─────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: Request) {
  try {
    const { email, resetLink } = await request.json()

    if (!email || !resetLink) {
      return NextResponse.json(
        { error: 'Email and reset link are required' },
        { status: 400 }
      )
    }

    await transporter.sendMail({
      from:    `"Ford Component Sales" <${process.env.SMTP_FROM}>`,
      to:      email,
      subject: 'Reset Your Password – Ford Component Sales',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0; padding:0; background-color:#f3f4f6; 
                       font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" 
                   style="background-color:#f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" 
                         style="max-width:600px; width:100%;">
                    <!-- Header -->
                    <tr>
                      <td style="background-color:#003478; padding: 20px 40px; 
                                 border-radius: 12px 12px 0 0; text-align: center;">
                        <p style="color:#ffffff; margin:0; font-size:12px; 
                                  letter-spacing:2px; text-transform:uppercase;">
                          Ford Motor Company – Component Sales Division
                        </p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="background-color:#ffffff; padding: 40px; 
                                 border-radius: 0 0 12px 12px;
                                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align:center; margin-bottom:24px;">
                          <div style="width:70px; height:70px; background-color:#dbeafe; 
                                      border-radius:50%; margin:0 auto; font-size:32px; 
                                      line-height:70px; text-align:center;">
                            🔐
                          </div>
                        </div>
                        <h1 style="color:#111827; font-size:24px; font-weight:700; 
                                   text-align:center; margin:0 0 8px 0;">
                          Password Reset Request
                        </h1>
                        <p style="color:#6b7280; font-size:15px; text-align:center; 
                                  margin:0 0 32px 0;">
                          We received a request to reset your password.
                        </p>
                        <p style="color:#374151; font-size:15px; line-height:1.6; 
                                  margin:0 0 24px 0;">
                          Hello,<br><br>
                          Click the button below to reset your password. 
                          This link will expire in <strong>1 hour</strong>.
                        </p>
                        <div style="text-align:center; margin: 32px 0;">
                          <a href="${resetLink}" 
                             style="display:inline-block; background-color:#003478; 
                                    color:#ffffff; padding:14px 36px; border-radius:8px; 
                                    text-decoration:none; font-size:16px; font-weight:600;">
                            🔐 Reset My Password
                          </a>
                        </div>
                        <div style="background-color:#fef3c7; border:1px solid #fcd34d; 
                                    border-radius:8px; padding:16px; margin:24px 0;">
                          <p style="color:#92400e; font-size:13px; margin:0;">
                            ⚠️ <strong>Security Notice:</strong> If you did not request 
                            a password reset, please ignore this email.
                          </p>
                        </div>
                        <p style="color:#6b7280; font-size:13px; margin:16px 0 0 0;">
                          If the button doesn't work, copy and paste this link:<br>
                          <a href="${resetLink}" style="color:#003478; word-break:break-all;">
                            ${resetLink}
                          </a>
                        </p>
                        <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;">
                        <p style="color:#9ca3af; font-size:12px; text-align:center; margin:0;">
                          © ${new Date().getFullYear()} Ford Motor Company. 
                          All rights reserved.<br>Ford Component Sales Division
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

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
