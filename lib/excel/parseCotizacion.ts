// Types only — AI extracts raw data, code computes all financials

export interface PartidaFlat {
  codigo: string
  descripcion: string
  nivel: number
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  parcial: number           // always = metrado × precio (computed, never from Excel)
  total: number             // for chapters: sum of children; for leaves: same as parcial
  parent_codigo: string | null
  orden: number
}

export interface ValidationResult {
  expected:    number
  calculado:   number
  diferencia:  number
  ok:          boolean
}

export interface PartidaTree extends PartidaFlat {
  children:    PartidaTree[]
  _validation: ValidationResult | null
}

export interface ResumenCotizacion {
  costo_directo: number
  gastos_generales_pct: number | null   // null = no existe en este Excel
  gastos_generales: number | null
  utilidad_pct: number | null           // null = no existe en este Excel
  utilidad: number | null
  subtotal: number                      // CD + GG + U  (o solo CD si no hay GG/U)
  igv_pct: number                       // 0.18 por defecto
  igv: number
  total: number
}

export interface CotizacionParseada {
  sheet_name: string
  version_label: string
  codigo_interno: string | null
  cliente: string | null
  proyecto: string | null
  fecha: string | null
  plazo: string | null
  total_sin_igv: number          // = resumen.subtotal
  partidas_flat: PartidaFlat[]
  partidas_tree: PartidaTree[]
  resumen: ResumenCotizacion
  warnings: string[]
  validacion_ok: boolean
}
