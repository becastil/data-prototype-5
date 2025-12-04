export type KpiStatus = 'positive' | 'warning' | 'negative'

export interface KpiPillProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
  formatCurrency?: boolean
  status?: KpiStatus
}

export function KpiPill({
  label,
  value,
  trend,
  trendValue,
  className = '',
  formatCurrency = false,
  status,
}: KpiPillProps) {
  const formatValue = (val: string | number): string => {
    if (formatCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val)
    }
    if (typeof val === 'number') {
      return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    }
    return String(val)
  }

  const trendConfig = {
    up: { color: 'text-emerald-400', icon: '↑' },
    down: { color: 'text-red-400', icon: '↓' },
    neutral: { color: 'text-slate-400', icon: '→' },
  }

  const statusConfig: Record<KpiStatus, { border: string; bg: string; valueColor: string }> = {
    positive: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-500/5',
      valueColor: 'text-emerald-400',
    },
    warning: {
      border: 'border-l-yellow-500',
      bg: 'bg-yellow-500/5',
      valueColor: 'text-yellow-400',
    },
    negative: {
      border: 'border-l-red-500',
      bg: 'bg-red-500/5',
      valueColor: 'text-red-400',
    },
  }

  const trendDisplay = trend ? trendConfig[trend] : null
  const statusDisplay = status ? statusConfig[status] : null

  const baseClasses = 'rounded-lg border border-slate-800 p-4 backdrop-blur-sm'
  const statusClasses = statusDisplay
    ? `border-l-4 ${statusDisplay.border} ${statusDisplay.bg}`
    : 'bg-slate-900/50'

  return (
    <div className={`${baseClasses} ${statusClasses} ${className}`}>
      <div className="mb-1 text-xs font-medium text-slate-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${statusDisplay ? statusDisplay.valueColor : 'text-slate-100'}`}>
          {formatValue(value)}
        </div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${trendDisplay?.color}`}>
            {trendDisplay?.icon} {formatValue(trendValue)}
          </div>
        )}
      </div>
    </div>
  )
}
