const P = ({ w, h = 'h-3' }: { w: string; h?: string }) => (
  <div className={`${h} ${w} rounded animate-pulse`} style={{ backgroundColor: '#1E293B' }} />
)

export default function FinanzasLoading() {
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <P key={i} w="w-24" h="h-7" />
            ))}
          </div>
          <P w="w-32" h="h-7" />
          <P w="w-48" />
        </div>
        <P w="w-32" h="h-9" />
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

      {/* Tesorería */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
          <P w="w-72" h="h-3" />
        </div>
        <div className="grid grid-cols-4 divide-x" style={{ borderColor: '#1E293B' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <P w="w-9 h-9" h="h-9" />
                <div className="space-y-1.5 flex-1">
                  <P w="w-3/4" h="h-3" />
                  <P w="w-1/2" h="h-2.5" />
                </div>
              </div>
              <P w="w-2/3" h="h-7" />
              <P w="w-full" h="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
            <P w="w-40" h="h-3" />
            <P w="w-full" h="h-1.5" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="flex justify-between">
                  <P w="w-1/2" h="h-3" />
                  <P w="w-16" h="h-3" />
                </div>
                <P w="w-full" h="h-1" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <P w="w-40" h="h-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between py-1.5">
              <P w="w-1/3" />
              <P w="w-20" />
            </div>
          ))}
        </div>
        <div className="col-span-2 rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="px-4 py-2.5 border-b" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <P w="w-48" h="h-3" />
          </div>
          <div className="grid grid-cols-2 divide-x p-4 gap-4" style={{ borderColor: '#1E293B' }}>
            {[0, 1].map(col => (
              <div key={col} className="space-y-2">
                <P w="w-24" h="h-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <P w="w-1/3" />
                    <P w="w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
