'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

// ─── Animated Counter Hook ───────────────────────────────
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

// ─── Stats Section with Animation ────────────────────────
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
    <section ref={ref} className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            {
              value: `${pickups}+`,
              label: 'Pickups Completed',
              color: 'border-[#1B4332]',
              bg:    'bg-green-50',
              text:  'text-[#1B4332]',
            },
            {
              value: `${hours}hrs`,
              label: 'Average Response Time',
              color: 'border-[#52B788]',
              bg:    'bg-emerald-50',
              text:  'text-[#2D6A4F]',
            },
            {
              value: `${satisf}%`,
              label: 'Customer Satisfaction',
              color: 'border-green-400',
              bg:    'bg-green-50',
              text:  'text-[#1B4332]',
            },
            {
              value: `${customers}+`,
              label: 'Happy Customers',
              color: 'border-[#52B788]',
              bg:    'bg-emerald-50',
              text:  'text-[#2D6A4F]',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`
                ${stat.bg} p-8 rounded-2xl shadow-md
                border-b-4 ${stat.color}
                transform hover:scale-105 transition duration-300
              `}
            >
              <div className={`text-5xl font-bold ${stat.text} mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Sticky navbar shadow on scroll
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
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className={`
        sticky top-0 z-50
        bg-[#1B4332] text-white
        transition-shadow duration-300
        ${scrolled ? 'shadow-2xl' : 'shadow-lg'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* ── Logos ── */}
            <div className="flex items-center space-x-4">

              {/* Ford Logo — Official Image */}
              <div className="
                bg-white rounded-xl
                px-3 py-2
                shadow-md
                flex items-center justify-center
              ">
                <Image
                  src="/ford-logo.png"
                  alt="Ford Logo"
                  width={90}
                  height={38}
                  className="object-contain h-9 w-auto"
                  priority
                />
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-white/30" />

              {/* FCS Logo */}
              <div className="
                bg-white rounded-xl
                px-3 py-2
                shadow-md
                flex items-center justify-center
              ">
                <Image
                  src="/FCS-logo.png"
                  alt="Ford Component Sales Logo"
                  width={150}
                  height={48}
                  className="object-contain h-9 w-auto"
                  priority
                />
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="
                    text-green-100 hover:text-white
                    font-medium text-sm
                    transition duration-200
                    hover:underline underline-offset-4
                  "
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop — Admin Login Only */}
            <div className="hidden md:flex items-center">
              <Link
                href="/login/admin"
                className="
                  bg-white text-[#1B4332]
                  px-5 py-2 rounded-lg
                  hover:bg-green-50
                  font-semibold text-sm
                  transition duration-200
                  shadow-md hover:shadow-lg
                "
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg
              hover:bg-[#2D6A4F] transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <div className="
              md:hidden pb-4 space-y-2
              border-t border-green-700 pt-4
            ">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="
                    block px-4 py-2 text-green-100
                    hover:bg-[#2D6A4F] rounded-lg
                    font-medium text-sm transition
                  "
                >
                  {link.label}
                </a>
              ))}
              {/* Mobile — Admin Login Only */}
              <div className="pt-2 px-4">
                <Link
                  href="/login/admin"
                  className="
                    block bg-white text-[#1B4332]
                    px-4 py-2 rounded-lg
                    hover:bg-green-50
                    font-semibold text-sm
                    text-center transition
                  "
                >
                  Admin Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────── */}
      <section className="
        relative bg-gradient-to-br
        from-[#1B4332] via-[#2D6A4F] to-[#1B4332]
        text-white py-28 overflow-hidden
      ">
        {/* Background decorative circles */}
        <div className="
          absolute top-0 left-0 w-96 h-96
          bg-green-400/10 rounded-full
          -translate-x-1/2 -translate-y-1/2
        " />
        <div className="
          absolute bottom-0 right-0 w-96 h-96
          bg-green-300/10 rounded-full
          translate-x-1/2 translate-y-1/2
        " />
        <div className="
          absolute top-1/2 left-1/3 w-64 h-64
          bg-white/5 rounded-full blur-3xl
        " />
        <div className="
          absolute top-1/4 right-1/4 w-48 h-48
          bg-[#52B788]/10 rounded-full blur-2xl
        " />

        <div className="
          relative max-w-7xl mx-auto
          px-4 sm:px-6 lg:px-8
        ">
          <div className="
            flex flex-col lg:flex-row
            items-center gap-12
          ">

            {/* ── Left Content ── */}
            <div className="flex-1 text-center lg:text-left">
            {/* ── Logos Row — Visible on ALL screens ── */}
<div className="
  flex items-center gap-4
  justify-center lg:justify-start
  mb-8
">
  {/* Ford Logo */}
  <div className="
    bg-white rounded-xl
    px-4 py-2 shadow-lg
    flex items-center justify-center
  ">
    <Image
      src="/ford-logo.png"
      alt="Ford Logo"
      width={100}
      height={40}
      className="object-contain h-10 w-auto"
      priority
    />
  </div>

  {/* Divider */}
  <div className="h-10 w-px bg-white/40" />

  {/* FCS Logo */}
  <div className="
    bg-white rounded-xl
    px-4 py-2 shadow-lg
    flex items-center justify-center
  ">
    <Image
      src="/FCS-logo.png"
      alt="Ford Component Sales"
      width={140}
      height={44}
      className="object-contain h-10 w-auto"
      priority
    />
  </div>
</div>
              {/* Trusted Badge */}
              <div className="
                inline-flex items-center gap-2
                bg-white/10 backdrop-blur-sm
                border border-white/20
                rounded-full px-4 py-2
                text-sm font-medium text-green-100
                mb-6
              ">
                <span className="
                  w-2 h-2 bg-[#52B788]
                  rounded-full animate-pulse
                " />
                Trusted by 500+ Customers Across the US
              </div>

              <h1 className="
                text-4xl md:text-5xl lg:text-6xl
                font-bold leading-tight mb-6
              ">
                Professional Scrap
                <br />
                <span className="text-[#52B788]">
                  Vehicle Pickup
                </span>
                <br />
                Service
              </h1>

              <p className="
                text-lg text-green-100 mb-8
                max-w-xl mx-auto lg:mx-0
                leading-relaxed
              ">
                Fast, reliable, and eco-friendly scrap
                component collection for Ford vehicles
                across the United States. Login to
                schedule your pickup today!
              </p>

              {/* CTA Buttons */}
              <div className="
                flex flex-col sm:flex-row gap-4
                justify-center lg:justify-start
              ">
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
              </div>

              {/* Trust Badges */}
              <div className="
                flex flex-wrap
                justify-center lg:justify-start
                gap-4 mt-8
              ">
                {[
                  '⚡ 24hr Response',
                  '🛡️ Safe & Secure',
                  '🌿 Eco-Friendly',
                  '🏆 Ford Authorised',
                ].map((badge, i) => (
                  <span
                    key={i}
                    className="
                      bg-white/10 border border-white/20
                      rounded-full px-3 py-1
                      text-sm text-green-100
                    "
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right Content — Visual Card ── */}
            <div className="flex-1 w-full max-w-md">
              <div className="
                bg-white/10 backdrop-blur-sm
                border border-white/20
                rounded-3xl p-8 shadow-2xl
              ">

                {/* Logos inside hero card */}
                <div className="
                  flex items-center justify-center
                  gap-4 mb-6
                ">
                  {/* Ford Logo */}
                  <div className="
                    bg-white rounded-xl
                    px-3 py-2 shadow-md
                  ">
                    <Image
                      src="ford-logo.png"
                      alt="Ford Logo"
                      width={80}
                      height={32}
                      className="object-contain h-8 w-auto"
                    />
                  </div>

                  <div className="h-8 w-px bg-white/30" />

                  {/* FCS Logo */}
                  <div className="
                    bg-white rounded-xl
                    px-3 py-2 shadow-md
                  ">
                    <Image
                      src="/FCS-logo.png"
                      alt="Ford Component Sales"
                      width={120}
                      height={40}
                      className="object-contain h-8 w-auto"
                    />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="
                    text-green-200 text-sm font-medium
                    uppercase tracking-wider
                  ">
                    Authorised Scrap Collection
                  </p>
                  <h3 className="
                    text-white text-2xl font-bold mt-1
                  ">
                    Ford Component Sales
                  </h3>
                </div>

                {/* Service Info */}
                <div className="space-y-3">
                  {[
                    { icon: '🚚', text: 'Doorstep Vehicle Pickup'  },
                    { icon: '📋', text: 'Easy Online Booking'      },
                    { icon: '💰', text: 'Competitive Scrap Rates'  },
                    { icon: '🌿', text: 'Eco-Friendly Disposal'    },
                    { icon: '📄', text: 'Proper Documentation'     },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="
                        flex items-center gap-3
                        bg-white/10 rounded-xl
                        px-4 py-3
                        hover:bg-white/20
                        transition duration-200
                      "
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="
                        text-white text-sm font-medium
                      ">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* See How It Works */}
                <a
                  href="#how-it-works"
                  className="
                    mt-6 block text-center
                    bg-white text-[#1B4332]
                    px-6 py-3 rounded-xl
                    font-bold text-base
                    hover:bg-green-50
                    transition duration-300
                    shadow-lg
                  "
                >
                  See How It Works →
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ANIMATED STATS ─────────────────────────────── */}
      <StatsSection />

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Simple Process
            </span>
            <h2 className="
              text-4xl font-bold text-gray-900 mb-4
            ">
              How It Works
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Get your scrap vehicle picked up in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step:    '01',
                icon:    '🔐',
                title:   'Login to Your Account',
                desc:    'Sign in to your customer account to access the pickup request form.',
                color:   'bg-green-50 border-green-200',
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
                color:  'bg-emerald-50 border-emerald-200',
                iconBg: 'bg-[#2D6A4F]',
                btn:    false,
              },
              {
                step:   '03',
                icon:   '🚚',
                title:  'Pickup Complete',
                desc:   'Our professional team arrives at your location and handles everything safely.',
                color:  'bg-teal-50 border-teal-200',
                iconBg: 'bg-[#52B788]',
                btn:    false,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`
                  relative text-center p-8
                  ${item.color} border-2 rounded-2xl
                  hover:shadow-xl transition duration-300
                  transform hover:-translate-y-2
                `}
              >
                {/* Step Number */}
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  bg-white border-2 border-green-200
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
                  text-2xl font-bold text-gray-900 mb-4
                ">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {item.desc}
                </p>
                {item.btn && (
                  <Link
                    href={item.btnHref!}
                    className="
                      inline-flex items-center gap-1
                      text-[#1B4332] font-semibold
                      hover:text-[#2D6A4F] transition
                    "
                  >
                    {item.btnText}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ──────────────────────────────── */}
      <section id="why-us" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Our Advantages
            </span>
            <h2 className="
              text-4xl font-bold text-gray-900 mb-4
            ">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Professional and reliable scrap pickup
              service you can trust
            </p>
          </div>

          <div className="
            grid grid-cols-1 sm:grid-cols-2
            lg:grid-cols-4 gap-6
          ">
            {[
              {
                icon:       '🚚',
                title:      'Fast Pickup',
                desc:       '24-48 hour guaranteed response time for all pickup requests.',
                color:      'hover:border-[#1B4332] hover:bg-green-50',
                badge:      'Fast',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
              {
                icon:       '📋',
                title:      'Easy Process',
                desc:       'Simple 3-step online booking. No paperwork hassle.',
                color:      'hover:border-[#2D6A4F] hover:bg-emerald-50',
                badge:      'Simple',
                badgeColor: 'bg-emerald-100 text-[#2D6A4F]',
              },
              {
                icon:       '🕐',
                title:      '24/7 Support',
                desc:       'Our support team is always available to assist you.',
                color:      'hover:border-[#52B788] hover:bg-teal-50',
                badge:      'Always On',
                badgeColor: 'bg-teal-100 text-teal-700',
              },
              {
                icon:       '🛡️',
                title:      'Safe & Secure',
                desc:       'Professional handling with proper documentation provided.',
                color:      'hover:border-green-400 hover:bg-green-50',
                badge:      'Trusted',
                badgeColor: 'bg-green-100 text-green-700',
              },
              {
                icon:       '🌿',
                title:      'Eco-Friendly',
                desc:       'Responsible disposal and recycling of all scrap components.',
                color:      'hover:border-[#1B4332] hover:bg-green-50',
                badge:      'Green',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
              {
                icon:       '💰',
                title:      'Best Rates',
                desc:       'Competitive and transparent pricing for all scrap vehicles.',
                color:      'hover:border-[#52B788] hover:bg-emerald-50',
                badge:      'Value',
                badgeColor: 'bg-emerald-100 text-[#2D6A4F]',
              },
              {
                icon:       '📄',
                title:      'Documentation',
                desc:       'Complete paperwork and legal compliance handled by us.',
                color:      'hover:border-teal-500 hover:bg-teal-50',
                badge:      'Compliant',
                badgeColor: 'bg-teal-100 text-teal-700',
              },
              {
                icon:       '🏆',
                title:      'Ford Authorised',
                desc:       'Officially authorised Ford scrap collection partner.',
                color:      'hover:border-[#1B4332] hover:bg-green-50',
                badge:      'Official',
                badgeColor: 'bg-green-100 text-[#1B4332]',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`
                  relative text-center p-6
                  bg-white border-2 border-gray-100
                  rounded-2xl shadow-sm
                  ${feature.color}
                  transition duration-300
                  transform hover:-translate-y-1
                  hover:shadow-xl
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
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="
                  text-lg font-bold text-gray-900 mb-2
                ">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ────────────────────────────── */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="
              inline-block bg-green-100 text-[#1B4332]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Get In Touch
            </span>
            <h2 className="
              text-4xl font-bold text-gray-900 mb-4
            ">
              Contact Us
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Have questions? We are here to help you!
            </p>
          </div>

          <div className="
            grid grid-cols-1 lg:grid-cols-2
            gap-12 items-start
          ">

            {/* ── Contact Info Cards ── */}
            <div className="space-y-6">

              {/* Phone */}
              <div className="
                flex items-center gap-5
                bg-green-50 border-2 border-green-200
                rounded-2xl p-5
                hover:shadow-md transition duration-300
              ">
                <div className="
                  w-14 h-14 bg-[#1B4332]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📞
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">
                    Phone
                  </div>
                  <div className="text-[#1B4332] font-semibold text-base">
                    Michelle Ridenour
                  </div>
                  <a
                    href="tel:+12489127995"
                    className="
                      text-[#2D6A4F] font-medium
                      hover:text-[#1B4332] transition text-sm
                    "
                  >
                    +1 (248) 912-7995
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="
                flex items-start gap-5
                bg-emerald-50 border-2 border-emerald-200
                rounded-2xl p-5
                hover:shadow-md transition duration-300
              ">
                <div className="
                  w-14 h-14 bg-[#2D6A4F]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📧
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg mb-1">
                    Email
                  </div>
                  <a
                    href="mailto:fcscats@ford.com"
                    className="
                      block text-[#1B4332] font-medium
                      hover:text-[#2D6A4F] transition text-sm
                    "
                  >
                    fcscats@ford.com
                  </a>
                  <a
                    href="mailto:fcsmktg@ford.com"
                    className="
                      block text-[#1B4332] font-medium
                      hover:text-[#2D6A4F] transition
                      text-sm mt-1
                    "
                  >
                    fcsmktg@ford.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="
                flex items-start gap-5
                bg-teal-50 border-2 border-teal-200
                rounded-2xl p-5
                hover:shadow-md transition duration-300
              ">
                <div className="
                  w-14 h-14 bg-[#52B788]
                  rounded-xl flex items-center
                  justify-center text-2xl
                  shadow-md flex-shrink-0
                ">
                  📍
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">
                    Location
                  </div>
                  <div className="text-[#1B4332] font-semibold mb-2">
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
                          bg-teal-100 text-teal-700
                          text-xs font-semibold
                          px-2 py-1 rounded-full
                        "
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm">
                    Serving all major Ford dealerships
                    and fleet operators across the US
                  </p>
                </div>
              </div>

            </div>

            {/* ── Login CTA Card ── */}
            <div className="
              bg-gradient-to-br
              from-[#1B4332] to-[#0D2B1F]
              rounded-3xl p-10 text-white
              shadow-2xl text-center
            ">

              {/* Both Logos in Card */}
              <div className="
                flex items-center justify-center
                gap-4 mb-6
              ">
                <div className="
                  bg-white rounded-xl
                  px-3 py-2 shadow-md
                ">
                  <Image
                    src="/ford-ford-logo.png"
                    alt="Ford Logo"
                    width={70}
                    height={28}
                    className="object-contain h-7 w-auto"
                  />
                </div>
                <div className="h-7 w-px bg-white/30" />
                <div className="
                  bg-white rounded-xl
                  px-3 py-2 shadow-md
                ">
                  <Image
                    src="/FCS-logo.png"
                    alt="FCS Logo"
                    width={110}
                    height={36}
                    className="object-contain h-7 w-auto"
                  />
                </div>
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

              {/* Contact Details inside card */}
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

              {/* Admin Login link */}
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
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────── */}
      <section className="
        py-20
        bg-gradient-to-r
        from-[#1B4332] to-[#2D6A4F]
        text-white
      ">
        <div className="
          max-w-4xl mx-auto
          px-4 sm:px-6 lg:px-8 text-center
        ">
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
            Login to your customer account to
            get started today!
          </p>
          <Link
            href="/login/requestor"
            className="
              inline-block
              bg-white text-[#1B4332]
              px-10 py-5 rounded-xl
              font-bold text-xl
              hover:bg-green-50 shadow-2xl
              transform hover:scale-105
              transition duration-300
            "
          >
            🔐 Login to Get Started
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-[#0D2B1F] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="
            grid grid-cols-1 md:grid-cols-4
            gap-10 mb-12
          ">

            {/* Brand */}
            <div className="col-span-1">

              {/* Both logos in footer */}
              <div className="
                flex items-center gap-3 mb-5
              ">
                <div className="
                  bg-white rounded-xl
                  px-2 py-1.5 shadow-md
                ">
                  <Image
                    src="/ford-logo.png"
                    alt="Ford Logo"
                    width={60}
                    height={24}
                    className="object-contain h-7 w-auto"
                  />
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div className="
                  bg-white rounded-xl
                  px-2 py-1.5 shadow-md
                ">
                  <Image
                    src="/FCS-logo.png"
                    alt="Ford Component Sales"
                    width={100}
                    height={32}
                    className="object-contain h-7 w-auto"
                  />
                </div>
              </div>

              <p className="
                text-green-400/70 text-sm leading-relaxed
              ">
                Professional scrap pickup service for
                Ford vehicles across the United States.
                Authorised and trusted Ford partner.
              </p>

              {/* Eco badge */}
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
                    className="hover:text-white cursor-pointer transition"
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
              <div className="
                bg-white/10 rounded-lg px-2 py-1
              ">
                <Image
                  src="/ford-logo.png"
                  alt="Ford Logo"
                  width={50}
                  height={20}
                  className="object-contain h-5 w-auto opacity-80"
                />
              </div>
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
