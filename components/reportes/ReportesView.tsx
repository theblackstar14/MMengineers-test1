'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { SankeyModal } from './SankeyModal'
import { HeatmapRecursos } from './HeatmapRecursos'
import { GanttChart } from './GanttChart'
import { RentabilidadChart } from './RentabilidadChart'

// Dynamic imports (chart.js — browser only)
const CurvaSChart = dynamic(
  () => import('./CurvaSChart').then(m => ({ default: m.CurvaSChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)
const WaterfallChart = dynamic(
  () => import('./WaterfallChart').then(m => ({ default: m.WaterfallChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)
const EVMChart = dynamic(
  () => import('./EVMChart').then(m => ({ default: m.EVMChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)
const BubbleRiesgoChart = dynamic(
  () => import('./BubbleRiesgoChart').then(m => ({ default: m.BubbleRiesgoChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)
const RadarSaludChart = dynamic(
  () => import('./RadarSaludChart').then(m => ({ default: m.RadarSaludChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

function ChartSkeleton() {
  return (
    <div
      className="w-full h-full animate-pulse rounded-lg"
      style={{ backgroundColor: '#1E293B' }}
    />
  )
}

type Period = 'mes' | 'trim' | 'semestre' | 'anio'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'mes',      label: 'Mes actual' },
  { key: 'trim',     label: 'Trim. 2025' },
  { key: 'semestre', label: 'Semestre' },
  { key: 'anio',     label: 'Año 2025' },
]

// ── Shared card component ────────────────────────────────────────────────────

interface CardProps {
  title: string
  subtitle: string
  topRight?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function Card({ title, subtitle, topRight, children, className }: CardProps) {
  return (
    <div
      className={`rounded-xl border overflow-hidden flex flex-col animate-fade-in ${className ?? ''}`}
      style={{ borderColor: '#1E293B', backgroundColor: '#0B0F1A' }}
    >
      {/* Card header */}
      <div
        className="px-4 py-3 border-b flex items-start justify-between gap-2 flex-none"
        style={{ borderColor: '#1E293B' }}
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-white leading-tight truncate">{title}</div>
          <div className="text-[10px] mt-0.5 leading-tight" style={{ color: '#64748B' }}>{subtitle}</div>
        </div>
        {topRight && <div className="shrink-0">{topRight}</div>}
      </div>
      {/* Card body */}
      <div className="flex-1 min-h-0 p-3">
        {children}
      </div>
    </div>
  )
}

function DarkButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
      style={{
        backgroundColor: '#0F1623',
        border: '1px solid #1E293B',
        color: '#94A3B8',
      }}
    >
      {children}
    </button>
  )
}

// ── Sankey mini-preview ──────────────────────────────────────────────────────
function SankeyMiniPreview({ onExpand }: { onExpand: () => void }) {
  const flows = [
    { label: 'Contrato Público → Proyectos', color: '#22C55E', w: 80 },
    { label: 'Contrato Privado → Proyectos', color: '#3B82F6', w: 50 },
    { label: 'Consultoría Técnica',          color: '#EAB308', w: 32 },
    { label: 'Supervisión de Obras',         color: '#8B5CF6', w: 26 },
  ]
  return (
    <div className="h-full flex flex-col justify-between">
      {/* Mini SVG preview */}
      <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: '#080C14' }}>
        <svg viewBox="0 0 300 140" className="w-full h-full">
          {/* Source nodes */}
          <rect x={8}  y={8}   width={10} height={55} fill="#22C55E" rx={2} opacity={0.9} />
          <rect x={8}  y={68}  width={10} height={24} fill="#3B82F6" rx={2} opacity={0.9} />
          <rect x={8}  y={96}  width={10} height={15} fill="#EAB308" rx={2} opacity={0.9} />
          <rect x={8}  y={114} width={10} height={13} fill="#8B5CF6" rx={2} opacity={0.9} />

          {/* Center nodes */}
          <rect x={140} y={8}   width={10} height={42} fill="#22C55E" rx={2} opacity={0.85} />
          <rect x={140} y={54}  width={10} height={21} fill="#F97316" rx={2} opacity={0.85} />
          <rect x={140} y={79}  width={10} height={19} fill="#06B6D4" rx={2} opacity={0.85} />
          <rect x={140} y={102} width={10} height={16} fill="#3B82F6" rx={2} opacity={0.85} />
          <rect x={140} y={122} width={10} height={7}  fill="#EAB308" rx={2} opacity={0.85} />

          {/* Right nodes */}
          <rect x={272} y={8}   width={10} height={35} fill="#EF4444" rx={2} opacity={0.9} />
          <rect x={272} y={47}  width={10} height={27} fill="#F97316" rx={2} opacity={0.9} />
          <rect x={272} y={78}  width={10} height={18} fill="#06B6D4" rx={2} opacity={0.9} />
          <rect x={272} y={100} width={10} height={10} fill="#8B5CF6" rx={2} opacity={0.9} />
          <rect x={272} y={114} width={10} height={15} fill="#22C55E" rx={2} opacity={0.9} />

          {/* Bezier flows left→center */}
          <path d="M 18 8 C 79 8, 79 8, 140 8 L 140 50 C 79 50, 79 63, 18 63 Z" fill="#22C55E" fillOpacity={0.25} />
          <path d="M 18 68 C 79 68, 79 54, 140 54 L 140 75 C 79 75, 79 92, 18 92 Z" fill="#3B82F6" fillOpacity={0.25} />
          <path d="M 18 96 C 79 96, 79 79, 140 79 L 140 98 C 79 98, 79 111, 18 111 Z" fill="#EAB308" fillOpacity={0.25} />
          <path d="M 18 114 C 79 114, 79 102, 140 102 L 140 129 C 79 129, 79 127, 18 127 Z" fill="#8B5CF6" fillOpacity={0.25} />

          {/* Bezier flows center→right */}
          <path d="M 150 8 C 211 8, 211 8, 272 8 L 272 43 C 211 43, 211 50, 150 50 Z" fill="#22C55E" fillOpacity={0.22} />
          <path d="M 150 54 C 211 54, 211 47, 272 47 L 272 74 C 211 74, 211 75, 150 75 Z" fill="#F97316" fillOpacity={0.22} />
          <path d="M 150 79 C 211 79, 211 78, 272 78 L 272 96 C 211 96, 211 98, 150 98 Z" fill="#06B6D4" fillOpacity={0.22} />

          {/* Labels */}
          <text x={10} y={136} fill="#64748B" fontSize={7}>Fuentes</text>
          <text x={135} y={136} fill="#64748B" fontSize={7}>Proyectos</text>
          <text x={262} y={136} fill="#64748B" fontSize={7}>Gastos</text>
        </svg>
      </div>

      {/* Expand button */}
      <button
        onClick={onExpand}
        className="mt-2 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        style={{
          backgroundColor: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.3)',
          color: '#EAB308',
        }}
      >
        <span className="text-base leading-none">≡</span>
        Ver expandido →
      </button>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export function ReportesView() {
  const [period, setPeriod] = useState<Period>('mes')
  const [showSankey, setShowSankey] = useState(false)

  return (
    <div className="p-5 space-y-4 animate-fade-in" style={{ backgroundColor: '#0F1623', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">Reportes &amp; Analítica</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Centro de análisis avanzado · Jun 2025
          </p>
        </div>

        {/* Period + Export pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={
                period === key
                  ? { backgroundColor: '#EAB308', color: '#0F1623' }
                  : {
                      backgroundColor: '#0F1623',
                      border: '1px solid #1E293B',
                      color: '#94A3B8',
                    }
              }
            >
              {label}
            </button>
          ))}
          <button
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: '#0F1623',
              border: '1px solid #1E293B',
              color: '#94A3B8',
            }}
          >
            Exportar todo PDF
          </button>
        </div>
      </div>

      {/* ── 3×3 Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4" style={{ gridAutoRows: '320px' }}>

        {/* Row 1 – Col 1: Curva S */}
        <Card
          title="Curva S – Avance Proyectos"
          subtitle="Avance real vs programado acumulado"
          topRight={<DarkButton>Por proyecto ▾</DarkButton>}
        >
          <div className="relative h-full">
            <CurvaSChart />
            {/* Atrasado badge */}
            <span
              className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
              style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Atrasado 8% acum.
            </span>
          </div>
        </Card>

        {/* Row 1 – Col 2: Waterfall */}
        <Card
          title="Waterfall – Caja Mensual"
          subtitle="Saldo ini. + ingresos – gastos = saldo fin."
          topRight={<DarkButton>Finanzas</DarkButton>}
        >
          <div className="h-full">
            <WaterfallChart />
          </div>
        </Card>

        {/* Row 1 – Col 3: EVM */}
        <Card
          title="EVM – Earned Value"
          subtitle="PV (plan) · EV (ganado) · AC (real)"
          topRight={
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              Avanzado
            </span>
          }
        >
          <div className="h-full">
            <EVMChart />
          </div>
        </Card>

        {/* Row 2 – Col 1: Riesgo vs Rentabilidad */}
        <Card
          title="Riesgo vs Rentabilidad"
          subtitle="Cada burbuja = licitación · Tamaño = monto"
        >
          <div className="h-full">
            <BubbleRiesgoChart />
          </div>
        </Card>

        {/* Row 2 – Col 2: Heatmap Recursos */}
        <Card
          title="Utilización de recursos"
          subtitle="Personal + maquinaria por proyecto y semana"
        >
          <HeatmapRecursos />
        </Card>

        {/* Row 2 – Col 3: Radar Salud */}
        <Card
          title="Salud del proyecto"
          subtitle="Carretera Ruta 5 Norte · 6 dimensiones"
        >
          <div className="h-full">
            <RadarSaludChart />
          </div>
        </Card>

        {/* Row 3 – Col 1: Gantt */}
        <Card
          title="Gantt multiproyecto"
          subtitle="Avance real (barra) vs programado (línea) · 2025"
          topRight={<DarkButton>Import .mpp</DarkButton>}
        >
          <GanttChart />
        </Card>

        {/* Row 3 – Col 2: Rentabilidad */}
        <Card
          title="Rentabilidad por proyecto"
          subtitle="Margen neto real · Presupuesto vs costo ejecutado"
        >
          <RentabilidadChart />
        </Card>

        {/* Row 3 – Col 3: Sankey mini */}
        <Card
          title="Flujo financiero Sankey"
          subtitle="Fuentes → Proyectos → Gastos · S/.9.3M"
        >
          <SankeyMiniPreview onExpand={() => setShowSankey(true)} />
        </Card>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between mt-2" style={{ fontSize: '11px', color: '#475569' }}>
        <span>MMHIGHMETRIK ENGINEERS S.A.C · Módulo Reportes · ERP v1.0</span>
        <span>Datos al 30 Jun 2025</span>
      </div>

      {/* ── Sankey Modal ────────────────────────────────────────────────────── */}
      {showSankey && <SankeyModal onClose={() => setShowSankey(false)} />}
    </div>
  )
}
