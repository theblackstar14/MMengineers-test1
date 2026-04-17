import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { CotizacionParseada, PartidaFlat, PartidaTree, ResumenCotizacion } from '@/lib/excel/parseCotizacion'

export const runtime = 'nodejs'
export const maxDuration = 120

const SKIP_SHEETS   = ['hoja1', 'portada', 'indice', 'resumen']
const SUM_TOLERANCE = 1.0

// ── Safety filters ────────────────────────────────────────────────
const SUMMARY_RE      = /^(de los costos|sub[\s-]?total|costo\s+(directo|total|indirecto)|igv|i\.g\.v|utilidad|gastos\s+generales|cronograma|precio\s+s(in\s+igv|\/\.?igv)|total(\s+general)?\s*$|condiciones\s+comerciales)/i
const CONDITION_RE    = /^\*+/
const SUMMARY_CODE_RE = /^\d+\.00$/
// Accepts: 01  01.01  01.01.01  01.01.01.01  (optional trailing dot)
const ITEM_RE         = /^\d{1,2}(\.\d{2})*\.?$/

const IGV_PCT = 0.18

// ── Types ────────────────────────────────────────────────────────

interface AIPartida {
  codigo:          string
  descripcion:     string
  unidad:          string | null
  metrado:         number | null
  precio_unitario: number | null
}

interface ColMap {
  item:        number | undefined
  descripcion: number | undefined
  unidad:      number | undefined
  metrado:     number | undefined
  precio:      number | undefined
  parcial:     number | undefined
  total:       number | undefined
}

interface SheetMeta {
  proyecto:       string | null
  cliente:        string | null
  fecha:          string | null
  plazo:          string | null
  version_label:  string
  codigo_interno: string | null
}


// ── Step 1 — Read rows as raw arrays (preserves column positions) ─

function readRows(ws: XLSX.WorkSheet): string[][] {
  const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][]
  return raw
    .map(row => row.map(c => String(c == null ? '' : c).trim()))
    .filter(row => row.some(c => c !== ''))
}

// ── Step 2 — Find header row ──────────────────────────────────────

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex(row =>
    row.some(c => c.toUpperCase().includes('ITEM')) &&
    (row.some(c => c.toUpperCase().includes('PARCIAL')) ||
     row.some(c => c.toUpperCase().includes('TOTAL')))
  )
}

// ── Step 3 — Map columns by index ────────────────────────────────

function mapColumns(header: string[]): ColMap {
  const map: ColMap = {
    item: undefined, descripcion: undefined, unidad: undefined,
    metrado: undefined, precio: undefined, parcial: undefined, total: undefined,
  }
  header.forEach((col, i) => {
    const name = col.toUpperCase().trim()
    if ((name.includes('ITEM') || name.includes('CODIGO') || name.includes('CÓDIGO')) && map.item == null)
      map.item = i
    if (name.includes('DESCRI') && map.descripcion == null)
      map.descripcion = i
    if (name.includes('UNID') && map.unidad == null)
      map.unidad = i
    if ((name.includes('METRAD') || name === 'MET.' || name.includes('CANT')) && map.metrado == null)
      map.metrado = i
    if ((name.includes('PRECIO') || name.includes('P.U') || name.includes('UNIT')) && map.precio == null)
      map.precio = i
    if (name.includes('PARCIAL') && map.parcial == null)
      map.parcial = i
    if ((name === 'TOTAL' || (name.includes('TOTAL') && !name.includes('SUB'))) && map.total == null)
      map.total = i
  })
  return map
}

// ── Step 4 — Parse numbers ────────────────────────────────────────

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const s = val.replace(/S\/\.?\s*/gi, '').trim()
  if (!s) return null
  const lastComma = s.lastIndexOf(',')
  const lastDot   = s.lastIndexOf('.')
  const normalised = lastComma > lastDot
    ? s.replace(/\./g, '').replace(',', '.')   // ES: 1.234,56
    : s.replace(/,/g, '')                       // EN: 1,234.56
  const n = parseFloat(normalised)
  return isNaN(n) ? null : n
}

