'use client'

import Link       from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// ─── Logos — No Background ────────────────────────────
function FordLogo({ height = 36 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ford-logo.png"
      alt="Ford"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
    />
  )
}

function FCSLogo({ height = 36 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/FCS-logo.png"
      alt="FCS"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
    />
  )
}

// ─── Animated Counter Hook ────────────────────────────
function useCountUp(
  target:    number,
  duration:  number  = 2000,
  isVisible: boolean = false
) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
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

  const stats = [
    { value: `${pickups}+`,   label: 'Pickups Completed',     icon: '🚚' },
    { value: `${hours}hrs`,   label: 'Average Response Time', icon: '⚡' },
    { value: `${satisf}%`,   label: 'Customer Satisfaction',  icon: '⭐' },
    { value: `${customers}+`, label: 'Happy Customers',       icon: '🤝' },
  ]

  return (
    <section ref={ref} className="py-16 bg-slate-800 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px
        bg-slate-700 rounded-2xl overflow-hidden">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800 dark:bg-slate-900 px-8 py-10 text-center"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative bg-white dark:bg-[#0a0a0a]
      pt-16 pb-24 overflow-hidden">

        {/* Subtle blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px]
        bg-slate-50 dark:bg-slate-900/30 rounded-full
        -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px]
        bg-slate-50 dark:bg-slate-900/20 rounded-full
        translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">

            {/* Logo Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-6 mb-12"
            >
              <FordLogo height={44} />
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <FCSLogo  height={40} />
            </motion.div>

            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-slate-600 dark:text-slate-300
              text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <span className="w-1.5 h-1.5 bg-slate-500
              dark:bg-slate-400 rounded-full" />
              Ford Authorised Scrap Pickup — Across the United States
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold
              text-slate-900 dark:text-white leading-[1.1]
              tracking-tight mb-6"
            >
              Scrap Vehicle
              <br />
              <span className="text-slate-500 dark:text-slate-400">
                Pickup Made Easy
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-slate-500 dark:text-slate-400
              max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Fast, reliable, and eco-friendly scrap component collection
              for Ford vehicles. Schedule your pickup in minutes — we handle
              everything from documentation to disposal.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3
              justify-center items-center mb-12"
            >
              <Link
                href="/login/requestor"
                className="inline-flex items-center gap-2
                bg-slate-800 dark:bg-slate-700 text-white
                px-7 py-3 rounded-xl font-semibold text-sm
                hover:bg-slate-700 dark:hover:bg-slate-600
                transition shadow-lg shadow-slate-900/10"
              >
                Schedule a Pickup
                <svg className="w-4 h-4" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2
                text-slate-600 dark:text-slate-400 px-6 py-3
                rounded-xl font-medium text-sm
                border border-slate-200 dark:border-slate-700
                hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6
              text-sm text-slate-400 dark:text-slate-500"
            >
              {[
                '24hr Response',
                'Safe & Secure',
                'Eco-Friendly',
                'Ford Authorised',
                '500+ Customers',
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">✓</span>
                  {item}
                </span>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────── */}
      <StatsSection />

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how-it-works"
      className="py-24 bg-slate-50 dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <span className="text-slate-500 dark:text-slate-400
            text-sm font-semibold uppercase tracking-widest">
              Simple Process
            </span>
            <h2 className="text-4xl font-bold text-slate-900
            dark:text-white mt-3 mb-4">
              How It Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Three simple steps to get your scrap vehicle picked up professionally.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step:  '01',
                icon:  '🔐',
                title: 'Login to Your Account',
                desc:  'Sign in securely to access the pickup request portal and manage your vehicles.',
                href:  '/login/requestor',
                label: 'Login Now',
              },
              {
                step:  '02',
                icon:  '📋',
                title: 'Fill Pickup Form',
                desc:  'Submit vehicle details, location, and preferred pickup time through our simple form.',
                href:  null,
                label: null,
              },
              {
                step:  '03',
                icon:  '🚚',
                title: 'Pickup Completed',
                desc:  'Our team arrives, handles documentation, and completes the eco-friendly disposal.',
                href:  null,
                label: null,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative bg-white dark:bg-[#1a1a1a]
                rounded-2xl p-8
                border border-slate-100 dark:border-slate-800
                hover:border-slate-300 dark:hover:border-slate-600
                hover:shadow-xl transition duration-300 group"
              >
                {/* Big Step Number */}
                <div className="text-8xl font-black
                text-slate-50 dark:text-white/5
                absolute top-4 right-6 select-none leading-none">
                  {item.step}
                </div>

                <div className="relative">
                  <div className="w-14 h-14 bg-slate-100
                  dark:bg-slate-800 rounded-2xl flex items-center
                  justify-center text-2xl mb-6">
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900
                  dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400
                  text-sm leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1
                      text-slate-700 dark:text-slate-300 text-sm
                      font-semibold group-hover:gap-2 transition-all"
                    >
                      {item.label}
                      <svg className="w-4 h-4" fill="none"
                           stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round"
                              strokeLinejoin="round" strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────── */}
      <section id="why-us"
      className="py-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <span className="text-slate-500 dark:text-slate-400
            text-sm font-semibold uppercase tracking-widest">
              Our Advantages
            </span>
            <h2 className="text-4xl font-bold text-slate-900
            dark:text-white mt-3 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Trusted by hundreds of Ford dealers and fleet operators across the US.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-4 gap-4">
            {[
              { icon: '🚚', title: 'Fast Pickup',     desc: '24–48 hour guaranteed response for all requests.'         },
              { icon: '📋', title: 'Easy Process',    desc: 'Simple 3-step online booking. Zero paperwork hassle.'     },
              { icon: '🕐', title: '24/7 Support',    desc: 'Our team is always available to assist you anytime.'      },
              { icon: '🛡️', title: 'Safe & Secure',  desc: 'Professional handling with complete documentation.'       },
              { icon: '🌿', title: 'Eco-Friendly',    desc: 'Responsible recycling following all environmental laws.'  },
              { icon: '💰', title: 'Best Rates',      desc: 'Transparent, competitive pricing with no hidden fees.'    },
              { icon: '📄', title: 'Documentation',   desc: 'Full legal compliance and paperwork handled by us.'       },
              { icon: '🏆', title: 'Ford Authorised', desc: 'Officially authorised Ford scrap collection partner.'     },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                viewport={{ once: true }}
                className="bg-slate-50 dark:bg-[#111]
                border border-slate-100 dark:border-slate-800
                rounded-2xl p-6
                hover:border-slate-300 dark:hover:border-slate-600
                hover:bg-white dark:hover:bg-[#1a1a1a]
                hover:shadow-lg transition duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-bold text-slate-800
                dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400
                text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact"
      className="py-24 bg-slate-50 dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <span className="text-slate-500 dark:text-slate-400
            text-sm font-semibold uppercase tracking-widest">
              Get In Touch
            </span>
            <h2 className="text-4xl font-bold text-slate-900
            dark:text-white mt-3 mb-4">
              Contact Us
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Have questions? Our team is here to help.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* ── Left — Contact Cards ── */}
            <div className="space-y-4">

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#1a1a1a]
                border border-slate-100 dark:border-slate-800
                rounded-2xl p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100
                  dark:bg-slate-800 rounded-xl flex items-center
                  justify-center text-lg flex-shrink-0">
                    📧
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900
                    dark:text-white mb-2">Email</p>
                    <a href="mailto:fcscats@ford.com"
                       className="block text-slate-600
                       dark:text-slate-400 text-sm
                       hover:text-slate-900 dark:hover:text-white
                       hover:underline transition">
                      fcscats@ford.com
                    </a>
                    <a href="mailto:fcsmktg@ford.com"
                       className="block text-slate-600
                       dark:text-slate-400 text-sm
                       hover:text-slate-900 dark:hover:text-white
                       hover:underline transition mt-1">
                      fcsmktg@ford.com
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Contact Person Card */}
              {/* ✅ Phone number REMOVED — Michelle's email added */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#1a1a1a]
                border border-slate-100 dark:border-slate-800
                rounded-2xl p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100
                  dark:bg-slate-800 rounded-xl flex items-center
                  justify-center text-lg flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900
                    dark:text-white mb-1">Contact Person</p>
                    <p className="text-slate-700 dark:text-slate-300
                    text-sm font-medium">
                      Michelle Ridenour
                    </p>
                    {/* ✅ Her email — phone removed */}
                    <a href="mailto:mrideno2@ford.com"
                       className="block text-slate-500
                       dark:text-slate-400 text-sm mt-1
                       hover:text-slate-800 dark:hover:text-white
                       hover:underline transition">
                      mrideno2@ford.com
                    </a>
                    <p className="text-slate-400 dark:text-slate-500
                    text-xs mt-1">
                      Ford Component Sales — USA
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#1a1a1a]
                border border-slate-100 dark:border-slate-800
                rounded-2xl p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100
                  dark:bg-slate-800 rounded-xl flex items-center
                  justify-center text-lg flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900
                    dark:text-white mb-2">Coverage</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Michigan', 'Texas', 'California',
                        'Florida', 'New York', '+ More',
                      ].map((state, i) => (
                        <span key={i} className="text-xs font-medium
                        bg-slate-100 dark:bg-slate-800
                        text-slate-600 dark:text-slate-400
                        px-2.5 py-1 rounded-full">
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* ── Right — CTA Card ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-slate-800 dark:bg-slate-900 rounded-2xl
              p-10 text-white flex flex-col justify-between
              border border-slate-700"
            >
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <FordLogo height={30} />
                  <div className="w-px h-7 bg-white/20" />
                  <FCSLogo  height={28} />
                </div>

                <h3 className="text-3xl font-bold mb-3">
                  Ready to Get Started?
                </h3>
                <p className="text-slate-300 mb-8 leading-relaxed text-sm">
                  Login to your account and schedule a scrap vehicle pickup.
                  Our team will handle everything from start to finish.
                </p>

                <Link
                  href="/login/requestor"
                  className="inline-flex items-center gap-2
                  bg-white text-slate-800 px-6 py-3 rounded-xl
                  font-semibold text-sm hover:bg-slate-100
                  transition shadow-lg w-full justify-center mb-6"
                >
                  Schedule a Pickup
                  <svg className="w-4 h-4" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round"
                          strokeLinejoin="round" strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* ✅ All 3 emails — NO phone number */}
                <div className="space-y-2.5 text-sm text-slate-300
                bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-slate-400 text-xs font-semibold
                  uppercase tracking-wider mb-3">
                    Direct Contact
                  </p>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span className="text-white font-medium text-sm">
                      Michelle Ridenour
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <a href="mailto:mrideno2@ford.com"
                       className="hover:text-white transition text-sm">
                      mrideno2@ford.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <a href="mailto:fcscats@ford.com"
                       className="hover:text-white transition text-sm">
                      fcscats@ford.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <a href="mailto:fcsmktg@ford.com"
                       className="hover:text-white transition text-sm">
                      fcsmktg@ford.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    signIn('google', { callbackUrl: '/admin/dashboard' })
                  }
                  className="text-slate-400 hover:text-white
                  text-sm font-medium transition"
                >
                  Admin Login →
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-slate-900 dark:bg-black
      text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4
          gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <FordLogo height={26} />
                <div className="h-6 w-px bg-white/20" />
                <FCSLogo  height={24} />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Professional scrap pickup for Ford vehicles
                across the United States.
              </p>
              <div className="mt-4 inline-flex items-center gap-2
              bg-white/5 border border-white/10
              rounded-full px-3 py-1">
                <span className="text-sm">🌿</span>
                <span className="text-slate-400 text-xs">
                  Eco-Friendly Service
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-5
              text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'How It Works',  href: '#how-it-works' },
                  { label: 'Why Choose Us', href: '#why-us'       },
                  { label: 'Contact Us',    href: '#contact'      },
                ].map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white
                      text-sm transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      signIn('google', { callbackUrl: '/admin/dashboard' })
                    }
                    className="text-slate-400 hover:text-white
                    text-sm transition"
                  >
                    Admin Login
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-5
              text-sm uppercase tracking-wider">
                Support
              </h4>
              <ul className="space-y-2.5">
                {[
                  'FAQ',
                  'Contact Us',
                  'Terms & Conditions',
                  'Privacy Policy',
                ].map(item => (
                  <li key={item}>
                    <span className="text-slate-400
                    hover:text-white text-sm
                    transition cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact — ✅ NO phone number, mrideno2 added */}
            <div>
              <h4 className="font-semibold text-white mb-5
              text-sm uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2
                text-slate-400">
                  <span>👤</span>
                  <span className="text-white font-medium">
                    Michelle Ridenour
                  </span>
                </li>
                <li className="flex items-center gap-2
                text-slate-400">
                  <span>📧</span>
                  <a href="mailto:mrideno2@ford.com"
                     className="hover:text-white transition">
                    mrideno2@ford.com
                  </a>
                </li>
                <li className="flex items-center gap-2
                text-slate-400">
                  <span>📧</span>
                  <a href="mailto:fcscats@ford.com"
                     className="hover:text-white transition">
                    fcscats@ford.com
                  </a>
                </li>
                <li className="flex items-center gap-2
                text-slate-400">
                  <span>📧</span>
                  <a href="mailto:fcsmktg@ford.com"
                     className="hover:text-white transition">
                    fcsmktg@ford.com
                  </a>
                </li>
                <li className="flex items-center gap-2
                text-slate-400">
                  <span>📍</span>
                  <span>Pan United States</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8
          flex flex-col md:flex-row justify-between
          items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Ford Component Sales.
              All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <FordLogo height={18} />
              <span className="text-slate-500 text-xs">
                An Authorised Ford Partner
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
