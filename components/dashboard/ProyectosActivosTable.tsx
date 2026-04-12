import Link from 'next/link'
import { formatSoles, formatFecha } from '@/lib/utils'

// Simplified row type — page maps DB data to this
export type ProyectoRow = {
  id: string
  nombre: string
  entidad_contratante?: string | null
  avance_fisico_pct: number
  monto_contrato: number
  monto_adicionales: number
  monto_valorizado?: number
  fecha_fin_contractual?: string | null
  estado: string
}

const BADGE: Record<string, { label: string; style: string }> = {
  en_ejecucion:   { label: 'En ejecución', style: 'bg-amber-900/40 text-amber-400 border border-amber-700/30' },
  adjudicado:     { label: 'Por concluir', style: 'bg-green-900/40 text-green-400' },
  en_licitacion:  { label: 'Licitación',   style: 'bg-yellow-900/40 text-yellow-400' },
  paralizado:     { label: 'En riesgo',    style: 'bg-red-900/40 text-red-400' },
  en_liquidacion: { label: 'Liquidación',  style: 'bg-orange-900/40 text-orange-400' },
  liquidado:      { label: 'Completado',   style: 'bg-slate-700 text-gray-400' },
  cerrado:        { label: 'Cerrado',      style: 'bg-slate-800 text-gray-500' },
}

function barColor(avance: number): string {
  if (avance >= 80) return '#22C55E'
  if (avance >= 40) return '#EAB308'
  return '#EF4444'
}

export function ProyectosActivosTable({ proyectos }: { proyectos: ProyectoRow[] }) {
  if (proyectos.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
        Sin proyectos activos
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #1E293B' }}>
            {['PROYECTO', 'CLIENTE', 'AVANCE', 'PRESUPUESTO', 'EJECUTADO', 'FECHA FIN', 'ESTADO'].map(h => (
              <th
                key={h}
                className="pb-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider pr-4 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: '#1E293B' }}>
          {proyectos.map(p => {
            const avance = p.avance_fisico_pct ?? 0
            const presupuesto = (p.monto_contrato ?? 0) + (p.monto_adicionales ?? 0)
            const badge = BADGE[p.estado] ?? { label: p.estado, style: 'bg-slate-700 text-gray-400' }
            return (
              <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                {/* Proyecto */}
                <td className="py-3 pr-4">
                  <div className="font-medium text-white text-[13px] truncate max-w-[160px]">
                    {p.nombre}
                  </div>
                </td>

                {/* Cliente */}
                <td className="py-3 pr-4">
                  <span className="text-[12px] text-gray-400 whitespace-nowrap">
                    {p.entidad_contratante ?? '—'}
                  </span>
                </td>

                {/* Avance */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div
                      className="w-14 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#1E293B' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(avance, 100)}%`, backgroundColor: barColor(avance) }}
                      />
                    </div>
                    <span
                      className="text-[12px] font-semibold whitespace-nowrap"
                      style={{ color: barColor(avance) }}
                    >
                      {avance.toFixed(0)}%
                    </span>
                  </div>
                </td>

                {/* Presupuesto */}
                <td className="py-3 pr-4">
                  <span className="text-[12px] text-gray-200 whitespace-nowrap font-medium">
                    {formatSoles(presupuesto, true)}
                  </span>
                </td>

                {/* Ejecutado */}
                <td className="py-3 pr-4">
                  <span className="text-[12px] text-gray-400 whitespace-nowrap">
                    {p.monto_valorizado != null ? formatSoles(p.monto_valorizado, true) : '—'}
                  </span>
                </td>

                {/* Fecha fin */}
                <td className="py-3 pr-4">
                  <span className="text-[12px] text-gray-400 whitespace-nowrap">
                    {p.fecha_fin_contractual
                      ? new Date(p.fecha_fin_contractual + 'T00:00:00')
                          .toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
                          .replace(/^\w/, c => c.toUpperCase())
                      : '—'}
                  </span>
                </td>

                {/* Estado */}
                <td className="py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${badge.style}`}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
