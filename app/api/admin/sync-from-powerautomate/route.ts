import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── This is the secret Power Automate will send ────────────
const SYNC_SECRET = process.env.SYNC_SECRET || 'ford-sync-2025'

export async function POST(request: Request) {
  try {
    // ── Security Check ─────────────────────────────────────
    const authHeader = request.headers.get('x-sync-secret')
    if (authHeader !== SYNC_SECRET) {
      console.error('❌ Unauthorized sync attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📥 Received from Power Automate:', JSON.stringify(body))

    // ── Power Automate sends either:
    //    { rows: [...] }       → batch of rows
    //    { row: {...} }        → single row
    // ──────────────────────────────────────────────────────
    const rows: Record<string, string>[] =
      body.rows
        ? body.rows
        : body.row
        ? [body.row]
        : []

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rows received' },
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
        // ── Map Power Automate fields → Supabase columns ──
        // UPDATE THESE to match your Excel column names!
        const record = {
          rcrc_number:           row['RCRC Number']          || row['rcrc_number']          || null,
          rcrc_name:             row['RCRC Name']            || row['rcrc_name']            || null,
          rcrc_contact_person:   row['Contact Person']       || row['rcrc_contact_person']  || null,
          rcrc_phone_number:     row['Phone']                || row['rcrc_phone_number']    || null,
          email:                 row['Email']                || row['email']                || null,
          address1:              row['Address']              || row['address1']             || null,
          city:                  row['City']                 || row['city']                 || null,
          state:                 row['State']                || row['state']                || null,
          zip:                   row['Zip']                  || row['zip']                  || null,
          preferred_date:        row['Preferred Date']       || row['preferred_date']       || null,
          time_window:           row['Time Window']          || row['time_window']          || null,
          pallet_quantity:       row['Pallets']              ? Number(row['Pallets'])       : null,
          total_pieces_quantity: row['Pieces']               ? Number(row['Pieces'])        : null,
          special_instructions:  row['Special Instructions'] || row['special_instructions'] || null,
          mcl_number:            row['MCL Number']           || row['mcl_number']           || null,
          status:               (row['Status']               || row['status']               || 'total_requests') as
            'total_requests' | 'sent_for_pickup' | 'in_transit' | 'shipment_arrived',
        }

        // ── Skip empty rows ────────────────────────────────
        if (!record.rcrc_name && !record.rcrc_number) {
          skipped++
          continue
        }

        // ── Check if record already exists ─────────────────
        if (record.rcrc_number) {
          const { data: existing } = await supabase
            .from('pickup_request')
            .select('id, status')
            .eq('rcrc_number', record.rcrc_number)
            .single()

          if (existing) {
            // Only update non-admin fields
            // Preserve admin fields already filled in!
            const { error: updateError } = await supabase
              .from('pickup_request')
              .update({
                rcrc_name:             record.rcrc_name,
                rcrc_contact_person:   record.rcrc_contact_person,
                rcrc_phone_number:     record.rcrc_phone_number,
                email:                 record.email,
                address1:              record.address1,
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

            if (updateError) {
              errors.push(`Update error ${record.rcrc_number}: ${updateError.message}`)
            } else {
              updated++
            }
            continue
          }
        }

        // ── Insert new record ──────────────────────────────
        const { error: insertError } = await supabase
          .from('pickup_request')
          .insert({
            ...record,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          errors.push(`Insert error: ${insertError.message}`)
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
    console.error('❌ Sync failed:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}