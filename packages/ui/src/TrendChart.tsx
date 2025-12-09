'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

export interface TrendDataPoint {
  period: string
  actual: number
  budget: number
  priorYear?: number
  isAlert?: boolean
  // Support for multiple metrics
  cost?: number
  costBudget?: number
  lossRatio?: number
  lossRatioBudget?: number
  pepm?: number
  pepmBudget?: number
}

export type MetricType = 'cost' | 'lossRatio' | 'pepm'

export interface TrendChartProps {
  data: TrendDataPoint[]
  showPriorYear?: boolean
  defaultMetric?: MetricType
  onMetricChange?: (metric: MetricType) => void
  alertThreshold?: number
  title?: string
}

export function TrendChart({
  data,
  showPriorYear = false,
  defaultMetric = 'cost',
  onMetricChange,
  alertThreshold,
  title = 'Cost Trend',
}: TrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>(defaultMetric)

  const handleMetricChange = (metric: MetricType) => {
    setActiveMetric(metric)
    onMetricChange?.(metric)
  }

  // Determine which data keys to use based on active metric
  const getDataKeys = () => {
    switch (activeMetric) {
      case 'lossRatio':
        return { actual: 'lossRatio', budget: 'lossRatioBudget' }
      case 'pepm':
        return { actual: 'pepm', budget: 'pepmBudget' }
      default:
        // Default to base keys or explicit cost keys if present
        return { 
          actual: data[0]?.cost !== undefined ? 'cost' : 'actual', 
          budget: data[0]?.costBudget !== undefined ? 'costBudget' : 'budget' 
        }
    }
  }

  const { actual: actualKey, budget: budgetKey } = getDataKeys()

  const formatValue = (value: number): string => {
    if (value === undefined || value === null) return '-'
    
    if (activeMetric === 'lossRatio') {
      return `${value.toFixed(1)}%`
    }
    if (activeMetric === 'pepm') {
      return `$${value.toFixed(0)}`
    }
    // Cost formatting
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatYAxis = (value: number): string => {
    if (activeMetric === 'lossRatio') {
      return `${value}%`
    }
    if (activeMetric === 'pepm') {
      return `$${value}`
    }
    // Cost formatting
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value}`
  }

  // Get domain based on metric to ensure good visualization
  const getYDomain = () => {
    if (activeMetric === 'lossRatio') {
      return [0, (dataMax: number) => Math.max(dataMax * 1.1, 150)]
    }
    return ['auto', 'auto']
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-elevated p-3">
          <p className="font-semibold text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-semibold text-text-primary">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom dot for alert periods
  const AlertDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.isAlert) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="#FF8400" />
          <circle cx={cx} cy={cy} r={3} fill="white" />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={4} fill="#00263E" />
  }

  const metrics: { key: MetricType; label: string }[] = [
    { key: 'cost', label: 'Cost' },
    { key: 'lossRatio', label: 'Loss Ratio' },
    { key: 'pepm', label: 'PMPM' },
  ]

  return (
    <div className="card p-6">
      {/* Header with metric toggle and legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <h3 className="text-card-title text-text-primary">{title}</h3>
          
          {/* Legend - Inline with title on desktop */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gallagher-blue rounded" />
              <span className="text-xs sm:text-sm text-text-secondary">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-text-muted rounded" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: '#6B7280' }} />
              <span className="text-xs sm:text-sm text-text-secondary">Budget</span>
            </div>
            {showPriorYear && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-gallagher-blue/40 rounded" />
                <span className="text-xs sm:text-sm text-text-secondary">Prior Year</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gallagher-orange" />
              <span className="text-xs sm:text-sm text-text-secondary">Alert</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => handleMetricChange(metric.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeMetric === metric.key
                  ? 'bg-gallagher-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              vertical={false} 
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={formatYAxis}
              dx={-10}
              domain={getYDomain()}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Budget line (dashed) */}
            <Line
              type="monotone"
              dataKey={budgetKey}
              name="Budget"
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
            
            {/* Prior year line */}
            {showPriorYear && (
              <Line
                type="monotone"
                dataKey="priorYear" // Assuming prior year is always consistent or mapped similarly if needed
                name="Prior Year"
                stroke="#00263E"
                strokeWidth={1.5}
                strokeOpacity={0.4}
                dot={false}
              />
            )}
            
            {/* Actual line with alert dots */}
            <Line
              type="monotone"
              dataKey={actualKey}
              name="Actual"
              stroke="#00263E"
              strokeWidth={2.5}
              dot={<AlertDot />}
              activeDot={{ r: 6, fill: '#00263E' }}
            />

            {/* Alert threshold reference line - Only show for Cost metric if threshold provided */}
            {alertThreshold && activeMetric === 'cost' && (
              <ReferenceLine
                y={alertThreshold}
                stroke="#FF8400"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
