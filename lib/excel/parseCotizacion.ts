import * as XLSX from 'xlsx'

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

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
  _validation?: { expected: number; calculado: number; diferencia: number; ok: boolean }
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
  validacion_ok: boolean
}

// ────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────

const SUM_TOLERANCE = 1.0
const SKIP_SHEETS = ['hoja1', 'portada', 'indice', 'resumen']

// Strict 2-digit groups: 01  01.01  01.01.01 — same as excelToERP.js
const ITEM_REGEX = /^\d{2}(\.\d{2})*\.?$/

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  const s = String(v).replace(/\s/g, '').replace(/,/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? null : Math.round(n * 10000) / 10000
}

function cleanRows(raw: unknown[][]): string[][] {
  return raw
    .map(row => row.map(c => (c == null ? '' : String(c).trim())))
    .filter(row => row.some(c => c !== ''))
}


// ────────────────────────────────────────────────────────────────
// COLUMN DETECTION
// ────────────────────────────────────────────────────────────────

interface ColMap {
  item?: number
  descripcion?: number
  unidad?: number
  metrado?: number
  precio?: number
  parcial?: number
  total?: number
}

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex(
    row =>
      row.some(c => c.toUpperCase().includes('ITEM')) &&
      row.some(c => c.toUpperCase().includes('TOTAL')),
  )
}

function mapColumns(header: string[]): ColMap {
  const map: ColMap = {}
  header.forEach((col, i) => {
    const name = col.toUpperCase()

    if (name.includes('ITEM')) map.item = i
    if (name.includes('DESCRIP')) map.descripcion = i
    if (name.includes('UNID')) map.unidad = i
    if (name.includes('MET') || name.includes('CANT')) map.metrado = i
    if (name.includes('PRECIO') || name.includes('P.U')) map.precio = i
    if (name.includes('PARCIAL')) map.parcial = i
    if (name.includes('TOTAL')) map.total = i
  })
  return map
}

// ────────────────────────────────────────────────────────────────
// NORMALIZE (🔥 CORE PRO)
// ────────────────────────────────────────────────────────────────

interface NormalizedRow {
  codigo: string
  descripcion: string
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  parcial: number | null
  total: number | null
  nivel_hint: number // = codigo.split('.').length
}

