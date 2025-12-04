'use client'

import { useEffect, useState } from 'react'
import {
  FuelGauge,
  KpiPill,
  ReportCard,
  PlanYtdChart,
  ClaimantDistributionChart,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'
import { 
  FuelGaugeStatus, 
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
      <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-red-400">
        Error: {error || 'No data available'}
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
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Executive Summary</h1>
        <p className="mt-2 text-slate-400">Year-to-date analysis and key metrics</p>
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
          />
          <KpiPill
            label="Surplus"
            value={ytd.surplus}
            formatCurrency={true}
            status={calculateSurplusStatus(ytd.surplus, ytd.budgetedPremium)}
          />
          <KpiPill
            label="Medical Paid"
            value={ytd.medicalPaid}
            formatCurrency={true}
          />
          <KpiPill
            label="Rx Paid"
            value={ytd.rxPaid}
            formatCurrency={true}
          />
          <KpiPill
            label="Net Paid"
            value={ytd.netPaid}
            formatCurrency={true}
          />
          <KpiPill
            label="% of Budget"
            value={ytd.percentOfBudget}
            formatCurrency={false}
            status={calculateBudgetStatus(ytd.percentOfBudget)}
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
                <span className="text-slate-300">Medical</span>
                <span className="font-semibold text-slate-100">
                  {medVsRx.medicalPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${medVsRx.medicalPercent}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-300">Pharmacy</span>
                <span className="font-semibold text-slate-100">
                  {medVsRx.rxPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${medVsRx.rxPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* Claimant Buckets */}
      {claimantBuckets && claimantBuckets.length > 0 && (
        <ReportCard title="High-Cost Claimant Buckets">
          <ClaimantDistributionChart data={claimantBuckets as ClaimantBucket[]} />
        </ReportCard>
      )}
      </div>
    </ErrorBoundary>
  )
}
