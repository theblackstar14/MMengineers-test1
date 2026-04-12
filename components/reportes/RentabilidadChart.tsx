'use client'

const projects = [
  { name: 'Carretera Ruta 5', presup: 'S/.5.24M', pct: +17.2, barW: 85,  color: '#22C55E' },
  { name: 'Puente Lurín',     presup: 'S/.4.7M',  pct: +14.5, barW: 72,  color: '#22C55E' },
  { name: 'Edificio Sede',    presup: 'S/.5.1M',  pct: +10.0, barW: 50,  color: '#22C55E' },
  { name: 'Cons. Hidráulica', presup: 'S/.1.18M', pct: +13.9, barW: 69,  color: '#22C55E' },
  { name: 'Saneam. Lima Sur', presup: 'S/.3.2M',  pct:  -3.1, barW: 15,  color: '#EF4444' },
]

export function RentabilidadChart() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 flex-1">
        {projects.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-gray-400 truncate">{p.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] text-gray-600">{p.presup}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: p.pct >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {p.pct >= 0 ? '+' : ''}{p.pct}%
                </span>
              </div>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: '#1E293B' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.barW}%`, backgroundColor: p.color + 'CC' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex justify-end items-center gap-2 pt-2 border-t mt-2"
        style={{ borderColor: '#1E293B' }}
      >
        <span className="text-[9px] text-gray-500">Margen promedio ponderado:</span>
        <span className="text-base font-bold" style={{ color: '#EAB308' }}>+14.3%</span>
      </div>
    </div>
  )
}
