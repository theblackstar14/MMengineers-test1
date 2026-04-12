'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Upload, Download, FileSpreadsheet } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────

interface Partida {
  id: string
  codigo: string
  nombre: string
  nivel: 1 | 2 | 3 | 4
  unidad?: string | null
  metrado?: number | null
  precio_unitario?: number | null
  total: number
  children?: Partida[]
}

interface Cotizacion {
  id: string
  nombre: string
  estado: string
  version: number
  total: number
  created_at: string
  notas?: string | null
  // derived (mock)
  numPartidas?: number
  numCapitulos?: number
  numSubpartidas?: number
}

// ─── Mock data (matches screenshot exactly) ───────────────────────

const MOCK_COTIZACIONES: Cotizacion[] = [
  {
    id: 'cot-1',
    nombre: 'Cotización inicial',
    estado: 'aprobada',
    version: 1,
    total: 8_240_000,
    created_at: '2025-01-10',
    numPartidas: 48,
    numCapitulos: 3,
    numSubpartidas: 127,
  },
  {
    id: 'cot-2',
    nombre: 'Adenda N° 1',
    estado: 'borrador',
    version: 2,
    total: 380_000,
    created_at: '2025-03-15',
    numPartidas: 12,
    numCapitulos: 2,
    numSubpartidas: 38,
  },
  {
    id: 'cot-3',
    nombre: 'Cotización alternativa',
    estado: 'historica',
    version: 1,
    total: 9_100_000,
    created_at: '2025-01-02',
    numPartidas: 45,
    numCapitulos: 3,
    numSubpartidas: 118,
  },
]

