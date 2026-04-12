'use client'

import dynamic from 'next/dynamic'
import {
  formatSoles, formatFecha,
  getColorEstadoProyecto, getLabelEstadoProyecto,
  cn,
} from '@/lib/utils'
import type { ProyectoResumen, HitoProyecto, CurvaS, Garantia } from '@/lib/types/database'
import {
  CheckCircle2, Circle, Clock, AlertTriangle,
  FileText, Users, TrendingUp, TrendingDown,
} from 'lucide-react'

const CurvaSChart = dynamic(
  () => import('./CurvaSChart').then(m => ({ default: m.CurvaSChart })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /></div> }
)

interface Props {
  proyecto: ProyectoResumen
  hitos: HitoProyecto[]
  curvaS: CurvaS[]
  equipo: Array<{ id: string; rol_en_proyecto: string; perfil: { nombre: string; apellido: string; cargo: string | null } | null }>
  garantias: Garantia[]
  documentos: Array<{ id: string; nombre: string; tipo_documento: string | null; created_at: string; url?: string }>
}

const HITO_ICON = {
  completado: <CheckCircle2 size={15} className="text-green-400 shrink-0" />,
  en_proceso: <Clock size={15} className="text-yellow-400 shrink-0 animate-pulse" />,
  pendiente: <Circle size={15} className="text-gray-600 shrink-0" />,
  retrasado: <AlertTriangle size={15} className="text-red-400 shrink-0" />,
}

export function ResumenTab({ proyecto: p, hitos, curvaS, equipo, garantias, documentos }: Props) {
  const hitosCompletados = hitos.filter(h => h.estado === 'completado').length
  const ingresoTotal = p.monto_valorizado ?? 0
  const costoEstimado = (p.monto_contrato + p.monto_adicionales) * (p.avance_financiero_pct / 100)
  const utilidad = ingresoTotal - costoEstimado
  const margen = ingresoTotal > 0 ? (utilidad / ingresoTotal) * 100 : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── Columna izquierda: Curva S + Hitos ── */}
      <div className="lg:col-span-1 space-y-4">

        {/* Curva S */}
        <div className="erp-card">
          <h4 className="text-sm font-semibold text-white mb-3">Curva S — Avance Físico</h4>
          <div style={{ height: '200px' }}>
            <CurvaSChart data={curvaS} />
          </div>
        </div>

        {/* Hitos */}
        <div className="erp-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Hitos del proyecto</h4>
            <span className="text-xs text-gray-500">{hitosCompletados}/{hitos.length}</span>
          </div>
          {hitos.length === 0 ? (
            <p className="text-sm text-gray-600">Sin hitos registrados</p>
          ) : (
            <div className="space-y-2">
              {hitos.map(h => (
                <div key={h.id} className="flex items-center gap-2.5">
                  {HITO_ICON[h.estado]}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-tight', h.estado === 'completado' ? 'text-gray-500 line-through' : 'text-white')}>
                      {h.nombre}
                    </p>
                    {h.fecha_estimada && (
                      <p className="text-xs text-gray-600">{formatFecha(h.fecha_estimada)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna central: Resumen financiero ── */}
      <div className="lg:col-span-1 space-y-4">
        <div className="erp-card">
          <h4 className="text-sm font-semibold text-white mb-4">Resumen financiero</h4>

          {/* Monto principal */}
          <div className="text-center py-3 rounded-xl mb-4" style={{ backgroundColor: '#0F1623' }}>
            <p className="text-3xl font-bold text-white">
              {formatSoles(p.monto_contrato + p.monto_adicionales)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Monto total del contrato</p>
            {p.monto_adicionales > 0 && (
              <p className="text-xs text-yellow-500 mt-0.5">
                Incl. {formatSoles(p.monto_adicionales)} adicionales
              </p>
            )}
          </div>

          {/* Métricas */}
          <div className="space-y-3">
            {[
              { label: 'Valorizado', value: formatSoles(p.monto_valorizado ?? 0), color: 'text-blue-400' },
              { label: 'Cobrado', value: formatSoles(p.monto_cobrado ?? 0), color: 'text-green-400' },
              { label: 'Por cobrar', value: formatSoles((p.monto_valorizado ?? 0) - (p.monto_cobrado ?? 0)), color: 'text-yellow-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#1E293B' }}>
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className={cn('text-sm font-semibold', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Margen */}
          <div className="mt-4 p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#0F1623' }}>
            <div>
              <p className="text-xs text-gray-500">Margen estimado</p>
              <p className={cn('text-xl font-bold mt-0.5', margen >= 0 ? 'text-green-400' : 'text-red-400')}>
                {margen.toFixed(1)}%
              </p>
            </div>
            {margen >= 0
              ? <TrendingUp size={22} className="text-green-400" />
              : <TrendingDown size={22} className="text-red-400" />
            }
          </div>
        </div>

        {/* Garantías activas */}
        {garantias.length > 0 && (
          <div className="erp-card">
            <h4 className="text-sm font-semibold text-white mb-3">Garantías activas</h4>
            <div className="space-y-2">
              {garantias.slice(0, 3).map(g => (
                <div key={g.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white capitalize">
                      {g.tipo.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {g.banco.toUpperCase()} · Vence {formatFecha(g.fecha_vencimiento)}
                    </p>
                  </div>
                  <span className={cn('erp-badge text-xs',
                    g.estado === 'vigente' ? 'text-green-400 bg-green-400/10' :
                    g.estado === 'por_vencer' ? 'text-yellow-400 bg-yellow-400/10' :
                    'text-red-400 bg-red-400/10'
                  )}>
                    {formatSoles(g.monto, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Columna derecha: Equipo + Documentos ── */}
      <div className="lg:col-span-1 space-y-4">

        {/* Equipo */}
        <div className="erp-card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-gray-500" />
            <h4 className="text-sm font-semibold text-white">Equipo del proyecto</h4>
          </div>
          {equipo.length === 0 ? (
            <p className="text-sm text-gray-600">Sin equipo asignado</p>
          ) : (
            <div className="space-y-2.5">
              {equipo.map((m, i) => {
                const perfil = m.perfil
                const initials = perfil
                  ? `${perfil.nombre[0]}${perfil.apellido[0]}`.toUpperCase()
                  : '?'
                return (
                  <div key={m.id ?? i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {perfil ? `${perfil.nombre} ${perfil.apellido}` : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{m.rol_en_proyecto}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Documentos clave */}
        <div className="erp-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-500" />
              <h4 className="text-sm font-semibold text-white">Documentos clave</h4>
            </div>
            <span className="text-xs text-gray-600">{documentos.length}</span>
          </div>
          {documentos.length === 0 ? (
            <p className="text-sm text-gray-600">Sin documentos</p>
          ) : (
            <div className="space-y-2">
              {documentos.slice(0, 5).map(d => (
                <a key={d.id} href={d.url ?? '#'} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2.5 py-1.5 hover:opacity-80 transition-opacity group">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <FileText size={13} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {d.nombre}
                    </p>
                    <p className="text-xs text-gray-600">{d.tipo_documento ?? 'Documento'}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
