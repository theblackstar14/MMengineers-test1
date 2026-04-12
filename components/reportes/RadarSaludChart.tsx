'use client'

import {
  Chart as ChartJS,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

export function RadarSaludChart() {
  const labels = ['Avance', 'Riesgo', 'Presupuesto', 'Calidad', 'Saldo', 'Equipo']
  const values = [72, 60, 68, 85, 90, 78]

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Salud',
        data: values,
        fill: true,
        backgroundColor: 'rgba(234,179,8,0.2)',
        borderColor: '#EAB308',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#EAB308',
        pointBorderColor: '#0B0F1A',
        pointBorderWidth: 1,
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
          label: (ctx: { label?: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#64748B',
          font: { size: 8 },
          backdropColor: 'transparent',
        },
        grid: { color: 'rgba(30,41,59,0.7)' },
        angleLines: { color: 'rgba(30,41,59,0.7)' },
        pointLabels: {
          color: '#94A3B8',
          font: { size: 10 },
        },
      },
    },
  }

  return <Radar data={chartData} options={options} />
}
