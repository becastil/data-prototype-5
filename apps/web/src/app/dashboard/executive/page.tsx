'use client'

import { useEffect, useState } from 'react'
import {
  FuelGauge,
  FuelGaugeStatus,
  KpiPill,
  ReportCard,
  PlanYtdChart,
  ClaimantDistributionChart,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'
import { 
  calculateSurplusStatus, 
  calculateBudgetStatus,
  type PlanYtdDataPoint, 
  type ClaimantBucket 
} from '@medical-reporting/lib'

export default function ExecutiveSummaryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/exec-summary?clientId=${clientId}&planYearId=${planYearId}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, planYearId])

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" className="h-24" />
          ))}
        </div>
        <SkeletonLoader variant="chart" className="h-96" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gallagher-orange mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Unable to load data</h3>
        <p className="text-text-muted">{error || 'No data available'}</p>
      </div>
    )
  }

  const { ytd, planMix, medVsRx, claimantBuckets } = data

  // Transform planMix for chart
  const planYtdData: PlanYtdDataPoint[] = planMix.map((plan: any) => ({
    planName: plan.planName,
    medical: ytd.medicalPaid * (plan.percentage / 100) * (medVsRx.medicalPercent / 100),
    rx: ytd.rxPaid * (plan.percentage / 100) * (medVsRx.rxPercent / 100),
    total: plan.amount,
  }))

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Executive Summary</h1>
          <p className="mt-1 text-text-muted">Year-to-date analysis and key metrics</p>
        </div>

        {/* Fuel Gauge and YTD KPIs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <ReportCard className="lg:col-span-1">
            <FuelGauge
              percentOfBudget={ytd.percentOfBudget}
              status={ytd.fuelGaugeStatus}
            />
          </ReportCard>

          <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-3">
            <KpiPill
              label="Total Cost"
              value={ytd.totalCost}
              formatCurrency={true}
              definition="Sum of all claims and fixed costs YTD"
            />
            <KpiPill
              label="Surplus"
              value={ytd.surplus}
              formatCurrency={true}
              status={calculateSurplusStatus(ytd.surplus, ytd.budgetedPremium)}
              definition="Budget minus actual costs"
            />
            <KpiPill
              label="Medical Paid"
              value={ytd.medicalPaid}
              formatCurrency={true}
              definition="Total medical claims paid YTD"
            />
            <KpiPill
              label="Rx Paid"
              value={ytd.rxPaid}
              formatCurrency={true}
              definition="Total pharmacy claims paid YTD"
            />
            <KpiPill
              label="Net Paid"
              value={ytd.netPaid}
              formatCurrency={true}
              definition="Claims net of stop-loss reimbursements"
            />
            <KpiPill
              label="% of Budget"
              value={ytd.percentOfBudget}
              formatPercent={true}
              status={calculateBudgetStatus(ytd.percentOfBudget)}
              definition="Actual costs as percentage of budget"
            />
          </div>
        </div>

        {/* Plan YTD Chart */}
        <ReportCard title="Plan Spending YTD">
          <PlanYtdChart data={planYtdData} />
        </ReportCard>

        {/* Med vs Rx Distribution */}
        <ReportCard title="Medical vs Pharmacy Split">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Medical</span>
                  <span className="font-semibold text-text-primary">
                    {medVsRx.medicalPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gallagher-blue transition-all"
                    style={{ width: `${medVsRx.medicalPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Pharmacy</span>
                  <span className="font-semibold text-text-primary">
                    {medVsRx.rxPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gallagher-blue-light transition-all"
                    style={{ width: `${medVsRx.rxPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ReportCard>

        {/* Claimant Buckets */}
        {claimantBuckets && claimantBuckets.length > 0 && (
          <ReportCard title="High-Cost Claimant Distribution">
            <ClaimantDistributionChart data={claimantBuckets as ClaimantBucket[]} />
          </ReportCard>
        )}
      </div>
    </ErrorBoundary>
  )
}
