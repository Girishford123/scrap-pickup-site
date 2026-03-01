'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// ─── Dynamic Import To Avoid SSR Issues ──────────────
let NProgress: typeof import('nprogress') | null = null

if (typeof window !== 'undefined') {
  Promise.all([
    import('nprogress'),
    import('nprogress/nprogress.css' as string),
  ]).then(([np]) => {
    NProgress = np.default
    NProgress.configure({
      minimum:     0.3,
      easing:      'ease',
      speed:       500,
      showSpinner: false,
    })
  })
}

// ─── Inner Component ──────────────────────────────────
function ProgressBarInner() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!NProgress) return
    NProgress.start()
    const timer = setTimeout(() => {
      NProgress?.done()
    }, 500)
    return () => {
      clearTimeout(timer)
      NProgress?.done()
    }
  }, [pathname, searchParams])

  return null
}

// ─── Main Export ──────────────────────────────────────
export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  )
}
