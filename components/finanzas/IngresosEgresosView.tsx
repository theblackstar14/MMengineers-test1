'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatSoles, cn } from '@/lib/utils'
import {
  FileText, Download, ChevronLeft, ChevronRight,
  AlertTriangle, AlertCircle, Info,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
type Movimiento = {
  id: string
  tipo: string
  tipo_comprobante: string
  numero_comprobante: string | null
  serie_comprobante: string | null
  fecha: string | null
  descripcion: string
  monto_bruto: number
  monto_neto: number
  detraccion_monto: number | null
  retencion_monto: number | null
  estado: string
  categoria: string | null
  proyecto_id: string | null
  proveedor_cliente: { razon_social: string } | null
  proyecto: { nombre: string; codigo: string } | null
  cuenta_bancaria: { nombre: string; banco: string } | null
}

interface Props {
  initialMovimientos: Movimiento[]
  initialMes: string
}

// ── Month labels ──────────────────────────────────────────────────
const MONTHS = [
  { key: '01', label: 'Ene' }, { key: '02', label: 'Feb' },
  { key: '03', label: 'Mar' }, { key: '04', label: 'Abr' },
  { key: '05', label: 'May' }, { key: '06', label: 'Jun' },
  { key: '07', label: 'Jul' }, { key: '08', label: 'Ago' },
  { key: '09', label: 'Sep' }, { key: '10', label: 'Oct' },
  { key: '11', label: 'Nov' }, { key: '12', label: 'Dic' },
]

// ── Mock rows matching image ──────────────────────────────────────
const MOCK_ROWS = [
  { id: '1',  tipo: 'ingreso', tipo_comprobante: 'factura_emitida',     fecha: '2025-06-05', descripcion: 'Valorización N°6 cobrada',                numero_comprobante: 'F001-00892', doc_vinculado: 'Val. N°6',     proyecto: 'Carretera R5',  categoria: 'Cobro valoriz.',    monto_bruto: 680000,  detraccion: null,   monto_neto: 680000,  estado: 'confirmado' },
  { id: '2',  tipo: 'egreso',  tipo_comprobante: 'factura_recibida',    fecha: '2025-06-05', descripcion: 'Subcontrato Vial SAC — obra jun',          numero_comprobante: 'F001-00234', doc_vinculado: 'OS-2025-041', proyecto: 'Carretera R5',  categoria: 'Subcontratistas',  monto_bruto: 280000,  detraccion: 32200,  monto_neto: 247800,  estado: 'confirmado' },
  { id: '3',  tipo: 'egreso',  tipo_comprobante: 'rhe',                 fecha: '2025-06-04', descripcion: 'Ing. topógrafo — levantamiento',           numero_comprobante: 'RHE-00456',  doc_vinculado: 'OS-2025-039', proyecto: 'Puente Lurín',  categoria: 'Consultoría',      monto_bruto: 3500,    detraccion: 280,    monto_neto: 3220,    estado: 'confirmado' },
  { id: '4',  tipo: 'egreso',  tipo_comprobante: 'factura_recibida',    fecha: '2025-06-04', descripcion: 'Compra fierro corrugado ferretería',       numero_comprobante: 'F003-01122', doc_vinculado: 'OC-2025-018', proyecto: 'Puente Lurín',  categoria: 'Materiales',       monto_bruto: 45200,   detraccion: null,   monto_neto: 45200,   estado: 'confirmado' },
  { id: '5',  tipo: 'ingreso', tipo_comprobante: 'nota_debito_emitida', fecha: '2025-06-03', descripcion: 'Nota débito — metrados adicionales',       numero_comprobante: 'ND01-00012', doc_vinculado: 'F001-00845',  proyecto: 'Saneam. Lima',  categoria: 'Ajuste factura',   monto_bruto: 18000,   detraccion: null,   monto_neto: 18000,   estado: 'confirmado' },
  { id: '6',  tipo: 'egreso',  tipo_comprobante: 'nota_credito_recibida', fecha: '2025-06-03', descripcion: 'Nota crédito prov. — descuento mat.',   numero_comprobante: 'NC01-00034', doc_vinculado: 'F003-01001',  proyecto: 'Carretera R5',  categoria: 'Descuento prov.',  monto_bruto: 5800,    detraccion: null,   monto_neto: 5800,    estado: 'confirmado' },
  { id: '7',  tipo: 'egreso',  tipo_comprobante: 'boleta_planilla',     fecha: '2025-06-02', descripcion: 'Planilla obreros semana 22',               numero_comprobante: 'PLAN-JUN-22', doc_vinculado: 'PDT 601',   proyecto: 'Carretera R5',  categoria: 'Planilla obra',    monto_bruto: 42000,   detraccion: null,   monto_neto: 42000,   estado: 'confirmado' },
  { id: '8',  tipo: 'egreso',  tipo_comprobante: 'ticket_maquina',      fecha: '2025-06-02', descripcion: 'Ticket combustible — obra Lima Sur',       numero_comprobante: 'T-00881',    doc_vinculado: '—',          proyecto: 'Saneam. Lima',  categoria: 'Combustible',      monto_bruto: 680,     detraccion: null,   monto_neto: 680,     estado: 'advertencia' },
  { id: '9',  tipo: 'egreso',  tipo_comprobante: 'carta_detraccion',    fecha: '2025-06-01', descripcion: 'Carta detracción — Vial SAC',              numero_comprobante: 'DET-00892',  doc_vinculado: 'F001-00234',  proyecto: 'Carretera R5',  categoria: 'Detracción',       monto_bruto: 32200,   detraccion: null,   monto_neto: 32200,   estado: 'confirmado' },
  { id: '10', tipo: 'egreso',  tipo_comprobante: 'factura_recibida',    fecha: null,         descripcion: 'Alquiler volquete mayo — Lima Sur',        numero_comprobante: '—',          doc_vinculado: 'OS-2025-028', proyecto: 'Saneam. Lima',  categoria: 'Maquinaria',       monto_bruto: 8500,    detraccion: null,   monto_neto: 8500,    estado: 'error' },
  { id: '11', tipo: 'egreso',  tipo_comprobante: 'vale_caja_chica',     fecha: '2025-06-01', descripcion: 'Vale caja chica — materiales menores',     numero_comprobante: 'VCC-041',    doc_vinculado: '—',          proyecto: 'Oficina',       categoria: 'Caja chica',       monto_bruto: 320,     detraccion: null,   monto_neto: 320,     estado: 'confirmado' },
  { id: '12', tipo: 'ingreso', tipo_comprobante: 'factura_emitida',     fecha: '2025-06-01', descripcion: 'Adelanto directo MTC — Carretera',         numero_comprobante: 'F001-00891', doc_vinculado: 'Contrato MTC', proyecto: 'Carretera R5', categoria: 'Adelanto directo', monto_bruto: 820000,  detraccion: null,   monto_neto: 820000,  estado: 'confirmado' },
]

// ── Comprobante pill config ────────────────────────────────────────
const COMP_PILL: Record<string, { label: string; bg: string; color: string }> = {
  factura_emitida:        { label: 'Factura emitida',      bg: '#22C55E20', color: '#22C55E' },
  factura_recibida:       { label: 'Factura recibida',     bg: '#F9731620', color: '#F97316' },
  rhe:                    { label: 'RHE',                  bg: '#8B5CF620', color: '#A78BFA' },
  nota_debito_emitida:    { label: 'Nota débito emit.',    bg: '#3B82F620', color: '#60A5FA' },
  nota_credito_recibida:  { label: 'Nota crédito recib.',  bg: '#14B8A620', color: '#2DD4BF' },
  boleta_planilla:        { label: 'Boleta de planilla',   bg: '#F59E0B20', color: '#FCD34D' },
  ticket_maquina:         { label: 'Ticket máq. regist.',  bg: '#64748B20', color: '#94A3B8' },
  carta_detraccion:       { label: 'Carta detracción',     bg: '#EAB30820', color: '#EAB308' },
  vale_caja_chica:        { label: 'Vale caja chica',      bg: '#22C55E20', color: '#22C55E' },
  nota_debito_recibida:   { label: 'Nota débito recib.',   bg: '#3B82F620', color: '#60A5FA' },
  nota_credito_emitida:   { label: 'Nota crédito emit.',   bg: '#14B8A620', color: '#2DD4BF' },
  boleta_venta:           { label: 'Boleta de venta',      bg: '#F59E0B20', color: '#FCD34D' },
  voucher_bancario:       { label: 'Voucher bancario',     bg: '#64748B20', color: '#94A3B8' },
}

function compPill(tipo: string) {
  return COMP_PILL[tipo] ?? { label: tipo, bg: '#64748B20', color: '#94A3B8' }
}

// ── Estado pill config ─────────────────────────────────────────────
function estadoPill(estado: string) {
  if (estado === 'confirmado') return { label: 'Confirmado', bg: '#22C55E20', color: '#22C55E' }
  if (estado === 'advertencia') return { label: 'Advertencia', bg: '#EAB30820', color: '#EAB308' }
  if (estado === 'error') return { label: 'Error', bg: '#EF444420', color: '#EF4444' }
  return { label: estado, bg: '#64748B20', color: '#94A3B8' }
}

// ── Format fecha ──────────────────────────────────────────────────
function fmtFecha(f: string | null): string {
  if (!f || f === '—') return '—'
  const d = new Date(f + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
}

// ── Filter tabs ───────────────────────────────────────────────────
const FILTER_TABS = ['Todos', 'Ingresos', 'Egresos', 'Facturas', 'RHE', 'Órdenes', 'Notas créd/déb.', 'Sin comprobante']

export function IngresosEgresosView({ initialMovimientos, initialMes }: Props) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(initialMes.split('-')[1])
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)

  const year = initialMes.split('-')[0]
  const mesLabel = MONTHS.find(m => m.key === selectedMonth)?.label ?? 'Jun'

  // Determine if we have real data
  const hasRealData = initialMovimientos.length > 0

  // KPI computation
  const rows = hasRealData
    ? initialMovimientos.map(m => ({
        id: m.id,
        tipo: m.tipo,
        tipo_comprobante: m.tipo_comprobante,
        fecha: m.fecha,
        descripcion: m.descripcion,
        numero_comprobante: m.numero_comprobante ?? '—',
        doc_vinculado: '—',
        proyecto: m.proyecto?.nombre ?? '—',
        categoria: m.categoria ?? '—',
        monto_bruto: m.monto_bruto,
        detraccion: m.detraccion_monto ?? m.retencion_monto ?? null,
        monto_neto: m.monto_neto,
        estado: m.estado,
      }))
    : MOCK_ROWS

  const totalIngresos = rows.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + r.monto_neto, 0)
  const totalEgresos  = rows.filter(r => r.tipo === 'egreso').reduce((s, r) => s + r.monto_neto, 0)
  const resultadoNeto = totalIngresos - totalEgresos
  const margen = totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : '14.3'

  const KPIS = [
    { label: `Total ingresos ${mesLabel}`,    value: hasRealData ? formatSoles(totalIngresos, true) : 'S/.3.82M',  sub: '▲ +12% vs May',        color: '#22C55E', subColor: '#22C55E' },
    { label: `Total egresos ${mesLabel}`,     value: hasRealData ? formatSoles(totalEgresos, true)  : 'S/.2.65M',  sub: 'Todos los gastos',       color: '#EF4444', subColor: '#64748B' },
    { label: 'Resultado neto',                value: hasRealData ? formatSoles(resultadoNeto, true)  : 'S/.1.17M',  sub: `${margen}% margen`,      color: '#22C55E', subColor: '#64748B' },
    { label: 'Documentos emitidos',           value: '18',                                                          sub: '3 notas crédito',        color: '#F1F5F9', subColor: '#64748B' },
    { label: 'Documentos recibidos',          value: '42',                                                          sub: '6 RHE · 28 fact.',       color: '#F1F5F9', subColor: '#64748B' },
    { label: 'Pendiente detracción',          value: 'S/.12,400',                                                   sub: '3 facturas',             color: '#F97316', subColor: '#64748B' },
    { label: 'Retenciones IR',                value: 'S/.504',                                                      sub: '4 RHE este mes',         color: '#F1F5F9', subColor: '#64748B' },
  ]

  // Filtered rows
  const filteredRows = rows.filter(r => {
    if (activeFilter === 'Todos') return true
    if (activeFilter === 'Ingresos') return r.tipo === 'ingreso'
    if (activeFilter === 'Egresos') return r.tipo === 'egreso'
    if (activeFilter === 'Facturas') return r.tipo_comprobante?.includes('factura')
    if (activeFilter === 'RHE') return r.tipo_comprobante === 'rhe'
    if (activeFilter === 'Órdenes') return r.doc_vinculado?.startsWith('OS-') || r.doc_vinculado?.startsWith('OC-')
    if (activeFilter === 'Notas créd/déb.') return r.tipo_comprobante?.includes('nota_')
    if (activeFilter === 'Sin comprobante') return !r.numero_comprobante || r.numero_comprobante === '—'
    return true
  })

  const ROWS_PER_PAGE = 12
  const totalPages = Math.max(1, Math.ceil((hasRealData ? initialMovimientos.length : 60) / ROWS_PER_PAGE))
  const pageRows = filteredRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  const confirmados = rows.filter(r => r.estado === 'confirmado').length
  const advertencias = rows.filter(r => r.estado === 'advertencia').length
  const errores = rows.filter(r => r.estado === 'error').length

  // Comprobantes panel data
  const COMPROBANTES = [
    { dot: '#22C55E', label: 'Facturas emitidas',  docs: 18, monto: 3820000, color: '#22C55E' },
    { dot: '#EF4444', label: 'Facturas recibidas', docs: 28, monto: 2140000, color: '#EF4444' },
    { dot: '#EF4444', label: 'RHE recibidos',       docs: 6,  monto: 22400,   color: '#EF4444' },
    { dot: '#F97316', label: 'Notas de crédito',    docs: 3,  monto: 15200,   color: '#94A3B8' },
    { dot: '#3B82F6', label: 'Notas de débito',     docs: 2,  monto: 28000,   color: '#3B82F6' },
    { dot: '#EAB308', label: 'Boletas / Tickets',   docs: 14, monto: 8600,    color: '#EAB308' },
    { dot: '#22C55E', label: 'Vales de caja chica', docs: 12, monto: 3840,    color: '#F1F5F9' },
  ]

  // Detracciones panel
  const DETRACCIONES = [
    { nombre: 'Vial SAC',         factura: 'F001-00234', monto: 33600, pct: '12%', estado: 'Pagado',    estadoColor: '#22C55E', estadoBg: '#22C55E20' },
    { nombre: 'Ferretería Lima',  factura: 'F003-01001', monto: 6400,  pct: '12%', estado: 'Pendiente', estadoColor: '#EF4444', estadoBg: '#EF444420' },
    { nombre: 'Consultoría ESP',  factura: 'F002-00567', monto: 6000,  pct: '12%', estado: 'Pendiente', estadoColor: '#F97316', estadoBg: '#F9731620' },
  ]
  const RETENCIONES = [
    { nombre: 'Ing. Topógrafo', rhe: 'RHE-00456', base: 3500, ret: 280 },
    { nombre: 'Arch. consultor', rhe: 'RHE-00441', base: 3800, ret: 224 },
  ]

  // Alertas panel
  const ALERTAS = [
    { nivel: 'CRÍTICO',  bg: '#EF444420', color: '#EF4444', icon: 'critical', titulo: 'Detracción Vial SAC vence mañana',          sub: 'S/.8,400 · F003-01001' },
    { nivel: 'CRÍTICO',  bg: '#EF444420', color: '#EF4444', icon: 'critical', titulo: 'Factura sin fecha — alquiler volquete',       sub: 'Imposible declarar a SUNAT' },
    { nivel: 'URGENTE',  bg: '#F9731620', color: '#F97316', icon: 'urgent',   titulo: '3 RHE sin retención calculada',               sub: 'Total expuesto: S/.38,000' },
    { nivel: 'AVISO',    bg: '#EAB30820', color: '#EAB308', icon: 'aviso',    titulo: 'Ticket combustible sin vinc. a proyecto',    sub: 'T-00881 · S/.680' },
    { nivel: 'AVISO',    bg: '#EAB30820', color: '#EAB308', icon: 'aviso',    titulo: 'Nota crédito NC01-00034 sin aplicar',         sub: 'Pendiente de cruzar con factura' },
  ]

  const LEGEND_PILLS = [
    { label: 'Factura emit./recib.', bg: '#22C55E20', color: '#22C55E' },
    { label: 'RHE',                  bg: '#8B5CF620', color: '#A78BFA' },
    { label: 'Nota déb/créd.',       bg: '#3B82F620', color: '#60A5FA' },
    { label: 'Detracción',           bg: '#EAB30820', color: '#EAB308' },
    { label: 'Planilla/Vale',        bg: '#F59E0B20', color: '#FCD34D' },
    { label: 'Ticket',               bg: '#64748B20', color: '#94A3B8' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── HEADER ROW ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Title */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-white">Ingresos y Egresos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Finanzas · Registro de movimientos · {mesLabel} {year}
          </p>
        </div>

        {/* Month pills */}
        <div className="flex items-center gap-1 flex-1 justify-center flex-wrap">
          {MONTHS.slice(0, 8).map(m => (
            <button
              key={m.key}
              onClick={() => { setSelectedMonth(m.key); setCurrentPage(1) }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={
                selectedMonth === m.key
                  ? { backgroundColor: '#EAB308', color: '#000' }
                  : { backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/finanzas/movimientos/nuevo')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors hover:opacity-90"
            style={{ backgroundColor: '#EAB308', color: '#000' }}
          >
            + Nuevo movimiento
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            Importar Excel
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div
        className="grid grid-cols-7 divide-x rounded-xl overflow-hidden border"
        style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
      >
        {KPIS.map((k, i) => (
          <div key={i} className="px-4 py-3" style={{ borderColor: '#1E293B' }}>
            <p className="text-[11px] text-gray-500 mb-0.5 truncate">{k.label}</p>
            <p className="text-xl font-bold leading-tight truncate" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: k.subColor }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN TABLE CARD ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>

        {/* Card header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between gap-4"
          style={{ borderColor: '#1E293B' }}
        >
          <div>
            <p className="text-sm font-bold text-white">Movimientos — {mesLabel === 'Jun' ? 'Junio' : mesLabel} {year}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {rows.length} registros · {confirmados} confirmados · {advertencias} advertencias · {errores} errores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#22C55E' }}
            >
              <Download size={11} /> Excel
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#EF4444' }}
            >
              <Download size={11} /> PDF
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
              style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#3B82F6' }}
            >
              <Download size={11} /> CSV
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto"
          style={{ borderColor: '#1E293B' }}
        >
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveFilter(tab); setCurrentPage(1) }}
              className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={
                activeFilter === tab
                  ? { backgroundColor: '#EAB308', color: '#000' }
                  : { backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#0B0F1A' }}>
                {['T', 'Fecha', 'Concepto', 'Tipo comprobante', 'N° Doc.', 'Doc. vinculado', 'Proyecto', 'Categoría', 'Monto', 'Detrac./Reten.', 'Neto', 'Estado'].map(col => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wide font-semibold whitespace-nowrap"
                    style={{ color: '#475569', borderBottom: '1px solid #1E293B' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const isError = row.estado === 'error'
                const isAdv   = row.estado === 'advertencia'
                const cp = compPill(row.tipo_comprobante)
                const ep = estadoPill(row.estado)

                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{
                      borderLeft: isError ? '3px solid #EF4444' : isAdv ? '3px solid #EAB308' : '3px solid transparent',
                      borderBottom: '1px solid #1E293B',
                    }}
                  >
                    {/* T */}
                    <td className="px-3 py-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={
                          row.tipo === 'ingreso'
                            ? { backgroundColor: '#22C55E20', color: '#22C55E' }
                            : { backgroundColor: '#EF444420', color: '#EF4444' }
                        }
                      >
                        {row.tipo === 'ingreso' ? 'I' : 'E'}
                      </div>
                    </td>
                    {/* Fecha */}
                    <td className="px-3 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                      {fmtFecha(row.fecha)}
                    </td>
                    {/* Concepto */}
                    <td className="px-3 py-2.5 text-xs text-white max-w-[200px] truncate">
                      {row.descripcion}
                    </td>
                    {/* Tipo comprobante */}
                    <td className="px-3 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                        style={{ backgroundColor: cp.bg, color: cp.color }}
                      >
                        {cp.label}
                      </span>
                    </td>
                    {/* N° Doc */}
                    <td className="px-3 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                      {row.numero_comprobante}
                    </td>
                    {/* Doc vinculado */}
                    <td className="px-3 py-2.5">
                      {row.doc_vinculado && row.doc_vinculado !== '—' ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }}
                        >
                          {row.doc_vinculado}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-600">—</span>
                      )}
                    </td>
                    {/* Proyecto */}
                    <td className="px-3 py-2.5 text-[11px] text-gray-400 whitespace-nowrap max-w-[100px] truncate">
                      {row.proyecto}
                    </td>
                    {/* Categoría */}
                    <td className="px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                      {row.categoria}
                    </td>
                    {/* Monto */}
                    <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: row.tipo === 'ingreso' ? '#22C55E' : '#EF4444' }}>
                      {row.tipo === 'ingreso' ? '+' : '-'}S/.{row.monto_bruto.toLocaleString('es-PE')}
                    </td>
                    {/* Detrac/Reten */}
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: row.detraccion ? '#F97316' : '#475569' }}>
                      {row.detraccion ? `-S/.${row.detraccion.toLocaleString('es-PE')}` : '—'}
                    </td>
                    {/* Neto */}
                    <td className="px-3 py-2.5 text-xs font-bold whitespace-nowrap" style={{ color: row.tipo === 'ingreso' ? '#22C55E' : '#EF4444' }}>
                      {row.tipo === 'ingreso' ? '+' : '-'}S/.{row.monto_neto.toLocaleString('es-PE')}
                    </td>
                    {/* Estado */}
                    <td className="px-3 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                        style={{ backgroundColor: ep.bg, color: ep.color }}
                      >
                        {ep.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between gap-4"
          style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
        >
          {/* Left */}
          <p className="text-[11px] text-gray-500 whitespace-nowrap">
            Mostrando {pageRows.length} de {hasRealData ? initialMovimientos.length : 60} movimientos
          </p>

          {/* Center: pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#161B2E', border: '1px solid #1E293B', color: '#94A3B8' }}
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                  style={
                    currentPage === page
                      ? { backgroundColor: '#EAB308', color: '#000' }
                      : { backgroundColor: '#161B2E', border: '1px solid #1E293B', color: '#64748B' }
                  }
                >
                  {page}
                </button>
              )
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-600 text-xs">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: '#161B2E', border: '1px solid #1E293B', color: '#64748B' }}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#161B2E', border: '1px solid #1E293B', color: '#94A3B8' }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Right: legend pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {LEGEND_PILLS.map(pill => (
              <span
                key={pill.label}
                className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                style={{ backgroundColor: pill.bg, color: pill.color }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM 3 PANELS ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Panel 1: Comprobantes del mes */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
              Comprobantes del mes
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Emitidos y recibidos · {mesLabel} {year}</p>
          </div>
          <div className="space-y-2">
            {COMPROBANTES.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dot }} />
                  <span className="text-xs text-gray-300">{item.label}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }}
                  >
                    {item.docs} docs
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: item.color }}>
                  S/.{(item.monto / 1000).toFixed(0) + (item.monto >= 1000000 ? 'M' : 'K')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Detracciones y Retenciones */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
              Detracciones y Retenciones
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Obligaciones fiscales del mes</p>
          </div>

          {/* Detracciones */}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-2">Detracciones (SUNAT)</p>
          <div className="space-y-2 mb-4">
            {DETRACCIONES.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300">{d.nombre} — <span className="text-gray-500">{d.factura}</span></p>
                  <p className="text-[10px] text-gray-500">S/.{d.monto.toLocaleString('es-PE')} · {d.pct}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: d.estadoBg, color: d.estadoColor }}
                >
                  {d.estado}
                </span>
              </div>
            ))}
          </div>

          {/* Retenciones */}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-2">Retenciones IR 4ta categ. (RHE)</p>
          <div className="space-y-2">
            {RETENCIONES.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300">{r.nombre} — <span className="text-gray-500">{r.rhe}</span></p>
                  <p className="text-[10px] text-gray-500">Base: S/.{r.base.toLocaleString('es-PE')}</p>
                </div>
                <span className="text-xs font-medium" style={{ color: '#F97316' }}>
                  Ret: S/.{r.ret}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Alertas y pendientes fiscales */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
              Alertas y pendientes fiscales
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Requieren acción inmediata</p>
          </div>
          <div className="space-y-2.5">
            {ALERTAS.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ backgroundColor: a.bg }}
              >
                <div className="shrink-0 mt-0.5">
                  {a.nivel === 'CRÍTICO' && <AlertCircle size={13} style={{ color: a.color }} />}
                  {a.nivel === 'URGENTE' && <AlertTriangle size={13} style={{ color: a.color }} />}
                  {a.nivel === 'AVISO'   && <Info size={13} style={{ color: a.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold" style={{ color: a.color }}>{a.nivel}</span>
                  </div>
                  <p className="text-xs font-medium text-white leading-snug">{a.titulo}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