// ── Step 5 — Extract partidas from table rows ─────────────────────

function extractPartidas(
  rows: string[][], headerIdx: number, colMap: ColMap,
): { partidas: AIPartida[]; lastPartidaIdx: number } {
  if (colMap.item == null) return { partidas: [], lastPartidaIdx: headerIdx }
  const partidas: AIPartida[] = []
  let lastPartidaIdx = headerIdx

  const dataRows = rows.slice(headerIdx + 1)
  for (let ri = 0; ri < dataRows.length; ri++) {
    const row     = dataRows[ri]
    const rawCode = row[colMap.item]?.trim() ?? ''
    if (!rawCode || !ITEM_RE.test(rawCode)) continue

    const descripcion = colMap.descripcion != null ? (row[colMap.descripcion]?.trim() ?? '') : ''
    if (!descripcion) continue

    // Skip summary / condition rows (they have valid-looking item codes like 10.06, 10.01, etc.)
    if (SUMMARY_RE.test(descripcion) || CONDITION_RE.test(descripcion)) continue
    if (SUMMARY_CODE_RE.test(rawCode)) continue

    lastPartidaIdx = headerIdx + 1 + ri   // absolute row index

    partidas.push({
      codigo:          rawCode.replace(/\.$/, ''),
      descripcion,
      unidad:          colMap.unidad  != null ? (row[colMap.unidad]?.trim()  || null) : null,
      metrado:         colMap.metrado != null ? parseNum(row[colMap.metrado])          : null,
      precio_unitario: colMap.precio  != null ? parseNum(row[colMap.precio])           : null,
    })
  }
  return { partidas, lastPartidaIdx }
}

// ── Step 6 — Extract resumen directly from Excel summary rows ────
// Reads: COSTO DIRECTO, GG, Util, SUB TOTAL, IGV, TOTAL — values + pcts
// Fallback: compute from partidas if Excel values not found

function parsePct(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const s      = val.trim()
  const hasPct = s.endsWith('%')
  const n      = parseFloat(s.replace('%', '').replace(/[S\/\s]/g, '').replace(',', '.'))
  if (isNaN(n) || n < 0) return null
  if (hasPct || n > 1) return Math.round((n / 100) * 10000) / 10000
  return n
}

interface ExcelResumen {
  costo_directo:        number | null
  gastos_generales_pct: number | null
  gastos_generales:     number | null
  utilidad_pct:         number | null
  utilidad:             number | null
  subtotal:             number | null
  igv_pct:              number | null
  igv:                  number | null
  total:                number | null
}

interface ResumenMatchedRow {
  rowIdx:   number
  rawRow:   string[]
  rowText:  string
  matched:  string
  monVal:   number | null
  pct:      number | null
}

