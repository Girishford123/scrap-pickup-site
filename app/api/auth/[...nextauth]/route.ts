import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Step 1: Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Step 2: Find user by email in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 3: Check if password is plain text or hashed
    // Handles existing plain text passwords
    // during transition period to bcrypt
    let passwordMatch = false

    const isHashed = user.password.startsWith('$2a$') ||
                     user.password.startsWith('$2b$')

    if (isHashed) {
      // ✅ Already hashed — use bcrypt compare
      passwordMatch = await bcrypt.compare(
        password,
        user.password
      )
    } else {
      // ⚠️ Old plain text password — direct compare
      // Then immediately hash and update it!
      passwordMatch = (password === user.password)

      if (passwordMatch) {
        // Auto-upgrade plain text to bcrypt hash
        const hashedPassword = await bcrypt.hash(password, 12)
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id)

        console.log(
          'Auto-upgraded password to bcrypt for:',
          user.email
        )
      }
    }

    // Step 4: If password wrong — return error
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 5: Check if user account is active
    if (
      user.status &&
      user.status !== 'active' &&
      user.status !== 'approved'
    ) {
      return NextResponse.json(
        {
          error:
            'Your account is not yet approved. Please contact admin.'
        },
        { status: 403 }
      )
    }

    // Step 6: Return safe user data
    // ⚠️ NEVER return password field!
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
          plant: user.plant || null,
          department: user.department || null
        }
      },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Login API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}