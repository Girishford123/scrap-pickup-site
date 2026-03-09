import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — List all requestors
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, rcrc_number, rcrc_name, status, created_at')
      .eq('role', 'requestor')
      .order('full_name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, requestors: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST — Create new requestor
export async function POST(req
