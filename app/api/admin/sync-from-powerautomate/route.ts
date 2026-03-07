import { NextResponse } from 'next/server'
import { createClient }  from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET — Health Check ──────────────────────────────────
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Sync API is running ✅',
      method:  'Use POST to sync data',
    },
    { status: 200 }
  )
}

// ── Helper — Parse Date ─────────────────────────────────
function parseDate(value: string): string | null {
  if (!value || value.trim() === '') return null
  const trimmed = value.trim()

  // Excel serial number (e.g., 45504)
  if (/^\d{5}$/.test(trimmed)) {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(
      excelEpoch.getTime() + Number(trimmed) * 86400000
    )
    return date.toISOString().split('T')[0]
  }

  // Already a date string (e.g., "16-Aug'24", "10/5/2024")
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

// ── Helper — Clean Text ─────────────────────────────────
function cleanText(value: unknown): string | null {
  if (!value) return null
  const text = value.toString().trim()
  return text === '' ? null : text
}

// ── Helper — Clean Number ───────────────────────────────
function cleanNumber(value: unknown): number | null {
  if (!value) return null
  const num = Number(value.toString().trim())
  return isNaN(num) ? null : num
}

// ── POST — Receive From Power Automate ──────────────────
export async function POST(request: Request) {
  try {

    // ── Parse Body ──────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // ── Extract Rows ────────────────────────────────────
    let rows: Record<string, string>[] = []

    if (Array.isArray(body.rows)) {
      rows = body.rows
    } else if (body.row && typeof body.row === 'object') {
      rows = [body.row as Record<string, string>]
    } else if (Array.isArray(body)) {
      rows = body as Record<string, string>[]
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rows received' },
        { status: 400 }
      )
    }

    console.log(`📊 Total rows received: ${rows.length}`)

    let inserted    = 0
    let updated     = 0
    let skipped     = 0
    const errors: string[] = []

    for (const row of rows) {

      // ── Skip Header / Empty / Summary Rows ───────────
      const col1 = (row['Column1'] || '').toString().trim()
      const col3 = (row['Column3'] || '').toString().trim()
      const col4 = (row['Column4'] || '').toString().trim()

      if (
        col1 === 'MCL #'         ||
        col1 === 'AUG TOTAL'     ||
        col1 === 'SEPT Total'    ||
        col1 === 'not billed'    ||
        col3 === 'RCRC # '       ||
        (col3 === '' && col4 === '')
      ) {
        skipped++
        continue
      }

      if (!col3 && !col4) {
        skipped++
        continue
      }

      try {

        // ────────────────────────────────────────────────
        //  EXCEL COLUMN → SUPABASE COLUMN MAPPING
        // ────────────────────────────────────────────────
        //
        //  Column1  → mcl_number
        //  Column2  → requested_pickup_date
        //  Column3  → rcrc_number
        //  Column4  → rcrc_name
        //  Column5  → rcrc_contact_person
        //  Column6  → rcrc_email
        //  Column7  → rcrc_phone_number
        //  Column8  → rcrc_address
        //             (address + address2 combined)
        //  Column9  → state
        //  Column10 → rcrc_zip_code
        //  Column11 → time_window  (pickup hours)
        //  Column12 → pallet_quantity
        //  Column13 → total_pieces_quantity
        //  Column14 → fcsd_offer_amount
        //  Column15 → date_sent_to_techemet  🆕 NEW
        //  Column16 → techemet_request_sent_at
        //             (Scheduled Pickup by Techemet)
        // ────────────────────────────────────────────────

        // ── Text Fields ──────────────────────────────────
        const mcl_number          = cleanText(row['Column1'])
        const rcrc_number         = cleanText(row['Column3'])
        const rcrc_name           = cleanText(row['Column4'])
        const rcrc_contact_person = cleanText(row['Column5'])
        const rcrc_email          = cleanText(row['Column6'])
        const rcrc_phone_number   = cleanText(row['Column7'])
        const state               = cleanText(row['Column9'])
        const rcrc_zip_code       = cleanText(row['Column10'])
        const time_window         = cleanText(row['Column11'])

        // ── RCRC Address ─────────────────────────────────
        // Combine address + address2 into one field
        const addr1  = cleanText(row['Column8']) || ''
        const rcrc_address = addr1.trim() || null

        // ── Numeric Fields ───────────────────────────────
        const pallet_quantity        = cleanNumber(row['Column12'])
        const total_pieces_quantity  = cleanNumber(row['Column13'])
        const fcsd_offer_amount      = cleanNumber(row['Column14'])

        // ── Date Fields ───────────────────────────────────
        const requested_pickup_date     = parseDate(
          row['Column2'] || ''
        )
        const date_sent_to_techemet     = parseDate(
          row['Column15'] || ''
        )
        const techemet_request_sent_at  = parseDate(
          row['Column16'] || ''
        )

        // ── Build Record ─────────────────────────────────
        const record = {
          mcl_number,
          requested_pickup_date,
          rcrc_number,
          rcrc_name,
          rcrc_contact_person,
          rcrc_email,
          rcrc_phone_number,
          rcrc_address,
          state,
          rcrc_zip_code,
          time_window,
          pallet_quantity,
          total_pieces_quantity,
          fcsd_offer_amount,
          date_sent_to_techemet,
          techemet_request_sent_at,
          updated_at: new Date().toISOString(),
        }

        console.log(
          `Processing → MCL: ${mcl_number} | 
           RCRC: ${rcrc_number} | 
           Name: ${rcrc_name}`
        )

        // ── Check If Record Exists ───────────────────────
        // Match by rcrc_number + mcl_number
        if (rcrc_number) {
          let existingRecord = null

          if (mcl_number && mcl_number !== '') {
            const { data } = await supabase
              .from('pickup_request')
              .select('id')
              .eq('rcrc_number', rcrc_number)
              .eq('mcl_number', mcl_number)
              .single()
            existingRecord = data
          } else {
            const { data } = await supabase
              .from('pickup_request')
              .select('id')
              .eq('rcrc_number', rcrc_number)
              .single()
            existingRecord = data
          }

          // ── Update Existing Record ───────────────────
          if (existingRecord) {
            const { error: updateErr } = await supabase
              .from('pickup_request')
              .update(record)
              .eq('id', existingRecord.id)

            if (updateErr) {
              errors.push(
                `Update error (${rcrc_number}): ${updateErr.message}`
              )
              console.error('Update error:', updateErr.message)
            } else {
              updated++
            }
            continue
          }
        }

        // ── Insert New Record ────────────────────────────
        const { error: insertErr } = await supabase
          .from('pickup_request')
          .insert({
            ...record,
            created_at: new Date().toISOString(),
            status: 'total_requests',
          })

        if (insertErr) {
          errors.push(
            `Insert error (${rcrc_number}): ${insertErr.message}`
          )
          console.error('Insert error:', insertErr.message)
        } else {
          inserted++
        }

      } catch (rowErr) {
        const msg = rowErr instanceof Error
          ? rowErr.message
          : 'Unknown row error'
        errors.push(msg)
        console.error('Row error:', msg)
      }
    }

    // ── Final Response ───────────────────────────────────
    const result = {
      success:     true,
      synced_at:   new Date().toISOString(),
      total_rows:  rows.length,
      inserted,
      updated,
      skipped,
      error_count: errors.length,
      errors:      errors.slice(0, 10),
    }

    console.log('✅ Sync complete:', result)
    return NextResponse.json(result, { status: 200 })

  } catch (err: unknown) {
    const message = err instanceof Error
      ? err.message
      : 'Unknown error'
    console.error('❌ Sync failed:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
