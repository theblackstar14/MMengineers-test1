import type { Alerta } from '@/lib/types/database'

interface Props {
  alertas: Alerta[]
}

// Badge config by tipo or prioridad
type AlertaDisplay = {
  titulo: string
  descripcion: string
  border: string
  badge: string
  badgeStyle: string
}

const MOCK_ALERTAS: AlertaDisplay[] = [
  {
    titulo: 'Saneamiento Lima Sur — atraso 18 días',
    descripcion: 'Avance real 31% vs 49% programado',
    border: '#EF4444',
    badge: 'CRÍTICO',
    badgeStyle: 'bg-red-900/50 text-red-400 border border-red-700/40',
  },
  {
    titulo: 'Garantía vence en 7 días — Puente Lurín',
    descripcion: 'Renovar carta fianza por S/. 470K',
    border: '#F97316',
    badge: 'URGENTE',
    badgeStyle: 'bg-orange-900/50 text-orange-400 border border-orange-700/40',
  },
  {
    titulo: '3 valorizaciones pendientes de cobro',
    descripcion: 'Total: S/. 1.2M · MTC, SEDAPAL, Reg. Ica',
    border: '#3B82F6',
    badge: 'COBROS',
    badgeStyle: 'bg-blue-900/50 text-blue-400 border border-blue-700/40',
  },
  {
    titulo: 'Licitación Carretera Ancón — cierra hoy',
    descripcion: 'Monto referencial S/. 12.4M',
    border: '#A855F7',
    badge: 'LICITACIÓN',
    badgeStyle: 'bg-purple-900/50 text-purple-400 border border-purple-700/40',
  },
  {
    titulo: 'Puente Río Lurín — 88% completado',
    descripcion: 'Entrega estimada: 15 Ago 2025',
    border: '#22C55E',
    badge: 'INFO',
    badgeStyle: 'bg-green-900/50 text-green-400 border border-green-700/40',
  },
]

function toDisplay(a: Alerta): AlertaDisplay {
  // Map DB alerta tipo → display
  const TYPE_MAP: Record<string, Omit<AlertaDisplay, 'titulo' | 'descripcion'>> = {
    garantia_vencimiento: {
      border: '#F97316',
      badge: 'URGENTE',
      badgeStyle: 'bg-orange-900/50 text-orange-400 border border-orange-700/40',
    },
    valorizacion_pendiente: {
      border: '#3B82F6',
      badge: 'COBROS',
      badgeStyle: 'bg-blue-900/50 text-blue-400 border border-blue-700/40',
    },
    licitacion: {
      border: '#A855F7',
      badge: 'LICITACIÓN',
      badgeStyle: 'bg-purple-900/50 text-purple-400 border border-purple-700/40',
    },
  }
  const PRIORIDAD_MAP: Record<string, Omit<AlertaDisplay, 'titulo' | 'descripcion'>> = {
    alta:  { border: '#EF4444', badge: 'CRÍTICO',  badgeStyle: 'bg-red-900/50 text-red-400 border border-red-700/40' },
    media: { border: '#F97316', badge: 'URGENTE',  badgeStyle: 'bg-orange-900/50 text-orange-400 border border-orange-700/40' },
    baja:  { border: '#22C55E', badge: 'INFO',     badgeStyle: 'bg-green-900/50 text-green-400 border border-green-700/40' },
  }

  const style = TYPE_MAP[a.tipo] ?? PRIORIDAD_MAP[a.prioridad]
  return {
    titulo: a.titulo,
    descripcion: a.descripcion ?? '',
    ...style,
  }
}

export function AlertasPanel({ alertas }: Props) {
  const items: AlertaDisplay[] = alertas.length > 0
    ? alertas.map(toDisplay)
    : MOCK_ALERTAS

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
          style={{
            backgroundColor: '#0F1623',
            borderLeft: `4px solid ${item.border}`,
          }}
        >
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white leading-snug truncate">
              {item.titulo}
            </p>
            {item.descripcion && (
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                {item.descripcion}
              </p>
            )}
          </div>

          {/* Badge */}
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase tracking-wide ${item.badgeStyle}`}
          >
            {item.badge}
          </span>
        </div>
      ))}
    </div>
  )
}
