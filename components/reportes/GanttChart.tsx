'use client'

const MONTHS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// startCol/endCol are 1-indexed month positions
const projects = [
  { name: 'Carretera Ruta 5',   start: 3, end: 12, pct: 72,  alert: false, color: '#22C55E', planned: 80 },
  { name: 'Saneam. Lima Sur',   start: 3, end: 9,  pct: 31,  alert: true,  color: '#EF4444', planned: 55 },
  { name: 'Puente Río Lurín',   start: 1, end: 6,  pct: 88,  alert: false, color: '#22C55E', planned: 90 },
  { name: 'Edificio Sede',      start: 4, end: 10, pct: 45,  alert: false, color: '#3B82F6', planned: 50 },
  { name: 'Cons. Hidráulica',   start: 3, end: 11, pct: 60,  alert: false, color: '#EAB308', planned: 65 },
]

export function GanttChart() {
  return (
    <div className="h-full flex flex-col">
      {/* Month headers */}
      <div className="flex mb-1">
        <div className="w-28 shrink-0" />
        <div className="flex-1 grid grid-cols-12 gap-0">
          {MONTHS.map((m, i) => (
            <div
              key={i}
              className="text-center text-[9px] font-medium"
              style={{ color: '#475569' }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Project rows */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {projects.map((proj) => {
          const barWidth = ((proj.end - proj.start + 1) / 12) * 100
          const barLeft = ((proj.start - 1) / 12) * 100
          const filledWidth = (proj.pct / 100) * barWidth
          const plannedWidth = (proj.planned / 100) * barWidth

          return (
            <div key={proj.name} className="flex items-center gap-1">
              <div className="w-28 shrink-0 text-[9px] text-gray-400 truncate pr-1">{proj.name}</div>
              <div className="flex-1 relative h-5 rounded" style={{ backgroundColor: '#0F1623' }}>
                {/* Bar background */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded"
                  style={{
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    backgroundColor: proj.color + '20',
                    border: `1px solid ${proj.color}40`,
                  }}
                />
                {/* Filled progress */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded"
                  style={{
                    left: `${barLeft}%`,
                    width: `${filledWidth}%`,
                    backgroundColor: proj.color + 'BB',
                  }}
                />
                {/* Planned dashed line */}
                <div
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    left: `${barLeft + plannedWidth}%`,
                    backgroundColor: '#F8FAFC',
                    opacity: 0.5,
                    borderLeft: '1px dashed #F8FAFC',
                  }}
                />
                {/* % label inside bar */}
                <div
                  className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: `${barLeft + filledWidth / 2}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-[8px] font-bold text-white whitespace-nowrap">
                    {proj.pct}%
                    {proj.alert && (
                      <span className="ml-1 text-red-400">•Alerta</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1.5 border-t text-[8px] text-gray-600" style={{ borderColor: '#1E293B' }}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1.5 rounded" style={{ backgroundColor: '#22C55E' }} />
          Avance real
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dashed border-white/50" />
          Programado
        </span>
      </div>
    </div>
  )
}
