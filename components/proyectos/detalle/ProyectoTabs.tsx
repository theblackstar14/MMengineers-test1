'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'resumen',       label: 'Resumen' },
  { key: 'cotizacion',    label: 'Cotización' },
  { key: 'valorizacion',  label: 'Valorización' },
  { key: 'finanzas',      label: 'Finanzas' },
  { key: 'documentos',    label: 'Documentos' },
  { key: 'progreso',      label: 'Progreso' },
]

interface Props {
  proyectoId: string
  tabActivo: string
}

export function ProyectoTabs({ proyectoId, tabActivo }: Props) {
  return (
    <div className="flex items-center gap-0 border-b" style={{ borderColor: '#1E293B' }}>
      {TABS.map(tab => {
        const isActive = tabActivo === tab.key
        return (
          <Link
            key={tab.key}
            href={`/proyectos/${proyectoId}?tab=${tab.key}`}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              isActive
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
