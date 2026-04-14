import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────

export interface PartidaFlat {
  codigo: string
  descripcion: string
  nivel: number
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  parcial: number | null
  total: number | null
  parent_codigo: string | null
  orden: number
}

export interface PartidaTree extends PartidaFlat {
  children: PartidaTree[]
}

export interface CotizacionParseada {
  sheet_name: string
  version_label: string
  codigo_interno: string | null
  cliente: string | null
  proyecto: string | null
  fecha: string | null
  plazo: string | null
  total_sin_igv: number | null
  partidas_flat: PartidaFlat[]
  partidas_tree: PartidaTree[]
  warnings: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────

function toNum(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function toStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s || null
}

function nivelFromCodigo(codigo: string): number {
  return codigo.split('.').length
}

function parentCodigo(codigo: string): string | null {
  const parts = codigo.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

function buildTree(flat: PartidaFlat[]): PartidaTree[] {
  const map = new Map<string, PartidaTree>()
  const roots: PartidaTree[] = []
  for (const p of flat) map.set(p.codigo, { ...p, children: [] })
  for (const p of flat) {
    const node = map.get(p.codigo)!
    if (p.parent_codigo && map.has(p.parent_codigo)) {
      map.get(p.parent_codigo)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

// Scan a row (array of unknowns) for a string value — returns column index or -1
function findCol(row: unknown[], ...candidates: string[]): number {
  for (let i = 0; i < row.length; i++) {
    const v = toStr(row[i])
    if (!v) continue
    for (const c of candidates) {
      if (v.toUpperCase().startsWith(c.toUpperCase())) return i
    }
  }
  return -1
}

// Find any cell matching value in entire row array
function rowContains(row: unknown[], value: string): boolean {
  return row.some(c => toStr(c)?.toUpperCase() === value.toUpperCase())
}

// ─── Parse single sheet ───────────────────────────────────────────

function parseSheet(ws: XLSX.WorkSheet, sheetName: string): CotizacionParseada | null {
  // Read as array of arrays — no defval so sparse is preserved
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  const warnings: string[] = []

  // ── Step 1: find the ITEM header row ──────────────────────────
  let dataStartRow = -1
  let colItem = -1, colDesc = -1, colUnid = -1
  let colMet = -1, colPrecio = -1, colParcial = -1, colTotal = -1

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i]
    if (!rowContains(row, 'ITEM')) continue

    // Found header row — map columns dynamically
    colItem    = findCol(row, 'ITEM')
    colDesc    = findCol(row, 'DESCRIPCION', 'DESCRIPCIÓN')
    colUnid    = findCol(row, 'UNID')
    colMet     = findCol(row, 'MET', 'METRADO')
    colPrecio  = findCol(row, 'PRECIO')
    colParcial = findCol(row, 'PARCIAL')
    colTotal   = findCol(row, 'TOTAL')
    dataStartRow = i + 1
    break
  }

  if (dataStartRow === -1 || colItem === -1) return null // not a cotización sheet

  // ── Step 2: extract metadata from rows above header ───────────
  let cliente: string | null = null
  let proyecto: string | null = null
  let plazo: string | null = null
  let total_sin_igv: number | null = null
  let version_label = 'REV.01'
  let codigo_interno: string | null = null

  for (let i = 0; i < dataStartRow; i++) {
    const row = rows[i]
    // Scan all cells for known labels
    for (let j = 0; j < row.length - 1; j++) {
      const label = toStr(row[j])?.toLowerCase() ?? ''
      const val   = row[j + 1]
      if (!label) continue
      if (label.includes('proyecto')) proyecto = toStr(val) ?? proyecto
      if (label.includes('cliente')) cliente = toStr(val) ?? cliente
      if (label.includes('plazo')) plazo = toStr(val) ?? plazo
      if (label.includes('precio sin igv') || label.includes('precio s/igv')) {
        total_sin_igv = toNum(val) ?? total_sin_igv
      }
      const s = toStr(val)
      if (s?.startsWith('REV')) version_label = s
      if (s?.includes('COT-')) codigo_interno = s
    }
  }

  // ── Step 3: parse partidas ────────────────────────────────────
  const partidas_flat: PartidaFlat[] = []
  const seenCodigos = new Map<string, number>()

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i]
    const rawCodigo = toStr(row[colItem])
    if (!rawCodigo) continue
    if (!/^\d/.test(rawCodigo)) continue // skip non-item rows

    const descripcion = colDesc >= 0 ? toStr(row[colDesc]) : null
    if (!descripcion) continue

    // Deduplicate código
    const baseCount = seenCodigos.get(rawCodigo) ?? 0
    let codigo = rawCodigo
    if (baseCount > 0) {
      const suffix = String.fromCharCode(96 + baseCount) // a, b, c…
      codigo = `${rawCodigo}${suffix}`
      warnings.push(`Código duplicado "${rawCodigo}" → "${codigo}"`)
    }
    seenCodigos.set(rawCodigo, baseCount + 1)

    const unidad         = colUnid    >= 0 ? toStr(row[colUnid])    : null
    const metrado        = colMet     >= 0 ? toNum(row[colMet])     : null
    const precio_unit    = colPrecio  >= 0 ? toNum(row[colPrecio])  : null
    const parcial        = colParcial >= 0 ? toNum(row[colParcial]) : null
    const total          = colTotal   >= 0 ? toNum(row[colTotal])   : null

    partidas_flat.push({
      codigo,
      descripcion,
      nivel: nivelFromCodigo(rawCodigo),
      unidad,
      metrado,
      precio_unitario: precio_unit,
      parcial,
      total,
      parent_codigo: parentCodigo(rawCodigo),
      orden: partidas_flat.length,
    })
  }

  if (partidas_flat.length === 0) return null

  return {
    sheet_name: sheetName,
    version_label,
    codigo_interno,
    cliente,
    proyecto,
    fecha: null,
    plazo,
    total_sin_igv,
    partidas_flat,
    partidas_tree: buildTree(partidas_flat),
    warnings,
  }
}

// ─── Public API ───────────────────────────────────────────────────

export function parseExcelCotizaciones(buffer: ArrayBuffer): CotizacionParseada[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const results: CotizacionParseada[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) continue

    const parsed = parseSheet(ws, sheetName)
    if (parsed) results.push(parsed)
  }

  return results
}
