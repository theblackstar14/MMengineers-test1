import { cn, formatFecha } from '@/lib/utils'
import type { Alerta } from '@/lib/types/database'
import { AlertTriangle, Clock, FileCheck, Bell } from 'lucide-react'

interface Props {
  alertas: Alerta[]
}

const TIPO_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  garantia_vencimiento: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  valorizacion_pendiente: {
    icon: FileCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  detraccion: {
    icon: Clock,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
}

const PRIORIDAD_COLORS = {
  alta:  'text-red-400',
  media: 'text-yellow-400',
  baja:  'text-gray-500',
}

export function AlertasPanel({ alertas }: Props) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-600">
        <Bell size={24} className="mb-2 opacity-30" />
        <span className="text-sm">Sin alertas pendientes</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alertas.map(alerta => {
        const config = TIPO_CONFIG[alerta.tipo] ?? {
          icon: Bell,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
        }
        const IconComponent = config.icon

        return (
          <div
            key={alerta.id}
            className="flex gap-3 p-3 rounded-lg border transition-colors hover:border-slate-600"
            style={{ backgroundColor: '#0F1623', borderColor: '#1E293B' }}
          >
            {/* Icono */}
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              config.bg
            )}>
              <IconComponent size={14} className={config.color} />
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white leading-tight">
                  {alerta.titulo}
                </p>
                <span className={cn(
                  'text-[10px] font-semibold uppercase shrink-0',
                  PRIORIDAD_COLORS[alerta.prioridad]
                )}>
                  {alerta.prioridad}
                </span>
              </div>
              {alerta.descripcion && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {alerta.descripcion}
                </p>
              )}
              <p className="text-[10px] text-gray-700 mt-1">
                {formatFecha(alerta.created_at.substring(0, 10), 'relative')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
