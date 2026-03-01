import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Email Data Type ──────────────────────────────────
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

// ─── Admin Notification Email ─────────────────────────
export async function sendAdminNotificationEmail(data: EmailData) {
  try {
    const { error } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',
      to:      ['gkulkara@ford.com'],
      subject: `New Pickup Request — ${data.rcrcName || data.customerName}`,
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        ">

          <!-- Header -->
          <div style="
            background-color: #1B4332;
            padding: 24px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          ">
            <h1 style="
              color: #ffffff;
              margin: 0;
              font-size: 22px;
              font-weight: bold;
            ">
              New Scrap Pickup Request
            </h1>
            <p style="
              color: #a7f3d0;
              margin: 6px 0 0 0;
              font-size: 13px;
            ">
              Ford Component Sales — Pickup Management System
            </p>
          </div>

          <!-- Body -->
          <div style="
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            padding: 24px;
          ">
            <p style="
              color: #374151;
              font-size: 15px;
              margin-top: 0;
            ">
              A new pickup request has been submitted.
              Please review the details below.
            </p>

            <!-- Details Table -->
            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              margin-top: 8px;
            ">

              ${data.rcrcNumber ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  width: 42%;
                  border-bottom: 1px solid #e5e7eb;
                ">RCRC Number</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.rcrcNumber}</td>
              </tr>` : ''}

              ${data.rcrcName ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">RCRC Name</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.rcrcName}</td>
              </tr>` : ''}

              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Contact Person</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.customerName}</td>
              </tr>

              ${data.customerEmail ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Email</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.customerEmail}</td>
              </tr>` : ''}

              ${data.phone ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Phone</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.phone}</td>
              </tr>` : ''}

              ${data.address ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Pickup Address</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.address}</td>
              </tr>` : ''}

              ${data.preferredDate ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Preferred Pickup Date</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.preferredDate}</td>
              </tr>` : ''}

              ${data.pickupHours ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Pickup Hours</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.pickupHours}</td>
              </tr>` : ''}

              ${data.vehicleInfo ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Quantity Details</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.vehicleInfo}</td>
              </tr>` : ''}

              ${data.notes ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                ">Notes</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                ">${data.notes}</td>
              </tr>` : ''}

            </table>

            <!-- Request ID Badge -->
            ${data.requestId ? `
            <div style="
              margin-top: 20px;
              padding: 12px 16px;
              background-color: #ecfdf5;
              border-left: 4px solid #1B4332;
              border-radius: 4px;
            ">
              <p style="margin: 0; font-size: 13px; color: #374151;">
                <strong>Request ID:</strong> #${data.requestId}
              </p>
            </div>` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 24px;">
              <a
                href="https://scrap-pickup-site.vercel.app/admin/dashboard"
                style="
                  display: inline-block;
                  background-color: #1B4332;
                  color: #ffffff;
                  padding: 12px 28px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: bold;
                  font-size: 14px;
                "
              >
                View in Dashboard →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <p style="
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 20px;
          ">
            Ford Component Sales — Scrap Pickup System<br/>
            This is an automated admin notification email.
          </p>

        </div>
      `,
    })

    if (error) {
      console.error('Admin email error:', error)
      return { success: false, error }
    }

    return { success: true }

  } catch (err) {
    console.error('sendAdminNotificationEmail failed:', err)
    return { success: false, error: err }
  }
}

// ─── Requestor Confirmation Email ─────────────────────
export async function sendRequestorConfirmationEmail(data: EmailData) {
  if (!data.customerEmail) {
    return { success: false, error: 'No customer email provided' }
  }

  try {
    const { error } = await resend.emails.send({
      from:    'FCS Scrap Pickup <onboarding@resend.dev>',
      to:      [data.customerEmail],
      subject: 'Your Scrap Pickup Request Has Been Received',
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        ">

          <!-- Header -->
          <div style="
            background-color: #1B4332;
            padding: 24px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          ">
            <h1 style="
              color: #ffffff;
              margin: 0;
              font-size: 22px;
              font-weight: bold;
            ">
              Request Received
            </h1>
            <p style="
              color: #a7f3d0;
              margin: 6px 0 0 0;
              font-size: 13px;
            ">
              Ford Component Sales — Pickup Management System
            </p>
          </div>

          <!-- Body -->
          <div style="
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            padding: 24px;
          ">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">
              Dear <strong>${data.customerName}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px;">
              Thank you! Your scrap pickup request has been
              successfully submitted. Our team will review
              your request and contact you shortly to
              confirm the pickup schedule.
            </p>

            <!-- Summary Table -->
            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              margin-top: 8px;
            ">

              ${data.rcrcName ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  width: 42%;
                  border-bottom: 1px solid #e5e7eb;
                ">RCRC Name</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.rcrcName}</td>
              </tr>` : ''}

              ${data.preferredDate ? `
              <tr>
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                  border-bottom: 1px solid #e5e7eb;
                ">Preferred Pickup Date</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                  border-bottom: 1px solid #e5e7eb;
                ">${data.preferredDate}</td>
              </tr>` : ''}

              ${data.vehicleInfo ? `
              <tr style="background-color: #f9fafb;">
                <td style="
                  padding: 12px 16px;
                  font-weight: bold;
                  color: #374151;
                ">Quantity Details</td>
                <td style="
                  padding: 12px 16px;
                  color: #111827;
                ">${data.vehicleInfo}</td>
              </tr>` : ''}

            </table>

            <!-- Request ID Badge -->
            ${data.requestId ? `
            <div style="
              margin-top: 20px;
              padding: 12px 16px;
              background-color: #ecfdf5;
              border-left: 4px solid #1B4332;
              border-radius: 4px;
            ">
              <p style="margin: 0; font-size: 13px; color: #374151;">
                <strong>Your Request ID:</strong> #${data.requestId}
              </p>
            </div>` : ''}

            <p style="
              color: #6b7280;
              font-size: 13px;
              margin-top: 20px;
            ">
              Questions? Contact us at
              <a href="mailto:fcscats@ford.com"
                style="color: #1B4332; font-weight: bold;">
                fcscats@ford.com
              </a>
              or call <strong>+1 (248) 912-7995</strong>
            </p>
          </div>

          <!-- Footer -->
          <p style="
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 20px;
          ">
            Ford Component Sales — Scrap Pickup System<br/>
            This is an automated confirmation email.
          </p>

        </div>
      `,
    })

    if (error) {
      console.error('Requestor email error:', error)
      return { success: false, error }
    }

    return { success: true }

  } catch (err) {
    console.error('sendRequestorConfirmationEmail failed:', err)
    return { success: false, error: err }
  }
}

// ─── Legacy Placeholder ───────────────────────────────
export async function sendPickupEmail(data: EmailData) {
  await sendAdminNotificationEmail(data)
  await sendRequestorConfirmationEmail(data)
  return { success: true }
}