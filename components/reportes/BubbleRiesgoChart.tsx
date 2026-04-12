'use client'

import {
  Chart as ChartJS,
  BubbleController,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bubble } from 'react-chartjs-2'

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip, Legend)

const bubbles = [
  { label: 'Callao',      x: 15, y: 80, r: 18, color: '#8B5CF6', amount: '0.8M' },
  { label: 'Lima S.',     x: 25, y: 60, r: 22, color: '#22C55E', amount: '0.7M' },
  { label: 'La Molina',   x: 45, y: 40, r: 28, color: '#EAB308', amount: '2.1M' },
  { label: 'Ancón',       x: 65, y: 25, r: 35, color: '#3B82F6', amount: '13.4M' },
  { label: 'SEDAPAL',     x: 80, y: 15, r: 24, color: '#F97316', amount: '5.2M' },
]

export function BubbleRiesgoChart() {
  const chartData = {
    datasets: bubbles.map(b => ({
      label: `${b.label} S/.${b.amount}`,
      data: [{ x: b.x, y: b.y, r: b.r }],
      backgroundColor: b.color + '80',
      borderColor: b.color,
      borderWidth: 1.5,
    })),
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
          boxWidth: 8,
          padding: 6,
          usePointStyle: true,
          pointStyle: 'circle' as const,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) =>
            ` ${ctx.dataset.label} · Prob: ${(ctx.raw as { x: number; y: number }).x}% · Riesgo: ${100 - (ctx.raw as { x: number; y: number }).y}%`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Prob. ganar %',
          color: '#64748B',
          font: { size: 9 },
        },
        grid: { color: 'rgba(30,41,59,0.4)' },
        ticks: { color: '#64748B', font: { size: 9 } },
        border: { display: false },
        min: 0,
        max: 100,
      },
      y: {
        display: false,
        min: 0,
        max: 100,
      },
    },
  }

  return (
    <div className="relative h-full w-full">
      <span className="absolute left-1 top-2 text-[8px] text-gray-600 rotate-[-90deg] origin-left translate-y-6">
        Alto riesgo ↑
      </span>
      <Bubble data={chartData} options={options} />
    </div>
  )
}
