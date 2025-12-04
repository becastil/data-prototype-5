'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ClaimantBucket } from '@medical-reporting/lib'

export interface ClaimantDistributionChartProps {
  data: ClaimantBucket[]
  title?: string
}

// Gallagher color palette for chart segments
const COLORS = ['#00263E', '#003A5C', '#00527D', '#006B9E', '#FF8400']

export function ClaimantDistributionChart({
  data,
  title,
}: ClaimantDistributionChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="rounded-lg border border-border bg-white p-3 shadow-elevated">
          <p className="font-semibold text-text-primary">{data.name}</p>
          <p className="text-sm text-text-secondary">
            Amount: {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-text-muted">
            Count: {data.payload.count} claimants
          </p>
        </div>
      )
    }
    return null
  }

  // Use provided colors or fallback to Gallagher palette
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || COLORS[index % COLORS.length]
  }))

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-text-secondary">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => {
              const total = data.reduce((sum, d) => sum + d.value, 0)
              const percent = total > 0 ? ((value / total) * 100).toFixed(0) : '0'
              return `${name}: ${percent}%`
            }}
            outerRadius={100}
            fill="#00263E"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
