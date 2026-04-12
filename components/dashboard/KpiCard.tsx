import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  delta?: string        // e.g. "+12%"
  deltaLabel?: string   // e.g. "vs mes anterior"
  deltaPositive?: boolean
  icon?: LucideIcon
  color?: 'gold' | 'green' | 'blue' | 'orange' | 'purple'
  className?: string
}

const COLOR_MAP = {
  gold:   { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  green:  { bg: 'bg-green-500/15',  text: 'text-green-400' },
  blue:   { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
}

export function KpiCard({
  label, value, sublabel, delta, deltaLabel, deltaPositive = true,
  icon: Icon, color = 'gold', className,
}: KpiCardProps) {
  const c = COLOR_MAP[color]

  return (
    <div
      className={cn('flex flex-col gap-3 rounded-xl p-5 border', className)}
      style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
    >
      {/* Row 1: label + icon */}
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest leading-tight">
          {label}
        </span>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', c.bg)}>
            <Icon size={18} className={c.text} />
          </div>
        )}
      </div>

      {/* Row 2: value */}
      <div className="text-[2.25rem] font-bold text-white tracking-tight leading-none">
        {value}
      </div>

      {/* Row 3: sublabel or delta */}
      {delta ? (
        <div className="flex items-center gap-1.5 text-sm">
          <span className={deltaPositive ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
            {delta}
          </span>
          {deltaLabel && (
            <span className="text-gray-500">{deltaLabel}</span>
          )}
        </div>
      ) : sublabel ? (
        <p className="text-sm text-gray-500 leading-tight">{sublabel}</p>
      ) : null}
    </div>
  )
}
