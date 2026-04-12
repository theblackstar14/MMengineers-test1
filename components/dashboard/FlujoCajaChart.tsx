'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend,
)

const MES_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar',
  '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set',
  '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

interface DataPoint {
  mes: string          // 'YYYY-MM' or 'YYYY-MM-DD'
  real: number
  proyectado: number | null
}

export function FlujoCajaChart({ data }: { data: DataPoint[] }) {
  const labels = data.map(d => MES_LABELS[d.mes.substring(5, 7)] ?? d.mes.substring(5, 7))

  const realData    = data.map(d => d.real > 0 ? d.real : null)
  const proyData    = data.map(d => d.proyectado != null && d.proyectado > 0 ? d.proyectado : null)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Real',
        data: realData,
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        pointBackgroundColor: '#06B6D4',
        pointBorderColor: '#06B6D4',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
        spanGaps: false,
      },
      {
        label: 'Proyectado',
        data: proyData,
        borderColor: '#EAB308',
        backgroundColor: 'transparent',
        pointBackgroundColor: '#EAB308',
        pointBorderColor: '#EAB308',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderDash: [6, 4],
        fill: false,
        tension: 0.4,
        spanGaps: false,
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
        grid: { color: 'rgba(30, 41, 59, 0.6)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (val: string | number) => {
            const n = Number(val)
            if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
            if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
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
        Sin datos
      </div>
    )
  }

  return <Line data={chartData} options={options} />
}
