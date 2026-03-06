import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYNC_SECRET = process.env.SYNC_SECRET || 'ford-sync-2025-secret'

// ── GET — Health Check ─────────────────────────────────────
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

// ── POST — Receive Data From Power Automate ────────────────
export async function POST(request: Request) {
  try {
    // ── Security Check ───────────────────────────────────
    const authHeader = request.headers.get('x-sync-secret')

    if (authHeader !== SYNC_SECRET) {
      console.error('❌ Unauthorized — secret mismatch')
      console.error('   Received:', authHeader)
      console.error('   Expected:', SYNC_SECRET)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Parse Body ───────────────────────────────────────
    let body: Record<string, unknown>

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    console.log('📥 Body received from Power Automate:', JSON.stringify(body))

    // ── Extract Rows ─────────────────────────────────────
    let rows: Record<string, string>[] = []

    if (Array.isArray(body.rows)) {
      rows = body.rows
    } else if (body.row && typeof body.row === 'object') {
      rows = [body.row as Record<string, string>]
    } else {
      // Maybe Power Automate sent the array directly
      if (Array.isArray(body)) {
        rows = body as Record<string, string>[]
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success:   false,
          error:     'No rows received',
          received:  body,
        },
        { status: 400 }
      )
    }

    console.log(`📊 Processing ${rows.length} rows...`)

    let inserted = 0
    let updated  = 0
    let skipped  = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        console.log('Row data:', JSON.stringify(row))

        // ── Map fields — UPDATE to match your Excel headers!
        const record = {
          rcrc_number: (
            row['RCRC Number']   ||
            row['rcrc_number']   ||
            row['RCRC #']        ||
            row['rcrc_#']        ||
            null
          ),
          rcrc_name: (
            row['RCRC Name']     ||
            row['rcrc_name']     ||
            row['Name']          ||
            null
          ),
          rcrc_contact_person: (
            row['Contact Person']       ||
            row['rcrc_contact_person']  ||
            row['Contact']             ||
            null
          ),
          rcrc_phone_number: (
            row['Phone']               ||
            row['rcrc_phone_number']   ||
            row['Phone Number']        ||
            null
          ),
          email: (
            row['Email']   ||
            row['email']   ||
            null
          ),
          address1: (
            row['Address']   ||
            row['address1']  ||
            row['Address 1'] ||
            null
          ),
          city: (
            row['City']   ||
            row['city']   ||
            null
          ),
          state: (
            row['State']   ||
            row['state']   ||
            null
          ),
          zip: (
            row['Zip']      ||
            row['zip']      ||
            row['Zip Code'] ||
            null
          ),
          preferred_date: (
            row['Preferred Date'] ||
            row['preferred_date'] ||
            row['Pickup Date']    ||
            null
          ),
          time_window: (
            row['Time Window'] ||
            row['time_window'] ||
            null
          ),
          pallet_quantity: (
            row['Pallets']          ||
            row['pallet_quantity']  ||
            row['Pallet Quantity']  ||
            null
          )
            ? Number(
                row['Pallets']         ||
                row['pallet_quantity'] ||
                row['Pallet Quantity']
              )
            : null,
          total_pieces_quantity: (
            row['Pieces']                 ||
            row['total_pieces_quantity']  ||
            row['Total Pieces']           ||
            null
          )
            ? Number(
                row['Pieces']                ||
                row['total_pieces_quantity'] ||
                row['Total Pieces']
              )
            : null,
          special_instructions: (
            row['Special Instructions'] ||
            row['special_instructions'] ||
            row['Notes']               ||
            null
          ),
          mcl_number: (
            row['MCL Number'] ||
            row['mcl_number'] ||
            row['MCL #']      ||
            null
          ),
          status: (
            row['Status'] ||
            row['status'] ||
            'total_requests'
          ),
        }

        // ── Skip blank rows ──────────────────────────────
        if (!record.rcrc_name && !record.rcrc_number) {
          skipped++
          continue
        }

        // ── Check if exists ──────────────────────────────
        if (record.rcrc_number) {
          const { data: existing } = await supabase
            .from('pickup_request')
            .select('id')
            .eq('rcrc_number', record.rcrc_number)
            .single()

          if (existing) {
            // Update non-admin fields only
            const { error: updateErr } = await supabase
              .from('pickup_request')
              .update({
                rcrc_name:             record.rcrc_name,
                rcrc_contact_person:   record.rcrc_contact_person,
                rcrc_phone_number:     record.rcrc_phone_number,
                email:                 record.email,
                address1:             record.address1,
                city:                  record.city,
                state:                 record.state,
                zip:                   record.zip,
                preferred_date:        record.preferred_date,
                time_window:           record.time_window,
                pallet_quantity:       record.pallet_quantity,
                total_pieces_quantity: record.total_pieces_quantity,
                special_instructions:  record.special_instructions,
                updated_at:            new Date().toISOString(),
              })
              .eq('id', existing.id)

            if (updateErr) {
              errors.push(`Update error ${record.rcrc_number}: ${updateErr.message}`)
            } else {
              updated++
            }
            continue
          }
        }

        // ── Insert new record ────────────────────────────
        const { error: insertErr } = await supabase
          .from('pickup_request')
          .insert({
            ...record,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertErr) {
          errors.push(`Insert error: ${insertErr.message}`)
        } else {
          inserted++
        }

      } catch (rowErr) {
        const msg = rowErr instanceof Error ? rowErr.message : 'Unknown'
        errors.push(`Row error: ${msg}`)
      }
    }

    const result = {
      success:      true,
      synced_at:    new Date().toISOString(),
      total_rows:   rows.length,
      inserted,
      updated,
      skipped,
      error_count:  errors.length,
      errors:       errors.slice(0, 5),
    }

    console.log('✅ Sync complete:', result)
    return NextResponse.json(result, { status: 200 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Sync handler error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}