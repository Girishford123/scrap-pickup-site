import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'requestor'
}

// Create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const supabase = getSupabaseClient()

  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.error('User not found')
      return null
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.error('Invalid password')
      return null
    }

    // Return user data
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

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'requestor' = 'requestor'
): Promise<User | null> {
  const supabase = getSupabaseClient()

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  } catch (error) {
    console.error('Registration error:', error)
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
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr)
    }
  }
  return null
}

export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function isRequestor(user: User | null): boolean {
  return user?.role === 'requestor'
}