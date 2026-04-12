'use client'

import dynamic from 'next/dynamic'

const IngresosGastosChart = dynamic(
  () => import('./IngresosGastosChart').then(m => ({ default: m.IngresosGastosChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)
const EstadoProyectosChart = dynamic(
  () => import('./EstadoProyectosChart').then(m => ({ default: m.EstadoProyectosChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)
const FlujoCajaChart = dynamic(
  () => import('./FlujoCajaChart').then(m => ({ default: m.FlujoCajaChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

function ChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
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
  // Q3 projected total for footer
  const q3Total = flujoCaja
    .filter(d => ['07', '08', '09'].includes(d.mes.substring(5, 7)))
    .reduce((s, d) => s + (d.proyectado ?? 0), 0)

  const q3Label = q3Total >= 1_000_000
    ? `S/. ${(q3Total / 1_000_000).toFixed(1)}M`
    : q3Total >= 1_000
    ? `S/. ${(q3Total / 1_000).toFixed(0)}K`
    : `S/. ${q3Total}`

  return (
    <div className="grid grid-cols-4 gap-3">

      {/* ── Ingresos vs Gastos — spans 2 cols ── */}
      <div
        className="col-span-2 rounded-xl border p-4 flex flex-col"
        style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Ingresos vs Gastos</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Últimos 6 meses&nbsp;•&nbsp;En millones S/.</p>
          </div>
          {/* Custom legend */}
          <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-yellow-500/85 inline-block" />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500/65 inline-block" />
              Gastos
            </span>
          </div>
        </div>
        <div className="flex-1" style={{ minHeight: '220px' }}>
          <IngresosGastosChart data={ingresosEgresos} />
        </div>
      </div>

      {/* ── Estado de Proyectos ── */}
      <div
        className="rounded-xl border p-4 flex flex-col"
        style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
      >
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-white">Estado de Proyectos</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{totalProyectos} proyectos totales</p>
        </div>
        <div className="flex-1" style={{ minHeight: '220px' }}>
          <EstadoProyectosChart data={estadoProyectos} total={totalProyectos} />
        </div>
      </div>

      {/* ── Flujo de Caja ── */}
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Flujo de Caja</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Proyectado 3 meses&nbsp;•&nbsp;S/.</p>
            </div>
            {/* Custom legend */}
            <div className="flex flex-col items-end gap-1 text-[11px] text-gray-500 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-cyan-400 inline-block" />
                Real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 border-t-2 border-dashed border-yellow-400 inline-block" />
                Proyectado
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 px-4" style={{ minHeight: '180px' }}>
          <FlujoCajaChart data={flujoCaja} />
        </div>

        {/* Q3 footer */}
        <div
          className="px-4 py-2.5 mt-3 flex items-center justify-between"
          style={{ backgroundColor: '#0F1623', borderTop: '1px solid #1E293B' }}
        >
          <span className="text-[11px] text-gray-500">Proyectado Q3</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{q3Label}</span>
            <span className="text-[11px] text-green-400 font-semibold">▲ +24% vs Q2</span>
          </div>
        </div>
      </div>

    </div>
  )
}
