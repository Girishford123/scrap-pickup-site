'use client'

import { useState, useEffect } from 'react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    const newVal = !isDark
    setIsDark(newVal)
    localStorage.setItem('darkMode', String(newVal))
    if (newVal) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleDark}
      className="
        relative inline-flex items-center
        w-14 h-7 rounded-full
        transition-colors duration-300
        focus:outline-none
        shadow-inner
        border border-white/20
      "
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1B4332, #2D6A4F)'
          : 'linear-gradient(135deg, #52B788, #1B4332)',
      }}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Track Icons */}
      <span className="
        absolute left-1 text-xs
        transition-opacity duration-300
      "
        style={{ opacity: isDark ? 0 : 1 }}
      >
        ☀️
      </span>
      <span className="
        absolute right-1 text-xs
        transition-opacity duration-300
      "
        style={{ opacity: isDark ? 1 : 0 }}
      >
        🌙
      </span>

      {/* Thumb */}
      <span
        className={`
          absolute w-5 h-5 rounded-full
          bg-white shadow-md
          transform transition-transform duration-300
          flex items-center justify-center text-xs
        `}
        style={{
          transform: isDark
            ? 'translateX(28px)'
            : 'translateX(2px)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}