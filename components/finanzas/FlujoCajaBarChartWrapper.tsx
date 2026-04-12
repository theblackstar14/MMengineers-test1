'use client'

import dynamic from 'next/dynamic'

const FlujoCajaBarChart = dynamic(
  () => import('./FlujoCajaBarChart').then(m => ({ default: m.FlujoCajaBarChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="h-40 w-full rounded-lg animate-pulse" style={{ backgroundColor: '#1E293B' }} />
      </div>
    ),
  }
)

interface DataPoint {
  mes: string
  real: number
  egresos: number
}

export function FlujoCajaBarChartWrapper({ data }: { data: DataPoint[] }) {
  return <FlujoCajaBarChart data={data} />
}
