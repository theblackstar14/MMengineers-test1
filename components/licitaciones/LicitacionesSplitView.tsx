'use client'

import { useState } from 'react'
import {
  cn, formatSoles, formatFecha,
  getLabelEstadoLicitacion,
} from '@/lib/utils'
import type { Licitacion } from '@/lib/types/database'
import {
  Building2, Search,
  Upload, ExternalLink, CheckCircle2, Circle,
} from 'lucide-react'

type LicitacionConResponsable = Licitacion & {
  responsable: { nombre: string; apellido: string; cargo: string | null } | null
}

interface Props {
  licitaciones: LicitacionConResponsable[]
  stats: {
    total: number
    porEstado: Record<string, number>
    montoTotal: number
    tasaExito: number
  }
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

const ESTADO_TABS = [
  { key: 'todos',                label: 'Todas' },
  { key: 'identificada',         label: 'Identificadas' },
  { key: 'preparando_propuesta', label: 'Preparando oferta' },
  { key: 'propuesta_enviada',    label: 'Presentadas' },
  { key: 'en_evaluacion',        label: 'En evaluación' },
  { key: 'adjudicada',           label: 'Adjudicadas' },
  { key: 'no_adjudicada',        label: 'No adjudicadas' },
]

const AVATAR_COLORS = [
  '#EAB308','#22C55E','#3B82F6','#F97316','#8B5CF6','#EC4899','#14B8A6',
]

function getAvatarColor(nombre: string) {
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}

function Avatar({ nombre, apellido }: { nombre: string; apellido: string }) {
  const color = getAvatarColor(nombre)
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
      style={{ backgroundColor: color + '25', color }}
    >
      {nombre[0]}{apellido[0]}
    </div>
  )
}

const CHECKLIST_ITEMS = [
  'Revisión de bases',
  'Cotización elaborada',
  'Documentos técnicos',
  'Oferta económica',
  'Firma y presentación',
]

