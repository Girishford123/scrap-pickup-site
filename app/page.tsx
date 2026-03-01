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

// ─── Ford Oval SVG Logo ───────────────────────────────────
function FordOvalLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="100" cy="40" rx="98" ry="38"
        fill="#003478"
        stroke="#C0A050"
        strokeWidth="3"
      />
      <text
        x="100" y="52"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="38"
        fontWeight="bold"
        fontStyle="italic"
        fill="white"
        letterSpacing="2"
      >
        Ford
      </text>
    </svg>
  )
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
              color: 'border-blue-500',
              bg:    'bg-blue-50',
              text:  'text-blue-900',
            },
            {
              value: `${hours}hrs`,
              label: 'Average Response Time',
              color: 'border-green-500',
              bg:    'bg-green-50',
              text:  'text-green-900',
            },
            {
              value: `${satisf}%`,
              label: 'Customer Satisfaction',
              color: 'border-orange-500',
              bg:    'bg-orange-50',
              text:  'text-orange-900',
            },
            {
              value: `${customers}+`,
              label: 'Happy Customers',
              color: 'border-purple-500',
              bg:    'bg-purple-50',
              text:  'text-purple-900',
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
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [scrolled,     setScrolled]     = useState(false)
  const [activeTestim, setActiveTestim] = useState(0)

  // Sticky navbar shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate testimonials
  const testimonials = [
    {
      name:    'Rajesh Kumar',
      role:    'Fleet Manager, Delhi',
      comment: 'Excellent service! They picked up our scrapped vehicles within 24 hours. Very professional team.',
      rating:  5,
      avatar:  'RK',
    },
    {
      name:    'Priya Sharma',
      role:    'Operations Head, Mumbai',
      comment: 'The online booking process is so simple. Highly recommend Ford Component Sales for scrap pickups.',
      rating:  5,
      avatar:  'PS',
    },
    {
      name:    'Amit Patel',
      role:    'Logistics Manager, Pune',
      comment: 'Outstanding support team. They handled everything professionally and on time!',
      rating:  5,
      avatar:  'AP',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestim(prev => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const navLinks = [
    { label: 'How It Works',  href: '#how-it-works'  },
    { label: 'Why Choose Us', href: '#why-us'        },
    { label: 'Testimonials',  href: '#testimonials'  },
    { label: 'Contact',       href: '#contact'       },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className={`
        sticky top-0 z-50 bg-[#003478] text-white
        transition-shadow duration-300
        ${scrolled ? 'shadow-2xl' : 'shadow-lg'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logos */}
            <div className="flex items-center space-x-3">
              <FordOvalLogo className="h-10 w-auto" />
              <div className="h-8 w-px bg-white/30" />
              <Image
                src="/FCS-logo.png"
                alt="Ford Component Sales Logo"
                width={120}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="
                    text-blue-100 hover:text-white
                    font-medium text-sm
                    transition duration-200
                    hover:underline underline-offset-4
                  "
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Login Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login/requestor"
                className="
                  bg-green-600 text-white
                  px-5 py-2 rounded-lg
                  hover:bg-green-500
                  font-semibold text-sm
                  transition duration-200
                  shadow-md hover:shadow-lg
                "
              >
                Customer Login
              </Link>
              <Link
                href="/login/admin"
                className="
                  bg-white text-[#003478]
                  px-5 py-2 rounded-lg
                  hover:bg-blue-50
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
              className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-blue-700 pt-4">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="
                    block px-4 py-2 text-blue-100
                    hover:bg-blue-700 rounded-lg
                    font-medium text-sm transition
                  "
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-2 px-4">
                <Link
                  href="/login/requestor"
                  className="
                    bg-green-600 text-white
                    px-4 py-2 rounded-lg
                    hover:bg-green-500
                    font-semibold text-sm
                    text-center transition
                  "
                >
                  Customer Login
                </Link>
                <Link
                  href="/login/admin"
                  className="
                    bg-white text-[#003478]
                    px-4 py-2 rounded-lg
                    hover:bg-blue-50
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
        from-[#003478] via-[#00297a] to-[#001f5c]
        text-white py-28 overflow-hidden
      ">
        {/* Background decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="
                inline-flex items-center gap-2
                bg-white/10 backdrop-blur-sm
                border border-white/20
                rounded-full px-4 py-2
                text-sm font-medium text-blue-100
                mb-6
              ">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Trusted by 500+ Customers Across India
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Professional Scrap
                <br />
                <span className="text-blue-300">
                  Vehicle Pickup
                </span>
                <br />
                Service
              </h1>

              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Fast, reliable, and eco-friendly scrap component collection
                for Ford vehicles across India. Login to schedule your
                pickup today!
              </p>

              {/* ✅ CTA → Login only, NO direct pickup button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login/requestor"
                  className="
                    inline-flex items-center justify-center gap-2
                    bg-white text-[#003478]
                    px-8 py-4 rounded-xl
                    font-bold text-lg
                    hover:bg-blue-50
                    shadow-2xl
                    transform hover:scale-105
                    transition duration-300
                  "
                >
                  🔐 Customer Login
                </Link>
                <a
                  href="#how-it-works"
                  className="
                    inline-flex items-center justify-center gap-2
                    bg-transparent border-2 border-white/40
                    text-white
                    px-8 py-4 rounded-xl
                    font-semibold text-lg
                    hover:bg-white/10
                    transition duration-300
                  "
                >
                  Learn More →
                </a>
              </div>

              {/* Trust Badges — removed Free Pickup */}
              <div className="
                flex flex-wrap justify-center lg:justify-start
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
                      text-sm text-blue-100
                    "
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Content — Visual Card */}
            <div className="flex-1 w-full max-w-md">
              <div className="
                bg-white/10 backdrop-blur-sm
                border border-white/20
                rounded-3xl p-8
                shadow-2xl
              ">
                {/* FCS Logo */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/FCS-logo.png"
                    alt="Ford Component Sales"
                    width={180}
                    height={70}
                    className="object-contain"
                  />
                </div>

                <div className="text-center mb-6">
                  <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">
                    Authorised Scrap Collection
                  </p>
                  <h3 className="text-white text-2xl font-bold mt-1">
                    Ford Component Sales
                  </h3>
                </div>

                {/* Service Info */}
                <div className="space-y-3">
                  {[
                    { icon: '🚚', text: 'Doorstep Vehicle Pickup'   },
                    { icon: '📋', text: 'Easy Online Booking'       },
                    { icon: '💰', text: 'Competitive Scrap Rates'   },
                    { icon: '🌿', text: 'Eco-Friendly Disposal'     },
                    { icon: '📄', text: 'Proper Documentation'      },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="
                        flex items-center gap-3
                        bg-white/10 rounded-xl
                        px-4 py-3
                      "
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-white text-sm font-medium">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ✅ Login to access pickup — NOT direct pickup */}
                <Link
                  href="/login/requestor"
                  className="
                    mt-6 block text-center
                    bg-white text-[#003478]
                    px-6 py-3 rounded-xl
                    font-bold text-base
                    hover:bg-blue-50
                    transition duration-300
                  "
                >
                  🔐 Login to Request Pickup →
                </Link>
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
              inline-block bg-blue-100 text-[#003478]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Simple Process
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Get your scrap vehicle picked up in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                step:   '01',
                icon:   '🔐',
                title:  'Login to Your Account',
                desc:   'Sign in to your customer account to access the pickup request form.',
                color:  'bg-blue-50 border-blue-200',
                iconBg: 'bg-[#003478]',
                // ✅ Login link instead of pickup link
                btn:    true,
                btnText:'Login Now →',
                btnHref:'/login/requestor',
              },
              {
                step:   '02',
                icon:   '📋',
                title:  'Fill Pickup Form',
                desc:   'Complete the simple online pickup request form with your vehicle details.',
                color:  'bg-green-50 border-green-200',
                iconBg: 'bg-green-600',
                btn:    false,
              },
              {
                step:   '03',
                icon:   '🚚',
                title:  'Pickup Complete',
                desc:   'Our professional team arrives at your location and handles everything safely.',
                color:  'bg-orange-50 border-orange-200',
                iconBg: 'bg-orange-500',
                btn:    false,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`
                  relative text-center p-8
                  ${item.color}
                  border-2 rounded-2xl
                  hover:shadow-xl transition duration-300
                  transform hover:-translate-y-2
                `}
              >
                {/* Step number */}
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  bg-white border-2 border-gray-200
                  rounded-full w-8 h-8
                  flex items-center justify-center
                  text-xs font-bold text-gray-500
                ">
                  {item.step}
                </div>

                <div className={`
                  w-20 h-20 ${item.iconBg}
                  rounded-2xl flex items-center justify-center
                  text-4xl mx-auto mb-6 shadow-lg
                `}>
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
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
                      text-[#003478] font-semibold
                      hover:text-blue-700 transition
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
              inline-block bg-blue-100 text-[#003478]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Our Advantages
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Professional and reliable scrap pickup service you can trust
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon:       '🚚',
                title:      'Fast Pickup',
                desc:       '24-48 hour guaranteed response time for all pickup requests.',
                color:      'hover:border-blue-500 hover:bg-blue-50',
                badge:      'Fast',
                badgeColor: 'bg-blue-100 text-blue-700',
              },
              {
                icon:       '📋',
                title:      'Easy Process',
                desc:       'Simple 3-step online booking. No paperwork hassle.',
                color:      'hover:border-green-500 hover:bg-green-50',
                badge:      'Simple',
                badgeColor: 'bg-green-100 text-green-700',
              },
              {
                icon:       '🕐',
                title:      '24/7 Support',
                desc:       'Our support team is always available to assist you.',
                color:      'hover:border-orange-500 hover:bg-orange-50',
                badge:      'Always On',
                badgeColor: 'bg-orange-100 text-orange-700',
              },
              {
                icon:       '🛡️',
                title:      'Safe & Secure',
                desc:       'Professional handling with proper documentation provided.',
                color:      'hover:border-purple-500 hover:bg-purple-50',
                badge:      'Trusted',
                badgeColor: 'bg-purple-100 text-purple-700',
              },
              {
                icon:       '🌿',
                title:      'Eco-Friendly',
                desc:       'Responsible disposal and recycling of all scrap components.',
                color:      'hover:border-teal-500 hover:bg-teal-50',
                badge:      'Green',
                badgeColor: 'bg-teal-100 text-teal-700',
              },
              {
                icon:       '💰',
                title:      'Best Rates',
                desc:       'Competitive and transparent pricing for all scrap vehicles.',
                color:      'hover:border-yellow-500 hover:bg-yellow-50',
                badge:      'Value',
                badgeColor: 'bg-yellow-100 text-yellow-700',
              },
              {
                icon:       '📄',
                title:      'Documentation',
                desc:       'Complete paperwork and legal compliance handled by us.',
                color:      'hover:border-red-500 hover:bg-red-50',
                badge:      'Compliant',
                badgeColor: 'bg-red-100 text-red-700',
              },
              {
                icon:       '🏆',
                title:      'Ford Authorised',
                desc:       'Officially authorised Ford scrap collection partner.',
                color:      'hover:border-[#003478] hover:bg-blue-50',
                badge:      'Official',
                badgeColor: 'bg-blue-100 text-[#003478]',
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">
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

      {/* ── TESTIMONIALS ───────────────────────────────── */}
      <section
        id="testimonials"
        className="py-24 bg-gradient-to-br from-[#003478] to-[#001f5c] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="
              inline-block bg-white/10 border border-white/20
              text-blue-100 text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Customer Reviews
            </span>
            <h2 className="text-4xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-blue-200 text-xl max-w-2xl mx-auto">
              Trusted by hundreds of fleet managers across India
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="
              bg-white/10 backdrop-blur-sm
              border border-white/20
              rounded-3xl p-10 text-center
              shadow-2xl transition-all duration-500
            ">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[activeTestim].rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-xl text-blue-100 leading-relaxed mb-8 italic">
                "{testimonials[activeTestim].comment}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="
                  w-14 h-14 rounded-full
                  bg-blue-400/30 border-2 border-white/30
                  flex items-center justify-center
                  text-white font-bold text-lg
                ">
                  {testimonials[activeTestim].avatar}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-lg">
                    {testimonials[activeTestim].name}
                  </div>
                  <div className="text-blue-300 text-sm">
                    {testimonials[activeTestim].role}
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestim(i)}
                  className={`
                    rounded-full transition-all duration-300
                    ${i === activeTestim
                      ? 'w-8 h-3 bg-white'
                      : 'w-3 h-3 bg-white/40 hover:bg-white/60'}
                  `}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ────────────────────────────── */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="
              inline-block bg-blue-100 text-[#003478]
              text-sm font-semibold
              px-4 py-2 rounded-full mb-4
            ">
              Get In Touch
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Have questions? We are here to help you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Info Cards */}
            <div className="space-y-6">
              {[
                {
                  icon:  '📞',
                  title: 'Phone',
                  info:  '+91 1800-XXX-XXXX',
                  sub:   'Mon–Sat, 9am–6pm IST',
                  bg:    'bg-blue-50 border-blue-200',
                },
                {
                  icon:  '📧',
                  title: 'Email',
                  info:  'support@fordcomponentsales.in',
                  sub:   'We reply within 2 hours',
                  bg:    'bg-green-50 border-green-200',
                },
                {
                  icon:  '📍',
                  title: 'Location',
                  info:  'Pan India Service',
                  sub:   'All major cities covered',
                  bg:    'bg-orange-50 border-orange-200',
                },
                {
                  icon:  '🕐',
                  title: 'Working Hours',
                  info:  '24/7 Online Support',
                  sub:   'Pickup: Mon–Sat',
                  bg:    'bg-purple-50 border-purple-200',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center gap-5
                    ${item.bg} border-2
                    rounded-2xl p-5
                    hover:shadow-md transition duration-300
                  `}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">
                      {item.title}
                    </div>
                    <div className="text-gray-700 font-medium">
                      {item.info}
                    </div>
                    <div className="text-gray-500 text-sm">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ Login CTA Card — No direct pickup */}
            <div className="
              bg-gradient-to-br from-[#003478] to-[#001f5c]
              rounded-3xl p-10 text-white
              shadow-2xl text-center
            ">
              <div className="flex justify-center mb-6">
                <Image
                  src="/FCS-logo.png"
                  alt="FCS Logo"
                  width={140}
                  height={55}
                  className="object-contain brightness-0 invert"
                />
              </div>

              <h3 className="text-3xl font-bold mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-blue-200 mb-8 leading-relaxed">
                Login to your customer account to schedule
                a scrap vehicle pickup. It only takes 2 minutes!
              </p>

              <Link
                href="/login/requestor"
                className="
                  inline-block
                  bg-white text-[#003478]
                  px-10 py-4 rounded-xl
                  font-bold text-lg
                  hover:bg-blue-50
                  shadow-xl
                  transform hover:scale-105
                  transition duration-300
                  mb-6 w-full text-center
                "
              >
                🔐 Login to Request Pickup
              </Link>

              <div className="
                flex justify-center gap-6
                pt-6 border-t border-white/20
              ">
                <Link
                  href="/login/requestor"
                  className="text-blue-200 hover:text-white text-sm font-medium transition"
                >
                  Customer Login →
                </Link>
                <Link
                  href="/login/admin"
                  className="text-blue-200 hover:text-white text-sm font-medium transition"
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
        bg-gradient-to-r from-[#003478] to-[#0057a8]
        text-white
      ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Schedule Your Pickup?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Login to your customer account to get started today!
          </p>
          {/* ✅ Login button only */}
          <Link
            href="/login/requestor"
            className="
              inline-block
              bg-white text-[#003478]
              px-10 py-5 rounded-xl
              font-bold text-xl
              hover:bg-blue-50
              shadow-2xl
              transform hover:scale-105
              transition duration-300
            "
          >
            🔐 Login to Get Started
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <FordOvalLogo className="h-10 w-auto" />
              </div>
              <Image
                src="/FCS-logo.png"
                alt="Ford Component Sales"
                width={130}
                height={50}
                className="object-contain mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional scrap pickup service for Ford
                vehicles across India. Authorised and
                trusted since 2020.
              </p>
            </div>

            {/* Quick Links — ✅ No pickup link */}
            <div>
              <h4 className="font-bold text-white mb-5 text-lg">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Customer Login',  href: '/login/requestor' },
                  { label: 'Admin Login',     href: '/login/admin'     },
                  { label: 'How It Works',    href: '#how-it-works'    },
                  { label: 'Why Choose Us',   href: '#why-us'          },
                ].map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-gray-400 hover:text-white
                        text-sm transition duration-200
                        inline-block
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
              <ul className="space-y-3 text-gray-400 text-sm">
                {['FAQ', 'Contact Us', 'Terms & Conditions', 'Privacy Policy'].map(item => (
                  <li key={item} className="hover:text-white cursor-pointer transition">
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
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <span>📞</span> +91 1800-XXX-XXXX
                </li>
                <li className="flex items-center gap-2 break-all">
                  <span>📧</span> support@fordcomponentsales.in
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span> Pan India
                </li>
                <li className="flex items-center gap-2">
                  <span>🕐</span> Mon–Sat, 9am–6pm IST
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="
            border-t border-gray-800 pt-8
            flex flex-col md:flex-row
            justify-between items-center gap-4
          ">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Ford Component Sales.
              All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <FordOvalLogo className="h-6 w-auto opacity-60" />
              <span className="text-gray-500 text-xs">
                An Authorised Ford Partner
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
