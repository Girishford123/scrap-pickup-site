import { NextResponse }  from 'next/server'
import { createClient }  from '@supabase/supabase-js'
import nodemailer        from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Email transporter (Gmail) ────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.REPORT_EMAIL_FROM!,
    pass: process.env.REPORT_EMAIL_PASSWORD!,
  },
})

// ── Build HTML email body ────────────────────────────────
function buildEmailHTML(stats: {
  total:        number
  closed:       number
  inTransit:    number
  arrived:      number
  totalValue:   number
  closedValue:  number
  slowMCLs:     number
  avgCycleDays: number | null
  topRCRCs:     { name: string; value: number; mcls: number }[]
  slowList:     {
    mcl:    string | null
    rcrc:   string | null
    days:   number
    status: string
    value:  number | null
  }[]
}) {
  const today     = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  const completion = stats.total > 0
    ? Math.round((stats.closed / stats.total) * 100)
    : 0

  const slowRows = stats.slowList
    .slice(0, 10)
    .map(r => `
      <tr style="border-bottom: 1px solid #f1f5f9">
        <td style="padding: 8px 12px; font-weight: 600;
                   color: #1e293b">
          ${r.mcl ?? '—'}
        </td>
        <td style="padding: 8px 12px; color: #64748b">
          ${r.rcrc ?? '—'}
        </td>
        <td style="padding: 8px 12px; text-align: center">
          <span style="background: #fee2e2; color: #b91c1c;
                       padding: 2px 8px; border-radius: 12px;
                       font-weight: 700; font-size: 13px">
            ${r.days}d
          </span>
        </td>
        <td style="padding: 8px 12px; color: #64748b">
          ${r.status}
        </td>
        <td style="padding: 8px 12px; text-align: right;
                   font-weight: 600; color: #059669">
          ${r.value
            ? r.value.toLocaleString('en-US', {
                style:    'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })
            : '—'
          }
        </td>
      </tr>
    `).join('')

  const rcrcRows = stats.topRCRCs
    .slice(0, 5)
    .map((r, i) => `
      <tr style="border-bottom: 1px solid #f1f5f9">
        <td style="padding: 8px 12px; font-weight: 700;
                   color: #94a3b8; width: 30px">
          ${i + 1}
        </td>
        <td style="padding: 8px 12px; font-weight: 600;
                   color: #1e293b">
          ${r.name}
        </td>
        <td style="padding: 8px 12px; text-align: center;
                   color: #64748b">
          ${r.mcls}
        </td>
        <td style="padding: 8px 12px; text-align: right;
                   font-weight: 700; color: #059669">
          ${r.value.toLocaleString('en-US', {
            style:    'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </td>
      </tr>
    `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Ford Scrap Dashboard Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system,
             BlinkMacSystemFont, 'Segoe UI', sans-serif;
             background: #f8fafc; color: #1e293b">

  <div style="max-width: 680px; margin: 0 auto;
              padding: 24px 16px">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #003087, #0057b8);
                border-radius: 16px; padding: 28px 32px;
                margin-bottom: 24px; text-align: center">
      <p style="color: #93c5fd; font-size: 12px; font-weight: 600;
                letter-spacing: 2px; text-transform: uppercase;
                margin: 0 0 8px 0">
        FORD COMPONENT SALES LLC
      </p>
      <h1 style="color: white; font-size: 24px; font-weight: 800;
                 margin: 0 0 8px 0">
        📊 Daily Scrap Dashboard Report
      </h1>
      <p style="color: #93c5fd; font-size: 14px; margin: 0">
        ${today}
      </p>
    </div>

    <!-- KPI Cards Row -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 12px; margin-bottom: 24px">

      <div style="background: white; border-radius: 12px;
                  padding: 16px; border: 1px solid #e2e8f0;
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: #059669; margin: 0">
          ${stats.totalValue.toLocaleString('en-US', {
            style:    'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          Total Est. Value
        </p>
      </div>

      <div style="background: white; border-radius: 12px;
                  padding: 16px; border: 1px solid #e2e8f0;
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: #1d4ed8; margin: 0">
          ${stats.total}
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          Total MCLs
        </p>
      </div>

      <div style="background: white; border-radius: 12px;
                  padding: 16px; border: 1px solid #e2e8f0;
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: #0d9488; margin: 0">
          ${completion}%
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          Completion Rate
        </p>
      </div>

      <div style="background: white; border-radius: 12px;
                  padding: 16px; border: 1px solid #e2e8f0;
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: #7c3aed; margin: 0">
          ${stats.inTransit}
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          In Transit
        </p>
      </div>

      <div style="background: white; border-radius: 12px;
                  padding: 16px; border: 1px solid #e2e8f0;
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: #16a34a; margin: 0">
          ${stats.arrived}
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          Arrived
        </p>
      </div>

      <div style="background: ${stats.slowMCLs > 0
        ? '#fef2f2'
        : '#f0fdf4'
      }; border-radius: 12px;
                  padding: 16px; border: 1px solid ${stats.slowMCLs > 0
        ? '#fecaca'
        : '#bbf7d0'
      };
                  text-align: center">
        <p style="font-size: 22px; font-weight: 800;
                  color: ${stats.slowMCLs > 0
        ? '#b91c1c'
        : '#16a34a'
      }; margin: 0">
          ${stats.slowMCLs}
        </p>
        <p style="font-size: 11px; color: #94a3b8;
                  font-weight: 600; margin: 4px 0 0 0;
                  text-transform: uppercase; letter-spacing: 1px">
          🔴 Slow MCLs (21d+)
        </p>
      </div>

    </div>

    <!-- Slow MCLs Alert -->
    ${stats.slowMCLs > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca;
                border-radius: 12px; padding: 20px 24px;
                margin-bottom: 24px">
      <h2 style="font-size: 16px; font-weight: 700;
                 color: #b91c1c; margin: 0 0 16px 0">
        🔴 Delayed MCLs Requiring Attention
        (${stats.slowMCLs} total)
      </h2>
      <table style="width: 100%; border-collapse: collapse;
                    font-size: 13px">
        <thead>
          <tr style="background: #fee2e2">
            <th style="padding: 8px 12px; text-align: left;
                       font-weight: 700; color: #b91c1c">
              MCL #
            </th>
            <th style="padding: 8px 12px; text-align: left;
                       font-weight: 700; color: #b91c1c">
              RCRC
            </th>
            <th style="padding: 8px 12px; text-align: center;
                       font-weight: 700; color: #b91c1c">
              Days
            </th>
            <th style="padding: 8px 12px; text-align: left;
                       font-weight: 700; color: #b91c1c">
              Status
            </th>
            <th style="padding: 8px 12px; text-align: right;
                       font-weight: 700; color: #b91c1c">
              Value
            </th>
          </tr>
        </thead>
        <tbody>${slowRows}</tbody>
      </table>
    </div>
    ` : `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0;
                border-radius: 12px; padding: 20px 24px;
                margin-bottom: 24px; text-align: center">
      <p style="font-size: 20px; margin: 0 0 8px 0">🎉</p>
      <p style="font-weight: 700; color: #16a34a; margin: 0">
        No delayed MCLs today — great performance!
      </p>
    </div>
    `}

    <!-- Top RCRCs -->
    <div style="background: white; border-radius: 12px;
                padding: 20px 24px; margin-bottom: 24px;
                border: 1px solid #e2e8f0">
      <h2 style="font-size: 16px; font-weight: 700;
                 color: #1e293b; margin: 0 0 16px 0">
        🏆 Top RCRCs by Value
      </h2>
      <table style="width: 100%; border-collapse: collapse;
                    font-size: 13px">
        <thead>
          <tr style="background: #f8fafc">
            <th style="padding: 8px 12px; text-align: left;
                       font-weight: 700; color: #64748b">
              #
            </th>
            <th style="padding: 8px 12px; text-align: left;
                       font-weight: 700; color: #64748b">
              RCRC
            </th>
            <th style="padding: 8px 12px; text-align: center;
                       font-weight: 700; color: #64748b">
              MCLs
            </th>
            <th style="padding: 8px 12px; text-align: right;
                       font-weight: 700; color: #64748b">
              Value
            </th>
          </tr>
        </thead>
        <tbody>${rcrcRows}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px;
                color: #94a3b8; font-size: 12px">
      <p style="margin: 0">
        Ford Component Sales LLC — Scrap Pickup Dashboard
      </p>
      <p style="margin: 4px 0 0 0">
        Auto-generated on ${new Date().toISOString()}
      </p>
      <p style="margin: 8px 0 0 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard"
           style="color: #3b82f6; font-weight: 600;
                  text-decoration: none">
          → Open Live Dashboard
        </a>
      </p>
    </div>

  </div>
</body>
</html>
  `
}

// ── POST — Send Report Now ───────────────────────────────
export async function POST() {
  try {
    // Fetch all requests
    const { data: requests, error } = await supabase
      .from('pickup_request')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!requests) throw new Error('No data')

    // Filter out test records
    const real = requests.filter(
      r => r.rcrc_number !== '9999'
    )

    function daysBetween(
      start?: string | null,
      end?:   string | null
    ): number | null {
      if (!start || !end) return null
      const s = new Date(start)
      const e = new Date(end)
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
      const diff = Math.round(
        (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (Math.abs(diff) > 365) return null
      return diff >= 0 ? diff : null
    }

    // Build stats
    const closed   = real.filter(r => r.status === 'closed')
    const slowList = real
      .map(r => {
        const end =
          r.invoice_submitted_date ??
          new Date().toISOString().slice(0, 10)
        return {
          ...r,
          cycleDays: daysBetween(r.requested_pickup_date, end),
        }
      })
      .filter(r => r.cycleDays !== null && r.cycleDays > 21)
      .sort((a, b) => (b.cycleDays ?? 0) - (a.cycleDays ?? 0))

    // RCRC map
    const rcrcMap = new Map<string, {
      name:  string
      value: number
      mcls:  number
    }>()
    real.forEach(r => {
      const key  = r.rcrc_name ?? 'Unknown'
      const curr = rcrcMap.get(key) ?? {
        name: key, value: 0, mcls: 0
      }
      curr.value += r.fcsd_offer_amount ?? 0
      curr.mcls  += 1
      rcrcMap.set(key, curr)
    })
    const topRCRCs = Array.from(rcrcMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const allCycleDays = closed
      .map(r => daysBetween(
        r.requested_pickup_date,
        r.invoice_submitted_date
      ))
      .filter((d): d is number => d !== null)

    const avgCycleDays = allCycleDays.length > 0
      ? Math.round(
        allCycleDays.reduce((s, d) => s + d, 0) /
        allCycleDays.length
      )
      : null

    const stats = {
      total:      real.length,
      closed:     closed.length,
      inTransit:  real.filter(r => r.status === 'in_transit').length,
      arrived:    real.filter(r =>
        r.status === 'shipment_arrived'
      ).length,
      totalValue: real.reduce(
        (s, r) => s + (r.fcsd_offer_amount ?? 0), 0
      ),
      closedValue: closed.reduce(
        (s, r) => s + (r.fcsd_offer_amount ?? 0), 0
      ),
      slowMCLs: slowList.length,
      avgCycleDays,
      topRCRCs,
      slowList: slowList.map(r => ({
        mcl:    r.mcl_number,
        rcrc:   r.rcrc_name,
        days:   r.cycleDays!,
        status: r.status,
        value:  r.fcsd_offer_amount,
      })),
    }

    const html = buildEmailHTML(stats)

    // Send email
    const recipients = [
      process.env.REPORT_EMAIL_TO!,
      process.env.REPORT_EMAIL_MANAGER!,
    ].filter(Boolean)

    await transporter.sendMail({
      from:    `"Ford Scrap Dashboard" <${process.env.REPORT_EMAIL_FROM}>`,
      to:      recipients.join(', '),
      subject: `📊 Daily Scrap Report — ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }
      )} | ${stats.slowMCLs > 0
        ? `⚠️ ${stats.slowMCLs} Delayed MCLs`
        : '✅ All On Track'
      }`,
      html,
    })

    return NextResponse.json({
      success:   true,
      sent_to:   recipients,
      slow_mcls: stats.slowMCLs,
      total:     stats.total,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    console.error('❌ Email report failed:', msg)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}

// ── GET — Cron trigger (called by Vercel Cron) ───────────
export async function GET() {
  return POST()
}