// Scan all rows after header, match summary patterns only in the DESCRIPCION column.
// This avoids false positives from partida descriptions that happen to contain "TOTAL", etc.
function extractExcelResumen(
  rows: string[][], headerIdx: number, colMap: ColMap,
  debugRows?: ResumenMatchedRow[],
): ExcelResumen {
  const r: ExcelResumen = {
    costo_directo: null, gastos_generales_pct: null, gastos_generales: null,
    utilidad_pct: null,  utilidad: null,             subtotal: null,
    igv_pct: null,       igv: null,                  total: null,
  }

  const pctCols = [colMap.parcial, colMap.precio, colMap.metrado].filter((c): c is number => c != null)

  for (let ri = headerIdx + 1; ri < rows.length; ri++) {
    const row  = rows[ri]
    const desc = colMap.descripcion != null ? (row[colMap.descripcion] ?? '').toUpperCase().trim() : ''
    if (!desc) continue

    // Match patterns on DESCRIPCION column only — never on partida description text
    const isCostDir = /^COSTO\s+DIRECTO/.test(desc)
    const isGG      = /^GASTOS?\s*GENERALES?/.test(desc)
    const isUtil    = /^UTILIDAD\b/.test(desc)
    const isSub     = /^SUB[\s-]?TOTAL/.test(desc)
    const isIGV     = /^I\.?G\.?V\b/.test(desc)
    // TOTAL: standalone — "TOTAL", "TOTAL GENERAL", but not "TOTAL DE PARTIDAS" etc.
    const isTotal   = !isSub && !isCostDir && /^TOTAL(\s+GENERAL)?\s*$/.test(desc)

    if (!isCostDir && !isGG && !isUtil && !isSub && !isIGV && !isTotal) continue

    // Monetary value: rightmost number > 1 (skips decimals like 0.10, 0.18)
    const monVal = (() => {
      for (let i = row.length - 1; i >= 0; i--) {
        const n = parseNum(row[i])
        if (n !== null && n > 1) return n
      }
      return null
    })()

    // Percentage: small decimal ≤ 1 or explicit % in candidate columns
    let pct: number | null = null
    for (const col of pctCols) {
      pct = parsePct(row[col])
      if (pct !== null && pct > 0 && pct <= 1) break
      pct = null
    }

    const matched = isCostDir ? 'COSTO_DIRECTO' : isGG ? 'GG' : isUtil ? 'UTIL'
                  : isSub ? 'SUBTOTAL' : isIGV ? 'IGV' : 'TOTAL'

    if (debugRows) debugRows.push({ rowIdx: ri, rawRow: row, rowText: desc.substring(0, 120), matched, monVal, pct })

    if      (isCostDir && r.costo_directo === null) r.costo_directo = monVal
    else if (isGG      && r.gastos_generales === null) { r.gastos_generales = monVal; r.gastos_generales_pct = pct }
    else if (isUtil    && r.utilidad === null)          { r.utilidad = monVal; r.utilidad_pct = pct }
    else if (isSub     && r.subtotal === null)            r.subtotal = monVal
    else if (isIGV     && r.igv === null)              { r.igv = monVal; r.igv_pct = pct }
    else if (isTotal   && r.total === null)               r.total = monVal
  }

  return r
}

function buildResumen(
  er:       ExcelResumen,
  partidas: PartidaFlat[],
  warnings: string[],
): ResumenCotizacion {
  // Use Excel values when available; compute as fallback
  const computed: string[] = []

  const costo_directo = er.costo_directo ?? (() => {
    computed.push('Costo Directo')
    return round2(partidas.filter(p => p.parent_codigo === null).reduce((s, p) => s + p.total, 0))
  })()

  const igv_pct              = er.igv_pct              ?? IGV_PCT
  const gastos_generales_pct = er.gastos_generales_pct ?? null
  const utilidad_pct         = er.utilidad_pct         ?? null

  const gastos_generales = er.gastos_generales ?? (
    gastos_generales_pct != null ? round2(costo_directo * gastos_generales_pct) : null
  )
  const utilidad = er.utilidad ?? (
    utilidad_pct != null ? round2(costo_directo * utilidad_pct) : null
  )

  const subtotal = er.subtotal ?? (() => {
    computed.push('Sub Total')
    return round2(costo_directo + (gastos_generales ?? 0) + (utilidad ?? 0))
  })()

  const igv = er.igv ?? (() => {
    computed.push('IGV')
    return round2(subtotal * igv_pct)
  })()

  const total = er.total ?? (() => {
    computed.push('Total')
    return round2(subtotal + igv)
  })()

  if (computed.length > 0)
    warnings.push(
      `Valores calculados (no leídos del Excel): ${computed.join(', ')}. ` +
      `Revisa que el Excel tenga las filas COSTO DIRECTO, SUB TOTAL, IGV y TOTAL visibles.`
    )

  return {
    costo_directo,
    gastos_generales_pct,
    gastos_generales,
    utilidad_pct,
    utilidad,
    subtotal,
    igv_pct,
    igv,
    total,
  }
}

// ── Step 7 — Extract metadata from header rows (above the table) ─
// Pattern matching only — no AI. Mirrors TEST1MM's extractMeta().

