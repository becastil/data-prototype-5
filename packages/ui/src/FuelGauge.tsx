'use client'

import * as React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export enum FuelGaugeStatus {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

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
  // Gallagher color palette
  const colorMap: Record<FuelGaugeStatus, string> = {
    [FuelGaugeStatus.GREEN]: '#00263E', // Gallagher Blue - on/under budget
    [FuelGaugeStatus.YELLOW]: '#FF8400', // Gallagher Orange - watch zone
    [FuelGaugeStatus.RED]: '#FF8400',    // Gallagher Orange - over budget (same, intensity via context)
  }

  const bgColor = '#E5E7EB' // Light gray background

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
      fill: bgColor,
    },
  ]

  // Ensure we don't exceed 100%
  const displayPercent = Math.min(percentOfBudget, 100)

  const statusLabels: Record<FuelGaugeStatus, string> = {
    [FuelGaugeStatus.GREEN]: 'Under Budget',
    [FuelGaugeStatus.YELLOW]: 'Near Budget',
    [FuelGaugeStatus.RED]: 'Over Budget',
  }

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
          <div className="mt-1 text-sm text-text-muted">of Budget</div>
          <div 
            className="mt-2 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full inline-block"
            style={{ 
              color,
              backgroundColor: status === FuelGaugeStatus.GREEN 
                ? '#E6EEF2' // Gallagher blue lighter
                : '#FFF4E6' // Gallagher orange light
            }}
          >
            {statusLabels[status]}
          </div>
        </div>
      )}
    </div>
  )
}
