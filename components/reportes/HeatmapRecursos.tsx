'use client'

const weeks = ['S0', 'S2', 'S4', 'S6', 'S7', 'S8', 'S9']

const projects = [
  { name: 'Carretera R5',   values: [8, 8, 7, 8, 6, 8, 5] },
  { name: 'Saneam. Lima',   values: [4, 5, 8, 4, 3, 4, 3] },
  { name: '[Puente R.L.]',  values: [8, 7, 6, 8, 7, 6, 5] },
  { name: 'Edificio Sede',  values: [8, 5, 8, 7, 8, 6, 4] },
  { name: 'Cons. Hi.',      values: [3, 4, 3, 4, 4, 3, 2] },
]

function cellStyle(value: number): React.CSSProperties {
  if (value >= 7) return { backgroundColor: 'rgba(249,115,22,0.55)', color: '#FED7AA' }
  if (value >= 4) return { backgroundColor: 'rgba(234,179,8,0.35)', color: '#FDE68A' }
  return { backgroundColor: 'rgba(34,197,94,0.25)', color: '#86EFAC' }
}

export function HeatmapRecursos() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-[9px] border-collapse">
          <thead>
            <tr>
              <th className="w-20 text-left px-1 py-1 text-gray-500 font-medium">Proyecto</th>
              {weeks.map(w => (
                <th key={w} className="text-center px-1 py-1 text-gray-500 font-medium">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.name}>
                <td className="px-1 py-1 text-gray-400 text-[8px] whitespace-nowrap">{proj.name}</td>
                {proj.values.map((v, j) => (
                  <td
                    key={j}
                    className="text-center font-semibold rounded"
                    style={{
                      ...cellStyle(v),
                      padding: '3px 2px',
                      margin: '1px',
                      fontSize: '9px',
                    }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: '#1E293B' }}>
        <span className="text-[9px] text-gray-600">Leyenda:</span>
        <span className="flex items-center gap-1 text-[9px]">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'rgba(34,197,94,0.3)' }}
          />
          <span className="text-gray-500">Bajo ≤3</span>
        </span>
        <span className="flex items-center gap-1 text-[9px]">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'rgba(234,179,8,0.4)' }}
          />
          <span className="text-gray-500">Medio 4-6</span>
        </span>
        <span className="flex items-center gap-1 text-[9px]">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'rgba(249,115,22,0.6)' }}
          />
          <span className="text-gray-500">Alto ≥7</span>
        </span>
      </div>
    </div>
  )
}
