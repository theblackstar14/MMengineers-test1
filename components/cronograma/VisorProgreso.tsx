'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Upload, Loader2, Search, Trash2, FileText,
  RefreshCw, Calendar, AlertTriangle, TrendingUp, Zap, Eye,
  Maximize2, Image as ImageIcon, ChevronsDownUp, ChevronsUpDown,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { CronogramaDB, TareaDB, RelacionDB } from '@/lib/queries/progreso'
import type { GanttHandle } from './GanttChart'

const GanttChart = dynamic(
  () => import('./GanttChart').then(m => m.GanttChart),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-[#8892a4]">Cargando Gantt…</div> }
)

type Zoom = 'day' | 'week' | 'month' | 'quarter'

interface Props {
  proyectoId: string
  proyectoNombre: string
  initial: {
    cronogramas: CronogramaDB[]
    activo: CronogramaDB | null
    tareas: TareaDB[]
    relaciones: RelacionDB[]
  }
}

type UploadStage =
  | 'idle'
  | 'uploading'
  | 'converting'
  | 'parsing'
  | 'saving'
  | 'done'
  | 'error'

const STAGE_TEXT: Record<UploadStage, string> = {
  idle:       '',
  uploading:  '📤 Subiendo archivo…',
  converting: '🔄 Convirtiendo .mpp → XML…',
  parsing:    '📊 Extrayendo tareas…',
  saving:     '💾 Guardando cronograma…',
  done:       '✨ Listo',
  error:      '⚠️ Error',
}

export function VisorProgreso({ proyectoId, proyectoNombre, initial }: Props) {
  const [cronogramas, setCronogramas] = useState<CronogramaDB[]>(initial.cronogramas)
  const [activo,      setActivo]      = useState<CronogramaDB | null>(initial.activo)
  const [tareas,      setTareas]      = useState<TareaDB[]>(initial.tareas)
  const [relaciones,  setRelaciones]  = useState<RelacionDB[]>(initial.relaciones)

  const [stage, setStage]           = useState<UploadStage>('idle')
  const [stageMsg, setStageMsg]     = useState('')
  const [dragging, setDragging]     = useState(false)

  const [zoom, setZoom]             = useState<Zoom>('week')
  const [showCritical, setCritical] = useState(true)
  const [showBaseline, setBaseline] = useState(false)
  const [search, setSearch]         = useState('')
  const [selectedTask, setSelected] = useState<TareaDB | null>(null)

  const ganttHandleRef = useRef<GanttHandle | null>(null)
  const [exporting, setExporting] = useState(false)

  const onGanttReady = useCallback((h: GanttHandle) => { ganttHandleRef.current = h }, [])

  const handleExpandAll   = () => ganttHandleRef.current?.expandAll()
  const handleCollapseAll = () => ganttHandleRef.current?.collapseAll()
  const handleFullscreen  = () => ganttHandleRef.current?.toggleFullscreen()
  const handleExportPng   = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const name = activo?.nombre ? `${activo.nombre}-${Date.now()}.png` : `cronograma-${Date.now()}.png`
      await ganttHandleRef.current?.exportPng(name)
    } finally {
      setExporting(false)
    }
  }

  const empty = cronogramas.length === 0

  // ── Stats ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!tareas.length) return null
    const leaf = tareas.filter(t => !t.is_summary)
    const total = leaf.length
    const done  = leaf.filter(t => (t.percent_complete ?? 0) >= 100).length
    const avg   = total ? Math.round(leaf.reduce((s, t) => s + (t.percent_complete ?? 0), 0) / total) : 0
    const today = new Date()
    const late  = leaf.filter(t => {
      const end = t.end_date ? new Date(t.end_date) : null
      return end && end < today && (t.percent_complete ?? 0) < 100
    })
    const critical = leaf.filter(t => t.is_critical).length
    const milestones = leaf.filter(t => t.is_milestone).length

    const starts = leaf.map(t => t.start_date).filter(Boolean) as string[]
    const ends   = leaf.map(t => t.end_date).filter(Boolean) as string[]
    const minStart = starts.length ? new Date(Math.min(...starts.map(s => +new Date(s)))) : null
    const maxEnd   = ends.length   ? new Date(Math.max(...ends.map(s   => +new Date(s))))  : null
    const daysRemaining = maxEnd ? Math.ceil((+maxEnd - +today) / 86400000) : null

    return { total, done, avg, late, critical, milestones, minStart, maxEnd, daysRemaining }
  }, [tareas])

  // ── Upload ───────────────────────────────────────
  const doUpload = useCallback(async (file: File, replace = false) => {
    setStage('uploading')
    setStageMsg(STAGE_TEXT.uploading)
    const fd = new FormData()
    fd.append('proyecto_id', proyectoId)
    fd.append('file', file)
    if (replace) fd.append('replace_version', '1')

    try {
      // Simulate stages (server does it all at once, we cycle UI)
      const stageTimer = setTimeout(() => { setStage('converting'); setStageMsg(STAGE_TEXT.converting) }, 400)
      const stageTimer2 = setTimeout(() => { setStage('parsing');   setStageMsg(STAGE_TEXT.parsing)   }, 1800)
      const stageTimer3 = setTimeout(() => { setStage('saving');    setStageMsg(STAGE_TEXT.saving)    }, 3200)

      const res = await fetch('/api/progreso/upload', { method: 'POST', body: fd })
      clearTimeout(stageTimer); clearTimeout(stageTimer2); clearTimeout(stageTimer3)

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Error desconocido' }))
        setStage('error')
        setStageMsg(`⚠️ ${j.error || 'Error desconocido'}`)
        setTimeout(() => { setStage('idle'); setStageMsg('') }, 4000)
        return
      }

      setStage('done')
      setStageMsg(STAGE_TEXT.done)

      // Fetch fresh data
      const fresh = await fetch(`/api/progreso/${proyectoId}`).then(r => r.json())
      setCronogramas(fresh.cronogramas ?? [])
      setActivo(fresh.cronogramas?.[0] ?? null)
      setTareas(fresh.tareas ?? [])
      setRelaciones(fresh.relaciones ?? [])

      setTimeout(() => { setStage('idle'); setStageMsg('') }, 1500)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setStage('error')
      setStageMsg(`⚠️ ${msg}`)
      setTimeout(() => { setStage('idle'); setStageMsg('') }, 4000)
    }
  }, [proyectoId])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) doUpload(f)
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) doUpload(f)
  }

  const onDeleteAll = async () => {
    if (!confirm('¿Eliminar todos los cronogramas del proyecto?')) return
    await fetch(`/api/progreso/${proyectoId}`, { method: 'DELETE' })
    setCronogramas([]); setActivo(null); setTareas([]); setRelaciones([])
  }

  // ── Render ───────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: '#0f1117' }}>
      {/* ── Header ─── */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2e3352' }}>
        <div className="flex items-center gap-3">
          <Link href={`/proyectos/${proyectoId}`}
            className="flex items-center gap-1 text-[12px] text-[#8892a4] hover:text-white transition-colors">
            <ChevronLeft size={14} /> Proyecto
          </Link>
          <span className="text-[#2e3352]">/</span>
          <span className="text-[13px] text-[#818cf8] font-semibold">Progreso</span>
          <span className="text-[12px] text-[#8892a4]">{proyectoNombre}</span>
        </div>

        {!empty && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded border"
              style={{ borderColor: '#2e3352', background: '#12151e' }}>
              {(['day','week','month','quarter'] as Zoom[]).map(z => (
                <button key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-all ${
                    zoom === z
                      ? 'bg-[#6366f1] text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'text-[#8892a4] hover:text-white'
                  }`}>
                  {z === 'day' ? 'Día' : z === 'week' ? 'Sem' : z === 'month' ? 'Mes' : 'Trim'}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-[11px] cursor-pointer transition-colors"
              style={{ borderColor: showCritical ? '#ef4444' : '#2e3352', background: showCritical ? 'rgba(239,68,68,0.1)' : '#12151e', color: showCritical ? '#fca5a5' : '#8892a4' }}>
              <input type="checkbox" checked={showCritical} onChange={e => setCritical(e.target.checked)} className="hidden" />
              <Zap size={12} /> Ruta crítica
            </label>

            <label className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-[11px] cursor-pointer"
              style={{ borderColor: showBaseline ? '#6366f1' : '#2e3352', background: showBaseline ? 'rgba(99,102,241,0.1)' : '#12151e', color: showBaseline ? '#a5b4fc' : '#8892a4' }}>
              <input type="checkbox" checked={showBaseline} onChange={e => setBaseline(e.target.checked)} className="hidden" />
              <Eye size={12} /> Baseline
            </label>

            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8892a4]" />
              <input
                type="text" placeholder="Buscar tarea…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-[11px] rounded border bg-[#12151e] text-white placeholder-[#5a6278] focus:outline-none focus:border-[#6366f1] w-[180px]"
                style={{ borderColor: '#2e3352' }}
              />
            </div>

            <div className="flex items-center gap-1 px-1 py-0.5 rounded border"
              style={{ borderColor: '#2e3352', background: '#12151e' }}>
              <button onClick={handleExpandAll}
                title="Expandir todas"
                className="p-1.5 rounded text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.1)] transition-colors">
                <ChevronsUpDown size={14} />
              </button>
              <button onClick={handleCollapseAll}
                title="Colapsar todas"
                className="p-1.5 rounded text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.1)] transition-colors">
                <ChevronsDownUp size={14} />
              </button>
            </div>

            <button onClick={handleFullscreen}
              title="Pantalla completa"
              className="p-1.5 rounded border text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.1)] transition-colors"
              style={{ borderColor: '#2e3352' }}>
              <Maximize2 size={13} />
            </button>

            <button onClick={handleExportPng}
              disabled={exporting}
              title="Exportar PNG"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] bg-[#06b6d4] text-white hover:bg-[#0891b2] transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
              {exporting ? 'Exportando…' : 'PNG'}
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] cursor-pointer bg-[#6366f1] text-white hover:bg-[#4f46e5] transition-colors">
              <RefreshCw size={12} /> Re-importar
              <input type="file" accept=".mpp,.xml" className="hidden" onChange={onFileInput} />
            </label>

            <button onClick={onDeleteAll}
              className="p-1.5 rounded border text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
              style={{ borderColor: '#2e3352' }} title="Eliminar cronograma">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Empty state ─── */}
      {empty && stage === 'idle' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="block cursor-pointer transition-all"
            style={{
              width: '100%', maxWidth: 640, padding: 48,
              border: `2px dashed ${dragging ? '#6366f1' : '#2e3352'}`,
              borderRadius: 12,
              background: dragging ? 'rgba(99,102,241,0.06)' : '#12151e',
              boxShadow: dragging ? '0 0 40px rgba(99,102,241,0.2)' : 'none',
              textAlign: 'center',
            }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
                <Upload size={28} color="#fff" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white mb-1">Arrastra tu archivo .mpp aquí</div>
                <div className="text-[12px] text-[#8892a4]">o click para seleccionar</div>
              </div>
              <div className="text-[10px] text-[#5a6278] px-4 py-2 rounded-full border" style={{ borderColor: '#2e3352' }}>
                MS Project 2007+ · también acepta .xml
              </div>
            </div>
            <input type="file" accept=".mpp,.xml" className="hidden" onChange={onFileInput} />
          </label>
        </div>
      )}

      {/* ── Upload in progress ─── */}
      {stage !== 'idle' && stage !== 'done' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-6 max-w-md w-full">
            <div className="relative">
              <Loader2 size={48} className="animate-spin" color="#6366f1" />
              {stage === 'error' && (
                <AlertTriangle size={48} className="absolute top-0 left-0" color="#ef4444" />
              )}
            </div>
            <div className="text-center">
              <div className="text-[14px] font-semibold text-white mb-2">{stageMsg}</div>
              <div className="text-[11px] text-[#8892a4]">Esto puede tomar unos segundos…</div>
            </div>
            <div className="w-full h-1 rounded overflow-hidden" style={{ background: '#12151e' }}>
              <div className="h-full rounded transition-all"
                style={{
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  width: stage === 'uploading' ? '20%' : stage === 'converting' ? '45%' : stage === 'parsing' ? '70%' : stage === 'saving' ? '90%' : '100%',
                  boxShadow: '0 0 12px rgba(99,102,241,0.6)',
                }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Loaded: Gantt + panels ─── */}
      {!empty && stage === 'idle' && (
        <div className="flex-1 flex min-h-0">
          {/* Left panel: stats */}
          <aside className="w-[220px] shrink-0 border-r p-3 flex flex-col gap-3 overflow-y-auto"
            style={{ borderColor: '#2e3352', background: '#12151e' }}>
            <div className="text-[10px] font-semibold text-[#8892a4] uppercase tracking-wider mb-1">Resumen</div>

            {stats && (
              <>
                <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                  <div className="flex items-center gap-1 text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">
                    <TrendingUp size={10} /> Avance
                  </div>
                  <div className="text-[24px] font-bold text-[#06b6d4]">{stats.avg}%</div>
                  <div className="text-[10px] text-[#8892a4]">{stats.done}/{stats.total} completadas</div>
                  <div className="mt-2 h-1 rounded overflow-hidden" style={{ background: '#0f1117' }}>
                    <div className="h-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]" style={{ width: `${stats.avg}%` }} />
                  </div>
                </div>

                <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                  <div className="flex items-center gap-1 text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">
                    <Calendar size={10} /> Plazo
                  </div>
                  <div className="text-[18px] font-bold text-white">
                    {stats.daysRemaining != null ? (stats.daysRemaining >= 0 ? `${stats.daysRemaining}d` : `-${Math.abs(stats.daysRemaining)}d`) : '—'}
                  </div>
                  <div className="text-[10px] text-[#8892a4]">
                    {stats.daysRemaining == null ? '' : stats.daysRemaining >= 0 ? 'restantes' : 'vencido'}
                  </div>
                </div>

                {stats.late.length > 0 && (
                  <div className="rounded p-3 border" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <div className="flex items-center gap-1 text-[10px] text-[#fca5a5] uppercase tracking-wider mb-1">
                      <AlertTriangle size={10} /> Atrasadas
                    </div>
                    <div className="text-[22px] font-bold text-[#ef4444]">{stats.late.length}</div>
                    <div className="text-[10px] text-[#fca5a5]">tareas fuera de plazo</div>
                  </div>
                )}

                <div className="rounded p-3 border" style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                  <div className="flex items-center gap-1 text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">
                    <Zap size={10} /> Crítica
                  </div>
                  <div className="text-[18px] font-bold text-[#fca5a5]">{stats.critical}</div>
                  <div className="text-[10px] text-[#8892a4]">tareas ruta crítica</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded p-2 border" style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                    <div className="text-[9px] text-[#8892a4]">HITOS</div>
                    <div className="text-[16px] font-bold text-[#f59e0b]">{stats.milestones}</div>
                  </div>
                  <div className="rounded p-2 border" style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                    <div className="text-[9px] text-[#8892a4]">REL.</div>
                    <div className="text-[16px] font-bold text-[#a5b4fc]">{relaciones.length}</div>
                  </div>
                </div>
              </>
            )}

            {cronogramas.length > 1 && (
              <div>
                <div className="text-[10px] font-semibold text-[#8892a4] uppercase tracking-wider mb-2 mt-2">Versiones</div>
                <div className="flex flex-col gap-1">
                  {cronogramas.map(c => (
                    <button key={c.id}
                      onClick={async () => {
                        const { tareas: T, relaciones: R } = await fetch(`/api/progreso/${proyectoId}`).then(r => r.json())
                        setActivo(c); setTareas(T); setRelaciones(R)
                      }}
                      className={`text-left text-[11px] px-2 py-1.5 rounded border transition-colors ${
                        activo?.id === c.id
                          ? 'border-[#6366f1] bg-[rgba(99,102,241,0.1)] text-white'
                          : 'border-[#2e3352] text-[#8892a4] hover:text-white'
                      }`}>
                      <div className="font-semibold">v{c.version}</div>
                      <div className="text-[9px] opacity-80 truncate">{c.archivo_nombre}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Gantt */}
          <div className="flex-1 min-w-0 relative">
            <GanttChart
              tareas={tareas}
              relaciones={relaciones}
              zoom={zoom}
              showCritical={showCritical}
              showBaseline={showBaseline}
              searchTerm={search}
              onReady={onGanttReady}
              onTaskClick={(id) => {
                const dbId = id.split(':')[1]
                const uid = Number(dbId)
                const t = tareas.find(x => x.uid === uid) || null
                setSelected(t)
              }}
            />
          </div>

          {/* Right: task detail panel */}
          {selectedTask && (
            <aside className="w-[320px] shrink-0 border-l overflow-y-auto"
              style={{ borderColor: '#2e3352', background: '#12151e' }}>
              <div className="sticky top-0 flex items-center justify-between p-3 border-b"
                style={{ borderColor: '#2e3352', background: '#1a1d27' }}>
                <div className="flex items-center gap-2">
                  <FileText size={14} color="#818cf8" />
                  <span className="text-[11px] font-semibold text-[#a5b4fc] uppercase tracking-wider">Detalle</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#8892a4] hover:text-white">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <div className="text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">{selectedTask.outline_number || selectedTask.wbs || '—'}</div>
                  <div className="text-[14px] font-semibold text-white">{selectedTask.nombre}</div>
                </div>
                <Field label="Inicio" value={fmtDate(selectedTask.start_date)} />
                <Field label="Fin" value={fmtDate(selectedTask.end_date)} />
                <Field label="Duración" value={selectedTask.duration_days != null ? `${selectedTask.duration_days} días` : '—'} />
                <Field label="Avance" value={`${Math.round(selectedTask.percent_complete ?? 0)}%`} />
                {selectedTask.is_milestone && <Tag color="#f59e0b" text="Hito" />}
                {selectedTask.is_critical  && <Tag color="#ef4444" text="Ruta crítica" />}
                {selectedTask.is_summary   && <Tag color="#64748b" text="Resumen" />}
                {selectedTask.responsable  && <Field label="Responsable" value={selectedTask.responsable} />}
                {selectedTask.costo_plan != null && <Field label="Costo plan" value={`S/ ${selectedTask.costo_plan.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} />}
                {selectedTask.notas && (
                  <div>
                    <div className="text-[10px] text-[#8892a4] uppercase tracking-wider mb-1">Notas</div>
                    <div className="text-[11px] text-[#c7d2fe] whitespace-pre-wrap p-2 rounded border" style={{ borderColor: '#2e3352', background: '#0f1117' }}>
                      {selectedTask.notas}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#8892a4] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[12px] text-[#e2e8f0]">{value}</div>
    </div>
  )
}

function Tag({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ color, background: `${color}22`, border: `1px solid ${color}55`, width: 'fit-content' }}>
      {text}
    </span>
  )
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
