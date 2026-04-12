'use client'

import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { CurvaS } from '@/lib/types/database'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface Props { data: CurvaS[] }

export function CurvaSChart({ data }: Props) {
  const labels = data.map(d => {
    const date = new Date(d.fecha + 'T00:00:00')
    return date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Planificado',
        data: data.map(d => d.avance_planificado),
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.08)',
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Real',
        data: data.map(d => d.avance_real),
        borderColor: '#22C55E',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#22C55E',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#1A2035',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
            ` ${ctx.dataset.label}: ${Number(ctx.raw ?? 0).toFixed(1)}%`,
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
        min: 0,
        max: 100,
        grid: { color: 'rgba(30, 41, 59, 0.8)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (v: string | number) => `${v}%`,
        },
        border: { display: false },
      },
    },
  }

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Sin datos de Curva S
      </div>
    )
  }

  return <Line data={chartData} options={options} />
}
