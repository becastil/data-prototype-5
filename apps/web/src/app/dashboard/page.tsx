'use client'

import { useEffect, useState } from 'react'
import {
  HeroMetricTile,
  CostBreakdownCard,
  TrendChart,
  InsightsPanel,
  HighCostClaimantSummary,
  DashboardSkeleton,
  generateInsights,
  type TrendDataPoint,
  type Insight,
  type HeroMetricStatus,
} from '@medical-reporting/ui'

interface DashboardData {
  ytd: {
    totalCost: number
    budgetedCost: number
    variance: number
    variancePercent: number
    lossRatio: number
    percentOfBudget: number
  }
  components: {
    fixed: { actual: number; budget: number; percentOfTotal: number }
    medical: { actual: number; budget: number; percentOfTotal: number }
    pharmacy: { actual: number; budget: number; percentOfTotal: number }
    hcc: { actual: number; budget: number; percentOfTotal: number }
  }
  trend: TrendDataPoint[]
  hccSummary: {
    topClaimantCount: number
    topClaimantPercent: number
    totalClaimants: number
    buckets: Array<{
      label: string
      count: number
      totalCost: number
      percentOfTotal: number
    }>
    stopLossThreshold: number
  }
}

// Mock data generator for demo
function generateMockData(): DashboardData {
  const budget = 12_500_000
  const actual = 11_875_000
  const variance = actual - budget
  
  return {
    ytd: {
      totalCost: actual,
      budgetedCost: budget,
      variance: variance,
      variancePercent: (variance / budget) * 100,
      lossRatio: 87.5,
      percentOfBudget: (actual / budget) * 100,
    },
    components: {
      fixed: { actual: 2_850_000, budget: 2_750_000, percentOfTotal: 24 },
      medical: { actual: 5_625_000, budget: 6_000_000, percentOfTotal: 47 },
      pharmacy: { actual: 2_100_000, budget: 2_250_000, percentOfTotal: 18 },
      hcc: { actual: 1_300_000, budget: 1_500_000, percentOfTotal: 11 },
    },
    trend: [
      { period: 'Jan', actual: 950000, budget: 1040000 },
      { period: 'Feb', actual: 980000, budget: 1040000 },
      { period: 'Mar', actual: 1020000, budget: 1040000 },
      { period: 'Apr', actual: 1050000, budget: 1040000, isAlert: true },
      { period: 'May', actual: 1100000, budget: 1040000, isAlert: true },
      { period: 'Jun', actual: 1080000, budget: 1040000, isAlert: true },
      { period: 'Jul', actual: 1000000, budget: 1040000 },
      { period: 'Aug', actual: 970000, budget: 1040000 },
      { period: 'Sep', actual: 1025000, budget: 1040000 },
      { period: 'Oct', actual: 1050000, budget: 1040000, isAlert: true },
      { period: 'Nov', actual: 1030000, budget: 1040000 },
    ],
    hccSummary: {
      topClaimantCount: 12,
      topClaimantPercent: 34,
      totalClaimants: 1847,
      buckets: [
        { label: 'Top 1%', count: 18, totalCost: 1950000, percentOfTotal: 34 },
        { label: 'Top 5%', count: 92, totalCost: 2850000, percentOfTotal: 50 },
        { label: 'Top 10%', count: 185, totalCost: 3420000, percentOfTotal: 60 },
      ],
      stopLossThreshold: 175000,
    },
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // In production, fetch from API
        // const response = await fetch('/api/exec-summary?clientId=...')
        // const json = await response.json()
        
        // For now, use mock data with a delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 800))
        setData(generateMockData())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gallagher-orange mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Unable to load dashboard</h3>
        <p className="text-text-muted">{error || 'No data available'}</p>
      </div>
    )
  }

  // Determine status based on variance
  const getVarianceStatus = (variancePercent: number): HeroMetricStatus => {
    if (variancePercent <= -5) return 'positive' // Under budget
    if (variancePercent >= 5) return 'warning'   // Over budget
    return 'neutral'
  }

  const getLossRatioStatus = (lossRatio: number): HeroMetricStatus => {
    if (lossRatio <= 85) return 'positive'
    if (lossRatio >= 95) return 'warning'
    return 'neutral'
  }

  // Generate insights from data
  const insights: Insight[] = generateInsights({
    totalCost: data.ytd.totalCost,
    budget: data.ytd.budgetedCost,
    medicalVariance: data.components.medical.actual - data.components.medical.budget,
    medicalVariancePercent: ((data.components.medical.actual - data.components.medical.budget) / data.components.medical.budget) * 100,
    pharmacyVariance: data.components.pharmacy.actual - data.components.pharmacy.budget,
    pharmacyVariancePercent: ((data.components.pharmacy.actual - data.components.pharmacy.budget) / data.components.pharmacy.budget) * 100,
    hccPercent: data.hccSummary.topClaimantPercent,
    lossRatio: data.ytd.lossRatio,
    lossRatioTrend: 'stable',
    consecutiveMonthsOverLossRatioThreshold: 0,
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Executive Summary</h1>
        <p className="text-text-muted mt-1">Year-to-date financial overview</p>
      </div>

      {/* Hero Metrics */}
      <section aria-labelledby="hero-metrics">
        <h2 id="hero-metrics" className="sr-only">Key Financial Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroMetricTile
            label="Total Plan Cost"
            value={data.ytd.totalCost}
            subLabel="YTD"
            formatCurrency
            status="neutral"
            definition="Total claims paid plus fixed costs and administrative fees for the current plan year."
          />
          <HeroMetricTile
            label="Budgeted Cost"
            value={data.ytd.budgetedCost}
            subLabel="YTD"
            formatCurrency
            status="neutral"
            definition="Projected total cost based on the approved 2025 budget."
          />
          <HeroMetricTile
            label="Variance"
            value={data.ytd.variance}
            subLabel="vs Budget"
            formatCurrency
            status={getVarianceStatus(data.ytd.variancePercent)}
            trend={{
              direction: data.ytd.variance < 0 ? 'down' : 'up',
              value: `${Math.abs(data.ytd.variancePercent).toFixed(1)}%`,
              isPositive: data.ytd.variance < 0,
            }}
            definition="Difference between actual costs and budgeted costs. Negative values indicate under-budget performance."
          />
          <HeroMetricTile
            label="Loss Ratio"
            value={data.ytd.lossRatio}
            subLabel="Claims / Premium"
            formatPercent
            status={getLossRatioStatus(data.ytd.lossRatio)}
            definition="Total claims paid divided by total premiums collected. Lower ratios indicate better plan performance."
          />
        </div>
      </section>

      {/* Cost Breakdown */}
      <section aria-labelledby="cost-breakdown">
        <div className="flex items-center justify-between mb-4">
          <h2 id="cost-breakdown" className="text-lg font-semibold text-text-primary">
            Cost Components
          </h2>
          <span className="text-sm text-text-muted">Actual vs Budget</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CostBreakdownCard
            title="Fixed Costs"
            actual={data.components.fixed.actual}
            budget={data.components.fixed.budget}
            percentOfTotal={data.components.fixed.percentOfTotal}
            trend={{ direction: 'up', value: '+3.6%' }}
            definition="Administrative fees, stop-loss premiums, and other fixed plan expenses."
          />
          <CostBreakdownCard
            title="Medical Claims"
            actual={data.components.medical.actual}
            budget={data.components.medical.budget}
            percentOfTotal={data.components.medical.percentOfTotal}
            trend={{ direction: 'down', value: '-6.3%' }}
            definition="All medical claims paid during the period, excluding pharmacy."
          />
          <CostBreakdownCard
            title="Pharmacy Claims"
            actual={data.components.pharmacy.actual}
            budget={data.components.pharmacy.budget}
            percentOfTotal={data.components.pharmacy.percentOfTotal}
            trend={{ direction: 'down', value: '-6.7%' }}
            definition="All prescription drug claims paid during the period."
          />
          <CostBreakdownCard
            title="High-Cost Claimants"
            actual={data.components.hcc.actual}
            budget={data.components.hcc.budget}
            percentOfTotal={data.components.hcc.percentOfTotal}
            trend={{ direction: 'down', value: '-13.3%' }}
            definition="Claims exceeding the specific stop-loss attachment point."
          />
        </div>
      </section>

      {/* Charts and Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <TrendChart
            data={data.trend}
            title="Cost Trend"
            alertThreshold={1040000}
          />
        </div>

        {/* Insights Panel */}
        <div className="lg:col-span-1">
          <InsightsPanel insights={insights} />
        </div>
      </div>

      {/* High-Cost Claimant Summary */}
      <section aria-labelledby="hcc-summary">
        <h2 id="hcc-summary" className="sr-only">High-Cost Claimant Summary</h2>
        <HighCostClaimantSummary
          topClaimantCount={data.hccSummary.topClaimantCount}
          topClaimantPercent={data.hccSummary.topClaimantPercent}
          totalClaimants={data.hccSummary.totalClaimants}
          buckets={data.hccSummary.buckets}
          stopLossThreshold={data.hccSummary.stopLossThreshold}
          definition="Claimants whose total claims exceed the individual stop-loss (ISL) specific deductible threshold."
        />
      </section>
    </div>
  )
}
