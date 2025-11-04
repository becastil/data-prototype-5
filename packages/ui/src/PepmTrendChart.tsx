'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { PepmDataPoint } from '@medical-reporting/lib'

export interface PepmTrendChartProps {
  data: PepmDataPoint[]
  title?: string
  currentLabel?: string
  priorLabel?: string
  showPrior?: boolean
}

export function PepmTrendChart({
  data,
  title,
  currentLabel = 'Current',
  priorLabel = 'Prior',
  showPrior = true,
}: PepmTrendChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-300">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label: string) => formatMonth(label)}
          />
          <Legend
            wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name={currentLabel}
          />
          {showPrior && (
            <Line
              type="monotone"
              dataKey="prior"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#64748b', r: 4 }}
              activeDot={{ r: 6 }}
              name={priorLabel}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
