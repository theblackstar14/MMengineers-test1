const P = ({ w, h = 'h-3' }: { w: string; h?: string }) => (
  <div className={`${h} ${w} rounded animate-pulse`} style={{ backgroundColor: '#1E293B' }} />
)

export default function MovimientosLoading() {
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 shrink-0">
          <P w="w-48" h="h-7" />
          <P w="w-64" />
        </div>
        {/* Month pills skeleton */}
        <div className="flex gap-1.5 flex-1 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <P key={i} w="w-12" h="h-8" />
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <P w="w-40" h="h-9" />
          <P w="w-32" h="h-9" />
        </div>
      </div>

      {/* KPI Strip */}
      <div
        className="grid grid-cols-7 divide-x rounded-xl overflow-hidden border"
        style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-1.5">
            <P w="w-20" h="h-2.5" />
            <P w="w-14" h="h-6" />
            <P w="w-16" h="h-2.5" />
          </div>
        ))}
      </div>

      {/* Main table card */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
        {/* Table header */}
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1E293B' }}>
          <div className="space-y-1.5">
            <P w="w-48" h="h-4" />
            <P w="w-72" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <P key={i} w="w-20" h="h-7" />
            ))}
          </div>
        </div>
        {/* Filter tabs */}
        <div className="px-4 py-2 border-b flex gap-2" style={{ borderColor: '#1E293B' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <P key={i} w="w-20" h="h-7" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: '#1E293B' }}>
            <P w="w-6" h="h-6" />
            <P w="w-16" />
            <P w="w-48" />
            <P w="w-24" h="h-5" />
            <P w="w-20" />
            <P w="w-20" />
            <P w="w-24" />
            <P w="w-20" />
            <P w="w-20" />
            <P w="w-16" />
            <P w="w-20" />
            <P w="w-20" h="h-5" />
          </div>
        ))}
        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between">
          <P w="w-40" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <P key={i} w="w-8" h="h-8" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <P key={i} w="w-20" h="h-5" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
            <div className="space-y-1">
              <P w="w-40" h="h-3" />
              <P w="w-56" h="h-2.5" />
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <P w="w-2" h="h-2" />
                  <P w="w-32" />
                </div>
                <P w="w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}
