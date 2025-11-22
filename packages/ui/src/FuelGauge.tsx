'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { FuelGaugeStatus } from '@medical-reporting/lib'

export interface FuelGaugeProps {
  percentOfBudget: number
  status: FuelGaugeStatus
  size?: number
  showLabel?: boolean
}

export function FuelGauge({
  percentOfBudget,
  status,
  size = 220,
  showLabel = true,
}: FuelGaugeProps) {
  const colorMap: Record<FuelGaugeStatus, string> = {
    [FuelGaugeStatus.GREEN]: '#22c55e',
    [FuelGaugeStatus.YELLOW]: '#eab308',
    [FuelGaugeStatus.RED]: '#ef4444',
  }

  const color = colorMap[status]

  // Create semi-circle data (180 degrees)
  const data = [
    {
      name: 'used',
      value: Math.min(percentOfBudget, 100),
      fill: color,
    },
    {
      name: 'remaining',
      value: Math.max(100 - percentOfBudget, 0),
      fill: '#334155',
    },
  ]

  // Ensure we don't exceed 100%
  const displayPercent = Math.min(percentOfBudget, 100)

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size / 2 + 20}>
        <PieChart>
          <Pie
            data={data}
            cx={size / 2}
            cy={size / 2}
            startAngle={180}
            endAngle={0}
            innerRadius={size / 2 - 40}
            outerRadius={size / 2}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {showLabel && (
        <div className="mt-4 text-center">
          <div
            className="text-4xl font-bold"
            style={{ color }}
          >
            {displayPercent.toFixed(1)}%
          </div>
          <div className="mt-1 text-sm text-slate-400">of Budget</div>
          <div className="mt-2 text-xs font-medium" style={{ color }}>
            {status === FuelGaugeStatus.GREEN && 'Under Budget'}
            {status === FuelGaugeStatus.YELLOW && 'Near Budget'}
            {status === FuelGaugeStatus.RED && 'Over Budget'}
          </div>
        </div>
      )}
    </div>
  )
}
