
export interface KpiPillProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
  formatCurrency?: boolean
}

export function KpiPill({
  label,
  value,
  trend,
  trendValue,
  className = '',
  formatCurrency = false,
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

  const trendDisplay = trend ? trendConfig[trend] : null

  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm ${className}`}
    >
      <div className="mb-1 text-xs font-medium text-slate-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-100">{formatValue(value)}</div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${trendDisplay?.color}`}>
            {trendDisplay?.icon} {formatValue(trendValue)}
          </div>
        )}
      </div>
    </div>
  )
}
