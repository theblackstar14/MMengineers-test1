import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────
// Formato de moneda (Soles peruanos)
// ─────────────────────────────────────────
export function formatSoles(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `S/. ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `S/. ${(amount / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount).replace('PEN', 'S/.')
}

// ─────────────────────────────────────────
// Formato de fecha
// ─────────────────────────────────────────
export function formatFecha(date: string | null, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '—'

  const d = new Date(date + 'T00:00:00') // evitar desfase horario

  if (format === 'relative') {
    const diff = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Mañana'
    if (diff === -1) return 'Ayer'
    if (diff > 0) return `En ${diff} días`
    return `Hace ${Math.abs(diff)} días`
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: format === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(d)
}

// ─────────────────────────────────────────
// Porcentaje formateado
// ─────────────────────────────────────────
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ─────────────────────────────────────────
// Color de estado de proyecto
// ─────────────────────────────────────────
export function getColorEstadoProyecto(estado: string): string {
  const map: Record<string, string> = {
    en_ejecucion: 'text-green-400 bg-green-400/10',
    adjudicado: 'text-blue-400 bg-blue-400/10',
    en_licitacion: 'text-yellow-400 bg-yellow-400/10',
    paralizado: 'text-red-400 bg-red-400/10',
    en_liquidacion: 'text-orange-400 bg-orange-400/10',
    liquidado: 'text-gray-400 bg-gray-400/10',
    cerrado: 'text-gray-500 bg-gray-500/10',
  }
  return map[estado] ?? 'text-gray-400 bg-gray-400/10'
}

export function getLabelEstadoProyecto(estado: string): string {
  const map: Record<string, string> = {
    en_ejecucion: 'En ejecución',
    adjudicado: 'Adjudicado',
    en_licitacion: 'En licitación',
    paralizado: 'Paralizado',
    en_liquidacion: 'En liquidación',
    liquidado: 'Liquidado',
    cerrado: 'Cerrado',
  }
  return map[estado] ?? estado
}

// ─────────────────────────────────────────
// Color de estado de licitación
// ─────────────────────────────────────────
export function getColorEstadoLicitacion(estado: string): string {
  const map: Record<string, string> = {
    identificada: 'text-gray-400 bg-gray-400/10',
    preparando_propuesta: 'text-yellow-400 bg-yellow-400/10',
    propuesta_enviada: 'text-blue-400 bg-blue-400/10',
    en_evaluacion: 'text-orange-400 bg-orange-400/10',
    adjudicada: 'text-green-400 bg-green-400/10',
    no_adjudicada: 'text-red-400 bg-red-400/10',
    desierta: 'text-gray-500 bg-gray-500/10',
    cancelada: 'text-red-600 bg-red-600/10',
  }
  return map[estado] ?? 'text-gray-400 bg-gray-400/10'
}

export function getLabelEstadoLicitacion(estado: string): string {
  const map: Record<string, string> = {
    identificada: 'Identificada',
    preparando_propuesta: 'Preparando propuesta',
    propuesta_enviada: 'Propuesta enviada',
    en_evaluacion: 'En evaluación',
    adjudicada: 'Adjudicada',
    no_adjudicada: 'No adjudicada',
    desierta: 'Desierta',
    cancelada: 'Cancelada',
  }
  return map[estado] ?? estado
}

// ─────────────────────────────────────────
// Color estado valorización
// ─────────────────────────────────────────
export function getColorEstadoValorizacion(estado: string): string {
  const map: Record<string, string> = {
    elaborando: 'text-gray-400 bg-gray-400/10',
    enviada: 'text-blue-400 bg-blue-400/10',
    en_revision: 'text-yellow-400 bg-yellow-400/10',
    aprobada: 'text-green-400 bg-green-400/10',
    facturada: 'text-purple-400 bg-purple-400/10',
    cobrada: 'text-emerald-400 bg-emerald-400/10',
    anulada: 'text-red-400 bg-red-400/10',
  }
  return map[estado] ?? 'text-gray-400 bg-gray-400/10'
}

// ─────────────────────────────────────────
// Color estado garantía
// ─────────────────────────────────────────
export function getColorEstadoGarantia(estado: string): string {
  const map: Record<string, string> = {
    vigente: 'text-green-400 bg-green-400/10',
    por_vencer: 'text-yellow-400 bg-yellow-400/10',
    vencida: 'text-red-400 bg-red-400/10',
    ejecutada: 'text-red-600 bg-red-600/10',
    liberada: 'text-gray-400 bg-gray-400/10',
  }
  return map[estado] ?? 'text-gray-400 bg-gray-400/10'
}

// ─────────────────────────────────────────
// Labels helpers
// ─────────────────────────────────────────
export function getLabelTipoProyecto(tipo: string): string {
  const map: Record<string, string> = {
    contrato_publico: 'Contrato Público',
    contrato_privado: 'Contrato Privado',
    consultoria_tecnica: 'Consultoría Técnica',
    supervision_obras: 'Supervisión de Obras',
  }
  return map[tipo] ?? tipo
}

export function getLabelTipoGarantia(tipo: string): string {
  const map: Record<string, string> = {
    fiel_cumplimiento: 'Fiel Cumplimiento',
    adelanto_directo: 'Adelanto Directo',
    adelanto_materiales: 'Adelanto de Materiales',
    vicios_ocultos: 'Vicios Ocultos',
  }
  return map[tipo] ?? tipo
}

export function getLabelBanco(banco: string): string {
  const map: Record<string, string> = {
    bcp: 'BCP',
    bbva: 'BBVA',
    scotiabank: 'Scotiabank',
    interbank: 'Interbank',
    banbif: 'BanBif',
    mibanco: 'MiBanco',
    banco_nacion: 'Banco de la Nación',
    otro: 'Otro',
  }
  return map[banco] ?? banco.toUpperCase()
}

export function getLabelTipoComprobante(tipo: string): string {
  const map: Record<string, string> = {
    factura_recibida: 'Factura recibida',
    rhe: 'RHE',
    boleta_venta: 'Boleta de venta',
    liquidacion_compra: 'Liquidación de compra',
    ticket_maquina: 'Ticket máquina registradora',
    nota_debito_recibida: 'Nota de débito recibida',
    nota_credito_recibida: 'Nota de crédito recibida',
    carta_detraccion: 'Carta de detracción',
    vale_caja_chica: 'Vale de caja chica',
    boleta_planilla: 'Boleta de planilla',
    voucher_bancario: 'Voucher bancario',
    factura_emitida: 'Factura emitida',
    nota_debito_emitida: 'Nota de débito emitida',
    nota_credito_emitida: 'Nota de crédito emitida',
    nota_abono_bancario: 'Nota de abono bancario',
  }
  return map[tipo] ?? tipo
}

// ─────────────────────────────────────────
// Calcular días hábiles entre fechas
// ─────────────────────────────────────────
export function diasHabilesRestantes(fecha: string): number {
  const hoy = new Date()
  const fin = new Date(fecha + 'T00:00:00')
  let dias = 0
  const current = new Date(hoy)

  while (current < fin) {
    const dow = current.getDay()
    if (dow !== 0 && dow !== 6) dias++
    current.setDate(current.getDate() + 1)
  }
  return dias
}
