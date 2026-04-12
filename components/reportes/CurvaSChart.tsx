'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export function CurvaSChart() {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago']

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Real',
        data: [0, 5, 15, 28, 42, 54, null, null],
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234,179,8,0.08)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#EAB308',
        borderWidth: 2,
      },
      {
        label: 'Prog.',
        data: [0, 8, 18, 32, 48, 62, 74, 85],
        borderColor: '#94A3B8',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3,
        borderDash: [5, 4],
        pointRadius: 2,
        pointBackgroundColor: '#94A3B8',
        borderWidth: 1.5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 10 },
          boxWidth: 10,
          boxHeight: 2,
          padding: 8,
          usePointStyle: false,
        },
      },
      tooltip: {
        backgroundColor: '#0B0F1A',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        padding: 8,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
            ` ${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(30,41,59,0.5)' },
        ticks: {
          color: '#64748B',
          font: { size: 10 },
          callback: (val: string | number) => `${val}%`,
        },
        border: { display: false },
        min: 0,
        max: 100,
      },
    },
  }

  return <Line data={chartData} options={options} />
}