function extractMeta(rows: string[][], headerIdx: number, sheetName: string): SheetMeta {
  const above = rows.slice(0, headerIdx)
  const meta: SheetMeta = {
    proyecto:       null,
    cliente:        null,
    fecha:          null,
    plazo:          null,
    version_label:  'REV.01',
    codigo_interno: null,
  }

  for (const row of above) {
    const rowStr = row.join(' ').toUpperCase()

    if ((rowStr.includes('PROYECTO:') || rowStr.includes('PROYECTO :')) && !meta.proyecto) {
      const idx = row.findIndex(c => c.toUpperCase().includes('PROYECTO'))
      meta.proyecto = row[idx + 1]?.trim() || null
    }
    if (rowStr.includes('CLIENTE:') && !meta.cliente) {
      const idx = row.findIndex(c => c.toUpperCase().includes('CLIENTE'))
      meta.cliente = row[idx + 1]?.trim() || null
    }
    if (rowStr.includes('FECHA') && !meta.fecha) {
      const idx = row.findIndex(c => c.toUpperCase().includes('FECHA'))
      meta.fecha = row[idx + 1]?.trim() || null
    }
    if (rowStr.includes('PLAZO') && !meta.plazo) {
      const idx = row.findIndex(c => c.toUpperCase().includes('PLAZO'))
      meta.plazo = row[idx + 1]?.trim() || null
    }

    // version_label: REV.01 / REV.02 / V1 / V2
    const revMatch = rowStr.match(/\bREV\.?\s*0*(\d+)\b|\bV(\d+)\b/i)
    if (revMatch && meta.version_label === 'REV.01') {
      const n = revMatch[1] ?? revMatch[2]
      meta.version_label = `REV.${String(n).padStart(2, '0')}`
    }

    // codigo_interno: COT-XXXX
    const cotMatch = rowStr.match(/COT[-\s]?\d+/i)
    if (cotMatch && !meta.codigo_interno)
      meta.codigo_interno = cotMatch[0].replace(/\s/g, '').toUpperCase()
  }

  // Fallback: derive version from sheet name  e.g. "COT-0000 (2)" → "REV.02"
  if (meta.version_label === 'REV.01') {
    const m = sheetName.match(/\((\d+)\)/)
    if (m) meta.version_label = `REV.${String(m[1]).padStart(2, '0')}`
  }
  if (!meta.codigo_interno) {
    const m = sheetName.match(/COT[-\s]?\d+/i)
    if (m) meta.codigo_interno = m[0].replace(/\s/g, '').toUpperCase()
  }

  return meta
}

// ── Helpers ──────────────────────────────────────────────────────

function round2(n: number): number { return Math.round(n * 100) / 100 }

function getLevel(codigo: string): number {
  return codigo.replace(/\.$/, '').split('.').length
}

