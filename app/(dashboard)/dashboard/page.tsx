import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  getDashboardKpis,
  getIngresosEgresosMensuales,
  getEstadoProyectos,
  getProyectosActivos,
  getAlertas,
  getFlujoCaja,
  getCuentasBancarias,
} from '@/lib/queries/dashboard'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ProyectosActivosTable } from '@/components/dashboard/ProyectosActivosTable'
import { AlertasPanel } from '@/components/dashboard/AlertasPanel'
import { formatSoles, getLabelBanco } from '@/lib/utils'
import {
  DollarSign, FolderKanban, Gavel, TrendingUp,
  ArrowUpRight, ArrowDownRight, Building2, Bell,
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard — MMHIGHMETRIK ERP' }
export const revalidate = 300

export default async function DashboardPage() {
  const [kpis, ingresosEgresos, estadoProyectos, proyectos, alertas, flujoCaja, cuentas] =
    await Promise.all([
      getDashboardKpis(),
      getIngresosEgresosMensuales(),
      getEstadoProyectos(),
      getProyectosActivos(),
      getAlertas(),
      getFlujoCaja(),
      getCuentasBancarias(),
    ])

  const totalProyectos = estadoProyectos.reduce((s, d) => s + d.cantidad, 0)
  const margenMes = kpis.ingresos_mes > 0
    ? ((kpis.ingresos_mes - kpis.egresos_mes) / kpis.ingresos_mes) * 100
    : 0

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ingresos del mes"
          value={formatSoles(kpis.ingresos_mes, true)}
          sublabel="Total cobrado"
          icon={DollarSign}
          color="gold"
          delta={kpis.ingresos_mes > 0 ? 8.4 : undefined}
          deltaLabel="vs mes anterior"
        />
        <KpiCard
          label="Proyectos activos"
          value={String(kpis.proyectos_activos)}
          sublabel={`${totalProyectos} en total`}
          icon={FolderKanban}
          color="blue"
        />
        <KpiCard
          label="Licitaciones"
          value={String(kpis.licitaciones_en_proceso)}
          sublabel="En proceso"
          icon={Gavel}
          color="purple"
        />
        <KpiCard
          label="Margen del mes"
          value={`${margenMes.toFixed(1)}%`}
          sublabel="Ingresos — Egresos"
          icon={TrendingUp}
          color={margenMes >= 15 ? 'green' : margenMes >= 5 ? 'gold' : 'red'}
          delta={margenMes - 12}
          deltaLabel="vs objetivo"
        />
      </div>

      {/* ── Gráficos ── */}
      <Suspense fallback={<div className="h-56 erp-card animate-pulse" />}>
        <DashboardCharts
          ingresosEgresos={ingresosEgresos}
          estadoProyectos={estadoProyectos}
          totalProyectos={totalProyectos}
          flujoCaja={flujoCaja}
        />
      </Suspense>

      {/* ── Proyectos activos + Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Tabla proyectos */}
        <div className="erp-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Proyectos Activos</h3>
            <Link href="/proyectos" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          <ProyectosActivosTable proyectos={proyectos} />
        </div>

        {/* Alertas */}
        <div className="erp-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Alertas y Pendientes</h3>
              {alertas.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {alertas.length}
                </span>
              )}
            </div>
          </div>
          <AlertasPanel alertas={alertas} />
        </div>
      </div>

      {/* ── Tesorería + KPIs financieros ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Cuentas bancarias */}
        <div className="erp-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Tesorería</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Saldo total:{' '}
                <span className="text-yellow-400 font-semibold">
                  {formatSoles(kpis.saldo_total_bancos, true)}
                </span>
              </p>
            </div>
            <Building2 size={14} className="text-gray-600" />
          </div>
          <div className="space-y-2.5">
            {cuentas.length === 0 ? (
              <p className="text-sm text-gray-600">Sin cuentas registradas</p>
            ) : (
              cuentas.map(cuenta => {
                const pct = kpis.saldo_total_bancos > 0
                  ? (cuenta.saldo_actual / kpis.saldo_total_bancos) * 100
                  : 0
                return (
                  <div key={cuenta.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base text-white">{cuenta.nombre}</span>
                        <span className="text-sm text-gray-500">{getLabelBanco(cuenta.banco)}</span>
                      </div>
                      <span className="text-base font-semibold text-white tabular-nums">
                        {formatSoles(cuenta.saldo_actual, false)}
                      </span>
                    </div>
                    <div className="erp-progress">
                      <div
                        className="erp-progress-bar"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cuenta.tipo === 'caja_chica' ? '#EAB308' : '#3B82F6'
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* KPIs financieros */}
        <div className="space-y-3">
          <div className="erp-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Por cobrar</p>
                <p className="text-3xl font-bold text-white">{formatSoles(kpis.por_cobrar, true)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight size={15} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="erp-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Por pagar</p>
                <p className="text-3xl font-bold text-white">{formatSoles(kpis.por_pagar, true)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight size={15} className="text-red-400" />
              </div>
            </div>
          </div>

          <div className="erp-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Garantías por vencer</p>
                <p className="text-3xl font-bold text-white">
                  {kpis.garantias_por_vencer}
                  <span className="text-sm text-gray-500 font-normal ml-1">en 30 días</span>
                </p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                kpis.garantias_por_vencer > 0 ? 'bg-yellow-500/10' : 'bg-gray-500/10'
              }`}>
                <Bell size={15} className={kpis.garantias_por_vencer > 0 ? 'text-yellow-400' : 'text-gray-600'} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
