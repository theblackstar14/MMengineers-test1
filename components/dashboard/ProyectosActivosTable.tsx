import Link from 'next/link'
import {
  formatSoles, formatFecha,
  getColorEstadoProyecto, getLabelEstadoProyecto, getLabelTipoProyecto,
  cn
} from '@/lib/utils'
import type { ProyectoResumen } from '@/lib/types/database'
import { ArrowRight, MapPin } from 'lucide-react'

interface Props {
  proyectos: ProyectoResumen[]
}

export function ProyectosActivosTable({ proyectos }: Props) {
  if (proyectos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-600">
        <span className="text-sm">Sin proyectos activos</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="erp-table">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Tipo</th>
            <th>Avance</th>
            <th>Monto contrato</th>
            <th>Fin contractual</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {proyectos.map(p => {
            const avance = p.avance_fisico_pct
            const barColor = avance >= 70
              ? '#22C55E'
              : avance >= 40
              ? '#EAB308'
              : '#EF4444'

            return (
              <tr key={p.id}>
                {/* Nombre */}
                <td>
                  <div className="font-medium text-white text-sm truncate max-w-[200px]">
                    {p.nombre}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-600">
                    <span className="font-mono">{p.codigo}</span>
                    {p.ubicacion && (
                      <>
                        <span>·</span>
                        <MapPin size={10} />
                        <span className="truncate max-w-[120px]">{p.ubicacion}</span>
                      </>
                    )}
                  </div>
                </td>

                {/* Tipo */}
                <td>
                  <span className="text-xs text-gray-500">
                    {getLabelTipoProyecto(p.tipo)}
                  </span>
                </td>

                {/* Avance */}
                <td>
                  <div className="w-28">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{avance.toFixed(0)}%</span>
                      <span className="text-gray-600">{p.avance_financiero_pct.toFixed(0)}% fin.</span>
                    </div>
                    <div className="erp-progress">
                      <div
                        className="erp-progress-bar"
                        style={{ width: `${avance}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </td>

                {/* Monto */}
                <td>
                  <div className="text-sm font-medium text-white">
                    {formatSoles(p.monto_contrato + p.monto_adicionales, true)}
                  </div>
                  {p.monto_adicionales > 0 && (
                    <div className="text-xs text-yellow-600 mt-0.5">
                      +{formatSoles(p.monto_adicionales, true)} adicionales
                    </div>
                  )}
                </td>

                {/* Fecha fin */}
                <td>
                  <div className="text-sm text-gray-300">
                    {formatFecha(p.fecha_fin_contractual)}
                  </div>
                  {p.dias_restantes !== null && (
                    <div className={cn(
                      'text-xs mt-0.5',
                      p.dias_restantes < 30 ? 'text-red-400' :
                      p.dias_restantes < 90 ? 'text-yellow-400' : 'text-gray-600'
                    )}>
                      {p.dias_restantes > 0
                        ? `${p.dias_restantes} días restantes`
                        : 'Vencido'}
                    </div>
                  )}
                </td>

                {/* Estado */}
                <td>
                  <span className={cn('erp-badge text-xs', getColorEstadoProyecto(p.estado))}>
                    {getLabelEstadoProyecto(p.estado)}
                  </span>
                </td>

                {/* Acción */}
                <td>
                  <Link
                    href={`/proyectos/${p.id}`}
                    className="text-gray-600 hover:text-yellow-400 transition-colors"
                  >
                    <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
