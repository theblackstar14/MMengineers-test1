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

  const [selectedId, setSelectedId] = useState('')
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [expanded, setExpanded] = useState(new Set<string>())

  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const [preview, setPreview] = useState<CotizacionParseada[] | null>(null)

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
    flat.forEach(p => {
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

    setPreview(json.versiones)
    setImporting(false)
  }

  // ─── CONFIRM (GUARDAR) ──────────────────────────────────────────

  async function confirmImport() {
    if (!preview) return

    setImporting(true)

    const res = await fetch('/api/cotizaciones/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto_id: proyectoId, versiones: preview }),
    })

    const json = await res.json()

    if (!res.ok) {
      alert(json.error)
      setImporting(false)
      return
    }

    // 🔥 actualizar lista SIN reload
    const nuevas = json.created.map((c: any, i: number) => ({
      id: c.cotizacion_id,
      nombre: `${c.nombre} (V${cotizacionesDB.length + i + 1})`,
      total: 0,
      proyecto_id: proyectoId,
    }))

    cotizacionesDB.push(...nuevas)

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

        {cotizacionesDB.map((c: any) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="p-3 border-b cursor-pointer hover:bg-white/5"
          >
            <p>{c.nombre}</p>
            <p className="text-xs text-gray-500">{fmtSoles(c.total)}</p>
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-auto">

        {/* PREVIEW */}
        {preview && (
          <div className="p-4 bg-[#0B1220] border-b border-yellow-500">

            <div className="flex justify-between mb-2">
              <p className="text-yellow-400">
                Preview: {preview.length} cotizaciones
              </p>

              <div className="flex gap-2">
                <button onClick={confirmImport} className="bg-green-600 px-3 py-1 text-xs">
                  <CheckCircle2 size={14} /> Confirmar
                </button>

                <button onClick={() => setPreview(null)} className="bg-red-600 px-3 py-1 text-xs">
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>

            {preview.map((v, i) => (
              <div key={i} className="text-xs text-gray-400">
                {v.sheet_name} — {v.partidas_flat.length} partidas
              </div>
            ))}
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