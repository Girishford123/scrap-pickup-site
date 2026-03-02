// lib/auth.ts
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'requestor'
}

const SESSION_KEY = 'user_session'

export function saveUserSession(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
}

export function getUserSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}