'use client'

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const bars = [
  { label: 'Saldo ini.', range: [0, 2100], color: '#3B82F6', value: '+2,100' },
  { label: 'Ingresos',   range: [2100, 4800], color: '#22C55E', value: '+2,700' },
  { label: 'Planilla',   range: [3400, 4800], color: '#EF4444', value: '-1,400' },
  { label: 'Subcon.',    range: [2200, 3400], color: '#F97316', value: '-1,200' },
  { label: 'Mat.',       range: [1200, 2200], color: '#F97316', value: '-1,000' },
  { label: 'Saldo fin.', range: [0, 1200],   color: '#3B82F6', value: '1,200' },
]

export function WaterfallChart() {
  const chartData = {
    labels: bars.map(b => b.label),
    datasets: [
      {
        label: 'Caja',
        data: bars.map(b => b.range),
        backgroundColor: bars.map(b => b.color + 'CC'),
        borderColor: bars.map(b => b.color),
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0B0F1A',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        padding: 8,
        callbacks: {
          label: (ctx: { dataIndex: number }) =>
            ` ${bars[ctx.dataIndex].value}K`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 9 } },
        border: { display: false },
      },
      y: {
        display: false,
        min: 0,
        max: 5200,
      },
    },
  }

  return (
    <div className="relative h-full w-full">
      <Bar data={chartData} options={options} />
      {/* Value labels overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex items-end justify-around pb-5 px-2">
        {bars.map((b, i) => {
          const pct = ((b.range[1] - b.range[0]) / 5200) * 100
          const isNeg = b.value.startsWith('-')
          return (
            <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
              <span
                className="text-[9px] font-semibold"
                style={{ color: isNeg ? '#EF4444' : '#22C55E' }}
              >
                {b.value}K
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
