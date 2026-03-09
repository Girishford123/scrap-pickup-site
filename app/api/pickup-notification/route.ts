import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      to,
      subject,
      requestorName,
      rcrcNumber,
      rcrcName,
      rcrcContactPerson,
      rcrcEmail,
      rcrcPhoneNumber,
      rcrcAddress,
      rcrcAddress2,
      state,
      rcrcZipCode,
      preferredDate,
      pickupHours,
      palletQuantity,
      totalPiecesQuantity,
      notes,
      requestId,
    } = body

    // Determine if this is admin or requestor email
    const isAdmin =
      to.includes('admin') ||
      subject.includes('New Pickup Request')

    const htmlContent = isAdmin
      ? `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif;
                   line-height: 1.6; color: #333; }
            .container { max-width: 600px;
                         margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(
                        135deg, #1e3a8a 0%, #1e40af 100%);
                      color: white; padding: 30px;
                      text-align: center;
                      border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px;
                       border-radius: 0 0 10px 10px; }
            .info-section { background: white; padding: 20px;
                            margin: 15px 0; border-radius: 8px;
                            border-left: 4px solid #1e40af; }
            .info-row { display: flex; padding: 8px 0;
                        border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: bold; width: 200px;
                     color: #4b5563; }
            .value { color: #1f2937; }
            .footer { text-align: center; margin-top: 30px;
                      padding: 20px; color: #6b7280;
                      font-size: 14px; }
            .button { display: inline-block;
                      background: #1e40af; color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 New Pickup Request Received</h1>
              <p>Request ID: ${requestId || 'N/A'}</p>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>A new scrap pickup request has been submitted.
                 Please review the details below:</p>

              <div class="info-section">
                <h3 style="margin-top:0;color:#1e40af;">
                  📋 RCRC Information
                </h3>
                <div class="info-row">
                  <span class="label">RCRC Number:</span>
                  <span class="value">${rcrcNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">RCRC Name:</span>
                  <span class="value">${rcrcName || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Contact Person:</span>
                  <span class="value">
                    ${rcrcContactPerson || 'N/A'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${rcrcEmail || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">
                    ${rcrcPhoneNumber || 'N/A'}
                  </span>
                </div>
              </div>

              <div class="info-section">
                <h3 style="margin-top:0;color:#1e40af;">
                  📍 Pickup Location
                </h3>
                <div class="info-row">
                  <span class="label">Address 1:</span>
                  <span class="value">
                    ${rcrcAddress || 'N/A'}
                  </span>
                </div>
                ${rcrcAddress2 ? `
                <div class="info-row">
                  <span class="label">Address 2:</span>
                  <span class="value">${rcrcAddress2}</span>
                </div>` : ''}
                <div class="info-row">
                  <span class="label">State:</span>
                  <span class="value">${state || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Zip Code:</span>
                  <span class="value">
                    ${rcrcZipCode || 'N/A'}
                  </span>
                </div>
              </div>

              <div class="info-section">
                <h3 style="margin-top:0;color:#1e40af;">
                  📅 Schedule
                </h3>
                <div class="info-row">
                  <span class="label">Preferred Date:</span>
                  <span class="value">
                    ${preferredDate || 'N/A'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Time Window:</span>
                  <span class="value">
                    ${pickupHours || 'N/A'}
                  </span>
                </div>
              </div>

              <div class="info-section">
                <h3 style="margin-top:0;color:#1e40af;">
                  📦 Quantities
                </h3>
                <div class="info-row">
                  <span class="label">Pallet Quantity:</span>
                  <span class="value">
                    ${palletQuantity || 0}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Total Pieces:</span>
                  <span class="value">
                    ${totalPiecesQuantity || 0}
                  </span>
                </div>
              </div>

              ${notes ? `
              <div class="info-section">
                <h3 style="margin-top:0;color:#1e40af;">
                  📝 Notes
                </h3>
                <p style="margin:0;">${notes}</p>
              </div>` : ''}

              <div style="text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL
                          || 'https://www.fordcomponentsales.in'}
                          /login/admin" class="button">
                  View in Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Ford Component Sales -
                 Scrap Pickup Management System</p>
              <p>This is an automated notification.
                 Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>`
      : `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif;
                   line-height: 1.6; color: #333; }
            .container { max-width: 600px;
                         margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(
                        135deg, #1e3a8a 0%, #1e40af 100%);
                      color: white; padding: 30px;
                      text-align: center;
                      border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px;
                       border-radius: 0 0 10px 10px; }
            .success-badge { background: #10b981;
                             color: white;
                             padding: 10px 20px;
                             border-radius: 20px;
                             display: inline-block;
                             margin: 20px 0; }
            .info-section { background: white; padding: 20px;
                            margin: 15px 0; border-radius: 8px;
                            border-left: 4px solid #10b981; }
            .info-row { display: flex; padding: 8px 0;
                        border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: bold; width: 200px;
                     color: #4b5563; }
            .value { color: #1f2937; }
            .footer { text-align: center; margin-top: 30px;
                      padding: 20px; color: #6b7280;
                      font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pickup Request Confirmed</h1>
              <div class="success-badge">
                Request Submitted Successfully
              </div>
            </div>
            <div class="content">
              <p>Hello ${requestorName},</p>
              <p>Thank you for submitting your scrap pickup
                 request. We have received your request and
                 will process it shortly.</p>

              <div class="info-section">
                <h3 style="margin-top:0;color:#10b981;">
                  📋 Request Summary
                </h3>
                <div class="info-row">
                  <span class="label">RCRC Number:</span>
                  <span class="value">
                    ${rcrcNumber || 'N/A'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Pickup Date:</span>
                  <span class="value">
                    ${preferredDate || 'N/A'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Time Window:</span>
                  <span class="value">
                    ${pickupHours || 'N/A'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Location:</span>
                  <span class="value">
                    ${rcrcAddress}, ${state} ${rcrcZipCode}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Pallet Quantity:</span>
                  <span class="value">
                    ${palletQuantity || 0}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Total Pieces:</span>
                  <span class="value">
                    ${totalPiecesQuantity || 0}
                  </span>
                </div>
              </div>

              <div style="background:#fef3c7;padding:15px;
                          border-radius:8px;margin:20px 0;
                          border-left:4px solid #f59e0b;">
                <h4 style="margin-top:0;color:#92400e;">
                  ⏱️ What's Next?
                </h4>
                <ul style="margin:0;padding-left:20px;
                           color:#78350f;">
                  <li>Our team will review your request
                      within 24 hours</li>
                  <li>You will receive a confirmation email
                      with pickup details</li>
                  <li>Our driver will contact you
                      before arrival</li>
                </ul>
              </div>

              <div style="background:#dbeafe;padding:15px;
                          border-radius:8px;margin:20px 0;
                          border-left:4px solid #2563eb;">
                <h4 style="margin-top:0;color:#1e40af;">
                  📞 Need Help?
                </h4>
                <p style="margin:0;color:#1e3a8a;">
                  Contact us at
                  <strong>
                    support@fordcomponentsales.in
                  </strong>
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Ford Component Sales -
                 Scrap Pickup Management System</p>
              <p>This is an automated confirmation.
                 Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>`

    // ✅ Send via Resend with verified domain
    const { error: emailError } = await resend.emails.send({
      from:    'Ford Component Sales <noreply@fordcomponentsales.in>',
      to:      [to],
      subject: subject,
      html:    htmlContent,
    })

    if (emailError) {
      console.error('❌ Resend error:', emailError)
      return NextResponse.json(
        { error: emailError },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully to:', to)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Email API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
