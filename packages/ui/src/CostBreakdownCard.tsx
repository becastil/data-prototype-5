'use client'

import * as React from 'react'
import { Tooltip } from './Tooltip'

export interface CostBreakdownCardProps {
  title: string
  actual: number
  budget: number
  percentOfTotal?: number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  definition?: string
}

export function CostBreakdownCard({
  title,
  actual,
  budget,
  percentOfTotal,
  trend,
  definition,
}: CostBreakdownCardProps) {
  const variance = actual - budget
  const variancePercent = budget !== 0 ? ((actual - budget) / budget) * 100 : 0
  const isOverBudget = variance > 0
  const fillPercent = budget !== 0 ? Math.min((actual / budget) * 100, 100) : 0
  const overflowPercent = budget !== 0 && actual > budget ? Math.min(((actual - budget) / budget) * 100, 20) : 0

  const formatCurrency = (val: number): string => {
    const absVal = Math.abs(val)
    const sign = val < 0 ? '-' : ''
    if (absVal >= 1_000_000) {
      return `${sign}$${(absVal / 1_000_000).toFixed(2)}M`
    } else if (absVal >= 1_000) {
      return `${sign}$${(absVal / 1_000).toFixed(0)}K`
    }
    return `${sign}$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const trendIcon = trend ? (
    trend.direction === 'up' ? '▲' :
    trend.direction === 'down' ? '▼' : '→'
  ) : null

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {definition && <Tooltip content={definition} />}
        </div>
        {percentOfTotal !== undefined && (
          <span className="text-xs font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
            {percentOfTotal.toFixed(0)}% of total
          </span>
        )}
      </div>

      {/* Actual vs Budget Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-text-secondary">Actual</span>
          <span className="font-semibold text-text-primary">{formatCurrency(actual)}</span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* Budget fill */}
          <div
            className={`absolute h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-gallagher-blue' : 'bg-gallagher-blue'
            }`}
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
          {/* Overflow indicator */}
          {overflowPercent > 0 && (
            <div
              className="absolute h-full bg-gallagher-orange rounded-r-full transition-all duration-500"
              style={{ 
                left: '100%',
                width: `${overflowPercent}%`,
                marginLeft: '-2px'
              }}
            />
          )}
          {/* Budget marker line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-text-secondary"
            style={{ left: '100%', transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-text-muted">Budget: {formatCurrency(budget)}</span>
        </div>
      </div>

      {/* Variance and Trend */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isOverBudget ? 'text-gallagher-orange' : 'text-gallagher-blue'}`}>
            {isOverBudget ? '+' : ''}{formatCurrency(variance)}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isOverBudget 
              ? 'bg-gallagher-orange-light text-gallagher-orange' 
              : 'bg-gallagher-blue-lighter text-gallagher-blue'
          }`}>
            {isOverBudget ? '+' : ''}{variancePercent.toFixed(1)}%
          </span>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${
            trend.direction === 'up' ? 'text-gallagher-orange' : 
            trend.direction === 'down' ? 'text-gallagher-blue' : 
            'text-text-muted'
          }`}>
            {trendIcon} {trend.value} vs prior
          </span>
        )}
      </div>
    </div>
  )
}