function getParent(codigo: string): string | null {
  const parts = codigo.replace(/\.$/, '').split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

function dedup(codigo: string, seen: Map<string, number>): string {
  const count = seen.get(codigo) ?? 0
  seen.set(codigo, count + 1)
  if (count === 0) return codigo
  return `${codigo}${String.fromCharCode(96 + count)}`
}

// ── Build flat list ───────────────────────────────────────────────

function buildFlat(partidas: AIPartida[]): PartidaFlat[] {
  const seen   = new Map<string, number>()
  const result: PartidaFlat[] = []
  let orden = 0

  for (const p of partidas) {
    const rawCodigo = (p.codigo ?? '').replace(/\.$/, '').trim()
    if (
      !rawCodigo ||
      SUMMARY_CODE_RE.test(rawCodigo) ||
      SUMMARY_RE.test((p.descripcion ?? '').trim()) ||
      CONDITION_RE.test((p.descripcion ?? '').trim())
    ) continue

    const codigo  = dedup(rawCodigo, seen)
    const metrado = typeof p.metrado         === 'number' ? p.metrado
                  : typeof p.metrado         === 'string' ? (parseNum(p.metrado)         ?? null) : null
    const precio  = typeof p.precio_unitario === 'number' ? p.precio_unitario
                  : typeof p.precio_unitario === 'string' ? (parseNum(p.precio_unitario) ?? null) : null
    const parcial = metrado !== null && precio !== null ? round2(metrado * precio) : 0

    result.push({
      codigo,
      descripcion:     p.descripcion,
      nivel:           getLevel(rawCodigo),
      unidad:          p.unidad ?? null,
      metrado,
      precio_unitario: precio,
      parcial,
      total:           parcial,
      parent_codigo:   getParent(rawCodigo),
      orden:           orden++,
    })
  }
  return result
}

// ── Bottom-up chapter totals ──────────────────────────────────────

function fillChapterTotals(partidas: PartidaFlat[]): PartidaFlat[] {
  const rows = partidas.map(p => ({ ...p }))
  for (let i = rows.length - 1; i >= 0; i--) {
    const children = rows.filter(c => c.parent_codigo === rows[i].codigo)
    if (children.length === 0) continue
    rows[i] = { ...rows[i], total: round2(children.reduce((s, c) => s + c.total, 0)) }
  }
  return rows
}


// ── Build tree from flat list (ported from TEST1MM buildTree) ─────
// Uses code-prefix matching + mistyped-code fallback

function buildTree(flat: PartidaFlat[]): PartidaTree[] {
  const root: PartidaTree[] = []
  const stack: { codigo: string; node: PartidaTree }[] = []

  for (const p of flat) {
    const node: PartidaTree = { ...p, children: [], _validation: null }
    const savedStack = [...stack]

    // Strategy 1: exact prefix match (01.01 is child of 01)
    while (stack.length) {
      if (p.codigo.startsWith(stack[stack.length - 1].codigo + '.')) break
      stack.pop()
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node)
      stack.push({ codigo: p.codigo, node })
      continue
    }

    // Strategy 2: mistyped code fallback (from TEST1MM)
    // e.g. "02.02.02" appears after root "04" — anchor to grandparent
    const firstSeg  = parseInt(p.codigo.split('.')[0], 10)
    const lastRoot  = root.length > 0 ? parseInt(root[root.length - 1].codigo.split('.')[0], 10) : 0
    const isMistyped = p.codigo.includes('.') && firstSeg < lastRoot && savedStack.length >= 2

    if (isMistyped) {
      savedStack[savedStack.length - 2].node.children.push(node)
      stack.length = 0
      savedStack.slice(0, -1).forEach(s => stack.push(s))
      stack.push({ codigo: p.codigo, node })
    } else {
      root.push(node)
      stack.push({ codigo: p.codigo, node })
    }
  }

  return root
}

// ── Validate tree: parent.total == sum(children) ─────────────────

function validateTree(nodes: PartidaTree[]): void {
  for (const node of nodes) {
    if (node.children.length === 0) continue
    validateTree(node.children)
    if (node.total == null) continue
    const sumChildren = node.children.reduce((acc, c) => acc + (c.parcial ?? c.total ?? 0), 0)
    const diff = Math.abs(sumChildren - node.total)
    node._validation = {
      expected:   node.total,
      calculado:  Math.round(sumChildren * 100) / 100,
      diferencia: Math.round(diff * 100) / 100,
      ok:         diff <= SUM_TOLERANCE,
    }
  }
}

// ── Count tree nodes ──────────────────────────────────────────────

function countNodes(nodes: PartidaTree[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0)
}

function treeAllValid(nodes: PartidaTree[]): boolean {
  return nodes.every(n => (!n._validation || n._validation.ok) && treeAllValid(n.children))
}

// ── Process one sheet — fully deterministic ───────────────────────

