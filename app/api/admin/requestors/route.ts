import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET: Fetch all requestors ─────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, full_name, email, phone, role, status, rcrc_number, rcrc_name, created_at'
      )
      .eq('role', 'requestor')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST: Create new requestor ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      full_name,
      email,
      password,
      phone,
      rcrc_number,
      rcrc_name,
    } = body

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email and password are required.' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new requestor
    const { data, error } = await supabase
      .from('users')
      .insert([{
        full_name,
        email:       email.toLowerCase().trim(),
        password:    hashedPassword,
        phone:       phone       || null,
        rcrc_number: rcrc_number || null,
        rcrc_name:   rcrc_name   || null,
        role:        'requestor',
        status:      'active',
      }])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error('POST requestor error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET: Fetch all requestors ─────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, full_name, email, phone, role, status, rcrc_number, rcrc_name, created_at'
      )
      .eq('role', 'requestor')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST: Create new requestor ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      full_name,
      email,
      password,
      phone,
      rcrc_number,
      rcrc_name,
    } = body

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email and password are required.' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new requestor
    const { data, error } = await supabase
      .from('users')
      .insert([{
        full_name,
        email:       email.toLowerCase().trim(),
        password:    hashedPassword,
        phone:       phone       || null,
        rcrc_number: rcrc_number || null,
        rcrc_name:   rcrc_name   || null,
        role:        'requestor',
        status:      'active',
      }])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error('POST requestor error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
