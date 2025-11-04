'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ClaimantBucket } from '@medical-reporting/lib'

export interface ClaimantDistributionChartProps {
  data: ClaimantBucket[]
  title?: string
}

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
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-lg">
          <p className="font-semibold text-slate-200">{data.name}</p>
          <p className="text-sm text-slate-300">
            Amount: {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-slate-400">
            Count: {data.payload.count} claimants
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-300">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => {
              const total = data.reduce((sum, d) => sum + d.value, 0)
              const percent = total > 0 ? ((value / total) * 100).toFixed(0) : '0'
              return `${name}: ${percent}%`
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
