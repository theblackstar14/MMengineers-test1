'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export function EVMChart() {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']

  const chartData = {
    labels,
    datasets: [
      {
        label: 'PV (plan)',
        data: [0, 1.2, 2.5, 3.8, 5.1, 6.2],
        borderColor: '#94A3B8',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: '#94A3B8',
        borderWidth: 1.5,
      },
      {
        label: 'EV (ganado)',
        data: [0, 1.0, 2.1, 3.2, 4.4, 5.4],
        borderColor: '#EAB308',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#EAB308',
        borderWidth: 2,
      },
      {
        label: 'AC (real)',
        data: [0, 1.1, 2.3, 3.6, 4.9, 5.8],
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#EF4444',
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
        align: 'end' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 9 },
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
            ` ${ctx.dataset.label}: S/.${ctx.raw}M`,
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
          callback: (val: string | number) => `${val}M`,
        },
        border: { display: false },
        min: 0,
      },
    },
  }

  return <Line data={chartData} options={options} />
}
