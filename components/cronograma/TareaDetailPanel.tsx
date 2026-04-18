'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  X, Upload, Trash2, Search, Link2, Link2Off, Loader2,
  MessageSquare, Send, Camera, Eye, FileText,
} from 'lucide-react'
import type { TareaDB } from '@/lib/queries/progreso'

interface PartidaLite {
  id: string
  codigo: string
  nombre: string
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  total: number | null
  cotizacion_label?: string
}

interface FotoLite {
  id: string
  signed_url: string | null
  descripcion: string | null
  size_bytes: number | null
  tomada_at: string | null
  created_at: string
}

interface ComentarioLite {
  id: string
  texto: string
  created_at: string
  created_by: string | null
  profiles: { nombre: string | null; apellido: string | null; avatar_url: string | null } | null
}

interface Props {
  tarea: TareaDB
  proyectoId: string
  onClose: () => void
  onAvanceChanged: (tareaId: string, percent: number) => void
  onPartidaChanged?: (tareaId: string, partidaId: string | null) => void
}

export function TareaDetailPanel({ tarea, proyectoId, onClose, onAvanceChanged, onPartidaChanged }: Props) {
  const [partida, setPartida] = useState<PartidaLite | null>(null)
  const [fotos, setFotos]         = useState<FotoLite[]>([])
  const [comentarios, setComs]    = useState<ComentarioLite[]>([])
  const [loading, setLoading]     = useState(true)

  const [avance, setAvance]       = useState<number>(tarea.percent_complete ?? 0)
  const [savingAvance, setSavAv]  = useState(false)

  const [query, setQuery]         = useState('')
  const [options, setOptions]     = useState<PartidaLite[]>([])
  const [showDrop, setShowDrop]   = useState(false)
  const [linking, setLinking]     = useState(false)

  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox]   = useState<string | null>(null)

  const [newCom, setNewCom]       = useState('')
  const [sending, setSending]     = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const avanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch detail on tarea change ──
  useEffect(() => {
    setLoading(true)
    setAvance(tarea.percent_complete ?? 0)
    fetch(`/api/progreso/tareas/${tarea.id}`)
      .then(r => r.json())
      .then(d => {
        setPartida(d.partida ?? null)
        setFotos(d.fotos ?? [])
        setComs(d.comentarios ?? [])
      })
      .finally(() => setLoading(false))
  }, [tarea.id, tarea.percent_complete])

  // ── Autocomplete partidas ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!showDrop) return
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/progreso/${proyectoId}/partidas?q=${encodeURIComponent(query)}`)
      const d = await r.json()
      setOptions(d.partidas ?? [])
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, showDrop, proyectoId])

  // ── Avance autosave (debounced) ──
  const commitAvance = useCallback(async (pct: number) => {
    setSavAv(true)
    try {
      const r = await fetch(`/api/progreso/tareas/${tarea.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ percent_complete: pct }),
      })
      if (r.ok) onAvanceChanged(tarea.id, pct)
    } finally {
      setSavAv(false)
    }
  }, [tarea.id, onAvanceChanged])

  const onAvanceInput = (v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    setAvance(clamped)
    if (avanceTimer.current) clearTimeout(avanceTimer.current)
    avanceTimer.current = setTimeout(() => commitAvance(clamped), 400)
  }

  // ── Link / unlink partida ──
  const linkPartida = async (p: PartidaLite | null) => {
    setLinking(true)
    try {
      const r = await fetch(`/api/progreso/tareas/${tarea.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ partida_id: p?.id ?? null }),
      })
      if (r.ok) {
        setPartida(p)
        setShowDrop(false)
        setQuery('')
        onPartidaChanged?.(tarea.id, p?.id ?? null)
      }
    } finally {
      setLinking(false)
    }
  }

  // ── Upload fotos ──
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch(`/api/progreso/tareas/${tarea.id}/fotos`, { method: 'POST', body: fd })
        if (r.ok) {
          const d = await r.json()
          setFotos(prev => [d.foto, ...prev])
        }
      }
    } finally {
      setUploading(false)
    }
  }

  const deleteFoto = async (id: string) => {
    if (!confirm('¿Eliminar foto?')) return
    const r = await fetch(`/api/progreso/fotos/${id}`, { method: 'DELETE' })
    if (r.ok) setFotos(prev => prev.filter(f => f.id !== id))
  }

  // ── Comentarios ──
  const sendComment = async () => {
    const texto = newCom.trim()
    if (!texto) return
    setSending(true)
    try {
      const r = await fetch(`/api/progreso/tareas/${tarea.id}/comentarios`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      if (r.ok) {
        const d = await r.json()
        setComs(prev => [...prev, d.comentario])
        setNewCom('')
      }
    } finally {
      setSending(false)
    }
  }

  const deleteComment = async (id: string) => {
    const r = await fetch(`/api/progreso/comentarios/${id}`, { method: 'DELETE' })
    if (r.ok) setComs(prev => prev.filter(c => c.id !== id))
  }

  // ── Valorizado ──
  const valorizado = partida?.total != null
    ? (partida.total * avance) / 100
    : null
  const fmtSoles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <aside className="w-[360px] shrink-0 border-l overflow-y-auto flex flex-col"
      style={{ borderColor: '#2e3352', background: '#12151e' }}>
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between p-3 border-b z-10"
        style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
        <div className="flex items-center gap-2">
          <FileText size={14} color="#818cf8" />
          <span className="text-[11px] font-semibold text-[#a5b4fc] uppercase tracking-wider">Detalle</span>
        </div>
        <button onClick={onClose} className="text-[#8892a4] hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Título */}
        <div>
          <div className="text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">
            {tarea.outline_number || tarea.wbs || '—'}
          </div>
          <div className="text-[14px] font-semibold text-white">{tarea.nombre}</div>
        </div>

        {/* Avance */}
        <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#0f1117' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#8892a4] uppercase tracking-wider">Avance</span>
            <div className="flex items-center gap-1">
              {savingAvance && <Loader2 size={10} className="animate-spin text-[#6366f1]" />}
              <input type="number" min={0} max={100} value={avance}
                onChange={e => onAvanceInput(+e.target.value)}
                className="w-14 text-right bg-transparent text-[13px] text-white font-semibold border-b border-[#2e3352] focus:outline-none focus:border-[#6366f1]" />
              <span className="text-[12px] text-[#8892a4]">%</span>
            </div>
          </div>
          <input type="range" min={0} max={100} value={avance}
            onChange={e => onAvanceInput(+e.target.value)}
            className="w-full accent-[#06b6d4]" />
          <div className="mt-1 h-1.5 rounded overflow-hidden" style={{ background: '#1a1d27' }}>
            <div className="h-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4] transition-all"
              style={{ width: `${avance}%` }} />
          </div>
        </div>

        {/* Partida vinculada */}
        <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#0f1117' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#8892a4] uppercase tracking-wider flex items-center gap-1">
              <Link2 size={10} /> Partida vinculada
            </span>
            {partida && (
              <button onClick={() => linkPartida(null)}
                className="text-[10px] text-[#f87171] hover:text-[#ef4444] flex items-center gap-1"
                disabled={linking}>
                <Link2Off size={10} /> Desvincular
              </button>
            )}
          </div>

          {partida ? (
            <div className="flex flex-col gap-1">
              <div className="text-[11px] font-mono text-[#a5b4fc]">{partida.codigo}</div>
              <div className="text-[12px] text-white">{partida.nombre}</div>
              {partida.cotizacion_label && (
                <div className="text-[10px] text-[#8892a4]">{partida.cotizacion_label}</div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t" style={{ borderColor: '#2e3352' }}>
                <Stat label="Metrado" value={`${partida.metrado ?? 0} ${partida.unidad ?? ''}`} />
                <Stat label="PU" value={fmtSoles(partida.precio_unitario ?? 0)} />
                <Stat label="Total" value={fmtSoles(partida.total ?? 0)} />
              </div>
              {valorizado != null && (
                <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: '#2e3352' }}>
                  <span className="text-[10px] text-[#8892a4] uppercase tracking-wider">Valorizado ({avance}%)</span>
                  <span className="text-[13px] font-bold text-[#06b6d4]">{fmtSoles(valorizado)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8892a4]" />
                <input type="text" placeholder="Buscar partida por código o nombre…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  onFocus={() => setShowDrop(true)}
                  className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded border bg-[#1a1d27] text-white placeholder-[#5a6278] focus:outline-none focus:border-[#6366f1]"
                  style={{ borderColor: '#2e3352' }} />
              </div>
              {showDrop && (
                <div className="absolute top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded border z-20"
                  style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                  {options.length === 0 ? (
                    <div className="p-2 text-[11px] text-[#8892a4]">Sin resultados</div>
                  ) : options.map(p => (
                    <button key={p.id} onClick={() => linkPartida(p)}
                      className="w-full text-left px-2 py-1.5 hover:bg-[rgba(99,102,241,0.1)] border-b last:border-b-0"
                      style={{ borderColor: '#2e3352' }}>
                      <div className="text-[10px] font-mono text-[#a5b4fc]">{p.codigo}</div>
                      <div className="text-[11px] text-white truncate">{p.nombre}</div>
                      <div className="text-[9px] text-[#8892a4]">
                        {p.metrado} {p.unidad} · {fmtSoles(p.total ?? 0)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fotos */}
        <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#0f1117' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#8892a4] uppercase tracking-wider flex items-center gap-1">
              <Camera size={10} /> Fotos ({fotos.length})
            </span>
            <label className="text-[10px] text-[#a5b4fc] hover:text-white cursor-pointer flex items-center gap-1">
              {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
              {uploading ? 'Subiendo…' : 'Subir'}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => onFiles(e.target.files)} disabled={uploading} />
            </label>
          </div>

          {loading ? (
            <div className="text-[11px] text-[#8892a4]">Cargando…</div>
          ) : fotos.length === 0 ? (
            <div className="text-[11px] text-[#8892a4] text-center py-3">Sin fotos aún</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {fotos.map(f => (
                <div key={f.id} className="relative group aspect-square rounded overflow-hidden border"
                  style={{ borderColor: '#2e3352' }}>
                  {f.signed_url ? (
                    <Image src={f.signed_url} alt={f.descripcion ?? ''}
                      fill unoptimized
                      sizes="100px"
                      className="object-cover" />
                  ) : <div className="w-full h-full bg-[#1a1d27]" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {f.signed_url && (
                      <button onClick={() => setLightbox(f.signed_url)} className="p-1 rounded bg-[#6366f1] text-white">
                        <Eye size={12} />
                      </button>
                    )}
                    <button onClick={() => deleteFoto(f.id)} className="p-1 rounded bg-[#ef4444] text-white">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#0f1117' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#8892a4] uppercase tracking-wider flex items-center gap-1">
              <MessageSquare size={10} /> Comentarios ({comentarios.length})
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-2 max-h-48 overflow-y-auto">
            {comentarios.map(c => {
              const author = c.profiles
                ? `${c.profiles.nombre ?? ''} ${c.profiles.apellido ?? ''}`.trim() || 'Usuario'
                : 'Usuario'
              return (
                <div key={c.id} className="text-[11px] p-2 rounded border group relative"
                  style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#a5b4fc]">{author}</span>
                    <span className="text-[9px] text-[#8892a4]">{fmtDateShort(c.created_at)}</span>
                  </div>
                  <div className="text-[#e2e8f0] whitespace-pre-wrap">{c.texto}</div>
                  <button onClick={() => deleteComment(c.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[#f87171]">
                    <Trash2 size={10} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-1">
            <input type="text" placeholder="Añadir comentario…"
              value={newCom} onChange={e => setNewCom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
              className="flex-1 px-2 py-1.5 text-[11px] rounded border bg-[#1a1d27] text-white placeholder-[#5a6278] focus:outline-none focus:border-[#6366f1]"
              style={{ borderColor: '#2e3352' }} />
            <button onClick={sendComment} disabled={sending || !newCom.trim()}
              className="p-1.5 rounded bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:opacity-50">
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 cursor-zoom-out">
          <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
        </div>
      )}
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#8892a4] uppercase">{label}</div>
      <div className="text-[11px] text-white font-medium">{value}</div>
    </div>
  )
}

function fmtDateShort(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
