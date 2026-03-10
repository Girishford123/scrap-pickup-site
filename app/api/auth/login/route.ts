import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt           from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('🔍 Login attempt for:', email)

    // Step 1: Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Step 2: Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    // ✅ DEBUG LOG 1 — Check if user found
    console.log('👤 User found:', user ? 'YES' : 'NO')
    console.log('❌ Supabase error:', userError)

    if (userError || !user) {
      console.log('🚫 User not found for email:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ✅ DEBUG LOG 2 — Check user data
    console.log('📋 User role:',   user.role)
    console.log('📋 User status:', user.status)
    console.log(
      '📋 Password type:',
      user.password?.startsWith('$2') ? 'bcrypt' : 'plain text'
    )
    console.log(
      '📋 Password preview:',
      user.password?.slice(0, 10)
    )

    // Step 3: Password check
    let passwordMatch = false

    const isHashed =
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2b$')

    if (isHashed) {
      passwordMatch = await bcrypt.compare(password, user.password)
      console.log('🔐 bcrypt compare result:', passwordMatch)
    } else {
      passwordMatch = (password === user.password)
      console.log('🔐 Plain text compare result:', passwordMatch)

      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, 12)
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id)
        console.log('✅ Password upgraded to bcrypt')
      }
    }

    // Step 4: Wrong password
    if (!passwordMatch) {
      console.log('🚫 Password mismatch for:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 5: Status check
    if (
      user.status &&
      user.status !== 'active' &&
      user.status !== 'approved'
    ) {
      console.log('🚫 Account not active. Status:', user.status)
      return NextResponse.json(
        {
          error:
            'Your account is not yet approved. Please contact admin.'
        },
        { status: 403 }
      )
    }

    console.log('✅ Login successful for:', email)

    // Step 6: Return full profile
    return NextResponse.json(
      {
        success: true,
        user: {
          id:                  user.id,
          email:               user.email,
          full_name:           user.full_name,
          role:                user.role,
          status:              user.status,
          plant:               user.plant               || null,
          department:          user.department          || null,
          phone:               user.phone               || '',
          rcrc_number:         user.rcrc_number         || '',
          rcrc_name:           user.rcrc_name           || '',
          rcrc_contact_person: user.rcrc_contact_person || '',
          rcrc_address:        user.rcrc_address        || '',
          rcrc_address2:       user.rcrc_address2       || '',
          state:               user.state               || '',
          rcrc_zip_code:       user.rcrc_zip_code       || '',
        }
      },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('💥 Login API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
