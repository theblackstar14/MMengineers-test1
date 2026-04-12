import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  getProyectoById, getHitosProyecto, getCurvaSProyecto,
  getEquipoProyecto, getValorizacionesProyecto, getGarantiasProyecto,
  getMovimientosProyecto, getCotizacionesProyecto, getDocumentosProyecto,
} from '@/lib/queries/proyectos'
import { ProyectoTabs } from '@/components/proyectos/detalle/ProyectoTabs'
import { ResumenTab } from '@/components/proyectos/detalle/ResumenTab'
import {
  formatSoles, formatFecha,
  getColorEstadoProyecto, getLabelEstadoProyecto, getLabelTipoProyecto, cn,
} from '@/lib/utils'
import {
  ChevronRight, Pencil, CalendarDays,
  TrendingUp, Clock, CheckSquare, DollarSign, FileText,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const proyecto = await getProyectoById(id)
  return { title: proyecto ? `${proyecto.nombre} — MMHIGHMETRIK ERP` : 'Proyecto' }
}

export default async function ProyectoDetallePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = 'resumen' } = await searchParams

  const proyecto = await getProyectoById(id)
  if (!proyecto) notFound()

  // Carga paralela según tab activo
  const [hitos, curvaS, equipo, valorizaciones, garantias, movimientos, cotizaciones, documentos] =
    await Promise.all([
      getHitosProyecto(id),
      getCurvaSProyecto(id),
      getEquipoProyecto(id),
      getValorizacionesProyecto(id),
      getGarantiasProyecto(id),
      getMovimientosProyecto(id),
      getCotizacionesProyecto(id),
      getDocumentosProyecto(id),
    ])

  const p = proyecto
  const avance = p.avance_fisico_pct ?? 0
  const montoTotal = p.monto_contrato + p.monto_adicionales
  const hitosCompletados = hitos.filter(h => h.estado === 'completado').length
  const avanceColor = avance >= 70 ? '#22C55E' : avance >= 40 ? '#EAB308' : '#EF4444'

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/proyectos" className="hover:text-gray-300 transition-colors">Proyectos</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300 font-medium">{p.nombre}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{p.nombre}</h1>
            <span className={cn('erp-badge text-sm', getColorEstadoProyecto(p.estado))}>
              {getLabelEstadoProyecto(p.estado)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {p.codigo} · {getLabelTipoProyecto(p.tipo)}
            {p.entidad_contratante && ` · ${p.entidad_contratante}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="erp-btn-secondary">
            <Pencil size={13} />
            Editar
          </button>
        </div>
      </div>

      {/* ── Barra de métricas horizontal ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Monto contrato */}
        <div className="erp-card md:col-span-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto contrato</p>
          <p className="text-xl font-bold text-white">{formatSoles(montoTotal, true)}</p>
          {p.monto_adicionales > 0 && (
            <p className="text-xs text-yellow-500 mt-0.5">+{formatSoles(p.monto_adicionales, true)} adic.</p>
          )}
        </div>

        {/* Valorizado */}
        <div className="erp-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valorizado</p>
          <p className="text-xl font-bold text-blue-400">{formatSoles(p.monto_valorizado ?? 0, true)}</p>
        </div>

        {/* Avance */}
        <div className="erp-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avance</p>
          <div className="flex items-end gap-1.5">
            <p className="text-xl font-bold" style={{ color: avanceColor }}>{avance.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mb-0.5">físico</p>
          </div>
          <div className="erp-progress mt-1.5">
            <div className="erp-progress-bar" style={{ width: `${avance}%`, backgroundColor: avanceColor }} />
          </div>
        </div>

        {/* Días restantes */}
        <div className="erp-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Días restantes</p>
          <p className={cn('text-xl font-bold',
            (p.dias_restantes ?? 0) < 30 ? 'text-red-400' :
            (p.dias_restantes ?? 0) < 90 ? 'text-yellow-400' : 'text-white'
          )}>
            {p.dias_restantes ?? '—'}
          </p>
          {p.fecha_fin_contractual && (
            <p className="text-xs text-gray-600 mt-0.5">{formatFecha(p.fecha_fin_contractual)}</p>
          )}
        </div>

        {/* Hitos */}
        <div className="erp-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hitos</p>
          <p className="text-xl font-bold text-white">
            {hitosCompletados}
            <span className="text-gray-600 text-base font-normal">/{hitos.length}</span>
          </p>
        </div>

        {/* Cobrado */}
        <div className="erp-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cobrado</p>
          <p className="text-xl font-bold text-green-400">{formatSoles(p.monto_cobrado ?? 0, true)}</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <ProyectoTabs proyectoId={id} tabActivo={tab} />

      {/* ── Contenido del tab ── */}
      <div className="mt-0">
        {tab === 'resumen' && (
          <ResumenTab
            proyecto={p}
            hitos={hitos}
            curvaS={curvaS}
            equipo={equipo as Parameters<typeof ResumenTab>[0]['equipo']}
            garantias={garantias}
            documentos={documentos}
          />
        )}

        {tab === 'cotizacion' && (
          <CotizacionTab cotizaciones={cotizaciones} proyectoId={id} />
        )}

        {tab === 'valorizacion' && (
          <ValorizacionTab valorizaciones={valorizaciones} />
        )}

        {tab === 'finanzas' && (
          <FinanzasTab movimientos={movimientos} />
        )}

        {tab === 'documentos' && (
          <DocumentosTab documentos={documentos} />
        )}

        {tab === 'progreso' && (
          <ProgresoTab hitos={hitos} proyecto={p} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Tabs inline (simples por ahora)
// ─────────────────────────────────────────

function CotizacionTab({ cotizaciones, proyectoId }: { cotizaciones: unknown[]; proyectoId: string }) {
  if (cotizaciones.length === 0) {
    return (
      <div className="erp-card flex flex-col items-center justify-center py-16 text-gray-600">
        <DollarSign size={36} className="mb-3 opacity-30" />
        <p className="text-base font-medium">Sin cotizaciones</p>
        <Link href={`/proyectos/${proyectoId}/cotizacion/nueva`}
          className="erp-btn-primary mt-4 text-sm">
          Crear cotización
        </Link>
      </div>
    )
  }
  return (
    <div className="erp-card">
      <p className="text-sm text-gray-400">Cotizaciones disponibles: {cotizaciones.length}</p>
    </div>
  )
}

import type { Valorizacion } from '@/lib/types/database'
import { getColorEstadoValorizacion } from '@/lib/utils'

function ValorizacionTab({ valorizaciones }: { valorizaciones: Valorizacion[] }) {
  if (valorizaciones.length === 0) {
    return (
      <div className="erp-card flex flex-col items-center justify-center py-16 text-gray-600">
        <CheckSquare size={36} className="mb-3 opacity-30" />
        <p className="text-base font-medium">Sin valorizaciones</p>
      </div>
    )
  }

  const totalBruto = valorizaciones.reduce((s, v) => s + (v.monto_bruto ?? 0), 0)
  const totalRetencion = valorizaciones.reduce((s, v) => s + (v.retencion_5pct ?? 0), 0)
  const totalNeto = valorizaciones.reduce((s, v) => s + (v.monto_neto ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total bruto', value: formatSoles(totalBruto), color: 'text-white' },
          { label: 'Retención acum. (5%)', value: formatSoles(totalRetencion), color: 'text-yellow-400' },
          { label: 'Total neto cobrado', value: formatSoles(totalNeto), color: 'text-green-400' },
        ].map(item => (
          <div key={item.label} className="erp-card text-center">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={cn('text-xl font-bold', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Período</th>
              <th>Monto bruto</th>
              <th>Retención 5%</th>
              <th>Monto neto</th>
              <th>Estado</th>
              <th>Fecha cobro</th>
            </tr>
          </thead>
          <tbody>
            {valorizaciones.map(v => (
              <tr key={v.id}>
                <td><span className="font-mono text-gray-400">Val. #{v.numero}</span></td>
                <td className="text-gray-300">
                  {formatFecha(v.periodo_inicio, 'short')} — {formatFecha(v.periodo_fin, 'short')}
                </td>
                <td className="text-white font-medium">{formatSoles(v.monto_bruto)}</td>
                <td className="text-yellow-400">-{formatSoles(v.retencion_5pct)}</td>
                <td className="text-green-400 font-semibold">{formatSoles(v.monto_neto)}</td>
                <td>
                  <span className={cn('erp-badge text-xs', getColorEstadoValorizacion(v.estado))}>
                    {v.estado.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="text-gray-400">{v.fecha_cobro ? formatFecha(v.fecha_cobro) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import type { Movimiento } from '@/lib/types/database'

function FinanzasTab({ movimientos }: { movimientos: Movimiento[] }) {
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto_neto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto_neto, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: formatSoles(ingresos, true), color: 'text-green-400' },
          { label: 'Egresos', value: formatSoles(egresos, true), color: 'text-red-400' },
          { label: 'Resultado', value: formatSoles(ingresos - egresos, true), color: ingresos - egresos >= 0 ? 'text-yellow-400' : 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="erp-card text-center">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={cn('text-xl font-bold', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>
      {movimientos.length === 0 ? (
        <div className="erp-card flex items-center justify-center py-12 text-gray-600">
          <p>Sin movimientos registrados</p>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr><th>Fecha</th><th>Descripción</th><th>Tipo</th><th>Monto</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {movimientos.slice(0, 10).map(m => (
                <tr key={m.id}>
                  <td className="text-gray-400 whitespace-nowrap">{formatFecha(m.fecha)}</td>
                  <td className="text-white max-w-[200px] truncate">{m.descripcion}</td>
                  <td>
                    <span className={cn('erp-badge text-xs', m.tipo === 'ingreso' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10')}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className={cn('font-semibold', m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400')}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{formatSoles(m.monto_neto, true)}
                  </td>
                  <td className="text-gray-400 capitalize">{m.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DocumentosTab({ documentos }: { documentos: Array<{ id: string; nombre: string; tipo_documento: string | null; created_at: string; url?: string }> }) {
  return (
    <div className="erp-card">
      {documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <p>Sin documentos adjuntos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documentos.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" style={{ backgroundColor: '#0F1623' }}>
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{d.nombre}</p>
                <p className="text-xs text-gray-500">{d.tipo_documento ?? 'Documento'} · {formatFecha(d.created_at.substring(0, 10))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import type { ProyectoResumen as PR } from '@/lib/types/database'

function ProgresoTab({ hitos, proyecto }: { hitos: HitoProyecto[]; proyecto: PR }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="erp-card">
        <h4 className="text-sm font-semibold text-white mb-4">Hitos del proyecto</h4>
        {hitos.length === 0 ? (
          <p className="text-sm text-gray-600">Sin hitos registrados</p>
        ) : (
          <div className="space-y-3">
            {hitos.map(h => (
              <div key={h.id} className="flex items-start gap-3 pb-3 border-b last:border-0" style={{ borderColor: '#1E293B' }}>
                <div className={cn('w-3 h-3 rounded-full mt-1 shrink-0',
                  h.estado === 'completado' ? 'bg-green-400' :
                  h.estado === 'en_proceso' ? 'bg-yellow-400' :
                  h.estado === 'retrasado' ? 'bg-red-400' : 'bg-gray-600'
                )} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{h.nombre}</p>
                  <div className="flex gap-4 mt-0.5">
                    {h.fecha_estimada && (
                      <p className="text-xs text-gray-500">Estimado: {formatFecha(h.fecha_estimada)}</p>
                    )}
                    {h.fecha_real && (
                      <p className="text-xs text-green-500">Real: {formatFecha(h.fecha_real)}</p>
                    )}
                  </div>
                </div>
                <span className={cn('erp-badge text-xs',
                  h.estado === 'completado' ? 'text-green-400 bg-green-400/10' :
                  h.estado === 'en_proceso' ? 'text-yellow-400 bg-yellow-400/10' :
                  h.estado === 'retrasado' ? 'text-red-400 bg-red-400/10' :
                  'text-gray-500 bg-gray-500/10'
                )}>
                  {h.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="erp-card flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-white">Avance general</h4>
        {[
          { label: 'Físico', value: proyecto.avance_fisico_pct, color: '#22C55E' },
          { label: 'Financiero', value: proyecto.avance_financiero_pct, color: '#3B82F6' },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm font-bold text-white">{item.value?.toFixed(1)}%</span>
            </div>
            <div className="erp-progress h-3">
              <div className="erp-progress-bar" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import type { HitoProyecto } from '@/lib/types/database'
