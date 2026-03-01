'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Vehicle Data ─────────────────────────────────────
const vehicles = [
  {
    id:       1,
    emoji:    '🚗',
    name:     'Ford Mustang',
    year:     '2018',
    parts:    ['Engine', 'Transmission', 'Body Parts'],
    color:    'from-blue-900/50 to-blue-800/30',
    badge:    '🔥 Popular',
    badgeBg:  'bg-blue-500',
  },
  {
    id:       2,
    emoji:    '🚙',
    name:     'Ford F-150',
    year:     '2019',
    parts:    ['Frame', 'Suspension', 'Exhaust'],
    color:    'from-orange-900/50 to-orange-800/30',
    badge:    '⭐ Most Scrapped',
    badgeBg:  'bg-orange-500',
  },
  {
    id:       3,
    emoji:    '🚐',
    name:     'Ford Transit',
    year:     '2020',
    parts:    ['Doors', 'Wheels', 'Interior'],
    color:    'from-purple-900/50 to-purple-800/30',
    badge:    '💼 Commercial',
    badgeBg:  'bg-purple-500',
  },
  {
    id:       4,
    emoji:    '🏎️',
    name:     'Ford Explorer',
    year:     '2017',
    parts:    ['Axle', 'Brakes', 'Cooling System'],
    color:    'from-teal-900/50 to-teal-800/30',
    badge:    '🌿 Eco Pick',
    badgeBg:  'bg-teal-500',
  },
]

// ─── Vehicle Card ─────────────────────────────────────
function VehicleCard({
  vehicle,
}: {
  vehicle: typeof vehicles[0]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1,   y: 0  }}
      exit={{   opacity: 0, scale: 0.9,  y: -30}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        relative rounded-3xl p-8
        bg-gradient-to-br ${vehicle.color}
        border border-white/20
        backdrop-blur-sm
        shadow-2xl
        overflow-hidden
      `}
    >
      {/* Background Glow */}
      <div className="
        absolute -top-10 -right-10
        w-40 h-40 rounded-full
        bg-white/5 blur-xl
      " />

      {/* Badge */}
      <span className={`
        inline-block
        ${vehicle.badgeBg}
        text-white text-xs font-bold
        px-3 py-1 rounded-full mb-4
      `}>
        {vehicle.badge}
      </span>

      {/* Vehicle Emoji */}
      <div className="text-8xl mb-4 filter drop-shadow-lg">
        {vehicle.emoji}
      </div>

      {/* Vehicle Info */}
      <h3 className="text-white text-2xl font-bold mb-1">
        {vehicle.name}
      </h3>
      <p className="text-white/60 text-sm mb-4">
        Year: {vehicle.year}
      </p>

      {/* Parts Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {vehicle.parts.map((part, i) => (
          <span
            key={i}
            className="
              bg-white/15 text-white
              text-xs font-medium
              px-3 py-1 rounded-full
              border border-white/20
            "
          >
            ✓ {part}
          </span>
        ))}
      </div>

      {/* Status */}
      <div className="
        flex items-center gap-2
        bg-white/10 rounded-xl
        px-4 py-2
      ">
        <span className="
          w-2 h-2 bg-green-400
          rounded-full animate-pulse
        " />
        <span className="text-white/80 text-sm font-medium">
          Ready for Pickup
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────
export default function HeroVehicleSlider() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto slide every 3 seconds
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % vehicles.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <div
      className="relative w-full max-w-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Vehicle Card */}
      <AnimatePresence mode="wait">
        <VehicleCard
          key={vehicles[current].id}
          vehicle={vehicles[current]}
        />
      </AnimatePresence>

      {/* Dots Navigation */}
      <div className="flex justify-center gap-3 mt-6">
        {vehicles.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`
              transition-all duration-300
              rounded-full
              ${i === current
                ? 'w-8 h-3 bg-white'
                : 'w-3 h-3 bg-white/30 hover:bg-white/60'
              }
            `}
          />
        ))}
      </div>

      {/* Prev / Next Buttons */}
      <button
        onClick={() =>
          setCurrent(
            prev => (prev - 1 + vehicles.length) % vehicles.length
          )
        }
        className="
          absolute left-0 top-1/2 -translate-y-1/2
          -translate-x-5
          w-10 h-10 rounded-full
          bg-white/20 hover:bg-white/30
          text-white flex items-center justify-center
          backdrop-blur-sm border border-white/20
          transition duration-200
          shadow-xl
        "
      >
        ‹
      </button>
      <button
        onClick={() =>
          setCurrent(prev => (prev + 1) % vehicles.length)
        }
        className="
          absolute right-0 top-1/2 -translate-y-1/2
          translate-x-5
          w-10 h-10 rounded-full
          bg-white/20 hover:bg-white/30
          text-white flex items-center justify-center
          backdrop-blur-sm border border-white/20
          transition duration-200
          shadow-xl
        "
      >
        ›
      </button>
    </div>
  )
}