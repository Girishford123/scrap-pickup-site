import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUT: Update requestor ─────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await req.json()
    const {
      full_name,
      email,
      phone,
      rcrc_number,
      rcrc_name,
      status,
    } = body

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name,
        email:       email.toLowerCase().trim(),
        phone:       phone       || '',
        rcrc_number: rcrc_number || '',
        rcrc_name:   rcrc_name   || '',
        status:      status      || 'active',
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE: Remove requestor ──────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check user exists first
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Requestor not found.' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
