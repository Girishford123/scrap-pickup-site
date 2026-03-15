'use client'

import Link       from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function FordLogo({ height = 36 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/ford-logo.png" alt="Ford" style={{ height: `${height}px`, width: 'auto' }} />
}
function FCSLogo({ height = 36 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/FCS-logo.png" alt="FCS" style={{ height: `${height}px`, width: 'auto' }} />
}

function useCountUp(target: number, duration = 2000, isVisible = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const inc = target / (duration / 16)
    const t = setInterval(() => {
      start += inc
      if (start >= target) { setCount(target); clearInterval(t) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [target, duration, isVisible])
  return count
}

function StatsBar() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const p = useCountUp(1000, 2000, visible)
  const h = useCountUp(24,   1500, visible)
  const s = useCountUp(100,  1800, visible)
  const c = useCountUp(500,  2000, visible)

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4">
      {[
        { val: `${p}+`,   sub: 'Pickups Done'       },
        { val: `${h}h`,   sub: 'Response Time'      },
        { val: `${s}%`,   sub: 'Satisfaction'       },
        { val: `${c}+`,   sub: 'Happy Customers'    },
      ].map((s2, i) => (
        <div key={i} className="py-10 text-center border-r last:border-r-0
          border-white/10 bg-slate-900">
          <div className="text-3xl md:text-4xl font-black text-white mb-1">
            {s2.val}
          </div>
          <div className="text-slate-400 text-xs uppercase tracking-widest">
            {s2.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#080808] font-sans">

      {/* ── HERO ── Full viewport, split layout */}
      <section className="min-h-[92vh] grid lg:grid-cols-2">

        {/* Left — Content */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20
          py-20 bg-white dark:bg-[#0d0d0d]">

          {/* Logo row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-12"
          >
            <FordLogo height={32} />
            <span className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <FCSLogo  height={30} />
            <span className="ml-2 text-xs font-semibold text-slate-400
              uppercase tracking-widest border border-slate-200
              dark:border-slate-700 px-2 py-1 rounded-md">
              Official Partner
            </span>
          </motion.div>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs font-bold uppercase tracking-[0.2em]
              text-slate-400 mb-4"
          >
            Ford Component Sales — USA
          </motion.p>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl xl:text-7xl font-black
              text-slate-900 dark:text-white leading-[1.05]
              tracking-tight mb-6"
          >
            Scrap
            <br />
            <span className="relative inline-block">
              Vehicle
              {/* Underline accent */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute bottom-1 left-0 w-full h-[6px]
                  bg-slate-200 dark:bg-slate-700 rounded-full
                  origin-left block"
              />
            </span>
            <br />
            <span className="text-slate-400 dark:text-slate-500
              font-light italic">
              Pickup.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-base text-slate-500 dark:text-slate-400
              leading-relaxed max-w-md mb-10"
          >
            Fast, compliant, and eco-responsible scrap pickup for Ford
            vehicles nationwide. Login and schedule in under 2 minutes.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            <Link
              href="/login/requestor"
              className="group flex items-center gap-2
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                px-6 py-3.5 rounded-full font-semibold text-sm
                hover:opacity-90 transition shadow-lg
                shadow-slate-900/20"
            >
              Schedule a Pickup
              <span className="w-5 h-5 rounded-full bg-white/20
                dark:bg-slate-900/20 flex items-center justify-center
                group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-3.5
                rounded-full font-medium text-sm text-slate-600
                dark:text-slate-400
                border border-slate-200 dark:border-slate-700
                hover:bg-slate-50 dark:hover:bg-slate-800/50
                transition"
            >
              Learn More
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {['24hr Response','Eco-Friendly','Ford Certified','500+ Pickups'].map((t,i) => (
              <span key={i} className="flex items-center gap-1.5
                text-xs text-slate-400 dark:text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full
                  bg-slate-300 dark:bg-slate-600" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — Visual Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden lg:flex flex-col justify-between
            bg-slate-900 dark:bg-[#111] p-16 relative overflow-hidden"
        >
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Top — Feature cards */}
          <div className="relative space-y-3">
            {[
              { icon: '🚚', label: 'Fast Pickup',    sub: '24–48 hour guaranteed' },
              { icon: '📋', label: 'Easy Booking',   sub: '3-step simple process'  },
              { icon: '🌿', label: 'Eco Compliant',  sub: 'Responsible disposal'   },
              { icon: '🛡️', label: 'Ford Certified', sub: 'Authorised partner'    },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-4 bg-white/5
                  border border-white/10 rounded-2xl px-5 py-4
                  backdrop-blur-sm"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.label}
                  </p>
                  <p className="text-slate-400 text-xs">{item.sub}</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full
                  bg-emerald-400 animate-pulse" />
              </motion.div>
            ))}
          </div>

          {/* Bottom — CTA mini card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="relative bg-white rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <FordLogo height={22} />
              <span className="w-px h-5 bg-slate-200" />
              <FCSLogo  height={20} />
            </div>
            <p className="text-slate-800 font-bold text-lg mb-1">
              Ready to schedule?
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Login to request a pickup instantly.
            </p>
            <Link
              href="/login/requestor"
              className="block w-full text-center bg-slate-900
                text-white text-sm font-semibold py-2.5 rounded-xl
                hover:bg-slate-700 transition"
            >
              Get Started →
            </Link>
          </motion.div>
        </motion.div>

      </section>

      {/* ── STATS BAR ── */}
      <StatsBar />

      {/* ── HOW IT WORKS ── Timeline style */}
      <section id="how-it-works"
        className="py-28 bg-white dark:bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 flex flex-col md:flex-row
              md:items-end justify-between gap-6"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]
                text-slate-400 mb-3">
                How It Works
              </p>
              <h2 className="text-4xl md:text-5xl font-black
                text-slate-900 dark:text-white leading-tight">
                Three steps.<br />
                <span className="text-slate-400 font-light italic">
                  {`That's all.`}
                </span>
              </h2>
            </div>
            <Link
              href="/login/requestor"
              className="flex-shrink-0 inline-flex items-center gap-2
                bg-slate-900 dark:bg-white text-white dark:text-slate-900
                px-5 py-3 rounded-full text-sm font-semibold
                hover:opacity-90 transition"
            >
              Start Now →
            </Link>
          </motion.div>

          {/* Steps — horizontal timeline on desktop */}
          <div className="relative">

            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[4%]
              right-[4%] h-px bg-slate-100 dark:bg-slate-800" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  n:     '01',
                  icon:  '🔐',
                  title: 'Login',
                  desc:  'Sign in to your account to access the pickup portal.',
                  href:  '/login/requestor',
                },
                {
                  n:     '02',
                  icon:  '📋',
                  title: 'Fill The Form',
                  desc:  'Enter vehicle details, location, and preferred pickup time.',
                  href:  null,
                },
                {
                  n:     '03',
                  icon:  '🚚',
                  title: 'Pickup Done',
                  desc:  'Our team handles everything — pickup, docs, disposal.',
                  href:  null,
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  {/* Step badge */}
                  <div className="w-16 h-16 rounded-2xl
                    bg-slate-900 dark:bg-white
                    text-white dark:text-slate-900
                    flex items-center justify-center
                    text-2xl mb-6 relative z-10
                    group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>

                  <span className="text-[80px] font-black
                    text-slate-50 dark:text-white/[0.03]
                    absolute -top-2 right-0 leading-none select-none">
                    {s.n}
                  </span>

                  <p className="text-xs font-bold text-slate-400
                    uppercase tracking-widest mb-2">
                    Step {s.n}
                  </p>
                  <h3 className="text-xl font-black text-slate-900
                    dark:text-white mb-3">
                    {s.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400
                    text-sm leading-relaxed mb-4">
                    {s.desc}
                  </p>
                  {s.href && (
                    <Link
                      href={s.href}
                      className="text-sm font-semibold text-slate-900
                        dark:text-white underline underline-offset-4
                        hover:opacity-70 transition"
                    >
                      Login Now →
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── Bento grid */}
      <section id="why-us"
        className="py-28 bg-[#f8f9fa] dark:bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em]
              text-slate-400 mb-3">
              Why Choose Us
            </p>
            <h2 className="text-4xl md:text-5xl font-black
              text-slate-900 dark:text-white">
              Built for Ford.<br />
              <span className="text-slate-400 font-light italic">
                Trusted by hundreds.
              </span>
            </h2>
          </motion.div>

          {/* Bento grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-4
            auto-rows-[160px] gap-4">

            {/* Large card — spans 2 cols 2 rows */}
            <motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  className="col-span-1 row-span-1 bg-slate-900
    dark:bg-white/5 rounded-3xl p-6 flex flex-col
    justify-between border border-slate-800
    hover:border-slate-600 transition"
>
  <span className="text-3xl">🏆</span>
  <div>
    <h3 className="text-base font-black text-white mb-1">
      Ford Authorised
    </h3>
    <p className="text-slate-400 text-xs leading-relaxed">
      Officially certified Ford scrap collection partner
      across all major US states.
    </p>
  </div>
</motion.div>

            {[
              { icon: '🚚', title: 'Fast Pickup',    desc: '24–48hr response'       },
              { icon: '🌿', title: 'Eco-Friendly',   desc: 'Responsible recycling'  },
              { icon: '💰', title: 'Best Rates',     desc: 'No hidden fees'         },
              { icon: '📄', title: 'Full Docs',      desc: 'Paperwork handled'      },
              { icon: '🕐', title: '24/7 Support',   desc: 'Always available'       },
              { icon: '🛡️', title: 'Safe Process',  desc: 'Fully insured'         },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-white/[0.03]
                  border border-slate-100 dark:border-white/10
                  rounded-3xl p-5 flex flex-col justify-between
                  hover:border-slate-300 dark:hover:border-white/20
                  hover:shadow-lg transition duration-300 group"
              >
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900
                    dark:text-white text-sm mb-0.5">
                    {f.title}
                  </h3>
                  <p className="text-slate-400 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* ── CONTACT ── Modern two-panel */}
      <section id="contact"
        className="py-28 bg-white dark:bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left — Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase
                  tracking-[0.2em] text-slate-400 mb-4">
                  Get In Touch
                </p>
                <h2 className="text-4xl md:text-5xl font-black
                  text-slate-900 dark:text-white mb-6 leading-tight">
                  Have a question?<br />
                  <span className="text-slate-400 font-light italic">
                    We&apos;re here.
                  </span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400
                  text-sm leading-relaxed mb-10 max-w-sm">
                  Reach out to our team directly or schedule
                  a pickup through the portal.
                </p>
              </div>

              {/* Contact tiles */}
              <div className="space-y-3">
                {[
                  {
                    icon:  '👤',
                    label: 'Michelle Ridenour',
                    sub:   'Ford Component Sales — USA',
                    href:  null,
                  },
                  {
                    icon:  '📧',
                    label: 'mrideno2@ford.com',
                    sub:   'Personal contact',
                    href:  'mailto:mrideno2@ford.com',
                  },
                  {
                    icon:  '📧',
                    label: 'fcscats@ford.com',
                    sub:   'CATS team',
                    href:  'mailto:fcscats@ford.com',
                  },
                  {
                    icon:  '📧',
                    label: 'fcsmktg@ford.com',
                    sub:   'Marketing team',
                    href:  'mailto:fcsmktg@ford.com',
                  },
                ].map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4
                      bg-slate-50 dark:bg-white/[0.03]
                      border border-slate-100 dark:border-white/10
                      rounded-2xl px-5 py-4
                      hover:border-slate-200 dark:hover:border-white/20
                      transition group"
                  >
                    <span className="text-xl w-10 h-10 rounded-xl
                      bg-white dark:bg-white/10 flex items-center
                      justify-center flex-shrink-0 shadow-sm">
                      {c.icon}
                    </span>
                    <div className="min-w-0">
                      {c.href ? (
                        <a href={c.href}
                           className="block text-sm font-semibold
                             text-slate-900 dark:text-white truncate
                             hover:underline">
                          {c.label}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold
                          text-slate-900 dark:text-white">
                          {c.label}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">{c.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Coverage pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Michigan','Texas','California','Florida','New York','+ More'].map((s,i) => (
                  <span key={i} className="text-xs font-medium
                    bg-slate-100 dark:bg-white/5
                    text-slate-500 dark:text-slate-400
                    px-3 py-1.5 rounded-full border
                    border-slate-200 dark:border-white/10">
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — CTA dark panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 rounded-3xl p-10 flex
                flex-col justify-between min-h-[500px]
                border border-slate-800"
            >
              <div>
                {/* Logos on white pill */}
                <div className="inline-flex items-center gap-3
                  bg-white rounded-xl px-4 py-2 mb-8">
                  <FordLogo height={22} />
                  <span className="w-px h-5 bg-slate-200" />
                  <FCSLogo  height={20} />
                </div>

                <h3 className="text-3xl font-black text-white mb-3">
                  Ready to start?
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Login and schedule a scrap vehicle pickup.
                  We handle everything — paperwork, logistics, disposal.
                </p>

                <Link
                  href="/login/requestor"
                  className="flex items-center justify-center gap-2
                    bg-white text-slate-900 py-4 rounded-2xl
                    font-bold text-sm hover:bg-slate-100
                    transition mb-4"
                >
                  🔐 Schedule a Pickup
                </Link>

                {/* Mini contact list */}
                <div className="bg-white/5 border border-white/10
                  rounded-2xl p-5 space-y-3">
                  <p className="text-slate-500 text-[10px] font-bold
                    uppercase tracking-widest">
                    Direct Contact
                  </p>
                  {[
                    { icon: '👤', text: 'Michelle Ridenour',  href: null },
                    { icon: '📧', text: 'mrideno2@ford.com',  href: 'mailto:mrideno2@ford.com' },
                    { icon: '📧', text: 'fcscats@ford.com',   href: 'mailto:fcscats@ford.com'  },
                    { icon: '📧', text: 'fcsmktg@ford.com',   href: 'mailto:fcsmktg@ford.com'  },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-base">{r.icon}</span>
                      {r.href
                        ? <a href={r.href}
                             className="text-slate-300 text-xs
                               hover:text-white transition">
                            {r.text}
                          </a>
                        : <span className="text-white text-xs font-semibold">
                            {r.text}
                          </span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  signIn('google', { callbackUrl: '/admin/dashboard' })
                }
                className="mt-6 text-slate-500 hover:text-slate-300
                  text-xs font-medium transition text-left"
              >
                Admin Login →
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-white pt-16 pb-8
        border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-white rounded-lg px-3 py-1.5">
                  <FordLogo height={20} />
                </div>
                <span className="w-px h-5 bg-white/20" />
                <div className="bg-white rounded-lg px-3 py-1.5">
                  <FCSLogo  height={18} />
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed
                max-w-xs mb-4">
                Professional scrap vehicle pickup for Ford dealers and
                fleet operators across the United States.
              </p>
              <span className="inline-flex items-center gap-2
                text-xs text-slate-500 border border-white/10
                rounded-full px-3 py-1">
                🌿 Eco-Certified Service
              </span>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest
                text-slate-500 mb-5">
                Navigation
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {[
                  { l: 'How It Works',  h: '#how-it-works' },
                  { l: 'Why Choose Us', h: '#why-us'       },
                  { l: 'Contact Us',    h: '#contact'      },
                ].map(x => (
                  <li key={x.l}>
                    <Link href={x.h}
                      className="hover:text-white transition">
                      {x.l}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      signIn('google', { callbackUrl: '/admin/dashboard' })
                    }
                    className="hover:text-white transition text-sm
                      text-slate-400"
                  >
                    Admin Login
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest
                text-slate-500 mb-5">
                Contact
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="text-white font-medium">
                  Michelle Ridenour
                </li>
                {[
                  'mrideno2@ford.com',
                  'fcscats@ford.com',
                  'fcsmktg@ford.com',
                ].map(e => (
                  <li key={e}>
                    <a href={`mailto:${e}`}
                       className="hover:text-white transition">
                      {e}
                    </a>
                  </li>
                ))}
                <li>📍 Pan United States</li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/5 pt-8 flex
            flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} Ford Component Sales. All rights reserved.
            </p>
            <p className="text-slate-600 text-xs">
              An Official Ford Authorised Partner
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
