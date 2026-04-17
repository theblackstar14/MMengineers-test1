'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Upload, Loader2, X, CheckCircle2,
  ChevronDown, ChevronRight, Search, Trash2,
} from 'lucide-react'
import type { CotizacionParseada } from '@/lib/excel/parseCotizacion'

// ─── Types ────────────────────────────────────────────────────────

interface PartidaDB {
  id: string
  parent_id: string | null
  codigo: string
  nivel: number
  nombre: string
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  total: number
  orden: number
}

interface PartidaNode extends PartidaDB {
  children: PartidaNode[]
}

interface CotizacionDB {
  id: string
  nombre: string
  version: number
  estado: string
  total: number
  costo_directo?: number | null
  gastos_generales?: number | null
  utilidad?: number | null
  igv?: number | null
  notas: string | null
  created_at: string
}

interface Resumen {
  costo_directo: number
  gastos_generales_pct: number | null
  gastos_generales: number | null
  utilidad_pct: number | null
  utilidad: number | null
  subtotal: number
  igv_pct: number
  igv: number
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100

function fmt(n: number | null | undefined) {
  if (n == null) return ''
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtN(n: number | null | undefined) {
  if (n == null) return ''
  return n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

function buildTree(flat: PartidaDB[]): PartidaNode[] {
  const map = new Map<string, PartidaNode>()
  const roots: PartidaNode[] = []
  const sorted = [...flat].sort((a, b) => a.orden - b.orden)

  for (const p of sorted) map.set(p.id, { ...p, children: [] })
  for (const p of sorted) {
    const node = map.get(p.id)!
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

function flattenNodes(nodes: PartidaNode[], out: Array<PartidaNode & { _depth: number }> = [], depth = 0) {
  for (const n of nodes) {
    out.push({ ...n, _depth: depth })
    if (n.children.length) flattenNodes(n.children, out, depth + 1)
  }
  return out
}

interface NotasMeta {
  version_label?: string
  codigo_interno?: string | null
  resumen?: { gg_pct: number | null; util_pct: number | null; igv_pct: number } | null
}

function parseNotas(notas: string | null): NotasMeta {
  if (!notas) return {}
  try { return JSON.parse(notas) } catch { return { version_label: notas } }
}

function computeResumen(roots: PartidaNode[], meta?: NotasMeta, dbCot?: CotizacionDB | null): Resumen {
  const gg_pct  = meta?.resumen?.gg_pct   ?? null
  const ut_pct  = meta?.resumen?.util_pct ?? null
  const igv_pct = meta?.resumen?.igv_pct  ?? 0.18

  // Prefer DB values (trigger-computed) when present; fallback to client rollup
  const cd = dbCot?.costo_directo != null
    ? round2(Number(dbCot.costo_directo))
    : round2(roots.reduce((s, p) => s + p.total, 0))

  const gg = dbCot?.gastos_generales != null
    ? round2(Number(dbCot.gastos_generales))
    : (gg_pct != null ? round2(cd * gg_pct) : null)

  const util = dbCot?.utilidad != null
    ? round2(Number(dbCot.utilidad))
    : (ut_pct != null ? round2(cd * ut_pct) : null)

  const sub = round2(cd + (gg ?? 0) + (util ?? 0))

  const igv = dbCot?.igv != null
    ? round2(Number(dbCot.igv))
    : round2(sub * igv_pct)

  const total = dbCot?.total != null && dbCot.total > 0
    ? round2(Number(dbCot.total))
    : round2(sub + igv)

  return {
    costo_directo:        cd,
    gastos_generales_pct: gg_pct,
    gastos_generales:     gg,
    utilidad_pct:         ut_pct,
    utilidad:             util,
    subtotal:             sub,
    igv_pct,
    igv,
    total,
  }
}

// ─── Row level styles (mirrors HTML viewer) ───────────────────────

const LVL_BG   = ['#1e2235', '#1a2030', '#161b2d', '#131827']
const LVL_TEXT = ['#c7d2fe', '#a5b4fc', '#94a3b8', '#64748b']
const LVL_FONT = ['700', '600', '500', '400']

// ─── Tree Row ─────────────────────────────────────────────────────

function TreeRow({
  node, depth, collapsed, onToggle, cdTotal, search,
}: {
  node: PartidaNode & { _depth: number }
  depth: number
  collapsed: Set<string>
  onToggle: (id: string) => void
  cdTotal: number
  search: string
}) {
  const hasKids = node.children.length > 0
  const isOpen  = !collapsed.has(node.id)
  const lv      = Math.min(depth, 3)
  const pct     = cdTotal > 0 ? ((node.total / cdTotal) * 100).toFixed(1) : '0.0'

  return (
    <>
      <tr
        style={{ backgroundColor: LVL_BG[lv] }}
        className="border-b border-[#2e3352] hover:brightness-110 transition-all"
      >
        {/* ITEM */}
        <td className="px-3 py-[6px] font-mono text-[11px] text-[#8892a4] w-[90px] whitespace-nowrap">
          {node.codigo}
        </td>

        {/* DESCRIPCIÓN */}
        <td className="px-2 py-[6px]">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
            {hasKids ? (
              <button
                onClick={() => onToggle(node.id)}
                className="w-4 h-4 rounded flex items-center justify-center border border-[#2e3352] bg-[#22263a] text-[9px] shrink-0 hover:border-[#6366f1] transition-colors"
              >
                {isOpen ? '▼' : '▶'}
              </button>
            ) : (
              <span className="w-[5px] h-[5px] rounded-full bg-[#2e3352] shrink-0 ml-[5px] mr-[3px]" />
            )}
            <span
              className="text-[12px]"
              style={{ color: LVL_TEXT[lv], fontWeight: LVL_FONT[lv] }}
            >
              {node.nombre}
            </span>
          </div>
        </td>

        {/* UNID */}
        <td className="px-2 py-[6px] w-[52px]">
          {node.unidad && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2e3352] bg-[#22263a] text-[#8892a4]">
              {node.unidad}
            </span>
          )}
        </td>

        {/* METRADO */}
        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] w-[100px] tabular-nums">
          {fmtN(node.metrado)}
        </td>

        {/* P.U. */}
        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] w-[110px] tabular-nums">
          {fmt(node.precio_unitario)}
        </td>

        {/* PARCIAL (met × pu) */}
        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] w-[115px] tabular-nums">
          {node.metrado != null && node.precio_unitario != null
            ? fmt(round2(node.metrado * node.precio_unitario))
            : ''}
        </td>

        {/* TOTAL */}
        <td className="px-2 py-[6px] text-right text-[12px] font-semibold text-[#06b6d4] w-[115px] tabular-nums">
          {node.total > 0 ? fmt(node.total) : ''}
        </td>

        {/* % */}
        <td className="px-2 py-[6px] text-right text-[11px] text-[#8892a4] w-[60px] tabular-nums">
          {node.total > 0 ? `${pct}%` : ''}
        </td>
      </tr>

      {/* Children */}
      {hasKids && isOpen && node.children.map(child => (
        <TreeRow
          key={child.id}
          node={{ ...child, _depth: depth + 1 }}
          depth={depth + 1}
          collapsed={collapsed}
          onToggle={onToggle}
          cdTotal={cdTotal}
          search={search}
        />
      ))}
    </>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────

function DeleteButton({ cotId, onDeleted }: { cotId: string; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function doDelete() {
    setDeleting(true)
    const res = await fetch(`/api/cotizaciones/${cotId}`, { method: 'DELETE' })
    if (res.ok) onDeleted()
    else { alert('Error al eliminar'); setDeleting(false); setConfirm(false) }
  }

  if (confirm) return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-red-400">¿Eliminar?</span>
      <button onClick={doDelete} disabled={deleting}
        className="px-2 py-1 rounded text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
        {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Sí'}
      </button>
      <button onClick={() => setConfirm(false)} className="px-2 py-1 rounded text-[11px] border border-[#2e3352] text-[#8892a4] hover:text-white">No</button>
    </div>
  )

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] text-red-400 border border-[#2e3352] hover:border-red-500 hover:bg-red-500/10 transition-all">
      <Trash2 size={12} /> Eliminar
    </button>
  )
}

// ─── Resumen panel ────────────────────────────────────────────────

function ResumenPanel({ r }: { r: Resumen }) {
  const pctLabel = (n: number | null) => n != null ? `${Math.round(n * 100)}%` : null

  const allRows = [
    { label: 'COSTO DIRECTO',    value: r.costo_directo,    pct: null,                        color: '#e2e8f0', bold: true,  skip: false },
    { label: 'Gastos Generales', value: r.gastos_generales, pct: pctLabel(r.gastos_generales_pct), color: '#8892a4', bold: false, skip: r.gastos_generales == null },
    { label: 'Utilidad',         value: r.utilidad,         pct: pctLabel(r.utilidad_pct),    color: '#8892a4', bold: false, skip: r.utilidad == null },
    { label: 'SUB TOTAL',        value: r.subtotal,         pct: null,                        color: '#818cf8', bold: true,  skip: false },
    { label: 'I.G.V.',           value: r.igv,              pct: pctLabel(r.igv_pct),         color: '#8892a4', bold: false, skip: false },
    { label: 'TOTAL',            value: r.total,            pct: null,                        color: '#4ade80', bold: true,  skip: false },
  ]
  const rows = allRows.filter(r => !r.skip)

  return (
    <div className="mt-4 flex justify-end">
      <div className="rounded-xl border border-[#2e3352] overflow-hidden min-w-[380px]"
        style={{ backgroundColor: '#1a1d27' }}>
        {rows.map((row, i) => (
          <div key={i}
            className="flex items-center justify-between px-5 py-2.5 border-b border-[#2e3352] last:border-0"
            style={{ backgroundColor: row.bold ? '#22263a' : undefined }}>
            <div className="flex items-center gap-3">
              <span className="text-[12px]" style={{ color: row.color, fontWeight: row.bold ? '700' : '400' }}>
                {row.label}
              </span>
              {row.pct && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22263a] border border-[#2e3352] text-[#8892a4]">
                  {row.pct}
                </span>
              )}
            </div>
            <span
              className="text-[13px] tabular-nums"
              style={{ color: row.color, fontWeight: row.bold ? '700' : '400' }}>
              {fmt(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────

export function VisorCotizaciones({
  proyectoId, proyectoNombre, cotizacionesDB,
}: {
  proyectoId: string
  proyectoNombre: string
  cotizacionesDB: CotizacionDB[]
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [cotizaciones, setCotizaciones] = useState<CotizacionDB[]>(cotizacionesDB ?? [])
  const [activeId, setActiveId]         = useState<string>(cotizacionesDB?.[0]?.id ?? '')
  const [roots, setRoots]               = useState<PartidaNode[]>([])
  const [loading, setLoading]           = useState(false)
  const [collapsed, setCollapsed]       = useState<Set<string>>(new Set())
  const [search, setSearch]             = useState('')

  // Import state
  const [importing, setImporting]             = useState(false)
  const [preview, setPreview]                 = useState<CotizacionParseada[] | null>(null)
  const [previewSelected, setPreviewSelected] = useState<Set<number>>(new Set())
  const [previewExpandedIdx, setPreviewExpandedIdx] = useState<number | null>(0)

  // Load partidas for active cotizacion
  const loadPartidas = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    const res  = await fetch(`/api/cotizaciones/${id}/partidas`)
    const json = await res.json()
    const flat: PartidaDB[] = json.partidas ?? []
    setRoots(buildTree(flat))
    setCollapsed(new Set())   // all expanded
    setLoading(false)
  }, [])

  useEffect(() => { loadPartidas(activeId) }, [activeId, loadPartidas])

  // Filtered flat rows for search
  const allFlat = flattenNodes(roots)
  const visibleFlat = search
    ? allFlat.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        r.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : null  // null = use tree rendering

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  function expandAll()   { setCollapsed(new Set()) }
  function collapseAll() {
    setCollapsed(new Set(flattenNodes(roots).filter(n => n.children.length).map(n => n.id)))
  }

  // Import handlers
  async function handleImport(file: File) {
    setImporting(true)
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/cotizaciones/import', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { alert(json.error); setImporting(false); return }
    const vers: CotizacionParseada[] = json.versiones
    setPreview(vers)
    setPreviewSelected(new Set(vers.map((_: unknown, i: number) => i)))
    setPreviewExpandedIdx(0)
    setImporting(false)
  }

  async function confirmImport() {
    if (!preview) return
    const toImport = preview.filter((_, i) => previewSelected.has(i))
    if (!toImport.length) return
    setImporting(true)
    const res  = await fetch('/api/cotizaciones/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto_id: proyectoId, versiones: toImport }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); setImporting(false); return }
    const updated = await fetch(`/api/proyectos/${proyectoId}/cotizaciones`)
    if (updated.ok) {
      const data = await updated.json()
      setCotizaciones(data.cotizaciones ?? [])
      const firstNew = json.created?.[0]?.id
      if (firstNew) setActiveId(firstNew)
    }
    setPreview(null)
    setImporting(false)
  }

  const activeCot  = cotizaciones.find(c => c.id === activeId)
  const notasMeta  = parseNotas(activeCot?.notas ?? null)
  const resumen    = roots.length ? computeResumen(roots, notasMeta, activeCot) : null

  return (
    <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: '#0f1117' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2e3352' }}>
        <div className="flex items-center gap-3">
          <Link href={`/proyectos/${proyectoId}`}
            className="flex items-center gap-1 text-[12px] text-[#8892a4] hover:text-white transition-colors">
            <ChevronLeft size={14} /> Proyecto
          </Link>
          <span className="text-[#2e3352]">/</span>
          <span className="text-[13px] text-[#818cf8] font-semibold">Cotizaciones</span>
          <span className="text-[12px] text-[#8892a4]">{proyectoNombre}</span>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
          style={{ backgroundColor: '#EAB308' }}>
          {importing
            ? <Loader2 size={13} className="animate-spin" />
            : <Upload size={13} />}
          Importar Excel
        </button>
        <input type="file" hidden ref={fileRef} accept=".xlsx,.xls"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = '' }} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      {cotizaciones.length > 0 && (
        <div className="flex items-end gap-0.5 px-5 pt-3 border-b shrink-0 overflow-x-auto"
          style={{ backgroundColor: '#1a1d27', borderColor: '#2e3352' }}>
          {cotizaciones.map(c => {
            const isActive = c.id === activeId
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-[12px] font-medium whitespace-nowrap border border-b-0 transition-all"
                style={{
                  backgroundColor: isActive ? '#0f1117' : 'transparent',
                  borderColor: isActive ? '#2e3352' : 'transparent',
                  color: isActive ? '#818cf8' : '#8892a4',
                }}>
                <span className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ backgroundColor: '#22c55e' }} />
                {c.nombre}
                <span className="text-[10px] opacity-60">
                  {c.total > 0 ? fmt(c.total) : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-5">

        {cotizaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl border border-[#2e3352] flex items-center justify-center"
              style={{ backgroundColor: '#1a1d27' }}>
              <Upload size={28} className="text-[#2e3352]" />
            </div>
            <p className="text-[14px] text-[#8892a4]">Sin cotizaciones. Importa un archivo Excel.</p>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-black"
              style={{ backgroundColor: '#EAB308' }}>
              <Upload size={14} /> Importar Excel
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#6366f1]" />
          </div>
        ) : (
          <>
            {/* Metadata cards */}
            {activeCot && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                {[
                  { lbl: 'Cotización',  val: activeCot.nombre, hi: false },
                  { lbl: 'Versión',     val: [notasMeta.version_label, notasMeta.codigo_interno].filter(Boolean).join(' · ') || `V${activeCot.version}`, hi: false },
                  { lbl: 'Estado',      val: activeCot.estado, hi: false },
                  { lbl: 'Partidas',    val: `${allFlat.length} nodos`, hi: false },
                  { lbl: 'Subtotal',    val: fmt(resumen?.subtotal ?? 0), hi: true },
                  { lbl: 'Total c/IGV', val: fmt(resumen?.total ?? 0), hi: true, green: true },
                ].map((card, i) => (
                  <div key={i}
                    className="rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: '#1a1d27',
                      borderColor: card.green ? '#22c55e' : card.hi ? '#6366f1' : '#2e3352',
                    }}>
                    <p className="text-[10px] uppercase tracking-wider text-[#8892a4] mb-1">{card.lbl}</p>
                    <p className="text-[13px] font-semibold truncate"
                      style={{ color: card.green ? '#4ade80' : card.hi ? '#818cf8' : '#e2e8f0' }}>
                      {card.val}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8892a4]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar partida..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] border outline-none w-52 focus:border-[#6366f1] transition-colors"
                  style={{ backgroundColor: '#1a1d27', borderColor: '#2e3352', color: '#e2e8f0' }}
                />
              </div>
              <button onClick={expandAll}
                className="px-3 py-1.5 rounded-lg text-[11px] border border-[#2e3352] text-[#8892a4] hover:text-white hover:border-[#6366f1] transition-all"
                style={{ backgroundColor: '#22263a' }}>
                ▼ Expandir todo
              </button>
              <button onClick={collapseAll}
                className="px-3 py-1.5 rounded-lg text-[11px] border border-[#2e3352] text-[#8892a4] hover:text-white hover:border-[#6366f1] transition-all"
                style={{ backgroundColor: '#22263a' }}>
                ▶ Colapsar todo
              </button>
              <div className="flex-1" />
              <span className="text-[11px] border border-[#2e3352] rounded-lg px-3 py-1.5 text-[#8892a4]"
                style={{ backgroundColor: '#1a1d27' }}>
                {allFlat.length} filas
              </span>
              {activeCot && (
                <DeleteButton
                  cotId={activeCot.id}
                  onDeleted={async () => {
                    const updated = await fetch(`/api/proyectos/${proyectoId}/cotizaciones`)
                    if (updated.ok) {
                      const data = await updated.json()
                      const list = data.cotizaciones ?? []
                      setCotizaciones(list)
                      setActiveId(list[0]?.id ?? '')
                    }
                  }}
                />
              )}
            </div>

            {/* Tree table */}
            <div className="rounded-xl border overflow-auto" style={{ borderColor: '#2e3352', maxHeight: '60vh' }}>
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col />
                  <col style={{ width: '52px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '115px' }} />
                  <col style={{ width: '115px' }} />
                  <col style={{ width: '60px' }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: '#22263a', position: 'sticky', top: 0, zIndex: 2 }}>
                    {['ITEM', 'DESCRIPCIÓN', 'UNID', 'METRADO', 'P.U.', 'PARCIAL', 'TOTAL', '%'].map(h => (
                      <th key={h}
                        className={`px-2 py-2.5 text-[10px] uppercase tracking-wider font-medium border-b border-[#2e3352] ${h !== 'ITEM' && h !== 'DESCRIPCIÓN' && h !== 'UNID' ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8892a4' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Search mode: flat filtered rows */}
                  {visibleFlat ? (
                    visibleFlat.map(row => (
                      <tr key={row.id} style={{ backgroundColor: LVL_BG[Math.min(row._depth, 3)] }}
                        className="border-b border-[#2e3352]">
                        <td className="px-3 py-[6px] font-mono text-[11px] text-[#8892a4]">{row.codigo}</td>
                        <td className="px-2 py-[6px]">
                          <span className="text-[12px]"
                            style={{ paddingLeft: `${row._depth * 16}px`, color: LVL_TEXT[Math.min(row._depth, 3)], fontWeight: LVL_FONT[Math.min(row._depth, 3)] }}>
                            {row.nombre}
                          </span>
                        </td>
                        <td className="px-2 py-[6px]">
                          {row.unidad && <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2e3352] bg-[#22263a] text-[#8892a4]">{row.unidad}</span>}
                        </td>
                        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] tabular-nums">{fmtN(row.metrado)}</td>
                        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] tabular-nums">{fmt(row.precio_unitario)}</td>
                        <td className="px-2 py-[6px] text-right text-[12px] text-[#8892a4] tabular-nums">
                          {row.metrado != null && row.precio_unitario != null ? fmt(round2(row.metrado * row.precio_unitario)) : ''}
                        </td>
                        <td className="px-2 py-[6px] text-right text-[12px] font-semibold text-[#06b6d4] tabular-nums">
                          {row.total > 0 ? fmt(row.total) : ''}
                        </td>
                        <td className="px-2 py-[6px] text-right text-[11px] text-[#8892a4] tabular-nums">
                          {row.total > 0 && resumen ? `${((row.total / resumen.costo_directo) * 100).toFixed(1)}%` : ''}
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* Tree mode */
                    roots.map(root => (
                      <TreeRow
                        key={root.id}
                        node={{ ...root, _depth: 0 }}
                        depth={0}
                        collapsed={collapsed}
                        onToggle={toggle}
                        cdTotal={resumen?.costo_directo ?? 0}
                        search={search}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen */}
            {resumen && <ResumenPanel r={resumen} />}
          </>
        )}
      </div>

      {/* ── Import preview modal ─────────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-2xl rounded-2xl border flex flex-col"
            style={{ backgroundColor: '#0F1623', borderColor: '#2e3352', maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#2e3352' }}>
              <div>
                <h3 className="text-[15px] font-bold text-white">Importar cotización</h3>
                <p className="text-[11px] text-[#8892a4] mt-0.5">
                  {preview.length} hoja{preview.length !== 1 ? 's' : ''} detectada{preview.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-[#8892a4] hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Versions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {preview.map((v, i) => {
                const isSelected = previewSelected.has(i)
                const isExpanded = previewExpandedIdx === i
                const r = (v as any).resumen

                return (
                  <div key={i} className="rounded-xl border"
                    style={{ borderColor: isSelected ? '#EAB308' : '#2e3352', backgroundColor: '#161B2E' }}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setPreviewExpandedIdx(isExpanded ? null : i)}>
                      <input type="checkbox" checked={isSelected} className="accent-yellow-400 w-4 h-4"
                        onChange={e => { e.stopPropagation(); setPreviewSelected(prev => { const n = new Set(prev); isSelected ? n.delete(i) : n.add(i); return n }) }}
                        onClick={e => e.stopPropagation()} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-white">{v.sheet_name}</span>
                          {v.version_label && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">
                              {v.version_label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8892a4] mt-0.5">
                          {v.partidas_flat.length} partidas
                          {r ? ` · CD: ${fmt(r.costo_directo)} · Total: ${fmt(r.total)}` : v.total_sin_igv ? ` · ${fmt(v.total_sin_igv)}` : ''}
                        </p>
                        {r && (
                          <p className="text-[10px] text-[#6366f1] mt-0.5">
                            GG 10% + Util 8% + IGV 18% incluidos
                          </p>
                        )}
                      </div>
                      <ChevronDown size={14} className={`text-[#8892a4] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-3" style={{ borderColor: '#2e3352' }}>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-[#8892a4]">
                              <th className="text-left py-1 pr-3 font-medium">Código</th>
                              <th className="text-left py-1 pr-3 font-medium">Descripción</th>
                              <th className="text-right py-1 pr-2 font-medium">Unid</th>
                              <th className="text-right py-1 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.partidas_flat.slice(0, 12).map((p, j) => (
                              <tr key={j}>
                                <td className="py-0.5 pr-3 font-mono text-[#8892a4]">{p.codigo}</td>
                                <td className="py-0.5 pr-3 text-gray-300 truncate max-w-[220px]"
                                  style={{ paddingLeft: `${(p.nivel - 1) * 8}px` }}>
                                  {p.descripcion}
                                </td>
                                <td className="py-0.5 pr-2 text-right text-[#8892a4]">{p.unidad ?? ''}</td>
                                <td className="py-0.5 text-right text-gray-300">
                                  {p.total > 0 ? fmt(p.total) : ''}
                                </td>
                              </tr>
                            ))}
                            {v.partidas_flat.length > 12 && (
                              <tr><td colSpan={4} className="py-1 text-[#8892a4] text-center">
                                … {v.partidas_flat.length - 12} partidas más
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#2e3352' }}>
              <p className="text-[12px] text-[#8892a4]">{previewSelected.size} de {preview.length} seleccionadas</p>
              <div className="flex gap-2">
                <button onClick={() => setPreview(null)}
                  className="px-4 py-2 rounded-lg text-[12px] text-[#8892a4] border hover:border-[#8892a4] transition-colors"
                  style={{ borderColor: '#2e3352', backgroundColor: '#161B2E' }}>
                  Cancelar
                </button>
                <button onClick={confirmImport}
                  disabled={importing || previewSelected.size === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
                  style={{ backgroundColor: '#EAB308' }}>
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Importar {previewSelected.size} versión{previewSelected.size !== 1 ? 'es' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
