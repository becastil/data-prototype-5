'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { PlanYtdDataPoint } from '@medical-reporting/lib'

export interface PlanYtdChartProps {
  data: PlanYtdDataPoint[]
  title?: string
}

export function PlanYtdChart({ data, title }: PlanYtdChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-300">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="planName"
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
            formatter={(value: number) => formatTooltip(value)}
          />
          <Legend
            wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
          />
          <Bar
            dataKey="medical"
            stackId="a"
            fill="#3b82f6"
            name="Medical"
          />
          <Bar
            dataKey="rx"
            stackId="a"
            fill="#a855f7"
            name="Pharmacy"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
