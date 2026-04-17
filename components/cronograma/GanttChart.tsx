'use client'

import { useEffect, useRef, useState } from 'react'
import type { TareaDB, RelacionDB } from '@/lib/queries/progreso'
import './gantt-dark.css'

export interface GanttHandle {
  expandAll: () => void
  collapseAll: () => void
  exportPng: (filename?: string) => Promise<void>
  toggleFullscreen: () => void
  getContainer: () => HTMLDivElement | null
}

interface Props {
  tareas: TareaDB[]
  relaciones: RelacionDB[]
  zoom: 'day' | 'week' | 'month' | 'quarter'
  showCritical: boolean
  showBaseline: boolean
  searchTerm: string
  onTaskClick?: (tareaId: string) => void
  onReady?: (handle: GanttHandle) => void
}

// dhtmlx link type codes: 0=FS, 1=SS, 2=FF, 3=SF
const TIPO_TO_DHTMLX: Record<string, string> = { FS: '0', SS: '1', FF: '2', SF: '3' }

function uidToId(cronogramaId: string, uid: number): string {
  return `${cronogramaId}:${uid}`
}

export function GanttChart({
  tareas, relaciones, zoom, showCritical, showBaseline, searchTerm, onTaskClick, onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ganttRef     = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Expose imperative handle to parent via onReady callback
  useEffect(() => {
    if (!ready || !onReady) return
    onReady({
      expandAll: () => {
        const g = ganttRef.current
        if (!g) return
        g.eachTask((t: { id: string | number }) => g.open(t.id))
      },
      collapseAll: () => {
        const g = ganttRef.current
        if (!g) return
        g.eachTask((t: { id: string | number; parent: string | number }) => {
          if (t.parent && t.parent !== 0) g.close(t.parent)
        })
      },
      exportPng: async (filename = 'gantt.png') => {
        const node = containerRef.current
        if (!node) return
        const { default: html2canvas } = await import('html2canvas')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gantt: any = ganttRef.current
        const originalAutosize = gantt?.config?.autosize
        try {
          if (gantt) {
            gantt.config.autosize = 'xy'
            gantt.render()
            await new Promise(r => setTimeout(r, 250))
          }
          const canvas = await html2canvas(node, {
            backgroundColor: '#0f1117',
            scale: 2,
            useCORS: true,
            allowTaint: false,
            width:  node.scrollWidth,
            height: node.scrollHeight,
            windowWidth:  node.scrollWidth,
            windowHeight: node.scrollHeight,
          })
          canvas.toBlob(blob => {
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = filename
            document.body.appendChild(a); a.click(); a.remove()
            URL.revokeObjectURL(url)
          }, 'image/png')
        } finally {
          if (gantt) {
            gantt.config.autosize = originalAutosize
            gantt.render()
          }
        }
      },
      toggleFullscreen: () => {
        const node = containerRef.current
        if (!node) return
        const doc = document as Document & {
          webkitFullscreenElement?: Element
          webkitExitFullscreen?: () => Promise<void>
        }
        const el = node as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>
        }
        const isFs = !!(document.fullscreenElement || doc.webkitFullscreenElement)
        if (isFs) {
          document.exitFullscreen?.() || doc.webkitExitFullscreen?.()
        } else {
          el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
        }
      },
      getContainer: () => containerRef.current,
    })
  }, [ready, onReady])

  // ── Init once ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mod = await import('dhtmlx-gantt')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gantt: any = (mod as any).gantt || (mod as any).default?.gantt || mod
      if (cancelled || !containerRef.current) return
      ganttRef.current = gantt

      gantt.config.date_format       = '%Y-%m-%d %H:%i:%s'
      gantt.config.xml_date          = '%Y-%m-%d %H:%i:%s'
      gantt.config.row_height        = 32
      gantt.config.bar_height        = 20
      gantt.config.min_column_width  = 40
      gantt.config.grid_width        = 420
      gantt.config.autofit           = false
      gantt.config.drag_progress     = true
      gantt.config.drag_resize       = false
      gantt.config.drag_move         = false
      gantt.config.drag_links        = false
      gantt.config.readonly          = false
      gantt.config.smart_rendering   = true
      gantt.config.round_dnd_dates   = true
      gantt.config.auto_scheduling   = false
      gantt.config.show_progress     = true
      gantt.config.highlight_critical_path = true

      gantt.config.columns = [
        { name: 'outline_number', label: '#',   width: 60, align: 'left',
          template: (t: { outline_number?: string }) => t.outline_number ?? '' },
        { name: 'text',           label: 'Tarea', tree: true, width: 240, resize: true },
        { name: 'duration',       label: 'Días', align: 'right', width: 50 },
        { name: 'progress',       label: '%',    align: 'right', width: 50,
          template: (t: { progress: number }) => `${Math.round((t.progress || 0) * 100)}%` },
      ]

      gantt.templates.task_class = (
        _s: Date, _e: Date, task: { is_milestone?: boolean; is_critical?: boolean; is_summary?: boolean }
      ) => {
        const parts: string[] = []
        if (task.is_milestone) parts.push('gantt-milestone')
        if (task.is_summary)   parts.push('gantt-summary')
        if (task.is_critical)  parts.push('gantt-critical')
        return parts.join(' ')
      }

      gantt.templates.task_text = (
        _s: Date, _e: Date, task: { text: string; progress: number }
      ) => {
        const pct = Math.round((task.progress || 0) * 100)
        return `<span style="font-size:10px;font-weight:500;letter-spacing:0.2px">${task.text}${pct > 0 ? ` · ${pct}%` : ''}</span>`
      }

      gantt.templates.tooltip_text = (
        s: Date, e: Date, task: {
          text: string; progress: number; duration: number; is_milestone?: boolean;
          responsable?: string; wbs?: string;
        }
      ) => {
        const fmt = (d: Date) =>
          d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        const pct = Math.round((task.progress || 0) * 100)
        return `
          <div style="padding:6px 2px;min-width:220px">
            <div style="font-weight:600;color:#e2e8f0;margin-bottom:4px">${task.text}</div>
            ${task.wbs         ? `<div style="color:#8892a4;font-size:11px">WBS: ${task.wbs}</div>` : ''}
            <div style="color:#8892a4;font-size:11px">${fmt(s)} → ${fmt(e)}</div>
            <div style="color:#8892a4;font-size:11px">${task.duration} días · <b style="color:#06b6d4">${pct}%</b></div>
            ${task.responsable ? `<div style="color:#8892a4;font-size:11px">👤 ${task.responsable}</div>` : ''}
          </div>
        `
      }

      gantt.templates.scale_cell_class    = () => 'gantt-scale-cell'
      gantt.templates.timeline_cell_class = () => 'gantt-timeline-cell'
      gantt.templates.task_row_class      = () => 'gantt-row'
      gantt.templates.grid_row_class      = () => 'gantt-row'

      gantt.attachEvent('onTaskClick', (id: string) => {
        if (onTaskClick) onTaskClick(String(id))
        return true
      })

      gantt.init(containerRef.current!)
      setReady(true)
    })()

    return () => {
      cancelled = true
      try { ganttRef.current?.clearAll() } catch { /* noop */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom
  useEffect(() => {
    const gantt = ganttRef.current
    if (!gantt || !ready) return
    switch (zoom) {
      case 'day':
        gantt.config.scales = [
          { unit: 'month', step: 1, format: '%F %Y' },
          { unit: 'day',   step: 1, format: '%d' },
        ]
        gantt.config.min_column_width = 28
        break
      case 'week':
        gantt.config.scales = [
          { unit: 'month', step: 1, format: '%F %Y' },
          { unit: 'week',  step: 1, format: (d: Date) => `S ${Math.ceil(d.getDate() / 7)}` },
        ]
        gantt.config.min_column_width = 60
        break
      case 'month':
        gantt.config.scales = [
          { unit: 'year',  step: 1, format: '%Y' },
          { unit: 'month', step: 1, format: '%M' },
        ]
        gantt.config.min_column_width = 70
        break
      case 'quarter':
        gantt.config.scales = [
          { unit: 'year',    step: 1, format: '%Y' },
          { unit: 'quarter', step: 1, format: (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1}` },
        ]
        gantt.config.min_column_width = 90
        break
    }
    gantt.render()
  }, [zoom, ready])

  useEffect(() => {
    const gantt = ganttRef.current
    if (!gantt || !ready) return
    gantt.config.highlight_critical_path = showCritical
    gantt.render()
  }, [showCritical, ready])

  // Load data
  useEffect(() => {
    const gantt = ganttRef.current
    if (!gantt || !ready) return

    const toDate = (s: string | null) => (s ? new Date(s) : null)
    const cronogramaId = tareas[0]?.cronograma_id ?? ''

    const ganttTasks = tareas
      .filter(t => {
        if (searchTerm) return t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        return true
      })
      .map(t => {
        const start = toDate(t.start_date)
        const end   = toDate(t.end_date)
        return {
          id:             uidToId(cronogramaId, t.uid),
          text:           t.nombre,
          start_date:     start || new Date(),
          end_date:       end   || new Date(Date.now() + 86400000),
          duration:       t.duration_days ?? 1,
          progress:       (t.percent_complete ?? 0) / 100,
          parent:         t.parent_uid ? uidToId(cronogramaId, t.parent_uid) : 0,
          open:           (t.outline_level ?? 0) < 2,
          type:           t.is_milestone ? 'milestone' : (t.is_summary ? 'project' : 'task'),
          is_milestone:   t.is_milestone,
          is_summary:     t.is_summary,
          is_critical:    t.is_critical,
          outline_number: t.outline_number,
          wbs:            t.wbs,
          responsable:    t.responsable,
          baseline_start: t.baseline_start,
          baseline_end:   t.baseline_end,
          _dbId:          t.id,
        }
      })

    const ganttLinks = relaciones.map(r => ({
      id:     r.id,
      source: uidToId(cronogramaId, r.source_uid),
      target: uidToId(cronogramaId, r.target_uid),
      type:   TIPO_TO_DHTMLX[r.tipo] ?? '0',
      lag:    r.lag_days ?? 0,
    }))

    gantt.clearAll()
    gantt.parse({ data: ganttTasks, links: ganttLinks })

    try { gantt.showDate(new Date()) } catch { /* noop */ }
  }, [tareas, relaciones, ready, searchTerm])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#0f1117' }}
      data-baseline={showBaseline ? '1' : '0'}
    />
  )
}
