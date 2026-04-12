'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, FileText, Upload, Paperclip,
  TrendingUp, TrendingDown, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
interface CuentaBancaria {
  id: string
  nombre: string
  banco?: string
  tipo?: string
  saldo_actual?: number
  [key: string]: unknown
}

interface Props {
  cuentas: CuentaBancaria[]
}

// ── Style constants ───────────────────────────────────────────────
const inputClass = 'w-full bg-[#0F1623] border border-[#1E293B] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308] transition-colors placeholder:text-gray-600'
const selectClass = 'w-full bg-[#0F1623] border border-[#1E293B] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308] transition-colors appearance-none'
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide mb-1.5'

// ── Category options ──────────────────────────────────────────────
const CATS_INGRESO = ['Cobro valorización', 'Adelanto directo', 'Adelanto materiales', 'Liquidación', 'Ajuste factura', 'Otros ingresos']
const CATS_EGRESO  = ['Subcontratistas', 'Materiales', 'Maquinaria', 'Planilla obra', 'Planilla adm.', 'Combustible', 'Consultoría', 'Caja chica', 'Detracción', 'Otros gastos']

const TIPO_COMP_INGRESO = [
  'factura_emitida', 'nota_debito_emitida', 'nota_credito_emitida', 'nota_abono_bancario',
]
const TIPO_COMP_EGRESO = [
  'factura_recibida', 'rhe', 'boleta_venta', 'ticket_maquina', 'boleta_planilla',
  'vale_caja_chica', 'carta_detraccion', 'nota_debito_recibida', 'nota_credito_recibida',
]

const TIPO_COMP_LABEL: Record<string, string> = {
  factura_emitida: 'Factura emitida', nota_debito_emitida: 'Nota débito emitida',
  nota_credito_emitida: 'Nota crédito emitida', nota_abono_bancario: 'Nota de abono bancario',
  factura_recibida: 'Factura recibida', rhe: 'RHE (Recibo Honorarios)',
  boleta_venta: 'Boleta de venta', ticket_maquina: 'Ticket máquina registradora',
  boleta_planilla: 'Boleta de planilla', vale_caja_chica: 'Vale de caja chica',
  carta_detraccion: 'Carta de detracción', nota_debito_recibida: 'Nota débito recibida',
  nota_credito_recibida: 'Nota crédito recibida',
}

// ── Recent mock movements ─────────────────────────────────────────
const RECIENTES = [
  { tipo: 'ingreso', descripcion: 'Cobro supervisión Reg. Ica',   categoria: 'Supervisión',    hora: 'Hoy 09:32',   monto: 42000  },
  { tipo: 'egreso',  descripcion: 'Planilla administrativa Jun',   categoria: 'Planilla adm.',  hora: 'Hoy 08:15',   monto: 29000  },
  { tipo: 'egreso',  descripcion: 'Compra fierro corrugado',        categoria: 'Materiales',     hora: 'Ayer 17:40',  monto: 45200  },
  { tipo: 'egreso',  descripcion: 'Pago subcontratista Vial SAC',  categoria: 'Subcontratistas',hora: 'Ayer 11:20',  monto: 280000 },
  { tipo: 'ingreso', descripcion: 'Valorización N°5 — Puente Lurín', categoria: 'Cobro valoriz.', hora: '03/06',      monto: 320000 },
]

