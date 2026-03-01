'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingButtons() {
  const [isOpen,      setIsOpen]      = useState(false)
  const [showScroll,  setShowScroll]  = useState(false)
  const [isVisible,   setIsVisible]   = useState(false)

  // Show buttons after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Show scroll-to-top after scrolling down
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buttons = [
    {
      icon:  '📞',
      label: 'Call Us',
      color: 'bg-blue-500 hover:bg-blue-600',
      href:  'tel:+12489127995',
    },
    {
      icon:  '💬',
      label: 'WhatsApp',
      color: 'bg-green-500 hover:bg-green-600',
      href:  'https://wa.me/12489127995?text=Hello%2C%20I%20need%20help%20with%20scrap%20vehicle%20pickup',
    },
    {
      icon:  '📧',
      label: 'Email',
      color: 'bg-purple-500 hover:bg-purple-600',
      href:  'mailto:fcscats@ford.com',
    },
  ]

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{   opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="
              w-12 h-12 rounded-full
              bg-[#1B4332] text-white
              flex items-center justify-center
              shadow-2xl
              hover:bg-[#2D6A4F]
              transition duration-300
              border-2 border-white/20
            "
            title="Scroll to top"
          >
            ⬆️
          </motion.button>
        )}
      </AnimatePresence>

      {/* Contact Sub Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: 20  }}
            className="flex flex-col gap-3"
          >
            {buttons.map((btn, i) => (
              <motion.a
                key={i}
                href={btn.href}
                target={
                  btn.label === 'WhatsApp' ? '_blank' : undefined
                }
                rel={
                  btn.label === 'WhatsApp'
                    ? 'noopener noreferrer'
                    : undefined
                }
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity:    1,
                  x:          0,
                  transition: { delay: i * 0.1 },
                }}
                exit={{
                  opacity:    0,
                  x:          50,
                  transition: { delay: (2 - i) * 0.05 },
                }}
                className={`
                  flex items-center gap-3
                  ${btn.color}
                  text-white
                  px-4 py-3 rounded-full
                  shadow-xl
                  transition duration-300
                  transform hover:scale-105
                `}
              >
                <span className="text-lg">{btn.icon}</span>
                <span className="
                  text-sm font-semibold
                  whitespace-nowrap
                ">
                  {btn.label}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-16 h-16 rounded-full
          bg-gradient-to-br
          from-[#1B4332] to-[#52B788]
          text-white text-2xl
          flex items-center justify-center
          shadow-2xl
          hover:shadow-green-500/30
          transition duration-300
          border-4 border-white
          relative
        "
        title="Contact Us"
      >
        {isOpen ? '✕' : '💬'}

        {/* Pulse Ring */}
        {!isOpen && (
          <span className="
            absolute inset-0
            rounded-full
            bg-[#52B788]/40
            animate-ping
          " />
        )}
      </motion.button>

    </div>
  )
}
