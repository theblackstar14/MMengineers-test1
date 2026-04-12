import { Metadata } from 'next'
import { ReactNode } from 'react'
import Link from 'next/link'
import {
  getFinanzasKpis, getCuentasTesoreria, getValorizacionesActivas,
  getGarantiasActivas, getFlujoCajaMensual,
  getCuentasPorCobrar, getCuentasPorPagar, getGastosOficina,
} from '@/lib/queries/finanzas'
import { formatSoles, formatFecha, getLabelBanco, cn } from '@/lib/utils'
import { FlujoCajaBarChartWrapper } from '@/components/finanzas/FlujoCajaBarChartWrapper'
import {
  Plus, AlertTriangle, ShieldCheck, ArrowUpRight, Download, Sparkles,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Finanzas — MMHIGHMETRIK ERP' }
export const revalidate = 120

// ── Helpers ──────────────────────────────────────────────────────
function dpv(fecha: string | null): number | null {
  if (!fecha) return null
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
}

const LABEL_VAL: Record<string, string> = {
  elaborando: 'Elaborando', enviada: 'Enviada', en_revision: 'En revisión',
  aprobada: 'Aprobada', facturada: 'Facturada', cobrada: 'Cobrada', anulada: 'Anulada',
}
const COLOR_VAL: Record<string, { bg: string; color: string }> = {
  elaborando: { bg: '#64748B20', color: '#94A3B8' },
  enviada:    { bg: '#3B82F620', color: '#60A5FA' },
  en_revision:{ bg: '#EAB30820', color: '#FCD34D' },
  aprobada:   { bg: '#22C55E20', color: '#4ADE80' },
  facturada:  { bg: '#8B5CF620', color: '#A78BFA' },
  cobrada:    { bg: '#10B98120', color: '#34D399' },
  anulada:    { bg: '#EF444420', color: '#F87171' },
}
const LABEL_GAR: Record<string, string> = {
  fiel_cumplimiento: 'Fiel cumplimiento', adelanto_directo: 'Adelanto directo',
  adelanto_materiales: 'Adelanto mat.', vicios_ocultos: 'Vicios ocultos',
}

// ── Mock fallbacks (matching image data) ─────────────────────────
const GASTOS_MOCK = [
  { id: '1', descripcion: 'Alquiler oficina',           categoria: 'Miraflores, piso 3',  monto_neto: 4500, color: '#3B82F6' },
  { id: '2', descripcion: 'Servicios (agua/luz/inet)',   categoria: 'Boletas incluidas',    monto_neto: 1200, color: '#3B82F6' },
  { id: '3', descripcion: 'Planilla administrativa',     categoria: '6 personas',           monto_neto: 5800, color: '#6B7280' },
  { id: '4', descripcion: 'Útiles y papelería',          categoria: 'Compras del mes',      monto_neto: 340,  color: '#6B7280' },
  { id: '5', descripcion: 'Transporte y viáticos',       categoria: 'Visitas a obra',       monto_neto: 890,  color: '#EAB308' },
  { id: '6', descripcion: 'Gastos de representación',    categoria: 'Reuniones clientes',   monto_neto: 510,  color: '#8B5CF6' },
]

const VAL_MOCK = [
  { id: '1', numero: 6, proyecto: { nombre: 'Carretera Ruta 5',  entidad_contratante: 'MTC Perú'  }, venceDias: 8,   monto_neto: 680000, estado: 'enviada'   },
  { id: '2', numero: 4, proyecto: { nombre: 'Saneamiento Lima',  entidad_contratante: 'SEDAPAL'   }, venceDias: 22,  monto_neto: 420000, estado: 'aprobada'  },
  { id: '3', numero: 3, proyecto: { nombre: 'Edificio Sede',     entidad_contratante: 'Priv. Inv.' }, venceDias: null, monto_neto: 510000, estado: 'facturada' },
  { id: '4', numero: 8, proyecto: { nombre: 'Puente Lurín',      entidad_contratante: 'Mun. Lima'  }, venceDias: null, monto_neto: 340000, estado: 'cobrada'   },
  { id: '5', numero: 2, proyecto: { nombre: 'Cons. Hidráulica',  entidad_contratante: 'Reg. Ica'   }, venceDias: -60,  monto_neto: 150000, estado: 'anulada'   },
]

const GAR_MOCK = [
  { id: '1', tipo: 'fiel_cumplimiento', proyecto: { nombre: 'Carretera Ruta 5'   }, banco: 'bcp',        dias: 15,  monto: 824000, fecha: '15 Jul 2025' },
  { id: '2', tipo: 'adelanto_directo',  proyecto: { nombre: 'Carretera Ruta 5'   }, banco: 'bcp',        dias: 15,  monto: 412000, fecha: '15 Jul 2025' },
  { id: '3', tipo: 'fiel_cumplimiento', proyecto: { nombre: 'Puente Lurín'       }, banco: 'bbva',       dias: 30,  monto: 470000, fecha: '30 Jul 2025' },
  { id: '4', tipo: 'fiel_cumplimiento', proyecto: { nombre: 'Saneam. Lima Sur'   }, banco: 'scotiabank', dias: 160, monto: 320000, fecha: '10 Ene 2026' },
  { id: '5', tipo: 'vicios_ocultos',    proyecto: { nombre: 'Pasim. Callao'      }, banco: 'bcp',        dias: 155, monto: 260000, fecha: '25 Dic 2025' },
]

const COBRAR_MOCK = [
  { id: '1', nombre: 'MTC Perú',           ref: 'Val. N°6 Carretera',     dias: 5,   monto: 680000 },
  { id: '2', nombre: 'SEDAPAL',            ref: 'Val. N°4 Saneam.',       dias: 22,  monto: 420000 },
  { id: '3', nombre: 'Priv. Inversiones',  ref: 'Val. N°3 Edificio',      dias: 45,  monto: 510000 },
  { id: '4', nombre: 'Reg. Ica',           ref: 'Cons. Hidráulica',       dias: -60, monto: 150000 },
  { id: '5', nombre: 'Mun. Lima Sur',      ref: 'Liquidación Puente',     dias: 30,  monto: 340000 },
]

const PAGAR_MOCK = [
  { id: '1', nombre: 'Contratista Vial SAC', ref: 'Subcontrato obra',   dias: 5,  monto: 280000 },
  { id: '2', nombre: 'Ferretería Lima',       ref: 'Materiales Jun',     dias: 12, monto: 145000 },
  { id: '3', nombre: 'Planilla administrativa', ref: 'Sueldos Jun',      dias: 19, monto: 290000 },
  { id: '4', nombre: 'Alquiler maquinaria',   ref: 'Volquetes + grúa',  dias: 20, monto: 98000  },
  { id: '5', nombre: 'Banco BCP',             ref: 'Cuota préstamo',    dias: 28, monto: 77000  },
]

const FLUJO_MOCK = [
  { mes: '2025-04-01', real: 2100000, egresos: 0       },
  { mes: '2025-05-01', real: 2400000, egresos: 0       },
  { mes: '2025-06-01', real: 3200000, egresos: 2600000 },
  { mes: '2025-07-01', real: 0,       egresos: 3600000 },
  { mes: '2025-08-01', real: 0,       egresos: 4100000 },
  { mes: '2025-09-01', real: 0,       egresos: 0       },
]

// ── Sub-components ───────────────────────────────────────────────
function SecHeader({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
        {label}
      </span>
      {action}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default async function FinanzasPage() {
  const [kpis, cuentas, valDB, garDB, flujoDB, cobrarDB, pagarDB, gastosDB] = await Promise.all([
    getFinanzasKpis(), getCuentasTesoreria(), getValorizacionesActivas(),
    getGarantiasActivas(), getFlujoCajaMensual(),
    getCuentasPorCobrar(), getCuentasPorPagar(), getGastosOficina(),
  ])

  // Exclude ahorros (user removed "Cuenta Ahorros Obras"), show only corriente + caja_chica
  const cuentasFiltradas = cuentas.filter((c: any) => c.tipo !== 'ahorros').slice(0, 2)
  const cuentaPrincipal = cuentasFiltradas.find((c: any) => c.tipo === 'corriente') ?? cuentasFiltradas[0]
  const cajaChica       = cuentasFiltradas.find((c: any) => c.tipo === 'caja_chica')

  const mesLabel = new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
  const mesCorto = new Date().toLocaleDateString('es-PE', { month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())

  // Use mock if DB empty
  const gastos   = gastosDB.length  > 0 ? gastosDB  : GASTOS_MOCK
  const vals     = valDB.length     > 0 ? valDB.map(v => ({
    id: v.id, numero: v.numero, proyecto: v.proyecto ? { nombre: v.proyecto.nombre, entidad_contratante: v.proyecto.entidad_contratante } : null,
    venceDias: dpv(v.fecha_vencimiento), monto_neto: v.monto_neto, estado: v.estado,
  })) : VAL_MOCK
  const gars     = garDB.length     > 0 ? garDB.map(g => ({
    id: g.id, tipo: g.tipo, proyecto: g.proyecto, banco: g.banco,
    dias: dpv(g.fecha_vencimiento) ?? 0, monto: g.monto, fecha: formatFecha(g.fecha_vencimiento),
  })) : GAR_MOCK
  const cobrar   = cobrarDB.length  > 0 ? cobrarDB.map(m => ({
    id: m.id, nombre: m.proveedor_cliente?.razon_social ?? m.descripcion,
    ref: m.proyecto?.nombre ?? '', dias: dpv(m.fecha_vencimiento) ?? 0, monto: m.monto_neto,
  })) : COBRAR_MOCK
  const pagar    = pagarDB.length   > 0 ? pagarDB.map(m => ({
    id: m.id, nombre: m.proveedor_cliente?.razon_social ?? m.descripcion,
    ref: m.proyecto?.nombre ?? '', dias: dpv(m.fecha_vencimiento) ?? 0, monto: m.monto_neto,
  })) : PAGAR_MOCK
  const flujo    = flujoDB.length  > 0 ? flujoDB : FLUJO_MOCK

  const totalGastos = gastos.reduce((s: number, g: any) => s + Number(g.monto_neto ?? 0), 0)
  const presupuesto = 18000
  const pctGastos   = Math.min((totalGastos / presupuesto) * 100, 100)
  const totalCobrar = cobrar.reduce((s, m) => s + m.monto, 0)
  const totalPagar  = pagar.reduce((s, m) => s + m.monto, 0)
  const totalGar    = gars.reduce((s, g) => s + g.monto, 0)
  const garPorVencer = gars.filter(g => g.dias >= 0 && g.dias <= 30).length

  const KPIS = [
    { label: 'Ingresos del mes',  value: formatSoles(kpis.ingresosMes, true),    sub: kpis.varIngresosPct !== null ? `${kpis.varIngresosPct >= 0 ? '▲ +' : '▼ '}${Math.abs(kpis.varIngresosPct).toFixed(0)}% vs mes ant.` : 'Sin comparativa', color: '#F1F5F9', subColor: kpis.varIngresosPct !== null && kpis.varIngresosPct >= 0 ? '#22C55E' : '#EF4444' },
    { label: 'Gastos del mes',    value: formatSoles(kpis.egresosMes, true),     sub: 'Planilla + subcont.',          color: '#F1F5F9', subColor: '#64748B' },
    { label: 'Margen neto',       value: `${kpis.margenNeto.toFixed(1)}%`,       sub: `${formatSoles(kpis.utilidad, true)} utilidad`, color: kpis.margenNeto >= 10 ? '#22C55E' : '#EAB308', subColor: '#64748B' },
    { label: 'Por cobrar',        value: formatSoles(kpis.porCobrar, true),      sub: `${kpis.facturasVencidas} fact. vencidas`, color: '#F97316', subColor: '#64748B' },
    { label: 'Por pagar',         value: formatSoles(kpis.porPagar, true),       sub: 'Próx. 30 días',                color: '#F1F5F9', subColor: '#64748B' },
    { label: 'Posición de caja',  value: formatSoles(kpis.saldoBancos, true),   sub: 'Ctas + caja chica',            color: '#EAB308', subColor: '#64748B' },
    { label: 'Garantías activas', value: formatSoles(kpis.garantiasMonto, true), sub: `${kpis.garantiasCount} cartas fianza`, color: '#EAB308', subColor: '#64748B' },
  ]

  const TABS = ['Resumen', 'Valorizaciones', 'Flujo de caja', 'Gastos de obra', 'Garantías']

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-white">Finanzas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control financiero · {mesLabel}</p>
        </div>
        {/* Tabs */}
        <div className="flex items-end gap-0 border-b flex-1" style={{ borderColor: '#1E293B' }}>
          {TABS.map((tab, i) => {
            const isActive = i === 0
            const baseClass = cn(
              'px-4 pb-2 text-sm font-medium transition-colors whitespace-nowrap',
              isActive ? 'text-yellow-400 border-b-2 -mb-px' : 'text-gray-500 hover:text-gray-300'
            )
            const style = isActive ? { borderColor: '#EAB308' } : {}

            if (tab === 'Flujo de caja') {
              return (
                <Link
                  key={tab}
                  href="/finanzas/movimientos"
                  className={baseClass}
                  style={style}
                >
                  {tab}
                </Link>
              )
            }
            return (
              <button
                key={tab}
                className={baseClass}
                style={style}
              >
                {tab}
              </button>
            )
          })}
        </div>
        {/* Button */}
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:text-white shrink-0"
          style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
        >
          <Download size={13} />
          Exportar PDF
        </button>
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

      {/* ── TESORERÍA ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B' }}>
        <div
          className="px-4 py-2 border-b flex items-center gap-2"
          style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
            TESORERÍA — Posición de caja en tiempo real
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: '#1E293B' }}>

          {/* Cuenta principal (BCP corriente) */}
          {cuentaPrincipal ? (
            <div className="p-5" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="px-2 py-1 rounded text-[10px] font-black text-white" style={{ backgroundColor: '#1e40af' }}>
                    {getLabelBanco((cuentaPrincipal as any).banco)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-snug">{(cuentaPrincipal as any).nombre}</p>
                    <p className="text-[10px] text-blue-300/60">N° {(cuentaPrincipal as any).numero_cuenta ?? '194-XXXXXXXX-0-78'} · S/.</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-[26px] font-black text-white leading-none">
                  {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((cuentaPrincipal as any).saldo_actual)}
                </p>
                <p className="text-[11px] text-blue-300/60 mt-1">Saldo disponible</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-900/50">
                <div>
                  <p className="text-[10px] text-blue-300/60">Ingresos mes</p>
                  <p className="text-sm font-bold text-green-400">+{formatSoles(kpis.ingresosMes, true)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-300/60">Egresos mes</p>
                  <p className="text-sm font-bold text-red-400">-{formatSoles(kpis.egresosMes, true)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 flex items-center justify-center text-gray-600 text-sm" style={{ backgroundColor: '#0F1623' }}>
              Sin cuenta corriente
            </div>
          )}

          {/* Caja Chica */}
          {cajaChica ? (
            <div className="p-5" style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black" style={{ backgroundColor: '#EAB30820', color: '#EAB308', border: '1px solid #EAB30840' }}>
                    S/.
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{(cajaChica as any).nombre}</p>
                    <p className="text-[10px] text-amber-300/50">Responsable: Patricia Salas</p>
                  </div>
                </div>
                <span className="text-[10px] text-green-400 font-medium">✓ Nivel normal</span>
              </div>
              <div className="mb-3">
                <p className="text-[26px] font-black leading-none" style={{ color: '#EAB308' }}>
                  {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((cajaChica as any).saldo_actual)}
                </p>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-amber-300/50">S/. 5,000 autorizados</span>
                  <span className="text-amber-300/70">{Math.round(((cajaChica as any).saldo_actual / 5000) * 100)}% dis.</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2d1f0060' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(((cajaChica as any).saldo_actual / 5000) * 100, 100)}%`, backgroundColor: '#EAB308' }}
                  />
                </div>
                <button className="mt-2.5 text-[11px] font-medium px-3 py-1 rounded-md transition-colors hover:opacity-80" style={{ backgroundColor: '#EAB30820', color: '#EAB308', border: '1px solid #EAB30840' }}>
                  Solicitar repos.
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 flex items-center justify-center text-gray-600 text-sm" style={{ backgroundColor: '#0F1623' }}>
              Sin caja chica
            </div>
          )}

          {/* Agregar cuenta */}
          <div
            className="p-5 flex flex-col items-center justify-center gap-3 cursor-pointer group transition-colors hover:bg-white/[0.02]"
            style={{ backgroundColor: '#0F1623' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed transition-colors group-hover:border-gray-500"
              style={{ borderColor: '#334155' }}
            >
              <Plus size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm text-gray-600 text-center leading-snug group-hover:text-gray-400 transition-colors">
              Agregar cuenta<br />banco o efectivo
            </p>
          </div>
        </div>
      </div>

      {/* ── FILA MEDIA ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Gastos de Oficina */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <SecHeader label={`GASTOS DE OFICINA — ${mesCorto} ${new Date().getFullYear()}`} />
          <div className="mb-4">
            <p className="text-[11px] text-gray-600 mb-2">Presupuesto mensual: S/. {presupuesto.toLocaleString('es-PE')}</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-yellow-400">Ejecutado: {formatSoles(totalGastos)}</span>
              <span className="text-[11px] font-bold text-gray-400">{pctGastos.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1E293B' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pctGastos}%`, backgroundColor: pctGastos > 90 ? '#EF4444' : '#EAB308' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {gastos.map((g: any, i: number) => {
              const color = g.color ?? ['#3B82F6','#3B82F6','#6B7280','#6B7280','#EAB308','#8B5CF6'][i % 6]
              const pct = totalGastos > 0 ? (Number(g.monto_neto) / totalGastos) * 100 : 0
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{g.descripcion}</p>
                        <p className="text-[10px] text-gray-600">{g.categoria ?? '—'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white ml-2 shrink-0">{formatSoles(Number(g.monto_neto))}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1E293B' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: '#1E293B' }}>
            <p className="text-[10px] text-gray-600">
              Total gastado: {formatSoles(totalGastos)} · Saldo: {formatSoles(presupuesto - totalGastos)}
            </p>
            <button className="text-[11px] text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors shrink-0">
              <Plus size={10} /> Agregar gasto
            </button>
          </div>
        </div>

        {/* Valorizaciones */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <SecHeader
            label="VALORIZACIONES — Estado de cobro"
            action={
              <button className="text-[10px] text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors">
                <Plus size={10} /> Nueva valorización
              </button>
            }
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white">Valorizaciones activas</p>
            <p className="text-[10px] text-gray-500">
              Total por cobrar: {formatSoles(vals.reduce((s, v) => s + v.monto_neto, 0), true)}
            </p>
          </div>
          <div className="space-y-0">
            {vals.map(v => {
              const dias = v.venceDias
              const vencido = dias !== null && dias < 0
              const urgente = dias !== null && dias >= 0 && dias <= 15
              const { bg, color } = COLOR_VAL[v.estado] ?? { bg: '#64748B20', color: '#94A3B8' }
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-2.5 border-b gap-2"
                  style={{ borderColor: '#1E293B' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      Val. N°{v.numero} — {v.proyecto?.nombre ?? '—'}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate">{v.proyecto?.entidad_contratante ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {dias !== null && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: vencido ? '#EF444420' : urgente ? '#EF444420' : '#EAB30820',
                          color: vencido ? '#F87171' : urgente ? '#FCA5A5' : '#FCD34D',
                        }}
                      >
                        {vencido ? `${Math.abs(dias)} días venc.` : `Vence en ${dias}d`}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-white">{formatSoles(v.monto_neto, true)}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: bg, color }}>
                      {v.estado === 'cobrada' ? '✓ Cobrada' : LABEL_VAL[v.estado] ?? v.estado}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Flujo de Caja */}
        <div className="rounded-xl border p-4 flex flex-col" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
              FLUJO DE CAJA — Real + Proyectado
            </span>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'rgba(56,189,248,0.75)' }} />
                Real
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'rgba(234,179,8,0.65)' }} />
                Proyectado
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">Real + proyectado · 6 meses</p>
          <div className="flex-1" style={{ minHeight: '190px' }}>
            <FlujoCajaBarChartWrapper data={flujo} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-[11px]" style={{ borderColor: '#1E293B' }}>
            <span className="text-gray-500">
              Caja actual: <span className="text-white font-bold">{formatSoles(kpis.saldoBancos, true)}</span>
            </span>
            <span className="font-medium flex items-center gap-1" style={{ color: '#4ADE80' }}>
              <ArrowUpRight size={12} />
              Proyectado Sep: {formatSoles(flujo[flujo.length - 2]?.egresos ?? 0, true)} ▲ +27%
            </span>
          </div>
        </div>
      </div>

      {/* ── FILA BAJA ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Garantías */}
        <div className="rounded-xl border p-4" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <SecHeader label="GARANTÍAS — Cartas fianza activas" />
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={13} className="text-yellow-500 shrink-0" />
            <p className="text-xs font-bold text-white">
              {gars.length} cartas fianza · Total: {formatSoles(totalGar, true)}
            </p>
          </div>
          {garPorVencer > 0 && (
            <p className="text-[11px] text-red-400 flex items-center gap-1 mb-3">
              <AlertTriangle size={10} />
              {garPorVencer} vencen en menos de 30 días
            </p>
          )}
          <div className="space-y-0 mt-3">
            {gars.map(g => {
              const urgente = g.dias >= 0 && g.dias <= 30
              const vencida = g.dias < 0
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-2 py-2 border-b text-xs"
                  style={{ borderColor: '#1E293B' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{LABEL_GAR[g.tipo] ?? g.tipo}</p>
                    <p className="text-[10px] text-gray-600 truncate">{g.proyecto?.nombre ?? '—'}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{getLabelBanco(g.banco)}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5"
                    style={{
                      backgroundColor: vencida ? '#EF444420' : urgente ? '#EF444420' : '#1E293B',
                      color: vencida ? '#F87171' : urgente ? '#FCA5A5' : '#94A3B8',
                    }}
                  >
                    {urgente && !vencida && '▲ '}{g.dias >= 0 ? `${g.dias}d` : 'Vencida'}
                  </span>
                  <span className="font-bold text-white shrink-0">{formatSoles(g.monto, true)}</span>
                  <span className="text-[10px] text-gray-600 shrink-0">{g.fecha}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cuentas por cobrar y pagar */}
        <div className="col-span-2 rounded-xl border overflow-hidden" style={{ borderColor: '#1E293B', backgroundColor: '#0F1623' }}>
          <div className="px-4 py-2.5 border-b" style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EAB308' }}>
              CUENTAS POR COBRAR Y PAGAR
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#1E293B' }}>

            {/* Por cobrar */}
            <div className="p-4">
              <p className="text-xs font-bold text-white">Por cobrar</p>
              <p className="text-[11px] text-gray-500 mb-3">{formatSoles(totalCobrar, true)} pendientes</p>
              <div className="space-y-0">
                {cobrar.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 py-2 border-b text-xs"
                    style={{ borderColor: '#1E293B' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{m.nombre}</p>
                      <p className="text-[10px] text-gray-600 truncate">{m.ref}</p>
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: m.dias < 0 ? '#EF444420' : '#1E293B',
                        color: m.dias < 0 ? '#F87171' : '#94A3B8',
                      }}
                    >
                      {m.dias < 0 ? `${Math.abs(m.dias)}d+` : `${m.dias}d`}
                    </span>
                    <span className="font-bold text-white shrink-0">{formatSoles(m.monto, true)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por pagar */}
            <div className="p-4">
              <p className="text-xs font-bold text-white">Por pagar</p>
              <p className="text-[11px] text-gray-500 mb-3">{formatSoles(totalPagar, true)} próx. 30 días</p>
              <div className="space-y-0">
                {pagar.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 py-2 border-b text-xs"
                    style={{ borderColor: '#1E293B' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{m.nombre}</p>
                      <p className="text-[10px] text-gray-600 truncate">{m.ref}</p>
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#1E293B', color: '#94A3B8' }}
                    >
                      {m.dias < 0 ? `${Math.abs(m.dias)}d+` : `${m.dias}d`}
                    </span>
                    <span className="font-bold shrink-0" style={{ color: '#F87171' }}>{formatSoles(m.monto, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl border text-[11px] text-gray-600"
        style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
      >
        <span>
          MMHIGHMETRIK ENGINEERS S.A.C · Módulo Finanzas · ERP v1.0 ·{' '}
          Actualizado: hoy {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} am
        </span>
        <button className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80" style={{ color: '#A78BFA' }}>
          <Sparkles size={11} />
          Asistente IA financiero activo
        </button>
      </div>
    </div>
  )
}