const MOCK_PARTIDAS: Partida[] = [
  {
    id: '01', codigo: '01', nombre: 'Obras Civiles', nivel: 1, total: 5_100_000,
    children: [
      {
        id: '01.01', codigo: '01.01', nombre: 'Movimiento de tierras', nivel: 2, total: 820_000,
        children: [
          {
            id: '01.01.01', codigo: '01.01.01', nombre: 'Excavación', nivel: 3, total: 410_000,
            children: [
              { id: '01.01.01.01', codigo: '01.01.0.01', nombre: 'Excavación manual terreno normal', nivel: 4, unidad: 'm³', metrado: 1200, precio_unitario: 180, total: 216_000 },
              { id: '01.01.01.02', codigo: '01.01.0.02', nombre: 'Excavación con maquinaria pesada', nivel: 4, unidad: 'm³', metrado: 860, precio_unitario: 225, total: 193_500 },
            ],
          },
          { id: '01.01.02', codigo: '01.01.02', nombre: 'Relleno y compactación', nivel: 3, total: 410_000 },
        ],
      },
      {
        id: '01.02', codigo: '01.02', nombre: 'Concreto estructural', nivel: 2, total: 2_840_000,
        children: [
          { id: '01.02.01', codigo: '01.02.01', nombre: 'Concreto f\'c=210 kg/cm² en losa', nivel: 4, unidad: 'm³', metrado: 320, precio_unitario: 485, total: 155_200 },
          { id: '01.02.02', codigo: '01.02.02', nombre: 'Encofrado y desencofrado', nivel: 4, unidad: 'm²', metrado: 1800, precio_unitario: 65, total: 117_000 },
        ],
      },
      { id: '01.03', codigo: '01.03', nombre: 'Pavimentación', nivel: 2, total: 1_440_000 },
    ],
  },
  {
    id: '02', codigo: '02', nombre: 'Instalaciones Eléctricas y Sanitarias', nivel: 1, total: 2_000_000,
    children: [
      { id: '02.01', codigo: '02.01', nombre: 'Instalaciones eléctricas', nivel: 2, total: 1_200_000 },
      { id: '02.02', codigo: '02.02', nombre: 'Instalaciones sanitarias', nivel: 2, total: 800_000 },
    ],
  },
  {
    id: '03', codigo: '03', nombre: 'Gastos Generales y Utilidad', nivel: 1, total: 1_140_000,
    children: [
      { id: '03.01', codigo: '03.01', nombre: 'Gastos generales fijos', nivel: 4, unidad: 'glb', metrado: 1, precio_unitario: 680_000, total: 680_000 },
      { id: '03.02', codigo: '03.02', nombre: 'Utilidad (7%)', nivel: 4, unidad: 'glb', metrado: 1, precio_unitario: 460_000, total: 460_000 },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────

function fmtSoles(n: number, compact = false): string {
  if (compact && n >= 1_000_000) return `S/. ${(n / 1_000_000).toFixed(2)}M`
  if (compact && n >= 1_000) return `S/. ${(n / 1_000).toFixed(0)}K`
  return `${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtFecha(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

const ESTADO_CFG: Record<string, { label: string; style: string }> = {
  aprobada:  { label: 'Aprobada',    style: 'bg-green-900/40 text-green-400 border border-green-700/30' },
  vigente:   { label: 'Aprobada',    style: 'bg-green-900/40 text-green-400 border border-green-700/30' },
  borrador:  { label: 'En revisión', style: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30' },
  historica: { label: 'Rechazada',   style: 'bg-red-900/40 text-red-400 border border-red-700/30' },
}

const CAP_COLORS = ['#EAB308', '#3B82F6', '#EAB308', '#22C55E']

// ─── PartidaRow ───────────────────────────────────────────────────

function PartidaRow({
  partida,
  totalPresupuesto,
  expanded,
  onToggle,
  depth = 0,
}: {
  partida: Partida
  totalPresupuesto: number
  expanded: Set<string>
  onToggle: (id: string) => void
  depth?: number
}) {
  const hasChildren = (partida.children?.length ?? 0) > 0
  const isExpanded = expanded.has(partida.id)
  const pct = totalPresupuesto > 0 ? (partida.total / totalPresupuesto) * 100 : 0
  const isChapter = partida.nivel === 1
  const isSection = partida.nivel === 2
  const isLeaf = partida.nivel === 4 || (!hasChildren && partida.nivel >= 3)

  // Chapter color index
  const chapterIdx = parseInt(partida.codigo.split('.')[0]) - 1
  const barColor = CAP_COLORS[chapterIdx] ?? '#64748B'

  return (
    <>
      <tr
        className={`group border-b transition-colors ${isChapter ? 'cursor-pointer hover:brightness-110' : 'hover:bg-white/[0.03]'}`}
        style={{
          borderColor: '#1E293B',
          backgroundColor: isChapter
            ? 'rgba(255,255,255,0.04)'
            : isSection
            ? 'rgba(255,255,255,0.02)'
            : 'transparent',
        }}
        onClick={() => hasChildren && onToggle(partida.id)}
      >
        {/* Código */}
        <td className="py-2 pl-3 pr-2 whitespace-nowrap text-[11px] text-gray-500 font-mono w-24">
          {partida.codigo}
        </td>

        {/* Descripción */}
        <td className="py-2 pr-3">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
            {hasChildren ? (
              <span className="text-gray-500 shrink-0">
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <span
              className={`${isChapter ? 'font-bold text-white text-[13px]' : isSection ? 'font-semibold text-gray-200 text-[12px]' : 'text-gray-300 text-[12px]'}`}
            >
              {partida.nombre}
            </span>
          </div>
        </td>

        {/* Unid */}
        <td className="py-2 pr-3 text-right text-[11px] text-gray-500 w-14">
          {isLeaf ? (partida.unidad ?? '') : ''}
        </td>

        {/* Metrado */}
        <td className="py-2 pr-3 text-right text-[11px] text-gray-400 w-20 font-mono">
          {isLeaf && partida.metrado != null
            ? partida.metrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })
            : ''}
        </td>

        {/* P. Unit */}
        <td className="py-2 pr-3 text-right text-[11px] text-gray-400 w-24 font-mono">
          {isLeaf && partida.precio_unitario != null
            ? partida.precio_unitario.toLocaleString('es-PE', { minimumFractionDigits: 2 })
            : ''}
        </td>

        {/* Total */}
        <td className="py-2 pr-3 text-right w-32">
          <span
            className={`text-[12px] font-mono ${isChapter ? 'font-bold text-[14px]' : 'font-medium text-gray-200'}`}
            style={{ color: isChapter ? barColor : undefined }}
          >
            {fmtSoles(partida.total)}
          </span>
        </td>

        {/* % */}
        <td className="py-2 pr-3 text-right w-28">
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1E293B' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
              />
            </div>
            <span className="text-[11px] text-gray-500 w-8 text-right">{pct.toFixed(1)}%</span>
          </div>
        </td>
      </tr>

      {/* Recursión */}
      {hasChildren && isExpanded && partida.children!.map(child => (
        <PartidaRow
          key={child.id}
          partida={child}
          totalPresupuesto={totalPresupuesto}
          expanded={expanded}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────

interface Props {
  cotizacionesDB: Cotizacion[]
  proyectoId: string
  proyectoNombre?: string
}

export function CotizacionesView({ cotizacionesDB, proyectoId, proyectoNombre }: Props) {
  const cotizaciones: Cotizacion[] = cotizacionesDB.length > 0 ? cotizacionesDB : MOCK_COTIZACIONES
  const [selectedId, setSelectedId] = useState<string>(cotizaciones[0]?.id ?? '')

  // All chapter IDs expanded by default
  const defaultExpanded = new Set<string>(MOCK_PARTIDAS.map(p => p.id))
  // Also expand nivel-2 with children
  MOCK_PARTIDAS.forEach(cap => {
    cap.children?.forEach(sec => {
      if (sec.children?.length) defaultExpanded.add(sec.id)
    })
  })
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded)

  const selected = cotizaciones.find(c => c.id === selectedId) ?? cotizaciones[0]
  const partidas = MOCK_PARTIDAS // always use mock for tree
  const totalPresupuesto = selected?.total ?? 0
  const igv = totalPresupuesto * 0.18

  // Cap totals for KPI bar
  const caps = partidas.map((cap, i) => ({
    label: `Cap. 0${i + 1} ${cap.nombre.split(' ').slice(0, 2).join(' ')}`,
    total: cap.total,
  }))

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalAprobado = cotizaciones
    .filter(c => c.estado === 'aprobada' || c.estado === 'vigente')
    .reduce((s, c) => s + c.total, 0)

  const activaCount = cotizaciones.filter(c => c.estado === 'aprobada' || c.estado === 'vigente').length

  return (
    <div
      className="flex rounded-xl border overflow-hidden"
      style={{ borderColor: '#1E293B', backgroundColor: '#0F1623', minHeight: '600px' }}
    >
      {/* ── LEFT: cotizaciones list ── */}
      <div
        className="w-72 shrink-0 flex flex-col border-r"
        style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: '#1E293B' }}
        >
          <div>
            <p className="text-[13px] font-semibold text-white">Cotizaciones</p>
            <p className="text-[11px] text-gray-500">{cotizaciones.length} en total</p>
          </div>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-black"
            style={{ backgroundColor: '#EAB308' }}
          >
            <Plus size={12} />
            Nueva
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {cotizaciones.map(cot => {
            const cfg = ESTADO_CFG[cot.estado] ?? { label: cot.estado, style: 'bg-slate-700 text-gray-400' }
            const isActive = cot.id === selectedId
            return (
              <button
                key={cot.id}
                onClick={() => setSelectedId(cot.id)}
                className="w-full text-left px-4 py-3.5 border-b transition-colors hover:bg-white/[0.03]"
                style={{
                  borderColor: '#1E293B',
                  borderLeft: isActive ? '3px solid #EAB308' : '3px solid transparent',
                  backgroundColor: isActive ? 'rgba(234,179,8,0.05)' : 'transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {cot.nombre}
                  </span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${cfg.style}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  {fmtFecha(cot.created_at)}
                  {cot.numPartidas ? ` · ${cot.numPartidas} partidas` : ''}
                </p>
                <p className={`text-[14px] font-bold ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
                  S/. {cot.total.toLocaleString('es-PE')}
                </p>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: '#1E293B' }}
        >
          <p className="text-[11px] text-gray-500 mb-0.5">Total aprobado</p>
          <p className="text-[16px] font-bold text-yellow-400">
            S/. {totalAprobado.toLocaleString('es-PE')}
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {activaCount} cotización activa
          </p>
        </div>
      </div>

      {/* ── RIGHT: presupuesto detail ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-white">
                Presupuesto — {selected?.nombre}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {(ESTADO_CFG[selected?.estado ?? ''] ?? { label: selected?.estado ?? '' }).label}
                {selected?.created_at ? ` · ${fmtFecha(selected.created_at)}` : ''}
                {selected?.numCapitulos ? ` · ${selected.numCapitulos} capítulos` : ''}
                {selected?.numPartidas ? ` · ${selected.numPartidas} partidas` : ''}
                {selected?.numSubpartidas ? ` · ${selected.numSubpartidas} subpartidas` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-300 border transition-colors hover:border-gray-500"
                style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
              >
                <FileSpreadsheet size={13} />
                Importar S10
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-300 border transition-colors hover:border-gray-500"
                style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
              >
                <Download size={13} />
                Exportar PDF
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-black"
                style={{ backgroundColor: '#EAB308' }}
              >
                <Plus size={13} />
                Partida
              </button>
            </div>
          </div>
        </div>

        {/* KPI bar */}
        <div
          className="flex divide-x border-b"
          style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
        >
          {/* Total */}
          <div className="px-4 py-2.5 shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total presupuesto</p>
            <p className="text-[15px] font-bold text-yellow-400">
              S/. {totalPresupuesto.toLocaleString('es-PE')}
            </p>
          </div>
          {/* Caps */}
          {caps.map((cap, i) => (
            <div key={i} className="px-4 py-2.5 flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 truncate">{cap.label}</p>
              <p className="text-[13px] font-semibold text-gray-200">
                S/. {cap.total.toLocaleString('es-PE')}
              </p>
            </div>
          ))}
          {/* IGV */}
          <div className="px-4 py-2.5 shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">IGV (18%)</p>
            <p className="text-[13px] font-semibold text-gray-200">
              S/. {igv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[800px]">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#0B0F1A', borderBottom: '1px solid #1E293B' }}>
                {[
                  { label: 'Código',       cls: 'pl-3 pr-2 w-24' },
                  { label: 'Descripción',  cls: 'pr-3' },
                  { label: 'Unid.',        cls: 'pr-3 text-right w-14' },
                  { label: 'Metrado',      cls: 'pr-3 text-right w-20' },
                  { label: 'P. Unit (S/.)',cls: 'pr-3 text-right w-24' },
                  { label: 'Total (S/.)',  cls: 'pr-3 text-right w-32' },
                  { label: '% del total', cls: 'pr-3 text-right w-28' },
                ].map(h => (
                  <th
                    key={h.label}
                    className={`py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${h.cls}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partidas.map(partida => (
                <PartidaRow
                  key={partida.id}
                  partida={partida}
                  totalPresupuesto={totalPresupuesto}
                  expanded={expanded}
                  onToggle={toggle}
                  depth={0}
                />
              ))}
              {/* Total row */}
              <tr style={{ backgroundColor: '#0B0F1A', borderTop: '2px solid #1E293B' }}>
                <td colSpan={5} className="py-3 pl-3 text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                  Total Presupuesto
                </td>
                <td className="py-3 pr-3 text-right text-[15px] font-bold text-yellow-400">
                  S/. {totalPresupuesto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-3 text-right text-[12px] font-bold text-gray-400">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
