import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Supabase Admin Client ─────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    }
  }
)

// ── CSV Parser ────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines   = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    const values = line
      .split(',')
      .map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    return row
  })
}

// ── Upload Result Type ────────────────────────────────
interface UploadResult {
  success:    number
  duplicates: number
  skipped:    number
  failed:     number
  details: {
    successful: { email: string; name: string }[]
    duplicate:  { email: string; name: string }[]
    skipped:    { row: number; reason: string; data: string }[]
    failed:     { email: string; error: string }[]
  }
}

// ── POST Handler ──────────────────────────────────────
export async function POST(request: Request) {
  try {

    const formData = await request.formData()
    const file     = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read CSV text
    const text = await file.text()
    const rows = parseCSV(text)

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no valid data' },
        { status: 400 }
      )
    }

    // Initialize Result
    const result: UploadResult = {
      success:    0,
      duplicates: 0,
      skipped:    0,
      failed:     0,
      details: {
        successful: [],
        duplicate:  [],
        skipped:    [],
        failed:     [],
      }
    }

    // Process Each Row
    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i]
      const rowNum = i + 2

      const firstName    = row['First Name']?.trim()          || ''
      const lastName     = row['Last Name']?.trim()           || ''
      const email        = row['RCRC Email']?.trim().toLowerCase() || ''
      const rcrcNumber   = row['RCRC Number']?.trim()         || ''
      const rcrcName     = row['RCRC Name']?.trim()           || ''
      const rcrcAddress  = row['RCRC Address']?.trim()        || ''
      const phone        = row['Phone Number']?.trim()        || ''
      const contactPerson = row['RCRC Contact Person']?.trim() || ''
      const state        = row['State']?.trim()               || ''
      const zipCode      = row['Zip Code']?.trim()            || ''
      const role         = row['Role']?.trim().toLowerCase()  || 'requestor'
      const fullName     = `${firstName} ${lastName}`.trim()

      // Check Required Fields
      const missingFields: string[] = []
      if (!firstName)  missingFields.push('First Name')
      if (!lastName)   missingFields.push('Last Name')
      if (!email)      missingFields.push('RCRC Email')
      if (!rcrcNumber) missingFields.push('RCRC Number')

      if (missingFields.length > 0) {
        result.skipped++
        result.details.skipped.push({
          row:    rowNum,
          reason: `Missing required fields: ${missingFields.join(', ')}`,
          data:   fullName || `Row ${rowNum}`,
        })
        continue
      }

      // Validate Email Format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        result.skipped++
        result.details.skipped.push({
          row:    rowNum,
          reason: `Invalid email format: ${email}`,
          data:   fullName,
        })
        continue
      }

      // Check Duplicate in Supabase Auth
      const { data: existingUsers } =
        await supabaseAdmin.auth.admin.listUsers()

      const emailExists = existingUsers?.users?.some(
        u => u.email?.toLowerCase() === email
      )

      if (emailExists) {
        result.duplicates++
        result.details.duplicate.push({ email, name: fullName })
        continue
      }

      // Check Duplicate in users table
      const { data: existingInTable } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle()

      if (existingInTable) {
        result.duplicates++
        result.details.duplicate.push({ email, name: fullName })
        continue
      }

      // Create User via Supabase Invite
      try {
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
              data: {
                full_name:            fullName,
                first_name:           firstName,
                last_name:            lastName,
                role:                 role,
                rcrc_number:          rcrcNumber,
                rcrc_name:            rcrcName,
                rcrc_address:         rcrcAddress,
                rcrc_contact_person:  contactPerson,
                phone:                phone,
                state:                state,
                rcrc_zip_code:        zipCode,
              },
              redirectTo:
                `${process.env.NEXT_PUBLIC_APP_URL}/login/requestor`
            }
          )

        if (authError) throw authError

        // Insert into users table
        await supabaseAdmin
          .from('users')
          .insert({
            id:                   authData.user.id,
            email:                email,
            full_name:            fullName,
            first_name:           firstName,
            last_name:            lastName,
            role:                 role,
            status:               'active',
            rcrc_number:          rcrcNumber,
            rcrc_name:            rcrcName,
            rcrc_address:         rcrcAddress,
            rcrc_contact_person:  contactPerson,
            phone:                phone,
            state:                state,
            rcrc_zip_code:        zipCode,
            password_reset_at:    new Date().toISOString(),
            created_at:           new Date().toISOString(),
          })

        result.success++
        result.details.successful.push({ email, name: fullName })

      } catch (inviteError: any) {
        result.failed++
        result.details.failed.push({
          email,
          error: inviteError?.message || 'Unknown error',
        })
      }

    }

    return NextResponse.json({ success: true, result })

  } catch (error: any) {
    console.error('Upload users error:', error)
    return NextResponse.json(
      { error: error?.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}
