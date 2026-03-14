'use client'

import { useEffect, Suspense }        from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress                        from 'nprogress'

// ✅ Configure NProgress with Ford brand color
NProgress.configure({
  minimum:     0.15,
  easing:      'ease',
  speed:       400,
  showSpinner: false,
  trickleSpeed: 150,
})

// ✅ Inject custom CSS for Ford green color
const PROGRESS_STYLE = `
  #nprogress .bar {
    background: #52B788 !important;
    height: 3px !important;
  }
  #nprogress .peg {
    box-shadow: 0 0 10px #52B788, 0 0 5px #52B788 !important;
  }
`

// ─── Inner Component ──────────────────────────────
function ProgressBarInner() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // ✅ Inject style once
    if (!document.getElementById('nprogress-style')) {
      const style       = document.createElement('style')
      style.id          = 'nprogress-style'
      style.textContent = PROGRESS_STYLE
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    NProgress.start()
    const timer = setTimeout(() => {
      NProgress.done()
    }, 400)  // ✅ Faster than before (was 500ms)

    return () => {
      clearTimeout(timer)
      NProgress.done()
    }
  }, [pathname, searchParams])

  return null
}

// ─── Main Export ──────────────────────────────────
export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  )
}