// Summary/footer rows that should never be stored as partidas de obra
const SUMMARY_DESC_RE = /^(de los costos|sub[\s-]?total|costo\s+directo|costo\s+total|condiciones\s+comerciales|de\s+nuestras|facilidades|imagen\s+referencial|igv|i\.g\.v|utilidad\s*\(|gastos\s+generales\s+y\s+utilidad)/i

function isSummaryCode(codigo: string): boolean {
  // XX.00 pattern — administrative grouping codes
  return /^\d+\.00$/.test(codigo)
}

function normalizeRows(data: string[][], colMap: ColMap): NormalizedRow[] {
  const rows: NormalizedRow[] = []

  for (const row of data) {
    const rawItem = colMap.item != null ? row[colMap.item] : ''
    const codigo = rawItem.trim().replace(/\.+$/, '')

    // Skip rows without a valid numeric item code
    if (!ITEM_REGEX.test(codigo)) continue

    const descripcion = colMap.descripcion != null ? row[colMap.descripcion] : ''
    if (!descripcion) continue

    // Skip summary/footer rows — not obra partidas
    if (isSummaryCode(codigo) || SUMMARY_DESC_RE.test(descripcion.trim())) continue

    const nivel_hint = codigo.split('.').length

    rows.push({
      codigo,
      descripcion,
      unidad: colMap.unidad != null ? row[colMap.unidad] || null : null,
      metrado: colMap.metrado != null ? parseNum(row[colMap.metrado]) : null,
      precio_unitario: colMap.precio != null ? parseNum(row[colMap.precio]) : null,
      parcial: colMap.parcial != null ? parseNum(row[colMap.parcial]) : null,
      total: colMap.total != null ? parseNum(row[colMap.total]) : null,
      nivel_hint,
    })
  }

  return rows
}

// ────────────────────────────────────────────────────────────────
// TREE BUILDER (🔥 INTELIGENTE)
// ────────────────────────────────────────────────────────────────

function buildTree(items: NormalizedRow[]): PartidaTree[] {
  const root: PartidaTree[] = []
  const stack: Array<{ codigo: string; node: PartidaTree }> = []

  let orden = 0

  for (const item of items) {
    const node: PartidaTree = {
      codigo: item.codigo,
      descripcion: item.descripcion,
      nivel: item.nivel_hint,
      unidad: item.unidad,
      metrado: item.metrado,
      precio_unitario: item.precio_unitario,
      parcial: item.parcial,
      total: item.total,
      parent_codigo: null,
      orden: orden++,
      children: [],
    }

    const savedStack = [...stack]

    // Strategy 1: exact prefix match (same as excelToERP.js)
    while (stack.length) {
      if (item.codigo.startsWith(stack[stack.length - 1].codigo + '.')) break
      stack.pop()
    }

    if (stack.length > 0) {
      node.parent_codigo = stack[stack.length - 1].codigo
      stack[stack.length - 1].node.children.push(node)
      stack.push({ codigo: item.codigo, node })
      continue
    }

    // Strategy 2: mistyped code fallback — same logic as excelToERP.js
    const firstSegNum = parseInt(item.codigo.split('.')[0], 10)
    const lastRootNum = root.length > 0
      ? parseInt(root[root.length - 1].codigo.split('.')[0], 10)
      : 0

    const isMistyped =
      item.codigo.includes('.') &&
      firstSegNum < lastRootNum &&
      savedStack.length >= 2

    if (isMistyped) {
      const grandparent = savedStack[savedStack.length - 2]
      node.parent_codigo = grandparent.codigo
      grandparent.node.children.push(node)
      stack.length = 0
      for (const s of savedStack.slice(0, -1)) stack.push(s)
      stack.push({ codigo: item.codigo, node })
    } else {
      root.push(node)
      stack.push({ codigo: item.codigo, node })
    }
  }

  return root
}

// ────────────────────────────────────────────────────────────────
// FLATTEN
// ────────────────────────────────────────────────────────────────

function flattenTree(nodes: PartidaTree[], out: PartidaFlat[] = []): PartidaFlat[] {
  for (const n of nodes) {
    out.push({
      codigo: n.codigo,
      descripcion: n.descripcion,
      nivel: n.nivel,
      unidad: n.unidad,
      metrado: n.metrado,
      precio_unitario: n.precio_unitario,
      parcial: n.parcial,
      total: n.total,
      parent_codigo: n.parent_codigo,
      orden: n.orden,
    })
    flattenTree(n.children, out)
  }
  return out
}

// ────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────

function validateTree(nodes: PartidaTree[]): void {
  for (const node of nodes) {
    if (node.children.length > 0) {
      validateTree(node.children)

      if (node.total != null) {
        const sum = node.children.reduce(
          (acc, c) => acc + (c.parcial ?? c.total ?? 0),
          0,
        )

        const diff = Math.abs(sum - node.total)

        node._validation = {
          expected: node.total,
          calculado: Math.round(sum * 100) / 100,
          diferencia: Math.round(diff * 100) / 100,
          ok: diff <= SUM_TOLERANCE,
        }
      }
    }
  }
}

function checkAllValid(nodes: PartidaTree[]): boolean {
  return nodes.every(
    n => (!n._validation || n._validation.ok) && checkAllValid(n.children),
  )
}

// ────────────────────────────────────────────────────────────────
// METADATA EXTRACTION
// ────────────────────────────────────────────────────────────────

interface SheetMeta {
  proyecto: string | null
  cliente: string | null
  fecha: string | null
  plazo: string | null
  total_sin_igv: number | null
  version_label: string
  codigo_interno: string | null
}

function extractPrecioSinIGV(text: string): number | null {
  const raw = text.replace(/^s\/\.?\s*/i, '').replace(/\s/g, '').replace(/,/g, '')
  const n = parseFloat(raw)
  return isNaN(n) || n <= 0 ? null : n
}

function extractMeta(rows: string[][], headerIdx: number): SheetMeta {
  const meta: SheetMeta = {
    proyecto: null, cliente: null, fecha: null, plazo: null,
    total_sin_igv: null, version_label: 'REV.01', codigo_interno: null,
  }

  for (let i = 0; i < headerIdx; i++) {
    const row = rows[i]

    for (let j = 0; j < row.length; j++) {
      const cell = row[j]
      const cellLow = cell.toLowerCase()

      // Embedded multi-line cell: "Precio sin IGV S/ 1,185,390.50"
      if (meta.total_sin_igv == null) {
        const m = cell.match(/precio\s+s(?:in\s+igv|\/\.?igv)[^\d]*([\d,.\s]+)/i)
        if (m) meta.total_sin_igv = extractPrecioSinIGV(m[1]) ?? meta.total_sin_igv
      }

      // Standard label | value pairs
      if (j < row.length - 1) {
        const val = row[j + 1]
        if (cellLow.includes('proyecto')) meta.proyecto = val || meta.proyecto
        if (cellLow.includes('cliente'))  meta.cliente  = val || meta.cliente
        if (cellLow.includes('fecha'))    meta.fecha    = val || meta.fecha
        if (cellLow.includes('plazo'))    meta.plazo    = val || meta.plazo
        if (cellLow.includes('precio sin igv') || cellLow.includes('precio s/igv')) {
          meta.total_sin_igv = extractPrecioSinIGV(val) ?? meta.total_sin_igv
        }
        if (val?.startsWith('REV'))  meta.version_label  = val
        if (val?.includes('COT-'))   meta.codigo_interno = val
      }
    }
  }

  return meta
}

// ────────────────────────────────────────────────────────────────
// PARSER
// ────────────────────────────────────────────────────────────────

function parseSheet(ws: XLSX.WorkSheet, sheetName: string): CotizacionParseada | null {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  const rows = cleanRows(rawRows as unknown[][])

  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) return null

  const colMap = mapColumns(rows[headerIdx])

  const data = rows.slice(headerIdx + 1)
  const items = normalizeRows(data, colMap)

  if (items.length === 0) return null

  const tree = buildTree(items)
  validateTree(tree)

  const meta = extractMeta(rows, headerIdx)

  return {
    sheet_name:     sheetName,
    version_label:  meta.version_label,
    codigo_interno: meta.codigo_interno,
    cliente:        meta.cliente,
    proyecto:       meta.proyecto,
    fecha:          meta.fecha,
    plazo:          meta.plazo,
    total_sin_igv:  meta.total_sin_igv,
    partidas_flat:  flattenTree(tree),
    partidas_tree:  tree,
    warnings:       [],
    validacion_ok:  checkAllValid(tree),
  }
}

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export function parseExcelCotizaciones(buffer: ArrayBuffer): CotizacionParseada[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const results: CotizacionParseada[] = []

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.includes(sheetName.toLowerCase())) continue

    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) continue

    const parsed = parseSheet(ws, sheetName)
    if (parsed) results.push(parsed)
  }

  return results
}