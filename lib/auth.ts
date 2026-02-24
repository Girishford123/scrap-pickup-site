mport { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'requestor'
}

export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey)
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const supabase = getSupabaseClient()

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.error('User not found')
      return null
    }

    // Check if password is bcrypt hash or plain text
    let isValidPassword = false
    
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      // It's a bcrypt hash
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    } else {
      // It's plain text (ONLY for development/testing)
      isValidPassword = password === user.password_hash
      console.warn('⚠️ WARNING: Using plain text password comparison. This is NOT secure for production!')
    }

    if (!isValidPassword) {
      console.error('Invalid password')
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export function saveUserSession(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export function getUserSession(): User | null {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      return JSON.parse(userJson)
    }
  }
  return null
}

export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin'
}

export function isRequestor(user: User): boolean {
  return user.role === 'requestor'
}