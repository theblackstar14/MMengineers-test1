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
import { CotizacionesView } from '@/components/proyectos/detalle/CotizacionesView'
import {
  formatSoles, formatFecha,
  getColorEstadoProyecto, getLabelEstadoProyecto, getLabelTipoProyecto, cn,
} from '@/lib/utils'
import {
  ChevronRight, Pencil, CheckSquare, DollarSign, FileText,
} from 'lucide-react'
import type { Valorizacion, Movimiento, HitoProyecto } from '@/lib/types/database'
import { getColorEstadoValorizacion } from '@/lib/utils'

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

  // Tab label for breadcrumb
  const TAB_LABELS: Record<string, string> = {
    resumen: 'Resumen', cotizacion: 'Cotizaciones', valorizacion: 'Valorizaciones',
    finanzas: 'Finanzas', documentos: 'Documentos', progreso: 'Progreso',
  }

  // Fin estimado short label
  const finLabel = p.fecha_fin_contractual
    ? new Date(p.fecha_fin_contractual + 'T00:00:00')
        .toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase())
    : '—'

  return (
    <div className="space-y-0 animate-fade-in">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1 text-[12px] text-gray-500 mb-3">
        <Link href="/proyectos" className="hover:text-gray-300 transition-colors">Proyectos</Link>
        <ChevronRight size={13} />
        <Link href={`/proyectos/${id}`} className="hover:text-gray-300 transition-colors">
          {p.nombre}
        </Link>
        {tab !== 'resumen' && (
          <>
            <ChevronRight size={13} />
            <span className="text-gray-300">{TAB_LABELS[tab] ?? tab}</span>
          </>
        )}
      </div>

      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl border px-5 py-3 mb-4"
        style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
      >
        {/* Left: name + meta + badge */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-white leading-tight truncate">{p.nombre}</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {p.entidad_contratante ?? '—'}
              {p.numero_contrato ? ` · Contrato N° ${p.numero_contrato}` : ''}
              {p.ubicacion ? ` · ${p.ubicacion}` : ''}
            </p>
          </div>
          <span className={cn('shrink-0 inline-block px-3 py-1 rounded-full text-[11px] font-semibold', getColorEstadoProyecto(p.estado))}>
            {getLabelEstadoProyecto(p.estado)}
          </span>
        </div>

        {/* Right: KPI boxes */}
        <div className="flex items-stretch divide-x shrink-0" style={{ borderColor: '#1E293B' }}>
          {[
            { label: 'Presupuesto', value: formatSoles(montoTotal, true), color: 'text-white' },
            { label: 'Ejecutado',   value: formatSoles(p.monto_valorizado ?? 0, true), color: 'text-white' },
            { label: 'Avance',      value: `${avance.toFixed(0)}%`, color: avanceColor },
            { label: 'Fin estimado',value: finLabel, color: 'text-white' },
          ].map(kpi => (
            <div key={kpi.label} className="px-4 text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-[15px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <ProyectoTabs proyectoId={id} tabActivo={tab} />

      {/* ── Tab content ── */}
      <div className="mt-4">
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
          <CotizacionesView
            cotizacionesDB={cotizaciones as Parameters<typeof CotizacionesView>[0]['cotizacionesDB']}
            proyectoId={id}
            proyectoNombre={p.nombre}
          />
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

// ─── ValorizacionTab ──────────────────────────────────────────────

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
      <div className="erp-card overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>N°</th><th>Período</th><th>Monto bruto</th>
              <th>Retención 5%</th><th>Monto neto</th><th>Estado</th><th>Fecha cobro</th>
            </tr>
          </thead>
          <tbody>
            {valorizaciones.map(v => (
              <tr key={v.id}>
                <td><span className="font-mono text-gray-400">Val. #{v.numero}</span></td>
                <td className="text-gray-300">
                  {formatFecha(v.periodo_inicio)} — {formatFecha(v.periodo_fin)}
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

// ─── FinanzasTab ──────────────────────────────────────────────────

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

// ─── DocumentosTab ────────────────────────────────────────────────

function DocumentosTab({ documentos }: { documentos: Array<{ id: string; nombre: string; tipo_documento: string | null; created_at: string }> }) {
  return (
    <div className="erp-card">
      {documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <FileText size={36} className="mb-3 opacity-30" />
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

// ─── ProgresoTab ──────────────────────────────────────────────────

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
                    {h.fecha_estimada && <p className="text-xs text-gray-500">Estimado: {formatFecha(h.fecha_estimada)}</p>}
                    {h.fecha_real && <p className="text-xs text-green-500">Real: {formatFecha(h.fecha_real)}</p>}
                  </div>
                </div>
                <span className={cn('erp-badge text-xs',
                  h.estado === 'completado' ? 'text-green-400 bg-green-400/10' :
                  h.estado === 'en_proceso' ? 'text-yellow-400 bg-yellow-400/10' :
                  h.estado === 'retrasado' ? 'text-red-400 bg-red-400/10' : 'text-gray-500 bg-gray-500/10'
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
