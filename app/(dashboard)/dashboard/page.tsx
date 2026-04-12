import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  getDashboardKpis,
  getIngresosEgresosMensuales,
  getEstadoProyectos,
  getProyectosActivos,
  getAlertas,
  getFlujoCaja,
} from '@/lib/queries/dashboard'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ProyectosActivosTable } from '@/components/dashboard/ProyectosActivosTable'
import type { ProyectoRow } from '@/components/dashboard/ProyectosActivosTable'
import { AlertasPanel } from '@/components/dashboard/AlertasPanel'
import { formatSoles } from '@/lib/utils'
import {
  CircleDollarSign, Package, Settings, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard — MMHIGHMETRIK ERP' }
export const revalidate = 300

// ── Mock data (shown when DB tables are empty) ─────────────────────
const MOCK_INGRESOS_EGRESOS = [
  { mes: '2025-01-01', ingresos: 2_800_000, egresos: 2_200_000, neto: 600_000 },
  { mes: '2025-02-01', ingresos: 3_200_000, egresos: 2_500_000, neto: 700_000 },
  { mes: '2025-03-01', ingresos: 4_100_000, egresos: 2_900_000, neto: 1_200_000 },
  { mes: '2025-04-01', ingresos: 3_800_000, egresos: 3_100_000, neto: 700_000 },
  { mes: '2025-05-01', ingresos: 4_500_000, egresos: 3_000_000, neto: 1_500_000 },
  { mes: '2025-06-01', ingresos: 4_200_000, egresos: 2_800_000, neto: 1_400_000 },
]

const MOCK_ESTADO_PROYECTOS = [
  { estado: 'en_ejecucion',  cantidad: 8 },
  { estado: 'liquidado',     cantidad: 4 },
  { estado: 'paralizado',    cantidad: 2 },
  { estado: 'en_licitacion', cantidad: 1 },
]

const MOCK_FLUJO_CAJA = [
  { mes: '2025-04', real: 1_800_000, proyectado: null },
  { mes: '2025-05', real: 2_100_000, proyectado: null },
  { mes: '2025-06', real: 1_600_000, proyectado: null },
  { mes: '2025-07', real: 0,         proyectado: 2_400_000 },
  { mes: '2025-08', real: 0,         proyectado: 2_800_000 },
  { mes: '2025-09', real: 0,         proyectado: 3_100_000 },
]

const MOCK_PROYECTOS: ProyectoRow[] = [
  { id: '1', nombre: 'Carretera Ruta 5 Norte',  entidad_contratante: 'MTC Perú',           avance_fisico_pct: 72, monto_contrato: 8_200_000, monto_adicionales: 0, monto_valorizado: 5_900_000, fecha_fin_contractual: '2025-12-31', estado: 'en_ejecucion' },
  { id: '2', nombre: 'Edificio Sede Central',    entidad_contratante: 'Priv. Inversiones',  avance_fisico_pct: 45, monto_contrato: 5_100_000, monto_adicionales: 0, monto_valorizado: 2_300_000, fecha_fin_contractual: '2026-03-31', estado: 'en_ejecucion' },
  { id: '3', nombre: 'Puente Río Lurín',         entidad_contratante: 'Mun. Lima Sur',      avance_fisico_pct: 88, monto_contrato: 4_700_000, monto_adicionales: 0, monto_valorizado: 4_100_000, fecha_fin_contractual: '2025-08-31', estado: 'adjudicado' },
  { id: '4', nombre: 'Saneamiento Lima Sur',     entidad_contratante: 'SEDAPAL',            avance_fisico_pct: 31, monto_contrato: 3_200_000, monto_adicionales: 0, monto_valorizado: 1_000_000, fecha_fin_contractual: '2026-06-30', estado: 'paralizado' },
  { id: '5', nombre: 'Cons. Hidráulica',         entidad_contratante: 'Reg. Ica',           avance_fisico_pct: 60, monto_contrato: 1_800_000, monto_adicionales: 0, monto_valorizado: 1_100_000, fecha_fin_contractual: '2025-09-30', estado: 'en_ejecucion' },
]

export default async function DashboardPage() {
  const [kpis, ingresosEgresosDB, estadoProyectosDB, proyectosDB, alertas, flujoCajaDB] =
    await Promise.all([
      getDashboardKpis(),
      getIngresosEgresosMensuales(),
      getEstadoProyectos(),
      getProyectosActivos(),
      getAlertas(),
      getFlujoCaja(),
    ])

  // Use mock when DB is empty
  const ingresosEgresos = ingresosEgresosDB.length > 0 ? ingresosEgresosDB : MOCK_INGRESOS_EGRESOS
  const estadoProyectos = estadoProyectosDB.length > 0 ? estadoProyectosDB : MOCK_ESTADO_PROYECTOS
  const flujoCaja = flujoCajaDB.length > 0 ? flujoCajaDB : MOCK_FLUJO_CAJA
  const totalProyectos = estadoProyectos.reduce((s, d) => s + d.cantidad, 0)

  // Proyectos table rows
  const proyectosRows: ProyectoRow[] = proyectosDB.length > 0
    ? proyectosDB.map(p => ({
        id: p.id,
        nombre: p.nombre,
        entidad_contratante: p.entidad_contratante,
        avance_fisico_pct: p.avance_fisico_pct,
        monto_contrato: p.monto_contrato,
        monto_adicionales: p.monto_adicionales,
        monto_valorizado: p.monto_valorizado,
        fecha_fin_contractual: p.fecha_fin_contractual,
        estado: p.estado,
      }))
    : MOCK_PROYECTOS

  // KPI values — use mock when all zeros
  const useMockKpis = kpis.ingresos_mes === 0 && kpis.proyectos_activos === 0
  const facturacion  = useMockKpis ? 4_200_000 : kpis.ingresos_mes
  const proyActivos  = useMockKpis ? 12 : kpis.proyectos_activos
  const licitaciones = useMockKpis ? 7  : kpis.licitaciones_en_proceso
  const margenPct    = useMockKpis ? 14.0
    : kpis.ingresos_mes > 0
      ? ((kpis.ingresos_mes - kpis.egresos_mes) / kpis.ingresos_mes) * 100
      : 0

  // Formatted time for footer
  const now = new Date()
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Facturación del mes"
          value={formatSoles(facturacion, true)}
          delta={useMockKpis ? '+12%' : undefined}
          deltaLabel="vs mes anterior"
          deltaPositive
          icon={CircleDollarSign}
          color="gold"
        />
        <KpiCard
          label="Proyectos Activos"
          value={String(proyActivos)}
          sublabel={useMockKpis ? '3 en riesgo · de 15 totales' : `${totalProyectos} totales`}
          icon={Package}
          color="orange"
        />
        <KpiCard
          label="Licitaciones en Curso"
          value={String(licitaciones)}
          sublabel={useMockKpis ? 'Tasa adj. 68% · 2 pendientes de respuesta' : 'En proceso actualmente'}
          icon={Settings}
          color="blue"
        />
        <KpiCard
          label="Margen Neto"
          value={`${margenPct.toFixed(1)}%`}
          delta={useMockKpis ? '+2.1pp' : undefined}
          deltaLabel="vs trimestre ant."
          deltaPositive
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* ── Charts row ── */}
      <Suspense fallback={
        <div className="h-[320px] rounded-xl animate-pulse" style={{ backgroundColor: '#161B2E' }} />
      }>
        <DashboardCharts
          ingresosEgresos={ingresosEgresos}
          estadoProyectos={estadoProyectos}
          totalProyectos={totalProyectos}
          flujoCaja={flujoCaja}
        />
      </Suspense>

      {/* ── Proyectos Activos + Alertas ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Proyectos table */}
        <div
          className="col-span-2 rounded-xl border p-4"
          style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Proyectos Activos</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Estado en tiempo real</p>
            </div>
            <Link
              href="/proyectos"
              className="text-[12px] text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <ProyectosActivosTable proyectos={proyectosRows} />
        </div>

        {/* Alertas */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
        >
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-white">Alertas y Pendientes</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Requieren atención inmediata</p>
          </div>
          <AlertasPanel alertas={alertas} />
        </div>

      </div>

      {/* ── Footer ── */}
      <div
        className="py-2.5 px-1 flex items-center gap-2 text-[11px] text-gray-600"
        style={{ borderTop: '1px solid #1E293B' }}
      >
        <span className="font-medium text-gray-500">MMHIGHMETRIK ENGINEERS S.A.C</span>
        <span>·</span>
        <span>Sistema ERP v1.0</span>
        <span>·</span>
        <span>Última actualización: hoy {hora}</span>
        <span>·</span>
        <span>Usuario: Gerente General</span>
      </div>

    </div>
  )
}
