'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatFecha } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DataPoint {
  mes: string
  ingresos: number
  egresos: number
}

interface Props {
  data: DataPoint[]
}

export function IngresosGastosChart({ data }: Props) {
  const labels = data.map(d =>
    formatFecha(d.mes.substring(0, 10), 'short').replace(/\d{4}/, '').trim()
  )

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.ingresos),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: '#EAB308',
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Egresos',
        data: data.map(d => d.egresos),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3B82F6',
        borderWidth: 0,
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
        labels: {
          color: '#94A3B8',
          font: { size: 11 },
          boxWidth: 10,
          boxHeight: 10,
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
            if (n >= 1_000_000) return `S/.${(n / 1_000_000).toFixed(1)}M`
            if (n >= 1_000) return `S/.${(n / 1_000).toFixed(0)}K`
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
        Sin movimientos registrados
      </div>
    )
  }

  return <Bar data={chartData} options={options} />
}
