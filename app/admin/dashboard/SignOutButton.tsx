// app/admin/dashboard/SignOutButton.tsx
'use client'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() =>
        signOut({ callbackUrl: '/admin/login' })
      }
      className="text-xs text-red-400 hover:text-red-600
                 font-semibold transition-colors px-3 py-1.5
                 rounded-lg hover:bg-red-50"
    >
      🚪 Sign Out
    </button>
  )
}