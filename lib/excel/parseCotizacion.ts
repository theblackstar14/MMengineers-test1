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
  version_label: string       // "REV.01" etc
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
  return String(v).trim() || null
}

function nivelFromCodigo(codigo: string): number {
  // Count dots: '01'=1, '01.01'=2, '01.01.01'=3, '01.01.01.01'=4
  return codigo.split('.').length
}

function parentCodigo(codigo: string): string | null {
  const parts = codigo.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

// Make duplicate códigos unique by appending suffix
function deduplicateCodigos(rows: PartidaFlat[]): void {
  const seen = new Map<string, number>()
  for (const row of rows) {
    const count = seen.get(row.codigo) ?? 0
    if (count > 0) {
      const suffix = String.fromCharCode(96 + count) // a, b, c...
      row.codigo = `${row.codigo}${suffix}`
    }
    seen.set(row.codigo.replace(/[a-z]$/, ''), (seen.get(row.codigo.replace(/[a-z]$/, '')) ?? 0) + 1)
  }
}

function buildTree(flat: PartidaFlat[]): PartidaTree[] {
  const map = new Map<string, PartidaTree>()
  const roots: PartidaTree[] = []

  for (const p of flat) {
    map.set(p.codigo, { ...p, children: [] })
  }

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

// ─── Parse single sheet ───────────────────────────────────────────

function parseSheet(ws: XLSX.WorkSheet, sheetName: string): CotizacionParseada {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  const warnings: string[] = []

  // ── Extract metadata (scan first 15 rows) ──
  let cliente: string | null = null
  let proyecto: string | null = null
  let fecha: string | null = null
  let plazo: string | null = null
  let total_sin_igv: number | null = null
  let version_label = 'REV.01'
  let codigo_interno: string | null = null
  let dataStartRow = -1

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] as unknown[]
    const b = toStr(row[1])
    const c = toStr(row[2])
    const g = toStr(row[6])
    const h = toStr(row[7])

    if (b === 'Proyecto:' && c) proyecto = c
    if (b === 'Cliente:' && c) cliente = c
    if (b === 'Ubicaci\u00f3n' && c) {} // skip
    if (b === 'Plazo de Ejec.' && c) plazo = c
    if (b === 'Precio sin IGV' || b === 'Precio sin IGV ') total_sin_igv = toNum(row[2])
    if (g === 'N\u00ba COT-024' || (g && g.startsWith('N'))) codigo_interno = g
    if (h && typeof h === 'string' && h.startsWith('REV')) version_label = h
    if (b === 'ITEM') { dataStartRow = i + 1; break }
  }

  if (dataStartRow === -1) {
    warnings.push('No se encontró fila de encabezado ITEM')
    return {
      sheet_name: sheetName,
      version_label,
      codigo_interno,
      cliente,
      proyecto,
      fecha,
      plazo,
      total_sin_igv,
      partidas_flat: [],
      partidas_tree: [],
      warnings,
    }
  }

  // ── Parse partidas ──
  const partidas_flat: PartidaFlat[] = []
  const seenCodigos = new Map<string, number>()

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const rawCodigo = toStr(row[1])
    if (!rawCodigo) continue

    // Skip non-item rows (subtotales, IGV lines, etc.)
    if (!/^\d/.test(rawCodigo)) continue

    const descripcion = toStr(row[2])
    if (!descripcion) continue

    // Deduplicate código
    const baseCount = seenCodigos.get(rawCodigo) ?? 0
    let codigo = rawCodigo
    if (baseCount > 0) {
      const suffix = String.fromCharCode(96 + baseCount) // a, b, c
      codigo = `${rawCodigo}${suffix}`
      warnings.push(`Código duplicado "${rawCodigo}" renombrado a "${codigo}"`)
    }
    seenCodigos.set(rawCodigo, baseCount + 1)

    const unidad = toStr(row[3])
    const metrado = toNum(row[4])
    const precio_unitario = toNum(row[5])
    const parcial = toNum(row[6])
    const total = toNum(row[7])

    const nivel = nivelFromCodigo(rawCodigo)
    const parent = parentCodigo(rawCodigo)

    partidas_flat.push({
      codigo,
      descripcion,
      nivel,
      unidad,
      metrado,
      precio_unitario,
      parcial,
      total,
      parent_codigo: parent,
      orden: partidas_flat.length,
    })
  }

  const partidas_tree = buildTree(partidas_flat)

  return {
    sheet_name: sheetName,
    version_label,
    codigo_interno,
    cliente,
    proyecto,
    fecha,
    plazo,
    total_sin_igv,
    partidas_flat,
    partidas_tree,
    warnings,
  }
}

// ─── Public API ───────────────────────────────────────────────────

export function parseExcelCotizaciones(buffer: ArrayBuffer): CotizacionParseada[] {
  const wb = XLSX.read(buffer, { type: 'array' })

  const results: CotizacionParseada[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    // Skip empty / helper sheets (Hoja2 etc)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    if (range.e.r < 5) continue

    const parsed = parseSheet(ws, sheetName)
    // Only include sheets that have actual partidas
    if (parsed.partidas_flat.length > 0) {
      results.push(parsed)
    }
  }

  return results
}
