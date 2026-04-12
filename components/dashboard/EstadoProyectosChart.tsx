'use client'

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip)

interface DataPoint {
  estado: string
  cantidad: number
}

interface Props {
  data: DataPoint[]
  total: number
}

// Visual overrides for the dashboard donut
const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  en_ejecucion:   { label: 'En Ejecución',  color: '#EAB308' },
  adjudicado:     { label: 'Por Concluir',  color: '#3B82F6' },
  en_licitacion:  { label: 'Licitación',    color: '#3B82F6' },
  liquidado:      { label: 'Completados',   color: '#22C55E' },
  cerrado:        { label: 'Completados',   color: '#22C55E' },
  paralizado:     { label: 'En riesgo',     color: '#F97316' },
  en_liquidacion: { label: 'En riesgo',     color: '#F97316' },
}

function getConfig(estado: string) {
  return ESTADO_CONFIG[estado] ?? { label: estado, color: '#6B7280' }
}

export function EstadoProyectosChart({ data, total }: Props) {
  const chartData = {
    labels: data.map(d => getConfig(d.estado).label),
    datasets: [{
      data: data.map(d => d.cantidad),
      backgroundColor: data.map(d => getConfig(d.estado).color),
      borderColor: '#161B2E',
      borderWidth: 3,
      hoverOffset: 4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A2035',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        padding: 10,
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw} proy.`,
        },
      },
    },
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Sin proyectos
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 h-full">
      {/* Custom legend — left */}
      <div className="flex flex-col gap-3 shrink-0">
        {data.map(d => {
          const cfg = getConfig(d.estado)
          const pct = total > 0 ? Math.round((d.cantidad / total) * 100) : 0
          return (
            <div key={d.estado} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-[12px] font-semibold text-white leading-tight">
                  {cfg.label}
                </span>
              </div>
              <div className="pl-5 text-[11px] text-gray-500">
                {d.cantidad} proy. &nbsp;
                <span
                  className="font-semibold px-1 rounded text-[10px]"
                  style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Donut — right */}
      <div className="relative flex-1 h-full min-h-0">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-[11px] text-gray-500">proyectos</span>
        </div>
      </div>
    </div>
  )
}
