/**
 * MS Project XML parser → canonical tasks + links.
 * Expects XML exported by MS Project (or produced by Aspose.Tasks).
 */

import { XMLParser } from 'fast-xml-parser'

export interface ParsedTask {
  uid: number
  id_ms: number
  outline_number: string | null
  outline_level: number | null
  wbs: string | null
  nombre: string
  notas: string | null
  start_date: string | null   // ISO
  end_date: string | null     // ISO
  baseline_start: string | null
  baseline_end: string | null
  actual_start: string | null
  actual_end: string | null
  duration_days: number | null
  percent_complete: number
  is_milestone: boolean
  is_summary: boolean
  is_critical: boolean
  parent_uid: number | null
  costo_plan: number | null
  orden: number
}

export interface ParsedLink {
  source_uid: number
  target_uid: number
  tipo: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days: number
}

export interface ParsedProject {
  nombre: string
  start: string | null
  end: string | null
  tasks: ParsedTask[]
  links: ParsedLink[]
}

// MSP link type codes → our enum
// 0 = FF, 1 = FS, 2 = SF, 3 = SS
const LINK_TYPE_MAP: Record<string, 'FS' | 'SS' | 'FF' | 'SF'> = {
  '0': 'FF', '1': 'FS', '2': 'SF', '3': 'SS',
}

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,      // keep as string, we coerce manually
  trimValues: true,
  removeNSPrefix: true,
})

function toNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

function toBool(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true'
}

function toIso(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  // MSP dates come like "2025-01-15T08:00:00" (no tz)
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

// MSP Duration: "PT480H0M0S" (ISO8601 duration, hours only for work time)
// Approximate days: hours / 8 (standard 8h workday).
function durationToDays(v: unknown): number | null {
  if (!v) return null
  const s = String(v)
  const m = s.match(/PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const hours = Number(m[1] || 0) + Number(m[2] || 0) / 60 + Number(m[3] || 0) / 3600
  if (!isFinite(hours) || hours === 0) return null
  return Math.round((hours / 8) * 100) / 100
}

// LinkLag units — MSP LagFormat codes. For simplicity convert only common ones.
// 4 = days, 5 = edays, 7 = hours, etc. Raw LinkLag stored in tenths of minutes.
function lagToDays(lagRaw: unknown, _format: unknown): number {
  const n = toNumber(lagRaw)
  if (n == null) return 0
  // MSP stores lag in tenths of minutes. tenths-min → days.
  const minutes = n / 10
  const hours   = minutes / 60
  return Math.round((hours / 8) * 100) / 100
}

function arr<T>(x: T | T[] | undefined): T[] {
  if (x === undefined || x === null) return []
  return Array.isArray(x) ? x : [x]
}

export function parseMspXml(xml: string): ParsedProject {
  const root = parser.parse(xml)
  const proj = root.Project || root.project
  if (!proj) throw new Error('XML no contiene nodo <Project> raiz')

  const projectName = String(proj.Name ?? proj.Title ?? 'Proyecto sin nombre').trim()
  const projectStart = toIso(proj.StartDate)
  const projectEnd   = toIso(proj.FinishDate)

  const rawTasks = arr(proj.Tasks?.Task)
  const tasks: ParsedTask[] = []
  const links: ParsedLink[] = []

  // Stack helper to map outline level → parent uid
  const parentStack: { level: number; uid: number }[] = []

  let orden = 0
  for (const t of rawTasks) {
    const uid   = toNumber(t.UID)
    if (uid == null) continue
    const level = toNumber(t.OutlineLevel) ?? 0
    const id_ms = toNumber(t.ID) ?? uid

    // Maintain stack
    while (parentStack.length && parentStack[parentStack.length - 1].level >= level) {
      parentStack.pop()
    }
    const parent_uid = parentStack.length ? parentStack[parentStack.length - 1].uid : null

    const task: ParsedTask = {
      uid,
      id_ms,
      outline_number:  t.OutlineNumber ? String(t.OutlineNumber) : null,
      outline_level:   level,
      wbs:             t.WBS ? String(t.WBS) : null,
      nombre:          String(t.Name ?? '').trim() || `Tarea ${uid}`,
      notas:           t.Notes ? String(t.Notes) : null,
      start_date:      toIso(t.Start),
      end_date:        toIso(t.Finish),
      baseline_start:  toIso(t.BaselineStart),
      baseline_end:    toIso(t.BaselineFinish),
      actual_start:    toIso(t.ActualStart),
      actual_end:      toIso(t.ActualFinish),
      duration_days:   durationToDays(t.Duration),
      percent_complete: toNumber(t.PercentComplete) ?? 0,
      is_milestone:    toBool(t.Milestone),
      is_summary:      toBool(t.Summary),
      is_critical:     toBool(t.Critical),
      parent_uid,
      costo_plan:      toNumber(t.Cost),
      orden:           orden++,
    }

    // Skip the synthetic "Project Summary" row (UID=0) only if clearly the root
    // — we keep it by default, MSP frequently uses it as outline level 0.
    tasks.push(task)

    parentStack.push({ level, uid })

    // predecessor links
    for (const pl of arr(t.PredecessorLink)) {
      const src = toNumber(pl.PredecessorUID)
      if (src == null) continue
      const typeCode = String(pl.Type ?? '1')
      const tipo = LINK_TYPE_MAP[typeCode] ?? 'FS'
      links.push({
        source_uid: src,
        target_uid: uid,
        tipo,
        lag_days: lagToDays(pl.LinkLag, pl.LagFormat),
      })
    }
  }

  return {
    nombre: projectName,
    start: projectStart,
    end:   projectEnd,
    tasks,
    links,
  }
}
