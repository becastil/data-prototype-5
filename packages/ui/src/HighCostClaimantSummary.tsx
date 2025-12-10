'use client'

import * as React from 'react'
import { Tooltip } from './Tooltip'

export interface ClaimantBucket {
  label: string
  count: number
  totalCost: number
  percentOfTotal: number
}

export interface HighCostClaimantSummaryProps {
  topClaimantCount: number
  topClaimantPercent: number
  totalClaimants: number
  buckets?: ClaimantBucket[]
  stopLossThreshold?: number
  definition?: string
}

export function HighCostClaimantSummary({
  topClaimantCount,
  topClaimantPercent,
  totalClaimants,
  buckets = [],
  stopLossThreshold,
  definition,
}: HighCostClaimantSummaryProps) {
  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-card-title text-text-primary">High-Cost Claimant Summary</h3>
        {definition && <Tooltip content={definition} />}
      </div>

      {/* Big Number */}
      <div className="text-center mb-6 pb-6 border-b border-border">
        <div className="text-6xl font-bold text-gallagher-blue mb-2">
          {topClaimantPercent.toFixed(0)}%
        </div>
        <p className="text-text-secondary">
          Top <span className="font-semibold text-text-primary">{topClaimantCount}</span> claimants = {topClaimantPercent.toFixed(1)}% of total claims
        </p>
        <p className="text-sm text-text-muted mt-1">
          Out of {totalClaimants.toLocaleString()} total claimants
        </p>
      </div>

      {/* Cost Concentration Bars */}
      {buckets.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary">Cost Concentration</h4>
          
          {buckets.map((bucket, index) => (
            <div key={bucket.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{bucket.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted">
                    {bucket.count} claimants
                  </span>
                  <span className="font-semibold text-text-primary">
                    {bucket.percentOfTotal.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${bucket.percentOfTotal}%`,
                    backgroundColor: index === 0 ? '#00263E' : 
                                    index === 1 ? '#003A5C' : 
                                    index === 2 ? '#00527D' : '#6B7280'
                  }}
                />
              </div>
            </div>
          ))}

          {/* Stop Loss Threshold indicator */}
          {stopLossThreshold && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full border-2 border-gallagher-orange bg-gallagher-orange-light" />
                <span className="text-text-secondary">
                  Stop-loss threshold: 
                  <span className="font-semibold text-gallagher-orange ml-1">
                    ${stopLossThreshold.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simple percentage visual if no buckets */}
      {buckets.length === 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Top {topClaimantCount} claimants</span>
            <span className="font-semibold text-gallagher-blue">{topClaimantPercent.toFixed(1)}%</span>
          </div>
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gallagher-blue rounded-full transition-all duration-500"
              style={{ width: `${Math.min(topClaimantPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  )
}








