import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailData = {
  customerName:   string
  customerEmail?: string | null
  phone?:         string
  address?:       string
  vehicleInfo?:   string
  preferredDate?: string
  notes?:         string
  requestId?:     string
  rcrcNumber?:    string
  rcrcName?:      string
  pickupHours?:   string
}

export async function sendAdminNotificationEmail(data: EmailData) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'gkulkara@ford.com'

    const { error } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',
      to:      [adminEmail],
      subject: `New Pickup Request - ${data.rcrcName || data.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #003478; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">
              New Scrap Pickup Request
            </h1>
            <p style="color: #a7c4f0; margin: 4px 0 0 0; font-size: 13px;">
              Ford Component Sales
            </p>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">
              A new pickup request has been submitted. Please review below.
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; width: 40%; border-bottom: 1px solid #e5e7eb;">RCRC Number</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.rcrcNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">RCRC Name</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.rcrcName || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Contact Person</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.customerEmail || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Phone</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Pickup Address</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.address || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Preferred Date</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.preferredDate || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Pickup Hours</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.pickupHours || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Quantity Details</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.vehicleInfo || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151;">Notes</td>
                <td style="padding: 10px 16px; color: #111827;">${data.notes || 'N/A'}</td>
              </tr>
            </table>
            ${data.requestId ? `
            <div style="margin-top: 20px; padding: 12px 16px; background-color: #eff6ff; border-left: 4px solid #003478; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #374151;">
                <strong>Request ID:</strong> #${data.requestId}
              </p>
            </div>` : ''}
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://fordcomponentsales.in/admin/dashboard"
                style="display: inline-block; background-color: #003478; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                View in Dashboard
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Ford Component Sales — Scrap Pickup System
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Admin email error:', error)
      return { success: false, error }
    }

    console.log('✅ Admin email sent to:', adminEmail)
    return { success: true }

  } catch (err) {
    console.error('sendAdminNotificationEmail failed:', err)
    return { success: false, error: err }
  }
}

export async function sendRequestorConfirmationEmail(data: EmailData) {
  if (!data.customerEmail) {
    return { success: false, error: 'No customer email' }
  }

  try {
    const { error } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',
      to:      [data.customerEmail],
      subject: 'Your Scrap Pickup Request Has Been Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #003478; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">
              Request Received
            </h1>
            <p style="color: #a7c4f0; margin: 4px 0 0 0; font-size: 13px;">
              Ford Component Sales
            </p>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">
              Dear <strong>${data.customerName}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px;">
              Thank you! Your scrap pickup request has been successfully
              submitted. Our team will contact you shortly to confirm
              the pickup schedule.
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; width: 40%; border-bottom: 1px solid #e5e7eb;">RCRC Name</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.rcrcName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Preferred Date</td>
                <td style="padding: 10px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${data.preferredDate || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 16px; font-weight: bold; color: #374151;">Quantity Details</td>
                <td style="padding: 10px 16px; color: #111827;">${data.vehicleInfo || 'N/A'}</td>
              </tr>
            </table>
            ${data.requestId ? `
            <div style="margin-top: 20px; padding: 12px 16px; background-color: #eff6ff; border-left: 4px solid #003478; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #374151;">
                <strong>Your Request ID:</strong> #${data.requestId}
              </p>
            </div>` : ''}
            <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
              Questions? Contact us at
              <a href="mailto:fcsmktg@ford.com" style="color: #003478; font-weight: bold;">fcsmktg@ford.com</a>
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Ford Component Sales — Scrap Pickup System
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Requestor email error:', error)
      return { success: false, error }
    }

    console.log('✅ Requestor email sent to:', data.customerEmail)
    return { success: true }

  } catch (err) {
    console.error('sendRequestorConfirmationEmail failed:', err)
    return { success: false, error: err }
  }
}

export async function sendPickupEmail(data: EmailData) {
  await sendAdminNotificationEmail(data)
  await sendRequestorConfirmationEmail(data)
  return { success: true }
}

// ── NEW: Password Reset Email ─────────────────────────
export async function sendPasswordResetEmail({
  fullName,
  email,
  resetLink,
}: {
  fullName:  string
  email:     string
  resetLink: string
}) {
  try {
    const { error } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',  // ← same as above
      to:      [email],
      subject: '🔐 Reset Your Ford MCL Password',
      html: `
        <div style="font-family: Arial, sans-serif; 
                    max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="background-color: #003478; padding: 20px; 
                      text-align: center; 
                      border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">
              Password Reset Request
            </h1>
            <p style="color: #a7c4f0; margin: 4px 0 0 0; font-size: 13px;">
              Ford Component Sales
            </p>
          </div>

          <!-- Body -->
          <div style="border: 1px solid #e5e7eb; border-top: none; 
                      padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">
              Dear <strong>${fullName}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px;">
              An admin has requested a password reset for your account. 
              Click the button below to set a new password.
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

            <!-- Expiry Warning -->
            <div style="background-color: #fef3c7; 
                        border-left: 4px solid #f59e0b; 
                        border-radius: 4px; 
                        padding: 12px 16px; 
                        margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                ⏰ This link expires in <strong>1 hour</strong>. 
                If you did not request this, please ignore this email.
              </p>
            </div>

            <!-- Fallback Link -->
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              If the button does not work, copy and paste this link 
              into your browser:<br/>
              <a href="${resetLink}" 
                 style="color: #003478; word-break: break-all;">
                ${resetLink}
              </a>
            </p>

            <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
              Questions? Contact us at
              <a href="mailto:fcsmktg@ford.com" 
                 style="color: #003478; font-weight: bold;">
                fcsmktg@ford.com
              </a>
            </p>
          </div>

          <p style="text-align: center; color: #9ca3af; 
                    font-size: 12px; margin-top: 16px;">
            Ford Component Sales — Scrap Pickup System
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Password reset email error:', error)
      return { success: false, error }
    }

    console.log('✅ Password reset email sent to:', email)
    return { success: true }

  } catch (err) {
    console.error('sendPasswordResetEmail failed:', err)
    return { success: false, error: err }
  }
}
