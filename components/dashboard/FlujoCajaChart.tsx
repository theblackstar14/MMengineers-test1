'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend
)

interface DataPoint {
  mes: string
  real: number
  proyectado: number | null
}

interface Props {
  data: DataPoint[]
}

function labelMes(isoDate: string) {
  const d = new Date(isoDate + '-01')
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
}

export function FlujoCajaChart({ data }: Props) {
  const labels = data.map(d => labelMes(d.mes.substring(0, 7)))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Real',
        data: data.map(d => d.real),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        pointBackgroundColor: '#22C55E',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Proyectado',
        data: data.map(d => d.proyectado),
        borderColor: '#EAB308',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#EAB308',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderDash: [5, 4],
        fill: false,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 11 },
          boxWidth: 10,
          boxHeight: 2,
          padding: 16,
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
          label: (ctx: { dataset: { label?: string }; raw: unknown }) => {
            const val = Number(ctx.raw ?? 0)
            return ` ${ctx.dataset.label}: S/. ${val.toLocaleString('es-PE')}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(30, 41, 59, 0.8)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (val: string | number) => {
            const n = Number(val)
            if (Math.abs(n) >= 1_000_000) return `S/.${(n / 1_000_000).toFixed(1)}M`
            if (Math.abs(n) >= 1_000) return `S/.${(n / 1_000).toFixed(0)}K`
            return `S/.${n}`
          },
        },
        border: { display: false },
      },
    },
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Sin datos de flujo de caja
      </div>
    )
  }

  return <Line data={chartData} options={options} />
}
