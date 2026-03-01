'use client'

// ─── Shimmer Animation Wrapper ────────────────────────
function Shimmer({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      {children}
      <div className="
        absolute inset-0
        -translate-x-full
        animate-[shimmer_1.5s_infinite]
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
      " />
    </div>
  )
}

// ─── Navbar Skeleton ──────────────────────────────────
export function NavbarSkeleton() {
  return (
    <div className="
      sticky top-0 z-50
      bg-[#1B4332] h-20
      flex items-center
      px-8 justify-between
    ">
      <div className="flex items-center gap-4">
        <Shimmer>
          <div className="
            w-24 h-10 rounded-xl
            bg-white/20
          " />
        </Shimmer>
        <div className="h-10 w-px bg-white/20" />
        <Shimmer>
          <div className="
            w-24 h-10 rounded-xl
            bg-white/20
          " />
        </Shimmer>
      </div>
      <div className="flex items-center gap-6">
        <Shimmer>
          <div className="w-20 h-4 rounded bg-white/20" />
        </Shimmer>
        <Shimmer>
          <div className="w-20 h-4 rounded bg-white/20" />
        </Shimmer>
        <Shimmer>
          <div className="w-24 h-9 rounded-lg bg-white/20" />
        </Shimmer>
      </div>
    </div>
  )
}

// ─── Hero Skeleton ────────────────────────────────────
export function HeroSkeleton() {
  return (
    <div className="
      bg-gradient-to-br
      from-[#1B4332] via-[#2D6A4F] to-[#1B4332]
      py-28 px-8
    ">
      <div className="
        max-w-7xl mx-auto
        flex flex-col lg:flex-row
        items-center gap-12
      ">
        {/* Left */}
        <div className="flex-1 space-y-6">
          <Shimmer>
            <div className="
              w-48 h-6 rounded-full
              bg-white/20
            " />
          </Shimmer>
          <div className="space-y-3">
            <Shimmer>
              <div className="w-3/4 h-12 rounded-xl bg-white/20" />
            </Shimmer>
            <Shimmer>
              <div className="w-1/2 h-12 rounded-xl bg-white/20" />
            </Shimmer>
          </div>
          <div className="space-y-2">
            <Shimmer>
              <div className="w-full h-4 rounded bg-white/20" />
            </Shimmer>
            <Shimmer>
              <div className="w-4/5 h-4 rounded bg-white/20" />
            </Shimmer>
            <Shimmer>
              <div className="w-3/4 h-4 rounded bg-white/20" />
            </Shimmer>
          </div>
          <div className="flex gap-4">
            <Shimmer>
              <div className="w-36 h-12 rounded-xl bg-white/20" />
            </Shimmer>
            <Shimmer>
              <div className="w-36 h-12 rounded-xl bg-white/20" />
            </Shimmer>
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 max-w-md w-full">
          <Shimmer>
            <div className="
              w-full h-80 rounded-3xl
              bg-white/10
            " />
          </Shimmer>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Skeleton ───────────────────────────────────
export function StatsSkeleton() {
  return (
    <div className="py-16 bg-white">
      <div className="
        max-w-7xl mx-auto px-8
        grid grid-cols-2 md:grid-cols-4 gap-6
      ">
        {[...Array(4)].map((_, i) => (
          <Shimmer key={i}>
            <div className="
              h-36 rounded-2xl
              bg-gray-100
            " />
          </Shimmer>
        ))}
      </div>
    </div>
  )
}

// ─── Card Skeleton ─────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="
      bg-white rounded-2xl
      border-2 border-gray-100
      p-6 space-y-4
    ">
      <Shimmer>
        <div className="
          w-16 h-16 rounded-2xl
          bg-gray-100 mx-auto
        " />
      </Shimmer>
      <Shimmer>
        <div className="
          w-3/4 h-5 rounded
          bg-gray-100 mx-auto
        " />
      </Shimmer>
      <div className="space-y-2">
        <Shimmer>
          <div className="w-full h-3 rounded bg-gray-100" />
        </Shimmer>
        <Shimmer>
          <div className="w-4/5 h-3 rounded bg-gray-100 mx-auto" />
        </Shimmer>
      </div>
    </div>
  )
}

// ─── Full Page Skeleton ───────────────────────────────
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <NavbarSkeleton />
      <HeroSkeleton />
      <StatsSkeleton />
      <div className="
        py-16 bg-gray-50 px-8
        max-w-7xl mx-auto
        grid grid-cols-1 md:grid-cols-3 gap-8
      ">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-3">
        {[...Array(5)].map((_, i) => (
          <Shimmer key={i}>
            <div className="h-4 rounded bg-gray-200" />
          </Shimmer>
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="
            grid grid-cols-5 gap-4
            px-4 py-4 bg-white
            rounded-xl border border-gray-100
          "
        >
          {[...Array(5)].map((_, j) => (
            <Shimmer key={j}>
              <div className={`
                h-4 rounded bg-gray-100
                ${j === 0 ? 'w-3/4' : 'w-full'}
              `} />
            </Shimmer>
          ))}
        </div>
      ))}
    </div>
  )
}