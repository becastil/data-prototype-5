'use client'

import * as React from 'react'
import { Tooltip } from './Tooltip'

export type KpiStatus = 'positive' | 'warning' | 'negative' | 'neutral'

export interface KpiPillProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
  formatCurrency?: boolean
  formatPercent?: boolean
  status?: KpiStatus
  definition?: string
  subLabel?: string
}

export function KpiPill({
  label,
  value,
  trend,
  trendValue,
  className = '',
  formatCurrency = false,
  formatPercent = false,
  status,
  definition,
  subLabel,
}: KpiPillProps) {
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
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val)
    }
    
    if (formatPercent) {
      return `${val.toFixed(1)}%`
    }
    
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const trendConfig = {
    up: { color: 'text-accent-orange', icon: '▲' },
    down: { color: 'text-primary-blue', icon: '▼' },
    neutral: { color: 'text-text-muted', icon: '→' },
  }

  const statusConfig: Record<KpiStatus, { border: string; bg: string; valueColor: string }> = {
    positive: {
      border: 'border-l-primary-blue',
      bg: 'bg-white',
      valueColor: 'text-primary-blue',
    },
    warning: {
      border: 'border-l-accent-orange',
      bg: 'bg-white',
      valueColor: 'text-accent-orange',
    },
    negative: {
      border: 'border-l-accent-orange',
      bg: 'bg-white',
      valueColor: 'text-accent-orange',
    },
    neutral: {
      border: 'border-l-border',
      bg: 'bg-white',
      valueColor: 'text-text-primary',
    },
  }

  const trendDisplay = trend ? trendConfig[trend] : null
  const statusDisplay = status ? statusConfig[status] : statusConfig.neutral

  return (
    <div className={`card p-3 border-l-4 ${statusDisplay.border} ${statusDisplay.bg} ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {definition && <Tooltip content={definition} />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${statusDisplay.valueColor}`}>
          {formatValue(value)}
        </div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${trendDisplay?.color}`}>
            {trendDisplay?.icon} {formatValue(trendValue)}
          </div>
        )}
      </div>
      {subLabel && (
        <div className="text-xs text-text-muted mt-1">{subLabel}</div>
      )}
    </div>
  )
}
