import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  delta?: number        // porcentaje de cambio (ej: +12.5)
  deltaLabel?: string   // texto del delta (ej: "vs mes anterior")
  icon?: LucideIcon
  color?: 'gold' | 'green' | 'blue' | 'red' | 'purple'
  className?: string
}

const COLOR_MAP = {
  gold:   { dot: 'bg-yellow-500',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  green:  { dot: 'bg-green-500',   text: 'text-green-400',   bg: 'bg-green-500/10' },
  blue:   { dot: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10' },
  red:    { dot: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10' },
  purple: { dot: 'bg-purple-500',  text: 'text-purple-400',  bg: 'bg-purple-500/10' },
}

export function KpiCard({
  label, value, sublabel, delta, deltaLabel, icon: Icon, color = 'gold', className
}: KpiCardProps) {
  const colors = COLOR_MAP[color]
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const DeltaIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className={cn('flex flex-col gap-2 rounded-xl p-4 border', className)}
      style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {label}
          </span>
        </div>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
            <Icon size={15} className={colors.text} />
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div>
        <div className="text-3xl font-bold text-white tracking-tight leading-none">{value}</div>
        {sublabel && (
          <div className="text-sm text-gray-500 mt-1.5">{sublabel}</div>
        )}
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-500'
        )}>
          <DeltaIcon size={14} />
          <span>
            {isPositive ? '+' : ''}{delta.toFixed(1)}%
            {deltaLabel && <span className="text-gray-600 font-normal ml-1">{deltaLabel}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
