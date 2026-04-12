'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { getLabelEstadoProyecto } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DataPoint {
  estado: string
  cantidad: number
}

interface Props {
  data: DataPoint[]
  total: number
}

const ESTADO_COLORS: Record<string, string> = {
  en_ejecucion:   '#22C55E',
  adjudicado:     '#3B82F6',
  en_licitacion:  '#EAB308',
  paralizado:     '#EF4444',
  en_liquidacion: '#F97316',
  liquidado:      '#6B7280',
  cerrado:        '#374151',
}

export function EstadoProyectosChart({ data, total }: Props) {
  const chartData = {
    labels: data.map(d => getLabelEstadoProyecto(d.estado)),
    datasets: [{
      data: data.map(d => d.cantidad),
      backgroundColor: data.map(d => ESTADO_COLORS[d.estado] ?? '#6B7280'),
      borderColor: '#161B2E',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 11 },
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1A2035',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        padding: 10,
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw} proyecto${Number(ctx.raw) !== 1 ? 's' : ''}`,
        },
      },
    },
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Sin proyectos registrados
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <Doughnut data={chartData} options={options} />
      {/* Total en el centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
           style={{ paddingBottom: '60px' }}>
        <span className="text-3xl font-bold text-white">{total}</span>
        <span className="text-xs text-gray-500">proyectos</span>
      </div>
    </div>
  )
}
