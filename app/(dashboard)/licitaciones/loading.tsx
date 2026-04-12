export default function LicitacionesLoading() {
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-40 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          <div className="h-4 w-56 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-36 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          <div className="h-9 w-40 rounded-lg animate-pulse" style={{ backgroundColor: '#EAB30830' }} />
        </div>
      </div>

      {/* KPI Strip */}
      <div
        className="grid grid-cols-7 divide-x rounded-xl overflow-hidden border"
        style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-1.5" style={{ borderColor: '#1E293B' }}>
            <div className="h-2.5 w-20 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            <div className="h-6 w-10 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            <div className="h-2.5 w-16 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
        <div className="flex gap-1 flex-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          ))}
        </div>
        <div className="h-8 w-40 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
      </div>

      {/* Split View */}
      <div
        className="grid grid-cols-5 rounded-xl overflow-hidden border"
        style={{ borderColor: '#1E293B' }}
      >
        {/* Tabla izquierda */}
        <div className="col-span-3" style={{ backgroundColor: '#0F1623' }}>
          {/* Header cols */}
          <div
            className="h-8 border-b animate-pulse"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          />
          {/* Filas */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 border-b"
              style={{ borderColor: '#1E293B' }}
            >
              <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
                <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              </div>
              <div className="h-5 w-24 rounded-full animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-3 w-14 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-5 w-8 rounded-full animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-5 w-20 rounded-full animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-6 w-6 rounded-full animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            </div>
          ))}
          {/* Footer paginación */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-t"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          >
            <div className="h-3 w-40 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 w-6 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Panel preview derecho */}
        <div
          className="col-span-2 border-l p-4 space-y-4"
          style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
        >
          {/* Header preview */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-4 w-16 rounded-full animate-pulse" style={{ backgroundColor: '#EF444420' }} />
            </div>
            <div className="h-4 w-4/5 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          </div>
          {/* Countdown */}
          <div className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#EF444410', border: '1px solid #EF444425' }} />
          {/* Checklist */}
          <div className="space-y-2">
            <div className="h-3.5 w-32 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: '#1E293B' }} />
                <div className="h-3 flex-1 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              </div>
            ))}
            <div className="h-1.5 w-full rounded-full mt-2 animate-pulse" style={{ backgroundColor: '#1E293B' }} />
          </div>
          {/* Datos clave */}
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-1.5">
                <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
                <div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              </div>
            ))}
          </div>
          {/* Botones */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-9 rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
              <div className="h-9 rounded-lg animate-pulse" style={{ backgroundColor: '#EAB30825' }} />
            </div>
            <div className="h-8 w-full rounded-lg animate-pulse" style={{ backgroundColor: '#8B5CF615' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
