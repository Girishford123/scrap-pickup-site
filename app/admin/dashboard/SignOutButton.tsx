'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/admin/login',  // ← Go to LOGIN page after signout
      redirect: true 
    })
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 
                 bg-red-600 hover:bg-red-700 
                 text-white text-sm font-medium 
                 rounded-lg transition-colors duration-200"
    >
      {/* Sign Out Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 
             4v1a3 3 0 01-3 3H6a3 3 0 
             01-3-3V7a3 3 0 013-3h4a3 
             3 0 013 3v1" 
        />
      </svg>
      Sign Out
    </button>
  )
}