export function NuevoMovimientoForm({ cuentas }: Props) {
  const router = useRouter()

  // Form state
  const today = new Date().toISOString().split('T')[0]
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [fecha, setFecha] = useState(today)
  const [monto, setMonto] = useState('0.00')
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [cuenta, setCuenta] = useState('')
  const [tipoContrato, setTipoContrato] = useState('')
  const [numComprobante, setNumComprobante] = useState('')
  const [provCliente, setProvCliente] = useState('')
  const [notas, setNotas] = useState('')

  const montoNum = parseFloat(monto.replace(/,/g, '')) || 0
  const cats = tipo === 'ingreso' ? CATS_INGRESO : CATS_EGRESO
  const tiposComp = tipo === 'ingreso' ? TIPO_COMP_INGRESO : TIPO_COMP_EGRESO

  // Format fecha for display
  function fmtFechaDisplay(f: string) {
    if (!f) return '—'
    const d = new Date(f + 'T00:00:00')
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function formatMontoDisplay(val: number) {
    return val.toLocaleString('es-PE', { minimumFractionDigits: 2 })
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div>
          <h1 className="text-2xl font-bold text-white">Registrar Movimiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Formulario manual · Ingresos y Egresos</p>
        </div>
        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            Importar Excel
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: '#EAB308', color: '#000' }}
          >
            Formulario manual
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            Escanear boleta IA
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="grid grid-cols-5 gap-6 items-start">

        {/* ── LEFT PANEL: Form ── */}
        <div className="col-span-3 space-y-5">
          <div className="rounded-xl border p-5" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <div className="mb-4">
              <h2 className="text-base font-bold text-white">Nuevo movimiento</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Completa todos los campos obligatorios (*)</p>
            </div>

            {/* Tipo de movimiento */}
            <div className="mb-5">
              <p className={cn(labelClass, 'text-gray-500')}>Tipo de movimiento *</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Ingreso */}
                <button
                  onClick={() => { setTipo('ingreso'); setCategoria('') }}
                  className="relative p-4 rounded-xl border-2 text-left transition-all"
                  style={
                    tipo === 'ingreso'
                      ? { borderColor: '#22C55E', backgroundColor: '#22C55E08' }
                      : { borderColor: '#1E293B', backgroundColor: '#0F1623' }
                  }
                >
                  {tipo === 'ingreso' && (
                    <div
                      className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#22C55E' }}
                    />
                  )}
                  <TrendingUp
                    size={20}
                    className="mb-2"
                    style={{ color: '#22C55E' }}
                  />
                  <p className="text-sm font-bold text-white">Ingreso</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Cobros, valorizaciones, adelantos</p>
                </button>

                {/* Egreso */}
                <button
                  onClick={() => { setTipo('egreso'); setCategoria('') }}
                  className="relative p-4 rounded-xl border-2 text-left transition-all"
                  style={
                    tipo === 'egreso'
                      ? { borderColor: '#EF4444', backgroundColor: '#EF444408' }
                      : { borderColor: '#1E293B', backgroundColor: '#0F1623' }
                  }
                >
                  {tipo === 'egreso' && (
                    <div
                      className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#EF4444' }}
                    />
                  )}
                  <TrendingDown
                    size={20}
                    className="mb-2"
                    style={{ color: '#EF4444' }}
                  />
                  <p className="text-sm font-bold text-white">Egreso</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Pagos, compras, planillas, gastos</p>
                </button>
              </div>
            </div>

            {/* Date + Amount */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Fecha *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Monto (S/.) *</label>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Concepto */}
            <div className="mb-4">
              <label className={cn(labelClass, 'text-gray-500')}>Concepto / descripción *</label>
              <input
                type="text"
                value={concepto}
                onChange={e => setConcepto(e.target.value)}
                placeholder="Ej: Cobro valorización N°6 — Carretera Ruta 5"
                className={inputClass}
              />
            </div>

            {/* Categoría + Proyecto */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Categoría *</label>
                <div className="relative">
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar...</option>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronRight
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                    style={{ color: '#64748B' }}
                  />
                </div>
              </div>
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Proyecto vinculado</label>
                <div className="relative">
                  <select
                    value={proyecto}
                    onChange={e => setProyecto(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sin proyecto</option>
                    <option value="Carretera R5">Carretera Ruta 5</option>
                    <option value="Puente Lurín">Puente Lurín</option>
                    <option value="Saneam. Lima">Saneamiento Lima</option>
                    <option value="Edificio Sede">Edificio Sede</option>
                    <option value="Oficina">Oficina (sin proyecto)</option>
                  </select>
                  <ChevronRight
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                    style={{ color: '#64748B' }}
                  />
                </div>
              </div>
            </div>

            {/* Cuenta + Tipo contrato */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Cuenta de {tipo === 'ingreso' ? 'destino' : 'origen'} *</label>
                <div className="relative">
                  <select
                    value={cuenta}
                    onChange={e => setCuenta(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cuentas.length > 0
                      ? cuentas.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))
                      : (
                        <>
                          <option value="bcp_principal">BCP — Cta. Corriente Principal</option>
                          <option value="caja_chica">Caja Chica Obras</option>
                        </>
                      )
                    }
                  </select>
                  <ChevronRight
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                    style={{ color: '#64748B' }}
                  />
                </div>
              </div>
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>Tipo de comprobante</label>
                <div className="relative">
                  <select
                    value={tipoContrato}
                    onChange={e => setTipoContrato(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sin comprobante</option>
                    {tiposComp.map(t => (
                      <option key={t} value={t}>{TIPO_COMP_LABEL[t] ?? t}</option>
                    ))}
                  </select>
                  <ChevronRight
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                    style={{ color: '#64748B' }}
                  />
                </div>
              </div>
            </div>

            {/* N° Comprobante + Proveedor */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>N° comprobante / factura</label>
                <input
                  type="text"
                  value={numComprobante}
                  onChange={e => setNumComprobante(e.target.value)}
                  placeholder="Ej: F001-00892"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={cn(labelClass, 'text-gray-500')}>{tipo === 'ingreso' ? 'Cliente' : 'Proveedor'}</label>
                <input
                  type="text"
                  value={provCliente}
                  onChange={e => setProvCliente(e.target.value)}
                  placeholder={tipo === 'ingreso' ? 'Nombre del cliente...' : 'Nombre del proveedor...'}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="mb-5">
              <label className={cn(labelClass, 'text-gray-500')}>Notas u observaciones</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales, referencias internas..."
                className={cn(inputClass, 'resize-none')}
              />
            </div>

            {/* Adjuntar comprobante */}
            <div className="mb-5">
              <p className={cn(labelClass, 'text-gray-500')}>Adjuntar comprobante</p>
              <p className="text-[11px] text-gray-600 mb-3">Foto de boleta, factura o voucher · JPG, PNG, PDF · máx. 5MB</p>
              <div className="flex items-center gap-3">
                {/* Existing file mock */}
                <div
                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold gap-1"
                  style={{ backgroundColor: '#161B2E', border: '1px solid #1E293B', color: '#64748B' }}
                >
                  <FileText size={18} style={{ color: '#3B82F6' }} />
                  BOL
                </div>
                {/* Add more */}
                <button
                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-medium border-2 border-dashed transition-colors hover:border-gray-500 hover:text-gray-400"
                  style={{ borderColor: '#1E293B', color: '#475569' }}
                >
                  <Upload size={14} />
                  Agregar
                </button>
                <div className="flex items-center gap-1.5">
                  <Paperclip size={11} className="text-gray-600" />
                  <span className="text-[11px] text-gray-600">1 archivo adjunto</span>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: '#1E293B' }}>
              <button
                onClick={() => router.back()}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:text-white"
                style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:text-white"
                style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
              >
                + Guardar y registrar otro
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-90"
                style={{ backgroundColor: '#EAB308', color: '#000' }}
              >
                Guardar movimiento
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Preview + Impact + Recent ── */}
        <div className="col-span-2 space-y-4 sticky top-6">

          {/* Card 1: Live preview */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Vista previa del movimiento</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-medium text-green-400">Live</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 mb-4">Se actualiza mientras llenas el formulario</p>

            {/* Big amount */}
            <div className="mb-4">
              <p
                className="text-3xl font-black leading-none"
                style={{ color: tipo === 'ingreso' ? '#22C55E' : '#EF4444' }}
              >
                {tipo === 'ingreso' ? '+' : '-'}S/. {formatMontoDisplay(montoNum)}
              </p>
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={
                  tipo === 'ingreso'
                    ? { backgroundColor: '#22C55E20', color: '#22C55E' }
                    : { backgroundColor: '#EF444420', color: '#EF4444' }
                }
              >
                {tipo === 'ingreso' ? 'INGRESO' : 'EGRESO'}
              </span>
              {fecha && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }}>
                  {fmtFechaDisplay(fecha)}
                </span>
              )}
              {categoria && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#161B2E', color: '#64748B', border: '1px solid #1E293B' }}>
                  {categoria}
                </span>
              )}
            </div>

            {/* Data rows */}
            <div className="space-y-2 text-xs border-t pt-3" style={{ borderColor: '#1E293B' }}>
              {[
                { label: 'Concepto',    value: concepto || '—' },
                { label: 'Proyecto',    value: proyecto || '—' },
                { label: 'Cuenta',      value: cuenta ? (cuentas.find(c => c.id === cuenta)?.nombre ?? cuenta) : '—' },
                { label: 'Comprobante', value: numComprobante || '—' },
                { label: tipo === 'ingreso' ? 'Cliente' : 'Proveedor', value: provCliente || '—' },
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-gray-600 w-24 shrink-0">{row.label}</span>
                  <span className="text-white truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Impacto */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <div className="mb-3">
              <p className="text-sm font-bold text-white">Impacto al registrar este movimiento</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Así quedarán los indicadores del mes</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Total Ingresos Jun', before: 'S/.3,520,000', after: 'S/.4,200,000', delta: '▲ Mejora', positive: true },
                { label: 'Resultado neto',      before: '-S/.80,000',  after: '+S/.600,000',  delta: '▲ Mejora', positive: true },
                { label: 'Margen del mes',      before: '-2.3%',        after: '+14.3%',       delta: '▲ Mejora', positive: true },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#0F1623', border: '1px solid #1E293B' }}
                >
                  <p className="text-[10px] text-gray-500 mb-1.5">{kpi.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{kpi.before}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-xs font-bold" style={{ color: kpi.positive ? '#22C55E' : '#EF4444' }}>{kpi.after}</span>
                    <span className="text-[10px] font-medium ml-auto" style={{ color: kpi.positive ? '#22C55E' : '#EF4444' }}>{kpi.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Últimos movimientos */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white">Últimos movimientos registrados</p>
              <Link href="/finanzas/movimientos" className="text-[11px] transition-colors hover:opacity-80" style={{ color: '#EAB308' }}>
                Ver todos →
              </Link>
            </div>
            <p className="text-[11px] text-gray-600 mb-3">Hoy · Jun {new Date().getFullYear()}</p>

            <div className="space-y-2">
              {RECIENTES.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={
                      r.tipo === 'ingreso'
                        ? { backgroundColor: '#22C55E20', color: '#22C55E' }
                        : { backgroundColor: '#EF444420', color: '#EF4444' }
                    }
                  >
                    {r.tipo === 'ingreso' ? 'I' : 'E'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{r.descripcion}</p>
                    <p className="text-[10px] text-gray-600">{r.categoria} · {r.hora}</p>
                  </div>
                  <span
                    className="text-xs font-medium shrink-0"
                    style={{ color: r.tipo === 'ingreso' ? '#22C55E' : '#EF4444' }}
                  >
                    {r.tipo === 'ingreso' ? '+' : '-'}S/.{r.monto.toLocaleString('es-PE')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