function processSheet(
  sheetName: string, ws: XLSX.WorkSheet, debug = false,
): (CotizacionParseada & { _debug?: object }) | null {
  const rows = readRows(ws)

  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    console.warn(`[parse] "${sheetName}" — sin cabecera detectable, hoja omitida`)
    return null
  }

  const colMap    = mapColumns(rows[headerIdx])
  const { partidas: rawParts, lastPartidaIdx } = extractPartidas(rows, headerIdx, colMap)

  if (rawParts.length === 0) {
    console.warn(`[parse] "${sheetName}" — 0 partidas extraídas, hoja omitida`)
    return null
  }

  const debugRows: ResumenMatchedRow[] = []
  const excelResumen  = extractExcelResumen(rows, headerIdx, colMap, debug ? debugRows : undefined)
  const meta          = extractMeta(rows, headerIdx, sheetName)
  const flat          = buildFlat(rawParts)
  if (flat.length === 0) return null

  const partidas_flat = fillChapterTotals(flat)
  const warnings: string[] = []
  const resumen       = buildResumen(excelResumen, partidas_flat, warnings)

  // Build tree + validate sums
  const partidas_tree = buildTree(partidas_flat)
  validateTree(partidas_tree)
  const validacion_ok = treeAllValid(partidas_tree)

  const withCosts = partidas_flat.filter(p => p.metrado !== null && p.precio_unitario !== null).length
  console.log(
    `[parse] "${sheetName}" → ${partidas_flat.length} partidas (${withCosts} con costo)`,
    `| CD ${resumen.costo_directo} | Sub ${resumen.subtotal} | Total ${resumen.total}`,
    `| tree: ${countNodes(partidas_tree)} nodos | valid: ${validacion_ok}`
  )

  const result: CotizacionParseada & { _debug?: object } = {
    sheet_name:     sheetName,
    version_label:  meta.version_label,
    codigo_interno: meta.codigo_interno,
    cliente:        meta.cliente,
    proyecto:       meta.proyecto,
    fecha:          meta.fecha,
    plazo:          meta.plazo,
    total_sin_igv:  resumen.subtotal,
    partidas_flat,
    partidas_tree,
    resumen,
    warnings,
    validacion_ok,
  }
  if (debug) result._debug = {
    headerIdx,
    colMap,
    lastPartidaIdx,
    excelResumen,
    resumenMatchedRows: debugRows,
    rawRows_around_lastPartida: rows.slice(Math.max(0, lastPartidaIdx - 2), lastPartidaIdx + 15),
  }
  return result
}

// ── Route ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext ?? ''))
      return NextResponse.json({ error: 'Solo se aceptan .xlsx o .xls' }, { status: 400 })

    const isDebug = new URL(req.url).searchParams.has('debug')
    const buffer = await file.arrayBuffer()
    const wb     = XLSX.read(buffer, { type: 'array' })

    const versiones: (CotizacionParseada & { _debug?: object })[] = []

    for (const sheetName of wb.SheetNames) {
      if (SKIP_SHEETS.includes(sheetName.toLowerCase())) continue
      const ws = wb.Sheets[sheetName]
      if (!ws || !ws['!ref']) continue

      console.log(`[import] procesando "${sheetName}"`)
      const result = processSheet(sheetName, ws, isDebug)
      if (result) versiones.push(result)
    }

    if (versiones.length === 0)
      return NextResponse.json({ error: 'No se encontraron hojas con datos válidos' }, { status: 422 })

    if (isDebug) {
      // Debug mode: return only diagnostic data, no full partidas tree
      return NextResponse.json({
        ok: true, filename: file.name, total_versiones: versiones.length,
        debug: versiones.map(v => ({
          sheet_name:      v.sheet_name,
          headerIdx:       (v._debug as any)?.headerIdx,
          colMap:          (v._debug as any)?.colMap,
          lastPartidaIdx:  (v._debug as any)?.lastPartidaIdx,
          excelResumen:    (v._debug as any)?.excelResumen,
          resumen:         v.resumen,
          resumenMatchedRows: (v._debug as any)?.resumenMatchedRows,
          rawRows_around_lastPartida: (v._debug as any)?.rawRows_around_lastPartida,
          warnings:        v.warnings,
          partidas_count:  v.partidas_flat.length,
        })),
      })
    }

    return NextResponse.json({ ok: true, filename: file.name, versiones, total_versiones: versiones.length })
  } catch (err) {
    console.error('[import/cotizacion]', err)
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}
