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
        <h3 className="mb-4 text-sm font-semibold text-text-secondary">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label: string) => formatMonth(label)}
          />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#00263E"
            strokeWidth={2.5}
            dot={{ fill: '#00263E', r: 4 }}
            activeDot={{ r: 6 }}
            name={currentLabel}
          />
          {showPrior && (
            <Line
              type="monotone"
              dataKey="prior"
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#6B7280', r: 4 }}
              activeDot={{ r: 6 }}
              name={priorLabel}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
