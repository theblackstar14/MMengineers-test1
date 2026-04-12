'use client'

import dynamic from 'next/dynamic'

const IngresosGastosChart = dynamic(
  () => import('./IngresosGastosChart').then(m => ({ default: m.IngresosGastosChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const EstadoProyectosChart = dynamic(
  () => import('./EstadoProyectosChart').then(m => ({ default: m.EstadoProyectosChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const FlujoCajaChart = dynamic(
  () => import('./FlujoCajaChart').then(m => ({ default: m.FlujoCajaChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
    </div>
  )
}

interface DashboardChartsProps {
  ingresosEgresos: Array<{ mes: string; ingresos: number; egresos: number }>
  estadoProyectos: Array<{ estado: string; cantidad: number }>
  totalProyectos: number
  flujoCaja: Array<{ mes: string; real: number; proyectado: number | null }>
}

export function DashboardCharts({
  ingresosEgresos,
  estadoProyectos,
  totalProyectos,
  flujoCaja,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Ingresos vs Egresos */}
      <div className="erp-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Ingresos vs Gastos</h3>
          <span className="text-sm text-gray-500">Últimos 6 meses</span>
        </div>
        <div style={{ height: '180px' }}>
          <IngresosGastosChart data={ingresosEgresos} />
        </div>
      </div>

      {/* Estado de Proyectos */}
      <div className="erp-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Estado de Proyectos</h3>
        </div>
        <div style={{ height: '180px' }}>
          <EstadoProyectosChart data={estadoProyectos} total={totalProyectos} />
        </div>
      </div>

      {/* Flujo de Caja */}
      <div className="erp-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Flujo de Caja</h3>
          <span className="text-sm text-gray-500">Real vs Proyectado</span>
        </div>
        <div style={{ height: '180px' }}>
          <FlujoCajaChart data={flujoCaja} />
        </div>
      </div>
    </div>
  )
}
