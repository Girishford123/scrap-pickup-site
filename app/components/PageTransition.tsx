'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { usePathname } from 'next/navigation'

const variants: Variants = {
  hidden: {
    opacity: 0,
    y:       20,
  },
  enter: {
    opacity:    1,
    y:          0,
    transition: {
      duration: 0.4,
      ease:     [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity:    0,
    y:          -20,
    transition: {
      duration: 0.3,
      ease:     [0.4, 0, 1, 1] as const,
    },
  },
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
