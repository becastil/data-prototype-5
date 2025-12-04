'use client'

import * as React from 'react'
import { Tooltip } from './Tooltip'

export type HeroMetricStatus = 'positive' | 'warning' | 'neutral'

export interface HeroMetricTileProps {
  label: string
  value: string | number
  subLabel?: string
  status?: HeroMetricStatus
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    isPositive?: boolean
  }
  definition?: string
  formatCurrency?: boolean
  formatPercent?: boolean
}

export function HeroMetricTile({
  label,
  value,
  subLabel,
  status = 'neutral',
  trend,
  definition,
  formatCurrency = false,
  formatPercent = false,
}: HeroMetricTileProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val
    
    if (formatCurrency) {
      const absVal = Math.abs(val)
      const sign = val < 0 ? '-' : ''
      if (absVal >= 1_000_000) {
        return `${sign}$${(absVal / 1_000_000).toFixed(2)}M`
      } else if (absVal >= 1_000) {
        return `${sign}$${(absVal / 1_000).toFixed(0)}K`
      }
      return `${sign}$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    
    if (formatPercent) {
      return `${val.toFixed(1)}%`
    }
    
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const statusStyles: Record<HeroMetricStatus, { bg: string; border: string; valueColor: string }> = {
    positive: {
      bg: 'bg-gallagher-blue-lighter',
      border: 'border-gallagher-blue/20',
      valueColor: 'text-gallagher-blue',
    },
    warning: {
      bg: 'bg-gallagher-orange-light',
      border: 'border-gallagher-orange/20',
      valueColor: 'text-gallagher-orange',
    },
    neutral: {
      bg: 'bg-white',
      border: 'border-border',
      valueColor: 'text-gallagher-blue',
    },
  }

  const style = statusStyles[status]

  const trendIcon = trend ? (
    trend.direction === 'up' ? '▲' :
    trend.direction === 'down' ? '▼' : '→'
  ) : null

  const trendColor = trend ? (
    trend.isPositive === true ? 'text-gallagher-blue' :
    trend.isPositive === false ? 'text-gallagher-orange' :
    'text-text-muted'
  ) : ''

  return (
    <div className={`card p-6 ${style.bg} ${style.border} transition-all duration-200 hover:shadow-card-hover`}>
      {/* Label with optional tooltip */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="metric-label">{label}</span>
        {definition && <Tooltip content={definition} />}
      </div>

      {/* Main Value */}
      <div className={`text-hero ${style.valueColor} mb-1`}>
        {formatValue(value)}
      </div>

      {/* Sub-label and Trend */}
      <div className="flex items-center justify-between">
        {subLabel && (
          <span className="text-sm text-text-muted">{subLabel}</span>
        )}
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendIcon} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}


