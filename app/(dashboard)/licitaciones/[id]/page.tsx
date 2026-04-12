import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getLicitacionById,
  getChecklistLicitacion,
  getDocumentosLicitacion,
} from '@/lib/queries/licitaciones'
import { formatSoles, formatFecha, getLabelEstadoLicitacion, getColorEstadoLicitacion } from '@/lib/utils'
import {
  ArrowLeft, Building2, Calendar, Clock, DollarSign,
  ExternalLink, FileText, Upload, User, CheckCircle2,
  Circle, TrendingUp, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  params: { id: string }
}

const ESTADO_COLOR: Record<string, string> = {
  identificada:          '#6B7280',
  preparando_propuesta:  '#EAB308',
  propuesta_enviada:     '#3B82F6',
  en_evaluacion:         '#F97316',
  adjudicada:            '#22C55E',
  no_adjudicada:         '#EF4444',
  desierta:              '#6B7280',
  cancelada:             '#EF4444',
}

export default async function LicitacionDetallePage({ params }: Props) {
  const [licitacion, checklist, documentos] = await Promise.all([
    getLicitacionById(params.id),
    getChecklistLicitacion(params.id),
    getDocumentosLicitacion(params.id),
  ])

  if (!licitacion) notFound()

  const dias = licitacion.fecha_presentacion
    ? Math.ceil((new Date(licitacion.fecha_presentacion).getTime() - Date.now()) / 86400000)
    : null
  const urgente = dias !== null && dias >= 0 && dias <= 7
  const vencida = dias !== null && dias < 0

  const checkDone = checklist.filter(c => c.completado).length
  const checkTotal = checklist.length
  const progresoPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0

  const estadoColor = ESTADO_COLOR[licitacion.estado] ?? '#6B7280'

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Breadcrumb + Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Link href="/dashboard/licitaciones" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            Licitaciones
          </Link>
          <span>/</span>
          <span className="text-gray-400">{licitacion.codigo_seace ?? licitacion.id}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white leading-tight">
                {licitacion.nombre}
              </h1>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                style={{
                  backgroundColor: estadoColor + '20',
                  color: estadoColor,
                  border: `1px solid ${estadoColor}30`,
                }}
              >
                {getLabelEstadoLicitacion(licitacion.estado)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {licitacion.entidad}
              {licitacion.codigo_seace && <> · N° SEACE: {licitacion.codigo_seace}</>}
            </p>
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:text-white"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
            >
              <Upload size={14} />
              Subir documentos
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:text-white"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
            >
              <ExternalLink size={14} />
              Ver en SEACE
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-black"
              style={{ backgroundColor: '#EAB308' }}
            >
              Confirmar participación
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div
        className="grid grid-cols-7 divide-x rounded-xl overflow-hidden border"
        style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
      >
        {[
          {
            label: 'Monto referencial',
            value: licitacion.monto_referencial ? formatSoles(licitacion.monto_referencial, true) : '—',
            sub: 'Incluye IGV',
            color: '#EAB308',
          },
          {
            label: 'Nuestra oferta',
            value: licitacion.monto_propuesta ? formatSoles(licitacion.monto_propuesta, true) : '—',
            sub: licitacion.monto_propuesta && licitacion.monto_referencial
              ? `${((licitacion.monto_propuesta / licitacion.monto_referencial) * 100).toFixed(1)}% del referencial`
              : 'Sin registrar',
            color: '#F1F5F9',
          },
          {
            label: 'Fecha límite',
            value: formatFecha(licitacion.fecha_presentacion),
            sub: '09:00 am · SEACE',
            color: urgente ? '#EF4444' : '#F1F5F9',
          },
          {
            label: 'Días restantes',
            value: dias !== null && !vencida ? `${dias} días` : vencida ? 'Vencida' : '—',
            sub: urgente ? 'Acción urgente' : dias !== null && !vencida ? 'Tiempo disponible' : '—',
            color: urgente ? '#EF4444' : vencida ? '#6B7280' : '#F1F5F9',
          },
          {
            label: 'Score de viabilidad',
            value: licitacion.probabilidad_pct ? `${licitacion.probabilidad_pct}/100` : '—',
            sub: (licitacion.probabilidad_pct ?? 0) >= 70 ? 'Alta probabilidad' : (licitacion.probabilidad_pct ?? 0) >= 40 ? 'Media' : 'Baja',
            color: (licitacion.probabilidad_pct ?? 0) >= 70 ? '#22C55E' : (licitacion.probabilidad_pct ?? 0) >= 40 ? '#EAB308' : '#EF4444',
          },
          {
            label: 'Responsable',
            value: licitacion.responsable
              ? `${licitacion.responsable.nombre} ${licitacion.responsable.apellido}`
              : '—',
            sub: licitacion.responsable?.cargo ?? 'Sin asignar',
            color: '#F1F5F9',
          },
          {
            label: 'Preparación',
            value: `${progresoPct}%`,
            sub: `${checkDone} / ${checkTotal} items`,
            color: progresoPct === 100 ? '#22C55E' : progresoPct > 50 ? '#EAB308' : '#EF4444',
          },
        ].map((k, i) => (
          <div key={i} className="px-4 py-3" style={{ borderColor: '#1E293B' }}>
            <p className="text-[10px] text-gray-500 mb-0.5 truncate">{k.label}</p>
            <p className="text-lg font-bold leading-tight truncate" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5 truncate">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Countdown urgente ── */}
      {dias !== null && !vencida && dias <= 14 && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            backgroundColor: urgente ? '#EF444410' : '#EAB30810',
            border: `1px solid ${urgente ? '#EF444430' : '#EAB30830'}`,
          }}
        >
          <AlertCircle size={16} className={urgente ? 'text-red-400' : 'text-yellow-400'} />
          <div>
            <p className={cn('text-sm font-bold', urgente ? 'text-red-400' : 'text-yellow-400')}>
              {dias === 0 ? 'Presentación HOY' : `${dias} días para presentar la oferta`}
            </p>
            <p className="text-xs text-gray-500">
              Fecha límite: {formatFecha(licitacion.fecha_presentacion)} · 09:00 am
            </p>
          </div>
        </div>
      )}

      {/* ── Contenido en 3 columnas ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* ── Col 1: Datos generales ── */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          >
            <h3 className="text-sm font-semibold text-white">Datos generales</h3>
            <p className="text-[10px] text-gray-600 mt-0.5">Información oficial del proceso</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1E293B' }}>
            {[
              { label: 'Entidad convocante', value: licitacion.entidad },
              { label: 'Tipo de proceso',    value: (licitacion.tipo_proceso ?? '—').replace(/_/g, ' ') },
              { label: 'Monto referencial',  value: licitacion.monto_referencial ? formatSoles(licitacion.monto_referencial) : '—' },
              { label: 'Nuestra propuesta',  value: licitacion.monto_propuesta ? formatSoles(licitacion.monto_propuesta) : 'Sin registrar' },
              { label: 'Presentación',       value: formatFecha(licitacion.fecha_presentacion) },
              { label: 'N° SEACE',           value: licitacion.codigo_seace ?? '—' },
              { label: 'Responsable',        value: licitacion.responsable ? `${licitacion.responsable.nombre} ${licitacion.responsable.apellido}` : '—' },
              { label: 'Cargo',              value: licitacion.responsable?.cargo ?? '—' },
            ].map(row => (
              <div
                key={row.label}
                className="flex justify-between items-start px-4 py-2.5 text-xs gap-3"
                style={{ borderColor: '#1E293B' }}
              >
                <span className="text-gray-500 shrink-0">{row.label}</span>
                <span className="text-white font-medium text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Notas */}
          {licitacion.notas && (
            <div className="px-4 py-3 border-t" style={{ borderColor: '#1E293B' }}>
              <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Notas</p>
              <p className="text-xs text-gray-400 leading-relaxed">{licitacion.notas}</p>
            </div>
          )}

          {/* Link SEACE */}
          <div className="px-4 py-3 border-t" style={{ borderColor: '#1E293B' }}>
            <button
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium border transition-colors hover:text-white"
              style={{ backgroundColor: '#161B2E', borderColor: '#3B82F630', color: '#3B82F6' }}
            >
              <ExternalLink size={12} />
              Ver proceso en SEACE
            </button>
          </div>
        </div>

        {/* ── Col 2: Nuestra propuesta + Checklist ── */}
        <div className="space-y-4">

          {/* Precio ofertado */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: '#EAB30830', backgroundColor: '#0F1623' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
              <h3 className="text-sm font-semibold text-white">Nuestra propuesta</h3>
              <p className="text-[10px] text-gray-600 mt-0.5">Oferta técnica y económica</p>
            </div>
            <div className="px-4 py-4">
              <p className="text-[10px] text-gray-500 mb-1">Precio ofertado</p>
              <p className="text-3xl font-black text-yellow-400">
                {licitacion.monto_propuesta ? formatSoles(licitacion.monto_propuesta) : '—'}
              </p>
              {licitacion.monto_propuesta && licitacion.monto_referencial && (
                <p className="text-xs text-gray-500 mt-1">
                  {((licitacion.monto_propuesta / licitacion.monto_referencial) * 100).toFixed(1)}% del monto referencial
                  {' · '}
                  <span className="text-green-400">
                    ▼ {(100 - (licitacion.monto_propuesta / licitacion.monto_referencial) * 100).toFixed(1)}% descuento
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Checklist de preparación</h3>
                <span className="text-xs font-bold" style={{
                  color: progresoPct === 100 ? '#22C55E' : progresoPct >= 50 ? '#EAB308' : '#EF4444'
                }}>
                  {progresoPct}%
                </span>
              </div>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {checklist.length === 0 ? (
                <p className="text-xs text-gray-600 py-2">Sin items de checklist</p>
              ) : (
                checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    {item.completado
                      ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      : <Circle size={14} className="text-gray-700 shrink-0" />
                    }
                    <span className={cn('text-xs flex-1', item.completado ? 'text-gray-500' : 'text-white')}>
                      {item.nombre ?? item.descripcion ?? '—'}
                    </span>
                    {!item.completado && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 shrink-0">
                        Pendiente
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Barra progreso */}
            <div className="px-4 pb-4">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1E293B' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progresoPct}%`,
                    backgroundColor: progresoPct === 100 ? '#22C55E' : '#EAB308',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Score IA */}
          {licitacion.probabilidad_pct && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: '#8B5CF620', backgroundColor: '#8B5CF608' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-base">✦</span>
                <p className="text-sm font-semibold text-white">Análisis del Asistente IA</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Probabilidad de adjudicación</span>
                  <span
                    className="font-bold"
                    style={{
                      color: licitacion.probabilidad_pct >= 70 ? '#22C55E'
                        : licitacion.probabilidad_pct >= 40 ? '#EAB308' : '#EF4444',
                    }}
                  >
                    {licitacion.probabilidad_pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1E293B' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${licitacion.probabilidad_pct}%`,
                      backgroundColor: licitacion.probabilidad_pct >= 70 ? '#22C55E'
                        : licitacion.probabilidad_pct >= 40 ? '#EAB308' : '#EF4444',
                    }}
                  />
                </div>
                <p className="text-[10px] text-purple-400 mt-2">
                  {licitacion.probabilidad_pct >= 70
                    ? 'Alta probabilidad — Recomendación: Participar'
                    : licitacion.probabilidad_pct >= 40
                    ? 'Probabilidad media — Evaluar costos'
                    : 'Probabilidad baja — Revisar viabilidad'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Col 3: Documentos ── */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          >
            <div>
              <h3 className="text-sm font-semibold text-white">Documentos</h3>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {documentos.length} archivo{documentos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:text-white"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
            >
              <Upload size={11} />
              Subir
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: '#1E293B' }}>
            {documentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <FileText size={24} className="mb-2 opacity-40" />
                <p className="text-xs">Sin documentos adjuntos</p>
              </div>
            ) : (
              documentos.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ borderColor: '#1E293B' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: '#1E293B', color: '#94A3B8' }}
                  >
                    {(doc.tipo ?? 'DOC').toUpperCase().slice(0, 4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {doc.nombre ?? doc.nombre_archivo ?? 'Documento'}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {formatFecha(doc.created_at)}
                    </p>
                  </div>
                  <ExternalLink size={12} className="text-gray-600 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}