export function LicitacionesSplitView({ licitaciones, stats }: Props) {
  const [seleccionada, setSeleccionada] = useState<LicitacionConResponsable | null>(
    licitaciones[0] ?? null
  )
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const diasRestantes = (fecha: string | null) => {
    if (!fecha) return null
    return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
  }

  const cierranEstaSemana = licitaciones.filter(l => {
    const d = diasRestantes(l.fecha_presentacion)
    return d !== null && d >= 0 && d <= 7
  }).length

  const montoEnJuego = licitaciones
    .filter(l => ['identificada','preparando_propuesta','propuesta_enviada','en_evaluacion'].includes(l.estado))
    .reduce((s, l) => s + (l.monto_referencial ?? 0), 0)

  const montoGanado = licitaciones
    .filter(l => l.estado === 'adjudicada')
    .reduce((s, l) => s + (l.monto_propuesta ?? l.monto_referencial ?? 0), 0)

  const filtradas = licitaciones.filter(l => {
    const matchEstado = filtroEstado === 'todos' || l.estado === filtroEstado
    const matchBusqueda =
      busqueda === '' ||
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.entidad ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.codigo_seace ?? '').toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  const adjudicadasYTD = stats.porEstado['adjudicada'] ?? 0

  const kpis = [
    {
      label: 'Total activas',
      value: (stats.porEstado['identificada'] ?? 0)
        + (stats.porEstado['preparando_propuesta'] ?? 0)
        + (stats.porEstado['propuesta_enviada'] ?? 0)
        + (stats.porEstado['en_evaluacion'] ?? 0),
      sub: 'En proceso',
      color: '#F1F5F9',
    },
    { label: 'Cierran esta semana', value: cierranEstaSemana,    sub: 'Acción urgente',       color: cierranEstaSemana > 0 ? '#EF4444' : '#F1F5F9' },
    { label: 'Preparando oferta',   value: stats.porEstado['preparando_propuesta'] ?? 0, sub: 'En elaboración',      color: '#F97316' },
    { label: 'En evaluación',       value: stats.porEstado['en_evaluacion'] ?? 0,        sub: 'Esperando resultado', color: '#F97316' },
    { label: 'Adjudicadas YTD',     value: adjudicadasYTD,       sub: `S/. ${(montoGanado/1e6).toFixed(1)}M ganados`, color: '#22C55E' },
    { label: 'Tasa adjudicación',   value: `${stats.tasaExito}%`, sub: 'Histórico 2024-25',   color: '#EAB308' },
    { label: 'Monto en juego',      value: `S/. ${(montoEnJuego/1e6).toFixed(1)}M`, sub: 'Cartera activa', color: '#EAB308' },
  ]

  return (
    <div className="space-y-4">

      {/* ── KPI Strip ── */}
      <div
        className="grid grid-cols-7 divide-x rounded-xl overflow-hidden border"
        style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B', '--tw-divide-opacity': 1 } as React.CSSProperties}
      >
        {kpis.map((k, i) => (
          <div key={i} className="px-4 py-3" style={{ borderColor: '#1E293B' }}>
            <p className="text-[11px] text-gray-500 mb-0.5 truncate">{k.label}</p>
            <p className="text-2xl font-bold leading-tight" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px] text-gray-600 mt-0.5 truncate">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Búsqueda + Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Buscador */}
        <div className="relative min-w-[200px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar licitación..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg text-white placeholder-gray-600 border focus:outline-none focus:border-yellow-500/40 transition-colors"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
          />
        </div>

        {/* Tabs estado */}
        <div className="flex gap-1 flex-wrap flex-1">
          {ESTADO_TABS.map(tab => {
            const count = tab.key === 'todos'
              ? licitaciones.length
              : (stats.porEstado[tab.key] ?? 0)
            const active = filtroEstado === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFiltroEstado(tab.key)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1',
                  active ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
                )}
                style={{
                  backgroundColor: active ? '#EAB30812' : 'transparent',
                  border: active ? '1px solid #EAB30830' : '1px solid transparent',
                }}
              >
                {tab.label}
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full',
                  active ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-600'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Ordenar */}
        <select
          className="text-[11px] text-gray-400 border rounded-lg px-3 py-2 focus:outline-none ml-auto"
          style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
        >
          <option>Ordenar: Fecha cierre ↑</option>
          <option>Ordenar: Monto ↓</option>
          <option>Ordenar: Estado</option>
        </select>
      </div>

      {/* ── Split View ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-5 rounded-xl overflow-hidden border"
        style={{ borderColor: '#1E293B' }}
      >

        {/* ── Lista tabla izquierda (3/5) ── */}
        <div
          className="lg:col-span-3 flex flex-col"
          style={{ backgroundColor: '#0F1623' }}
        >
          {/* Header columnas */}
          <div
            className="grid text-[11px] font-semibold text-gray-600 uppercase tracking-wider px-3 py-2 border-b sticky top-0 z-10"
            style={{
              backgroundColor: '#0B0F1A',
              borderColor: '#1E293B',
              gridTemplateColumns: '90px 1fr 110px 100px 80px 48px 100px 72px',
            }}
          >
            <span>Código</span>
            <span>Proceso / Entidad</span>
            <span>Tipo</span>
            <span>Monto ref.</span>
            <span>Fecha cierre</span>
            <span>Días</span>
            <span>Estado</span>
            <span>Resp.</span>
          </div>

          {/* Filas */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {filtradas.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-600 text-sm">
                Sin licitaciones
              </div>
            ) : (
              filtradas.map(lic => {
                const isActive = seleccionada?.id === lic.id
                const dias = diasRestantes(lic.fecha_presentacion)
                const urgente = dias !== null && dias >= 0 && dias <= 7

                return (
                  <button
                    key={lic.id}
                    onClick={() => setSeleccionada(lic)}
                    className={cn(
                      'w-full text-left border-b transition-colors',
                      isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    )}
                    style={{ borderColor: '#1E293B' }}
                  >
                    <div
                      className="grid items-center px-3 py-2.5 gap-2"
                      style={{
                        gridTemplateColumns: '90px 1fr 110px 100px 80px 48px 100px 72px',
                        borderLeft: `3px solid ${isActive
                          ? (ESTADO_COLOR[lic.estado] ?? '#6B7280')
                          : 'transparent'}`,
                      }}
                    >
                      {/* Código */}
                      <span className="text-[11px] font-mono text-gray-500 truncate">
                        {lic.codigo_seace
                          ? lic.codigo_seace.split('-').slice(0, 2).join('-')
                          : '—'}
                      </span>

                      {/* Nombre + entidad */}
                      <div className="min-w-0">
                        <p className={cn(
                          'text-sm font-semibold leading-snug line-clamp-1',
                          isActive ? 'text-yellow-400' : 'text-white'
                        )}>
                          {lic.nombre}
                        </p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={10} className="shrink-0" />
                          <span className="truncate">{lic.entidad}</span>
                        </p>
                      </div>

                      {/* Tipo */}
                      <span
                        className="text-[10px] px-2 py-1 rounded-full text-center truncate"
                        style={{ backgroundColor: '#1E293B', color: '#94A3B8' }}
                      >
                        {(lic.tipo_proceso ?? '—').replace(/_/g, ' ')}
                      </span>

                      {/* Monto */}
                      <span className="text-[13px] font-bold text-white">
                        {lic.monto_referencial
                          ? formatSoles(lic.monto_referencial, true)
                          : '—'}
                      </span>

                      {/* Fecha cierre */}
                      <span className="text-[11px] text-gray-500">
                        {formatFecha(lic.fecha_presentacion)}
                      </span>

                      {/* Días */}
                      {dias !== null && dias >= 0 ? (
                        <span className={cn(
                          'text-[11px] font-bold px-1.5 py-0.5 rounded-full text-center',
                          urgente
                            ? 'text-red-400 bg-red-500/10'
                            : 'text-gray-400 bg-white/5'
                        )}>
                          {dias}d
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-700 text-center">—</span>
                      )}

                      {/* Estado badge */}
                      <span
                        className="text-[10px] font-medium px-2 py-1 rounded-full text-center truncate"
                        style={{
                          backgroundColor: (ESTADO_COLOR[lic.estado] ?? '#6B7280') + '20',
                          color: ESTADO_COLOR[lic.estado] ?? '#6B7280',
                        }}
                      >
                        {getLabelEstadoLicitacion(lic.estado)}
                      </span>

                      {/* Responsable */}
                      {lic.responsable ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            nombre={lic.responsable.nombre}
                            apellido={lic.responsable.apellido}
                          />
                          <span className="text-[11px] text-gray-500 truncate">
                            {lic.responsable.nombre[0]}. {lic.responsable.apellido.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-700">—</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer paginación */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-gray-600"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          >
            <span>Mostrando {filtradas.length} de {licitaciones.length} licitaciones</span>
            <div className="flex items-center gap-1">
              {['<','1','2','3','...','6','>'].map((p, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-6 h-6 rounded text-[10px] flex items-center justify-center transition-colors',
                    p === '1'
                      ? 'font-bold text-black'
                      : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                  )}
                  style={p === '1' ? { backgroundColor: '#EAB308' } : {}}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel preview derecho (2/5) ── */}
        <div
          className="lg:col-span-2 border-l overflow-y-auto"
          style={{
            maxHeight: 'calc(100vh - 340px)',
            borderColor: '#1E293B',
            backgroundColor: '#0B0F1A',
          }}
        >
          {!seleccionada ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm p-8">
              Selecciona una licitación
            </div>
          ) : (
            <PreviewPanel licitacion={seleccionada} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Panel preview ──────────────────────────────────────────────────────────
function PreviewPanel({ licitacion: l }: { licitacion: LicitacionConResponsable }) {
  const dias = l.fecha_presentacion
    ? Math.ceil((new Date(l.fecha_presentacion).getTime() - Date.now()) / 86400000)
    : null
  const urgente = dias !== null && dias >= 0 && dias <= 7
  const vencida = dias !== null && dias < 0

  // En producción esto viene de getChecklistLicitacion()
  // Por ahora simulamos basado en estado
  const checkDone = l.estado === 'preparando_propuesta' ? 3
    : l.estado === 'propuesta_enviada' ? 5
    : l.estado === 'adjudicada' ? 5 : 0

  const progresoPct = CHECKLIST_ITEMS.length > 0
    ? Math.round((checkDone / CHECKLIST_ITEMS.length) * 100)
    : 0

  return (
    <div className="p-4 space-y-4">

      {/* Código + URGENTE badge + Título */}
      <div>
        <div className="flex items-center justify-between mb-1">
          {l.codigo_seace && (
            <p className="text-[10px] font-mono text-gray-500">{l.codigo_seace}</p>
          )}
          {urgente && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
              URGENTE
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-white leading-snug">{l.nombre}</h3>
      </div>

      {/* Countdown */}
      {dias !== null && !vencida && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            backgroundColor: urgente ? '#EF444410' : '#EAB30810',
            border: `1px solid ${urgente ? '#EF444430' : '#EAB30830'}`,
          }}
        >
          <p className="text-[10px] text-gray-500 mb-1">Cierra en</p>
          <p className={cn('text-2xl font-black', urgente ? 'text-red-400' : 'text-yellow-400')}>
            {dias === 0 ? 'HOY' : `${dias} días · ${formatFecha(l.fecha_presentacion)}`}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">Presentación de ofertas</p>
        </div>
      )}

      {/* Preparación de oferta */}
      {['preparando_propuesta', 'propuesta_enviada'].includes(l.estado) && (
        <div>
          <p className="text-xs font-semibold text-white mb-2.5">Preparación de oferta</p>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item, i) => {
              const done = i < checkDone
              return (
                <div key={item} className="flex items-center gap-2">
                  {done
                    ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                    : <Circle size={13} className="text-gray-700 shrink-0" />
                  }
                  <span className={cn('text-xs flex-1', done ? 'text-gray-500' : 'text-white')}>
                    {item}
                  </span>
                  {!done && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 shrink-0">
                      Pendiente
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-600">Completado</span>
              <span className="font-bold text-yellow-400">{progresoPct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1E293B' }}>
              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{ width: `${progresoPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Datos clave */}
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mb-2">
          Datos clave
        </p>
        <div
          className="rounded-lg overflow-hidden divide-y"
          style={{ border: '1px solid #1E293B', '--tw-divide-opacity': 1 } as React.CSSProperties}
        >
          {[
            { label: 'Entidad',           value: l.entidad },
            { label: 'Tipo',              value: (l.tipo_proceso ?? '—').replace(/_/g, ' ') },
            { label: 'Monto referencial', value: l.monto_referencial ? formatSoles(l.monto_referencial) : '—' },
            ...(l.codigo_seace           ? [{ label: 'N° SEACE',       value: l.codigo_seace }] : []),
            ...(l.responsable            ? [{ label: 'Responsable',     value: `${l.responsable.nombre} ${l.responsable.apellido}` }] : []),
            ...(l.monto_propuesta        ? [{ label: 'Cot. vinculada',  value: formatSoles(l.monto_propuesta) }] : []),
          ].map(row => (
            <div
              key={row.label}
              className="flex justify-between items-center px-3 py-2 text-xs"
              style={{ borderColor: '#1E293B' }}
            >
              <span className="text-gray-500 shrink-0">{row.label}</span>
              <span className="text-white font-medium text-right ml-2 truncate max-w-[160px]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score de viabilidad */}
      {l.probabilidad_pct && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Score de viabilidad</span>
            <span
              className="font-bold"
              style={{
                color: l.probabilidad_pct >= 70 ? '#22C55E'
                  : l.probabilidad_pct >= 40 ? '#EAB308' : '#EF4444',
              }}
            >
              {l.probabilidad_pct}/100
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1E293B' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${l.probabilidad_pct}%`,
                backgroundColor: l.probabilidad_pct >= 70 ? '#22C55E'
                  : l.probabilidad_pct >= 40 ? '#EAB308' : '#EF4444',
              }}
            />
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            <Upload size={11} />
            Subir documentos
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#EAB308' }}
          >
            <ExternalLink size={11} />
            Registrar en SEACE
          </button>
        </div>

        {/* Asistente IA */}
        <button
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: '#8B5CF610',
            color: '#A78BFA',
            border: '1px solid #8B5CF620',
          }}
        >
          + Asistente IA
        </button>
      </div>
    </div>
  )
}