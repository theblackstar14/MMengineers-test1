'use client'

import { useEffect, useRef, useState } from 'react'
import { SankeyDiagram } from './SankeyDiagram'

interface Props {
  onClose: () => void
}

type Filter = 'Todos' | 'Públicos' | 'Privados' | 'Consultoría' | 'Supervisión'
const FILTERS: Filter[] = ['Todos', 'Públicos', 'Privados', 'Consultoría', 'Supervisión']

export function SankeyModal({ onClose }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('Todos')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden animate-fade-in"
        style={{
          width: '95vw',
          maxWidth: '1200px',
          height: '90vh',
          backgroundColor: '#0B0F1A',
          border: '1px solid rgba(234,179,8,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="px-6 py-4 border-b flex-none"
          style={{ borderColor: '#1E293B' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">
                Flujo Financiero de Proyectos
              </h2>
              <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                Diagrama Sankey · Periodo: Enero – Junio 2025 · S/. 9,300,000
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: '#0F1623',
                border: '1px solid #1E293B',
                color: '#94A3B8',
              }}
            >
              <span className="text-base leading-none">×</span> Cerrar
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={
                  activeFilter === f
                    ? { backgroundColor: '#EAB308', color: '#0F1623' }
                    : {
                        backgroundColor: '#0F1623',
                        border: '1px solid #1E293B',
                        color: '#94A3B8',
                      }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Sankey area */}
        <div className="flex-1 px-6 py-4 overflow-hidden">
          <SankeyDiagram />
        </div>

        {/* Footer bar */}
        <div
          className="border-t px-6 py-3 flex-none grid grid-cols-5 gap-4"
          style={{ borderColor: '#1E293B', backgroundColor: '#080C14' }}
        >
          <div>
            <div className="text-[9px] text-gray-600 mb-0.5">Total flujo</div>
            <div className="text-sm font-bold text-white">S/. 9,300,000</div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 mb-0.5">Mayor fuente</div>
            <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>
              Contrato Público · 52%
            </div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 mb-0.5">Mayor destino</div>
            <div className="text-sm font-semibold" style={{ color: '#EF4444' }}>
              Mano de Obra · 33%
            </div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 mb-0.5">Margen neto</div>
            <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>
              14.0% · S/. 1.3M
            </div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 mb-0.5">Proyectos activos</div>
            <div className="text-sm font-bold text-white">5 proyectos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
