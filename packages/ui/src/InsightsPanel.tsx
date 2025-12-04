'use client'

import * as React from 'react'

export interface Insight {
  id: string
  type: 'info' | 'warning' | 'alert'
  message: string
  metric?: string
  value?: string
}

export interface InsightsPanelProps {
  insights: Insight[]
  title?: string
}

export function InsightsPanel({ insights, title = "What to Know" }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null
  }

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'alert':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gallagher-orange-light flex items-center justify-center">
            <svg className="w-4 h-4 text-gallagher-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gallagher-orange-light flex items-center justify-center">
            <svg className="w-4 h-4 text-gallagher-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gallagher-blue-lighter flex items-center justify-center">
            <svg className="w-4 h-4 text-gallagher-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        )
    }
  }

  const getBorderColor = (type: Insight['type']) => {
    switch (type) {
      case 'alert':
        return 'border-l-gallagher-orange'
      case 'warning':
        return 'border-l-gallagher-orange/60'
      default:
        return 'border-l-gallagher-blue'
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-card-title text-text-primary mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gallagher-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {title}
      </h3>
      
      <ul className="space-y-3">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 ${getBorderColor(insight.type)}`}
          >
            {getIcon(insight.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary leading-relaxed">
                {insight.message}
              </p>
              {(insight.metric || insight.value) && (
                <div className="mt-1 flex items-center gap-2">
                  {insight.metric && (
                    <span className="text-xs font-medium text-text-muted">
                      {insight.metric}
                    </span>
                  )}
                  {insight.value && (
                    <span className={`text-xs font-semibold ${
                      insight.type === 'alert' || insight.type === 'warning' 
                        ? 'text-gallagher-orange' 
                        : 'text-gallagher-blue'
                    }`}>
                      {insight.value}
                    </span>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Helper function to generate insights from data
export function generateInsights(data: {
  totalCost: number
  budget: number
  medicalVariance: number
  medicalVariancePercent: number
  pharmacyVariance: number
  pharmacyVariancePercent: number
  hccPercent: number
  lossRatio: number
  lossRatioTrend: 'increasing' | 'decreasing' | 'stable'
  consecutiveMonthsOverLossRatioThreshold?: number
}): Insight[] {
  const insights: Insight[] = []

  // Overall variance
  const totalVariance = data.totalCost - data.budget
  const totalVariancePercent = ((totalVariance) / data.budget) * 100

  if (Math.abs(totalVariancePercent) > 5) {
    insights.push({
      id: 'total-variance',
      type: totalVariancePercent > 10 ? 'alert' : totalVariancePercent > 5 ? 'warning' : 'info',
      message: totalVariancePercent > 0 
        ? `Total costs are ${Math.abs(totalVariancePercent).toFixed(1)}% over budget YTD.`
        : `Total costs are ${Math.abs(totalVariancePercent).toFixed(1)}% under budget YTD.`,
      metric: 'Variance',
      value: `${totalVariancePercent > 0 ? '+' : ''}$${Math.abs(totalVariance / 1000).toFixed(0)}K`,
    })
  }

  // Largest component variance
  if (Math.abs(data.medicalVariancePercent) > Math.abs(data.pharmacyVariancePercent)) {
    if (Math.abs(data.medicalVariancePercent) > 5) {
      insights.push({
        id: 'medical-variance',
        type: data.medicalVariancePercent > 10 ? 'warning' : 'info',
        message: `Largest variance: Medical claims (${data.medicalVariancePercent > 0 ? '+' : ''}${data.medicalVariancePercent.toFixed(1)}% vs budget).`,
        metric: 'Medical',
        value: `${data.medicalVariancePercent > 0 ? '+' : ''}$${Math.abs(data.medicalVariance / 1000).toFixed(0)}K`,
      })
    }
  } else {
    if (Math.abs(data.pharmacyVariancePercent) > 5) {
      insights.push({
        id: 'pharmacy-variance',
        type: data.pharmacyVariancePercent > 10 ? 'warning' : 'info',
        message: `Largest variance: Pharmacy claims (${data.pharmacyVariancePercent > 0 ? '+' : ''}${data.pharmacyVariancePercent.toFixed(1)}% vs budget).`,
        metric: 'Pharmacy',
        value: `${data.pharmacyVariancePercent > 0 ? '+' : ''}$${Math.abs(data.pharmacyVariance / 1000).toFixed(0)}K`,
      })
    }
  }

  // High-cost claimants
  if (data.hccPercent > 20) {
    insights.push({
      id: 'hcc-concentration',
      type: data.hccPercent > 35 ? 'warning' : 'info',
      message: `High-cost claimants account for ${data.hccPercent.toFixed(0)}% of total medical claims.`,
      metric: 'Concentration',
      value: `${data.hccPercent.toFixed(0)}%`,
    })
  }

  // Loss ratio trend
  if (data.lossRatioTrend === 'increasing' && data.lossRatio > 85) {
    insights.push({
      id: 'loss-ratio-trend',
      type: 'warning',
      message: `Loss ratio has been trending upward${data.consecutiveMonthsOverLossRatioThreshold ? ` for ${data.consecutiveMonthsOverLossRatioThreshold} consecutive months` : ''}.`,
      metric: 'Loss Ratio',
      value: `${data.lossRatio.toFixed(1)}%`,
    })
  }

  // If loss ratio exceeded threshold for multiple months
  if (data.consecutiveMonthsOverLossRatioThreshold && data.consecutiveMonthsOverLossRatioThreshold >= 3) {
    insights.push({
      id: 'loss-ratio-consecutive',
      type: 'alert',
      message: `Loss ratio exceeded 90% for ${data.consecutiveMonthsOverLossRatioThreshold} consecutive months.`,
    })
  }

  return insights.slice(0, 4) // Limit to 4 insights
}


