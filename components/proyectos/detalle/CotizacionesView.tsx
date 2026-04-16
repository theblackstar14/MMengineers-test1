'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown, ChevronRight, Upload,
  Loader2, CheckCircle2, X
} from 'lucide-react'

import type { CotizacionParseada } from '@/lib/excel/parseCotizacion'

// ─── TYPES ────────────────────────────────────────────────────────

interface Partida {
  id: string
  parent_id?: string | null
  codigo: string
  nombre: string
  nivel: number
  unidad?: string | null
  metrado?: number | null
  precio_unitario?: number | null
  total: number
  children?: Partida[]
}

// ─── HELPERS ──────────────────────────────────────────────────────

function normalizeCodigo(codigo: string) {
  return codigo.split('.').filter(s => s !== '' && s !== '0').join('.')
}

function isSummaryRow(p: Partida) {
  const d = (p.nombre ?? '').toUpperCase()
  return /\b(TOTAL|SUBTOTAL|IGV|RESUMEN)\b/i.test(d)
}

function fmtSoles(n: number) {
  return `S/. ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function buildTree(flat: Partida[]) {
  const map = new Map<string, Partida>()
  const roots: Partida[] = []

  flat.forEach(p => {
    map.set(p.id, { ...p, children: [] })
  })

  flat.forEach(p => {
    const node = map.get(p.id)!
    if (p.parent_id) {
      map.get(p.parent_id)?.children?.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

// ─── ROW ──────────────────────────────────────────────────────────

function Row({ p, total, expanded, toggle, depth = 0 }: any) {
  const hasChildren = p.children?.length > 0
  const open = expanded.has(p.id)

  return (
    <>
      <tr onClick={() => hasChildren && toggle(p.id)} className="hover:bg-white/5">
        <td className="pl-2 text-xs text-gray-500">{p.codigo}</td>

        <td>
          <div style={{ paddingLeft: depth * 14 }}>
            {hasChildren && (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
            {p.nombre}
          </div>
        </td>

        <td className="text-right">{p.unidad}</td>
        <td className="text-right">{p.metrado?.toFixed(2)}</td>
        <td className="text-right">{p.precio_unitario?.toFixed(2)}</td>
        <td className="text-right text-yellow-400">{fmtSoles(p.total)}</td>
        <td className="text-right text-xs">
          {total > 0 ? ((p.total / total) * 100).toFixed(1) : 0}%
        </td>
      </tr>

      {hasChildren && open && p.children.map((c: any) => (
        <Row key={c.id} p={c} total={total} expanded={expanded} toggle={toggle} depth={depth + 1} />
      ))}
    </>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────

export function CotizacionesView({ cotizacionesDB, proyectoId }: any) {

  const fileRef = useRef<HTMLInputElement>(null)

  // Local state so list updates without F5
  const [cotizaciones, setCotizaciones] = useState<any[]>(cotizacionesDB ?? [])
  const [selectedId, setSelectedId] = useState(cotizacionesDB?.[0]?.id ?? '')
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [expanded, setExpanded] = useState(new Set<string>())

  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const [preview, setPreview] = useState<CotizacionParseada[] | null>(null)
  const [previewSelected, setPreviewSelected] = useState<Set<number>>(new Set())
  const [previewExpandedIdx, setPreviewExpandedIdx] = useState<number | null>(0)

  // ─── LOAD PARTIDAS ──────────────────────────────────────────────

  async function loadPartidas(id: string) {
    setLoading(true)

    const res = await fetch(`/api/cotizaciones/${id}/partidas`)
    const json = await res.json()

    const flat = (json.partidas ?? []).map((p: Partida) => ({
      ...p,
      codigo: normalizeCodigo(p.codigo),
    }))

    setPartidas(buildTree(flat))

    const exp = new Set<string>()
    flat.forEach((p: Partida) => {
      if (p.nivel <= 2) exp.add(p.id)
    })
    setExpanded(exp)

    setLoading(false)
  }

  useEffect(() => {
    if (selectedId) loadPartidas(selectedId)
  }, [selectedId])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const total = partidas
    .filter(p => !isSummaryRow(p))
    .reduce((s, p) => s + p.total, 0)

  // ─── IMPORT (DRAG & DROP + INPUT) ───────────────────────────────

  async function handleImport(file: File) {
    setImporting(true)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/cotizaciones/import', {
      method: 'POST',
      body: fd,
    })

    const json = await res.json()

    if (!res.ok) {
      alert(json.error)
      setImporting(false)
      return
    }

    const versiones: CotizacionParseada[] = json.versiones
    setPreview(versiones)
    setPreviewSelected(new Set(versiones.map((_: unknown, i: number) => i)))
    setPreviewExpandedIdx(0)
    setImporting(false)
  }

  // ─── CONFIRM (GUARDAR) ──────────────────────────────────────────

  async function confirmImport() {
    if (!preview) return

    const toImport = preview.filter((_, i) => previewSelected.has(i))
    if (!toImport.length) return

    setImporting(true)

    const res = await fetch('/api/cotizaciones/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto_id: proyectoId, versiones: toImport }),
    })

    const json = await res.json()

    if (!res.ok) {
      alert(json.error)
      setImporting(false)
      return
    }

    // Fetch updated cotizaciones list from DB — no F5 needed
    const updated = await fetch(`/api/proyectos/${proyectoId}/cotizaciones`)
    if (updated.ok) {
      const data = await updated.json()
      setCotizaciones(data.cotizaciones ?? [])
      const firstNew = json.created?.[0]?.id
      if (firstNew) setSelectedId(firstNew)
    }

    setPreview(null)
    setImporting(false)
  }

  // ─── DRAG DROP ──────────────────────────────────────────────────

  function onDrop(e: any) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImport(file)
  }

  // ─── UI ─────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">

      {/* LEFT */}
      <div className="w-64 border-r border-[#1E293B]">

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="p-4 border-b border-[#1E293B] text-center cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mx-auto mb-2" />
          <p className="text-xs text-gray-400">
            Drag & Drop o click
          </p>

          <input
            type="file"
            hidden
            ref={fileRef}
            accept=".xlsx,.xls"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
            }}
          />
        </div>

        {cotizaciones.map((c: any) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="p-3 border-b cursor-pointer hover:bg-white/5 transition-colors"
            style={{
              borderColor: '#1E293B',
              borderLeft: selectedId === c.id ? '3px solid #EAB308' : '3px solid transparent',
              backgroundColor: selectedId === c.id ? 'rgba(234,179,8,0.05)' : undefined,
            }}
          >
            <p className={`text-[12px] font-semibold ${selectedId === c.id ? 'text-white' : 'text-gray-300'}`}>{c.nombre}</p>
            <p className={`text-[13px] font-bold mt-0.5 ${selectedId === c.id ? 'text-yellow-400' : 'text-gray-400'}`}>{fmtSoles(c.total ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-auto">

        {/* PREVIEW MODAL OVERLAY */}
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
            <div className="w-full max-w-2xl rounded-2xl border flex flex-col" style={{ backgroundColor: '#0F1623', borderColor: '#1E293B', maxHeight: '85vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1E293B' }}>
                <div>
                  <h3 className="text-[15px] font-bold text-white">Importar cotización desde Excel</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{preview.length} hoja{preview.length !== 1 ? 's' : ''} detectada{preview.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>

              {/* Versions list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {preview.map((v, i) => {
                  const isSelected = previewSelected.has(i)
                  const isExpanded = previewExpandedIdx === i
                  return (
                    <div key={i} className="rounded-xl border" style={{ borderColor: isSelected ? '#EAB308' : '#1E293B', backgroundColor: '#161B2E' }}>
                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setPreviewExpandedIdx(isExpanded ? null : i)}>
                        <input type="checkbox" checked={isSelected} className="accent-yellow-400 w-4 h-4"
                          onChange={e => { e.stopPropagation(); setPreviewSelected(prev => { const n = new Set(prev); isSelected ? n.delete(i) : n.add(i); return n }) }}
                          onClick={e => e.stopPropagation()} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-white">{v.sheet_name}</span>
                            {v.version_label && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">{v.version_label}</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {v.partidas_flat.length} partidas
                            {v.total_sin_igv ? ` · S/. ${v.total_sin_igv.toLocaleString('es-PE')}` : ''}
                            {v.cliente ? ` · ${v.cliente}` : ''}
                          </p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      {isExpanded && (
                        <div className="border-t px-4 py-3" style={{ borderColor: '#1E293B' }}>
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="text-gray-600">
                                <th className="text-left py-1 pr-3 font-medium">Código</th>
                                <th className="text-left py-1 pr-3 font-medium">Descripción</th>
                                <th className="text-right py-1 pr-2 font-medium">Unid</th>
                                <th className="text-right py-1 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.partidas_flat.slice(0, 10).map((p, j) => (
                                <tr key={j}>
                                  <td className="py-0.5 pr-3 font-mono text-gray-500">{p.codigo}</td>
                                  <td className="py-0.5 pr-3 text-gray-300 truncate max-w-[200px]" style={{ paddingLeft: `${(p.nivel - 1) * 8}px` }}>{p.descripcion}</td>
                                  <td className="py-0.5 pr-2 text-right text-gray-600">{p.unidad ?? ''}</td>
                                  <td className="py-0.5 text-right text-gray-400">{(p.parcial ?? p.total)?.toLocaleString('es-PE') ?? ''}</td>
                                </tr>
                              ))}
                              {v.partidas_flat.length > 10 && (
                                <tr><td colSpan={4} className="py-1 text-gray-600 text-center">… {v.partidas_flat.length - 10} partidas más</td></tr>
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
              <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#1E293B' }}>
                <p className="text-[12px] text-gray-500">{previewSelected.size} de {preview.length} seleccionadas</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg text-[12px] text-gray-400 border hover:border-gray-500" style={{ borderColor: '#1E293B', backgroundColor: '#161B2E' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmImport} disabled={importing || previewSelected.size === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-black disabled:opacity-50"
                    style={{ backgroundColor: '#EAB308' }}>
                    {importing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Importar {previewSelected.size} versión{previewSelected.size !== 1 ? 'es' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE */}
        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin inline" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-[#1E293B]">
                <th>Código</th>
                <th>Descripción</th>
                <th>Unid</th>
                <th>Metrado</th>
                <th>P.U</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>

            <tbody>
              {partidas.map(p => (
                <Row key={p.id} p={p} total={total} expanded={expanded} toggle={toggle} />
              ))}

              <tr className="border-t border-[#1E293B]">
                <td colSpan={5} className="text-right">TOTAL</td>
                <td className="text-yellow-400">{fmtSoles(total)}</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}