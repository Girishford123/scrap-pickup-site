import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      reason,
      reasonDetail,
      deletedBy = 'admin',
    } = body

    if (!id || !reason) {
      return NextResponse.json(
        { error: 'Missing id or reason' },
        { status: 400 }
      )
    }

    // ── 1. Fetch the full record first ──────────────────
    const { data: record, error: fetchErr } = await supabase
      .from('pickup_request')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    // ── 2. Save to deleted_requests (audit log) ─────────
    const { error: auditErr } = await supabase
      .from('deleted_requests')
      .insert({
        original_id:           record.id,
        mcl_number:            record.mcl_number,
        rcrc_name:             record.rcrc_name,
        rcrc_number:           record.rcrc_number,
        rcrc_contact_person:   record.rcrc_contact_person,
        rcrc_email:            record.rcrc_email,
        rcrc_phone_number:     record.rcrc_phone_number,
        status_at_deletion:    record.status,
        fcsd_offer_amount:     record.fcsd_offer_amount,
        pallet_quantity:       record.pallet_quantity,
        total_pieces_quantity: record.total_pieces_quantity,
        requested_pickup_date: record.requested_pickup_date,
        delete_reason:         reason,
        delete_reason_detail:  reasonDetail ?? null,
        deleted_by:            deletedBy,
        deleted_at:            new Date().toISOString(),
        original_created_at:   record.created_at,
        full_record:           record,
      })

    if (auditErr) {
      return NextResponse.json(
        { error: `Audit log failed: ${auditErr.message}` },
        { status: 500 }
      )
    }

    // ── 3. Delete from pickup_request ───────────────────
    const { error: deleteErr } = await supabase
      .from('pickup_request')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json(
        { error: `Delete failed: ${deleteErr.message}` },
        { status: 500 }
      )
    }

    // ── 4. Send email to requestor ──────────────────────
    const recipientEmail = record.rcrc_email || record.email
    const recipientName  = record.rcrc_contact_person
      || record.rcrc_name
      || record.customer_name
      || 'Requestor'

    const reasonLabels: Record<string, string> = {
      duplicate:          'Duplicate Request',
      test_record:        'Test / Demo Record',
      wrong_information:  'Incorrect Information Submitted',
      cancelled_by_rcrc:  'Cancelled by RCRC',
      no_longer_needed:   'No Longer Needed',
      other:              'Other',
    }

    if (recipientEmail) {
      await resend.emails.send({
        from:    'Ford FCSD Scrap <noreply@yourdomain.com>',
        to:      [recipientEmail],
        subject: `Your Scrap Pickup Request Has Been Removed — MCL ${record.mcl_number ?? record.id}`,
        html: `
          <div style="font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                      background: #f9fafb;
                      border-radius: 12px;">

            <div style="background: #1e40af;
                        padding: 20px 24px;
                        border-radius: 10px 10px 0 0;
                        text-align: center;">
              <h1 style="color: white;
                         font-size: 20px;
                         margin: 0;">
                🏭 Ford FCSD Scrap Pickup
              </h1>
            </div>

            <div style="background: white;
                        padding: 28px;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #e5e7eb;">

              <p style="color: #374151;
                        font-size: 15px;
                        margin-bottom: 20px;">
                Dear <strong>${recipientName}</strong>,
              </p>

              <p style="color: #374151; font-size: 15px;">
                We are writing to inform you that your scrap pickup
                request has been <strong style="color: #dc2626;">
                removed</strong> from our system by the
                Ford FCSD admin team.
              </p>

              <!-- Request Details -->
              <div style="background: #f3f4f6;
                          border-radius: 8px;
                          padding: 16px;
                          margin: 20px 0;">
                <p style="font-size: 13px;
                          color: #6b7280;
                          margin: 0 0 10px;
                          font-weight: bold;
                          text-transform: uppercase;
                          letter-spacing: 0.05em;">
                  Request Details
                </p>
                <table style="width: 100%;
                              font-size: 14px;
                              color: #374151;
                              border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0;
                                color: #6b7280;
                                width: 45%;">MCL Number</td>
                    <td style="padding: 4px 0;
                                font-weight: bold;">
                      ${record.mcl_number ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">
                      RCRC Name
                    </td>
                    <td style="padding: 4px 0; font-weight: bold;">
                      ${record.rcrc_name ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">
                      RCRC Number
                    </td>
                    <td style="padding: 4px 0; font-weight: bold;">
                      ${record.rcrc_number ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">
                      Requested Pickup Date
                    </td>
                    <td style="padding: 4px 0; font-weight: bold;">
                      ${record.requested_pickup_date ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">
                      Status at Removal
                    </td>
                    <td style="padding: 4px 0; font-weight: bold;">
                      ${record.status}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Reason -->
              <div style="background: #fef2f2;
                          border-left: 4px solid #dc2626;
                          border-radius: 0 8px 8px 0;
                          padding: 14px 16px;
                          margin: 16px 0;">
                <p style="font-size: 13px;
                          color: #991b1b;
                          font-weight: bold;
                          margin: 0 0 6px;">
                  Reason for Removal
                </p>
                <p style="font-size: 14px;
                          color: #374151;
                          margin: 0;">
                  ${reasonLabels[reason] ?? reason}
                </p>
                ${reasonDetail ? `
                  <p style="font-size: 13px;
                             color: #6b7280;
                             margin: 8px 0 0;">
                    <em>${reasonDetail}</em>
                  </p>
                ` : ''}
              </div>

              <p style="color: #374151;
                        font-size: 14px;
                        margin-top: 20px;">
                If you believe this was done in error or have
                any questions, please contact the
                Ford FCSD admin team directly.
              </p>

              <p style="color: #374151; font-size: 14px;">
                If you still need a pickup, please submit
                a new request.
              </p>

              <hr style="border: none;
                          border-top: 1px solid #e5e7eb;
                          margin: 24px 0;" />

              <p style="color: #9ca3af;
                        font-size: 12px;
                        text-align: center;
                        margin: 0;">
                This is an automated message from
                Ford FCSD Scrap Pickup System.<br />
                Deleted on:
                ${new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day:   'numeric',
                  year:  'numeric',
                })}
                by ${deletedBy}
              </p>

            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success:    true,
      message:    'Request deleted, audited, and email sent',
      emailSent:  !!recipientEmail,
      auditedTo:  'deleted_requests',
    })

  } catch (err) {
    console.error('Delete request error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}