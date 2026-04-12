'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DataPoint {
  mes: string
  real: number
  egresos: number
}

interface Props {
  data: DataPoint[]
}

function labelMes(isoDate: string) {
  const d = new Date(isoDate.substring(0, 7) + '-01')
  return d.toLocaleDateString('es-PE', { month: 'short' })
    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
}

export function FlujoCajaBarChart({ data }: Props) {
  const labels = data.map(d => labelMes(d.mes))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Real',
        data: data.map(d => d.real),
        backgroundColor: 'rgba(56, 189, 248, 0.75)',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Proyectado',
        data: data.map(d => d.egresos),
        backgroundColor: 'rgba(234, 179, 8, 0.65)',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 11 },
          boxWidth: 10,
          boxHeight: 8,
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
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
            if (val >= 1_000_000) return ` ${ctx.dataset.label}: S/. ${(val / 1_000_000).toFixed(1)}M`
            if (val >= 1_000) return ` ${ctx.dataset.label}: S/. ${(val / 1_000).toFixed(0)}K`
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
        grid: { color: 'rgba(30, 41, 59, 0.6)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (val: string | number) => {
            const n = Number(val)
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
            return `${n}`
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

  return <Bar data={chartData} options={options} />
}
