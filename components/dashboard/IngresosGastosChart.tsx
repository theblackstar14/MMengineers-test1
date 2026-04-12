'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MES_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar',
  '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set',
  '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

interface DataPoint {
  mes: string
  ingresos: number
  egresos: number
}

export function IngresosGastosChart({ data }: { data: DataPoint[] }) {
  const labels = data.map(d => MES_LABELS[d.mes.substring(5, 7)] ?? d.mes.substring(5, 7))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.ingresos),
        backgroundColor: 'rgba(234, 179, 8, 0.85)',
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.75,
      },
      {
        label: 'Gastos',
        data: data.map(d => d.egresos),
        backgroundColor: 'rgba(59, 130, 246, 0.65)',
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.75,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
          label: (ctx: { dataset: { label?: string }; raw: unknown }) => {
            const val = Number(ctx.raw ?? 0)
            if (val >= 1_000_000) return ` ${ctx.dataset.label}: S/. ${(val / 1_000_000).toFixed(1)}M`
            if (val >= 1_000) return ` ${ctx.dataset.label}: S/. ${(val / 1_000).toFixed(0)}K`
            return ` ${ctx.dataset.label}: S/. ${val}`
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
        grid: { color: 'rgba(30, 41, 59, 0.7)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (val: string | number) => {
            const n = Number(val)
            if (n === 0) return '0M'
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
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
        Sin movimientos registrados
      </div>
    )
  }

  return <Bar data={chartData} options={options} />
}
