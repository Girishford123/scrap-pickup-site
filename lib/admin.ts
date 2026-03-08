// lib/admin.ts

// ✅ Only these 3 accounts are allowed as admin
export const ADMIN_EMAILS = [
  'gkulkara@ford.com',
  'mrideno2@ford.com',
  'girishtrainer@gmail.com',
].map((e) => e.toLowerCase().trim())

export function normalizeEmail(email?: string | null) {
  return (email ?? '').toLowerCase().trim()
}

export function isAdmin(email?: string | null) {
  return ADMIN_EMAILS.includes(normalizeEmail(email))
}