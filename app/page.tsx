'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DarkModeToggle    from './components/DarkModeToggle'
import HeroVehicleSlider from './components/HeroVehicleSlider'

// ─── Animated Counter Hook ────────────────────────────
function useCountUp(
  target: number,
  duration: number = 2000,
  isVisible: boolean = false
) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, isVisible])

  return count
}

// ─── Stats Section ────────────────────────────────────
function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const pickups   = useCountUp(1000, 2000, isVisible)
  const hours     = useCountUp(24,   1500, isVisible)
  const satisf    = useCountUp(100,  1800, isVisible)
  const customers = useCountUp(500,  2000, isVisible)

  return (
    <section
      ref={ref}
      className="py-16 bg-white dark:bg-[#0a0a0a]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            {
              value: `${pickups}+`,
              label: 'Pickups Completed',
              color: 'border-[#1B4332]',
              bg:    'bg-green-50 dark:bg-green-900/20',
              text:  'text-[#1B4332] dark:text-green-400',
            },
            {
              value: `${hours}hrs`,
              label: 'Average Response Time',
              color: 'border-[#52B788]',
              bg:    'bg-emerald-50 dark:bg-emerald-900/20',
              text:  'text-[#2D6A4F] dark:text-emerald-400',
            },
            {
              value: `${satisf}%`,
              label: 'Customer Satisfaction',
              color: 'border-green-400',
              bg:    'bg-green-50 dark:bg-green-900/20',
              text:  'text-[#1B4332] dark:text-green-400',
            },
            {
              value: `${customers}+`,
              label: 'Happy Customers',
              color: 'border-[#52B788]',
              bg:    'bg-emerald-50 dark:bg-emerald-900/20',
              text:  'text-[#2D6A4F] dark:text-emerald-400',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`
                ${stat.bg} p-8 rounded-2xl shadow-md
                border-b-4 ${stat.color}
                transform hover:scale-105 transition duration-300
              `}
            >
              <div className={`text-5xl font-bold ${stat.text} mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Ford Logo Component ──────────────────────────────
function FordLogo({ height = 40 }: { height?: number }) {
  return (
    <div style={{
      background:     'white',
      borderRadius:   '12px',
      padding:        '8px 16px',
      boxShadow:      '0 4px 12px rgba(0,0,0,0.15)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      border:         '1px solid #f0f0f0',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ford-logo.png"
        alt="Ford Logo"
        style={{
          height:  `${height}px`,
          width:   'auto',
          display: 'block',
        }}
      />
    </div>
  )
}

// ─── FCS Logo Component ───────────────────────────────
function FCSLogo({ height = 40 }: { height?: number }) {
  return (
    <div style={{
      background:     'white',
      borderRadius:   '12px',
      padding:        '8px 16px',
      boxShadow:      '0 4px 12px rgba(0,0,0,0.15)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      border:         '1px solid #f0f0f0',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/FCS-logo.png"
        alt="FCS Logo"
        style={{
          height:  `${height}px`,
          width:   'auto',
          display: 'block',
        }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'How It Works',  href: '#how-it-works' },
    { label: 'Why Choose Us', href: '#why-us'       },
    { label: 'Contact',       href: '#contact'      },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">

            {/* ── HERO SECTION ─────────────────────────────── */}
      <section className="
        relative bg-gradient-to-br
        from-[#1B4332] via-[#2D6A4F] to-[#1B4332]
        text-white py-28 overflow-hidden
      ">
        {/* Background Circles */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="
            absolute top-0 left-0 w-96 h-96
            bg-green-400/10 rounded-full
            -translate-x-1/2 -translate-y-1/2
            blur-3xl
          "
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="
            absolute bottom-0 right-0 w-96 h-96
            bg-green-300/10 rounded-full
            translate-x-1/2 translate-y-1/2
            blur-3xl
          "
        />

        <div className="
          relative max-w-7xl mx-auto
          px-4 sm:px-6 lg:px-8
        ">
          <div className="
            flex flex-col lg:flex-row
            items-center gap-12
          ">

            {/* ── Left Content ── */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0   }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex-1 text-center lg:text-left"
            >
              {/* Logos Row */}
              <div className="
                flex items-center gap-4
                justify-center lg:justify-start
                mb-8
              ">
                <FordLogo height={40} />
                <div className="h-10 w-px bg-white/40" />
                <FCSLogo height={40} />
              </div>

              {/* Trusted Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.3 }}
                className="
                  inline-flex items-center gap-2
                  bg-white/10 backdrop-blur-sm
                  border border-white/20
                  rounded-full px-4 py-2
                  text-sm font-medium text-green-100
                  mb-6
                "
              >
                <span className="
                  w-2 h-2 bg-[#52B788]
                  rounded-full animate-pulse
                " />
                Trusted by 500+ Customers Across the US
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.4 }}
                className="
                  text-4xl md:text-5xl lg:text-6xl
                  font-bold leading-tight mb-6
                "
              >
                Professional Scrap
                <br />
                <span className="text-[#52B788]">
                  Vehicle Pickup
                </span>
                <br />
                Service
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.5 }}
                className="
                  text-lg text-green-100 mb-8
                  max-w-xl mx-auto lg:mx-0
                  leading-relaxed
                "
              >
                Fast, reliable, and eco-friendly scrap
                component collection for Ford vehicles
                across the United States. Login to
                schedule your pickup today!
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.6 }}
                className="
                  flex flex-col sm:flex-row gap-4
                  justify-center lg:justify-start
                "
              >
                <a
                  href="#how-it-works"
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    bg-white text-[#1B4332]
                    px-8 py-4 rounded-xl
                    font-bold text-lg
                    hover:bg-green-50
                    shadow-2xl
                    transform hover:scale-105
                    transition duration-300
                  "
                >
                  Learn More →
                </a>
                <a
                  href="#contact"
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    bg-transparent
                    border-2 border-white/40
                    text-white
                    px-8 py-4 rounded-xl
                    font-semibold text-lg
                    hover:bg-white/10
                    transition duration-300
                  "
                >
                  Contact Us →
                </a>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="
                  flex flex-wrap
                  justify-center lg:justify-start
                  gap-4 mt-8
                "
              >
                {[
                  '⚡ 24hr Response',
                  '🛡️ Safe & Secure',
                  '🌿 Eco-Friendly',
                  '🏆 Ford Authorised',
                ].map((badge, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1   }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="
                      bg-white/10 border border-white/20
                      rounded-full px-3 py-1
                      text-sm text-green-100
                    "
                  >
                    {badge}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Right Content — Vehicle Slider ── */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0  }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="flex-1 w-full max-w-md flex justify-center"
            >
              <HeroVehicleSlider />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── ANIMATED STATS ───────────────────────────── */}
      <StatsSection />

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 bg-gray-50 dark:bg-[#111111]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              dark:bg-green-900/40 dark:text-green-400
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Simple Process
            </span>
            <h2 className="
              text-4xl font-bold
              text-gray-900 dark:text-white mb-4
            ">
              How It Works
            </h2>
            <p className="
              text-xl text-gray-500
              dark:text-gray-400 max-w-2xl mx-auto
            ">
              Get your scrap vehicle picked up in 3 simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step:    '01',
                icon:    '🔐',
                title:   'Login to Your Account',
                desc:    'Sign in to your customer account to access the pickup request form.',
                color:   'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                iconBg:  'bg-[#1B4332]',
                btn:     true,
                btnText: 'Login Now →',
                btnHref: '/login/requestor',
              },
              {
                step:   '02',
                icon:   '📋',
                title:  'Fill Pickup Form',
                desc:   'Complete the simple online pickup request form with your vehicle and contact details.',
                color:  'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
                iconBg: 'bg-[#2D6A4F]',
                btn:    false,
              },
              {
                step:   '03',
                icon:   '🚚',
                title:  'Pickup Complete',
                desc:   'Our professional team arrives at your location and handles everything safely.',
                color:  'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
                iconBg: 'bg-[#52B788]',
                btn:    false,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className={`
                  relative text-center p-8
                  ${item.color} border-2 rounded-2xl
                  hover:shadow-xl transition duration-300
                `}
              >
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  bg-white dark:bg-[#1a1a1a]
                  border-2 border-green-200
                  rounded-full w-8 h-8
                  flex items-center justify-center
                  text-xs font-bold text-[#1B4332]
                ">
                  {item.step}
                </div>
                <div className={`
                  w-20 h-20 ${item.iconBg}
                  rounded-2xl flex items-center
                  justify-center text-4xl
                  mx-auto mb-6 shadow-lg
                `}>
                  {item.icon}
                </div>
                <h3 className="
                  text-2xl font-bold
                  text-gray-900 dark:text-white mb-4
                ">
                  {item.title}
                </h3>
                <p className="
                  text-gray-600 dark:text-gray-400
                  leading-relaxed mb-4
                ">
                  {item.desc}
                </p>
                {item.btn && (
                  <Link
                    href={item.btnHref!}
                    className="
                      inline-flex items-center gap-1
                      text-[#1B4332] dark:text-green-400
                      font-semibold
                      hover:text-[#2D6A4F] transition
                    "
                  >
                    {item.btnText}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────── */}
      <section
        id="why-us"
        className="py-24 bg-white dark:bg-[#0a0a0a]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              dark:bg-green-900/40 dark:text-green-400
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Our Advantages
            </span>
            <h2 className="
              text-4xl font-bold
              text-gray-900 dark:text-white mb-4
            ">
              Why Choose Us?
            </h2>
            <p className="
              text-xl text-gray-500 dark:text-gray-400
              max-w-2xl mx-auto
            ">
              Professional and reliable scrap pickup service you can trust
            </p>
          </motion.div>

          <div className="
            grid grid-cols-1 sm:grid-cols-2
            lg:grid-cols-4 gap-6
          ">
            {[
              {
                icon:       '🚚',
                title:      'Fast Pickup',
                desc:       '24-48 hour guaranteed response time for all pickup requests.',
                color:      'hover:border-[#1B4332] hover:bg-green-50 dark:hover:bg-green-900/20',
                badge:      'Fast',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
              {
                icon:       '📋',
                title:      'Easy Process',
                desc:       'Simple 3-step online booking. No paperwork hassle.',
                color:      'hover:border-[#2D6A4F] hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                badge:      'Simple',
                badgeColor: 'bg-emerald-100 text-[#2D6A4F]',
              },
              {
                icon:       '🕐',
                title:      '24/7 Support',
                desc:       'Our support team is always available to assist you.',
                color:      'hover:border-[#52B788] hover:bg-teal-50 dark:hover:bg-teal-900/20',
                badge:      'Always On',
                badgeColor: 'bg-teal-100 text-teal-700',
              },
              {
                icon:       '🛡️',
                title:      'Safe & Secure',
                desc:       'Professional handling with proper documentation provided.',
                color:      'hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
                badge:      'Trusted',
                badgeColor: 'bg-green-100 text-green-700',
              },
              {
                icon:       '🌿',
                title:      'Eco-Friendly',
                desc:       'Responsible disposal and recycling of all scrap components.',
                color:      'hover:border-[#1B4332] hover:bg-green-50 dark:hover:bg-green-900/20',
                badge:      'Green',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
              {
                icon:       '💰',
                title:      'Best Rates',
                desc:       'Competitive and transparent pricing for all scrap vehicles.',
                color:      'hover:border-[#52B788] hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                badge:      'Value',
                badgeColor: 'bg-emerald-100 text-[#2D6A4F]',
              },
              {
                icon:       '📄',
                title:      'Documentation',
                desc:       'Complete paperwork and legal compliance handled by us.',
                color:      'hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20',
                badge:      'Compliant',
                badgeColor: 'bg-teal-100 text-teal-700',
              },
              {
                icon:       '🏆',
                title:      'Ford Authorised',
                desc:       'Officially authorised Ford scrap collection partner.',
                color:      'hover:border-[#1B4332] hover:bg-green-50 dark:hover:bg-green-900/20',
                badge:      'Official',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`
                  relative text-center p-6
                  bg-white dark:bg-[#1a1a1a]
                  border-2 border-gray-100 dark:border-gray-800
                  rounded-2xl shadow-sm
                  ${feature.color}
                  transition duration-300
                  hover:shadow-xl cursor-default
                `}
              >
                <span className={`
                  absolute top-3 right-3
                  text-xs font-semibold
                  px-2 py-1 rounded-full
                  ${feature.badgeColor}
                `}>
                  {feature.badge}
                </span>
                <div className="text-5xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="
                  text-lg font-bold
                  text-gray-900 dark:text-white mb-2
                ">
                  {feature.title}
                </h3>
                <p className="
                  text-gray-500 dark:text-gray-400
                  text-sm leading-relaxed
                ">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ──────────────────────────── */}
      <section
        id="contact"
        className="py-24 bg-gray-50 dark:bg-[#111111]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              dark:bg-green-900/40 dark:text-green-400
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Get In Touch
            </span>
            <h2 className="
              text-4xl font-bold
              text-gray-900 dark:text-white mb-4
            ">
              Contact Us
            </h2>
            <p className="
              text-xl text-gray-500 dark:text-gray-400
              max-w-2xl mx-auto
            ">
              Have questions? We are here to help you!
            </p>
          </motion.div>

          <div className="
            grid grid-cols-1 lg:grid-cols-2 gap-12 items-start
          ">

            {/* ── Contact Info Cards ── */}
            <div className="space-y-6">

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="
                  flex items-center gap-5
                  bg-green-50 dark:bg-green-900/20
                  border-2 border-green-200 dark:border-green-800
                  rounded-2xl p-5
                  hover:shadow-md transition duration-300
                "
              >
                <div className="
                  w-14 h-14 bg-[#1B4332]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📞
                </div>
                <div>
                  <div className="
                    font-bold text-gray-900
                    dark:text-white text-lg
                  ">
                    Phone
                  </div>
                  <div className="
                    text-[#1B4332] dark:text-green-400
                    font-semibold text-base
                  ">
                    Michelle Ridenour
                  </div>
                  <a
                    href="tel:+12489127995"
                    className="
                      text-[#2D6A4F] dark:text-green-300
                      font-medium hover:text-[#1B4332]
                      transition text-sm
                    "
                  >
                    +1 (248) 912-7995
                  </a>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="
                  flex items-start gap-5
                  bg-emerald-50 dark:bg-emerald-900/20
                  border-2 border-emerald-200 dark:border-emerald-800
                  rounded-2xl p-5
                  hover:shadow-md transition duration-300
                "
              >
                <div className="
                  w-14 h-14 bg-[#2D6A4F]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📧
                </div>
                <div>
                  <div className="
                    font-bold text-gray-900
                    dark:text-white text-lg mb-1
                  ">
                    Email
                  </div>
                  <a
                    href="mailto:fcscats@ford.com"
                    className="
                      block text-[#1B4332] dark:text-green-400
                      font-medium hover:text-[#2D6A4F]
                      transition text-sm
                    "
                  >
                    fcscats@ford.com
                  </a>
                  <a
                    href="mailto:fcsmktg@ford.com"
                    className="
                      block text-[#1B4332] dark:text-green-400
                      font-medium hover:text-[#2D6A4F]
                      transition text-sm mt-1
                    "
                  >
                    fcsmktg@ford.com
                  </a>
                </div>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="
                  flex items-start gap-5
                  bg-teal-50 dark:bg-teal-900/20
                  border-2 border-teal-200 dark:border-teal-800
                  rounded-2xl p-5
                  hover:shadow-md transition duration-300
                "
              >
                <div className="
                  w-14 h-14 bg-[#52B788]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📍
                </div>
                <div className="flex-1">
                  <div className="
                    font-bold text-gray-900
                    dark:text-white text-lg
                  ">
                    Location
                  </div>
                  <div className="
                    text-[#1B4332] dark:text-green-400
                    font-semibold mb-2
                  ">
                    Pan United States
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      '🏙️ Michigan',
                      '🌆 Texas',
                      '🏛️ California',
                      '🌇 Florida',
                      '🏢 New York',
                      '+ More States',
                    ].map((state, i) => (
                      <span
                        key={i}
                        className="
                          bg-teal-100 dark:bg-teal-900/40
                          text-teal-700 dark:text-teal-300
                          text-xs font-semibold
                          px-2 py-1 rounded-full
                        "
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                  <p className="
                    text-gray-500 dark:text-gray-400 text-sm
                  ">
                    Serving all major Ford dealerships
                    and fleet operators across the US
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ── Login CTA Card ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="
                bg-gradient-to-br
                from-[#1B4332] to-[#0D2B1F]
                rounded-3xl p-10 text-white
                shadow-2xl text-center
              "
            >
              {/* Logos in Contact Card */}
              <div className="
                flex items-center justify-center
                gap-4 mb-6
              ">
                <FordLogo height={28} />
                <div className="h-7 w-px bg-white/30" />
                <FCSLogo height={28} />
              </div>

              <h3 className="text-3xl font-bold mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-green-200 mb-8 leading-relaxed">
                Login to your customer account to
                schedule a scrap vehicle pickup.
                It only takes 2 minutes!
              </p>

              <Link
                href="/login/requestor"
                className="
                  inline-block
                  bg-white text-[#1B4332]
                  px-10 py-4 rounded-xl
                  font-bold text-lg
                  hover:bg-green-50 shadow-xl
                  transform hover:scale-105
                  transition duration-300
                  mb-6 w-full text-center
                "
              >
                🔐 Login to Request Pickup
              </Link>

              <div className="
                bg-white/10 rounded-2xl p-5
                text-left space-y-3
                border border-white/20
              ">
                <p className="
                  text-green-300 text-xs
                  font-semibold uppercase tracking-wider mb-2
                ">
                  Direct Contact
                </p>
                <div className="flex items-center gap-3">
                  <span>👤</span>
                  <span className="text-white text-sm font-semibold">
                    Michelle Ridenour
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>📞</span>
                  <a
                    href="tel:+12489127995"
                    className="
                      text-green-200 text-sm
                      hover:text-white transition
                    "
                  >
                    +1 (248) 912-7995
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span>📧</span>
                  <a
                    href="mailto:fcscats@ford.com"
                    className="
                      text-green-200 text-sm
                      hover:text-white transition
                    "
                  >
                    fcscats@ford.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span>📧</span>
                  <a
                    href="mailto:fcsmktg@ford.com"
                    className="
                      text-green-200 text-sm
                      hover:text-white transition
                    "
                  >
                    fcsmktg@ford.com
                  </a>
                </div>
              </div>

              <div className="
                flex justify-center
                pt-6 border-t border-white/20 mt-6
              ">
                <Link
                  href="/login/admin"
                  className="
                    text-green-200 hover:text-white
                    text-sm font-medium transition
                  "
                >
                  Admin Login →
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────── */}
      <section className="
        py-20
        bg-gradient-to-r
        from-[#1B4332] to-[#2D6A4F]
        text-white
      ">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="
            max-w-4xl mx-auto
            px-4 sm:px-6 lg:px-8 text-center
          "
        >
          <div className="
            w-16 h-16 bg-white/10
            rounded-2xl flex items-center
            justify-center text-3xl
            mx-auto mb-6 border border-white/20
          ">
            🌿
          </div>
          <h2 className="
            text-4xl md:text-5xl font-bold mb-6
          ">
            Ready to Schedule Your Pickup?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Login to your customer account to get started today!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{  scale: 0.95 }}
          >
            <Link
              href="/login/requestor"
              className="
                inline-block
                bg-white text-[#1B4332]
                px-10 py-5 rounded-xl
                font-bold text-xl
                hover:bg-green-50 shadow-2xl
                transition duration-300
              "
            >
              🔐 Login to Get Started
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="
        bg-[#0D2B1F] text-white pt-16 pb-8
      ">
        <div className="
          max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
        ">
          <div className="
            grid grid-cols-1 md:grid-cols-4 gap-10 mb-12
          ">

            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <FordLogo height={28} />
                <div className="h-7 w-px bg-white/20" />
                <FCSLogo height={28} />
              </div>
              <p className="
                text-green-400/70 text-sm leading-relaxed
              ">
                Professional scrap pickup service for
                Ford vehicles across the United States.
                Authorised and trusted Ford partner.
              </p>
              <div className="
                mt-4 inline-flex items-center gap-2
                bg-green-900/50 border border-green-700
                rounded-full px-3 py-1
              ">
                <span className="text-sm">🌿</span>
                <span className="
                  text-green-300 text-xs font-medium
                ">
                  Eco-Friendly Service
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-5 text-lg">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Admin Login',   href: '/login/admin'  },
                  { label: 'How It Works',  href: '#how-it-works' },
                  { label: 'Why Choose Us', href: '#why-us'       },
                  { label: 'Contact Us',    href: '#contact'      },
                ].map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-green-400/70 hover:text-white
                        text-sm transition duration-200
                        inline-block hover:translate-x-1
                      "
                    >
                      → {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-white mb-5 text-lg">
                Support
              </h4>
              <ul className="space-y-3 text-green-400/70 text-sm">
                {[
                  'FAQ',
                  'Contact Us',
                  'Terms & Conditions',
                  'Privacy Policy',
                ].map(item => (
                  <li
                    key={item}
                    className="
                      hover:text-white cursor-pointer transition
                      hover:translate-x-1 inline-block
                    "
                  >
                    → {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-5 text-lg">
                Contact
              </h4>
              <ul className="space-y-3 text-green-400/70 text-sm">
                <li className="flex items-center gap-2">
                  <span>👤</span>
                  <span className="text-white font-medium">
                    Michelle Ridenour
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a
                    href="tel:+12489127995"
                    className="hover:text-white transition"
                  >
                    +1 (248) 912-7995
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <a
                    href="mailto:fcscats@ford.com"
                    className="hover:text-white transition"
                  >
                    fcscats@ford.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <a
                    href="mailto:fcsmktg@ford.com"
                    className="hover:text-white transition"
                  >
                    fcsmktg@ford.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Pan United States</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="
            border-t border-green-900 pt-8
            flex flex-col md:flex-row
            justify-between items-center gap-4
          ">
            <p className="text-green-400/60 text-sm">
              © {new Date().getFullYear()} Ford Component Sales.
              All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <FordLogo height={20} />
              <span className="text-green-400/60 text-xs">
                An Authorised Ford Partner
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}