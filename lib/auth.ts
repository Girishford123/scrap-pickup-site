// lib/auth.ts

// ✅ UserSession interface
export interface UserSession {
  id: string
  email: string
  full_name: string
  role: string
}

// ✅ User type alias
// (used by Navbar.tsx)
export type User = UserSession

// ✅ Save session to localStorage
export function setUserSession(user: UserSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_session', JSON.stringify(user))
  }
}

// ✅ Get session from localStorage
export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  try {
    const session = localStorage.getItem('user_session')
    if (!session) return null
    return JSON.parse(session) as UserSession
  } catch {
    return null
  }
}

// ✅ Clear session from localStorage
export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_session')
  }
}