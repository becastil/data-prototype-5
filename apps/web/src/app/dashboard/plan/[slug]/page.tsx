'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ReportCard,
  PepmTrendChart,
  KpiPill,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'
import type { PepmDataPoint } from '@medical-reporting/lib'

export default function PlanPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  // Map slug to plan ID
  const planMap: { [key: string]: string } = {
    'hdhp': 'HDHP',
    'ppo-base': 'PPO Base',
    'ppo-buyup': 'PPO Buy-Up',
  }

  const planName = planMap[slug]
  const planColors: { [key: string]: string } = {
    'hdhp': 'emerald',
    'ppo-base': 'blue',
    'ppo-buyup': 'purple',
  }
  const planColor = planColors[slug] || 'slate'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/monthly/${slug}?clientId=${clientId}&planYearId=${planYearId}`
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
  }, [clientId, planYearId, slug])

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-32" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" className="h-24" />
          ))}
        </div>
        <SkeletonLoader variant="chart" className="h-96" />
        <SkeletonLoader variant="table" lines={12} />
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

  const { monthlyData, ytd, pepm, trends } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-100">{planName}</h1>
          <span className={`inline-block rounded-full bg-${planColor}-500/20 px-3 py-1 text-sm font-medium text-${planColor}-400`}>
            {planName}
          </span>
        </div>
        <p className="mt-2 text-slate-400">Plan-specific monthly detail with PEPM trends</p>
      </div>

      {/* YTD Summary */}
      {ytd && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <KpiPill
            label="Total Cost"
            value={ytd.totalCost}
            formatCurrency={true}
          />
          <KpiPill
            label="Surplus"
            value={ytd.surplus}
            formatCurrency={true}
          />
          <KpiPill
            label="Medical PEPM"
            value={pepm.medical.current}
            formatCurrency={true}
          />
          <KpiPill
            label="Rx PEPM"
            value={pepm.rx.current}
            formatCurrency={true}
          />
        </div>
      )}

      {/* PEPM Comparison Chart */}
      {trends && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportCard title="Medical PEPM Trend">
            <PepmTrendChart
              data={trends.medical as PepmDataPoint[]}
              currentLabel="Current 12"
              priorLabel="Prior 12"
            />
            <div className="mt-4 text-xs text-slate-400">
              Current: {formatCurrency(pepm.medical.current)} | Prior:{' '}
              {formatCurrency(pepm.medical.prior)}
            </div>
          </ReportCard>

          <ReportCard title="Rx PEPM Trend">
            <PepmTrendChart
              data={trends.rx as PepmDataPoint[]}
              currentLabel="Current 12"
              priorLabel="Prior 12"
            />
            <div className="mt-4 text-xs text-slate-400">
              Current: {formatCurrency(pepm.rx.current)} | Prior: {formatCurrency(pepm.rx.prior)}
            </div>
          </ReportCard>
        </div>
      )}

      {/* A-N Columns Table */}
      <ReportCard title="Monthly A-N Columns">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Month</th>
                <th className="px-4 py-3 text-slate-300">C: Medical</th>
                <th className="px-4 py-3 text-slate-300">D: Rx</th>
                <th className="px-4 py-3 text-slate-300">K: Total Cost</th>
                <th className="px-4 py-3 text-slate-300">L: Budget</th>
                <th className="px-4 py-3 text-slate-300">M: Surplus</th>
                <th className="px-4 py-3 text-slate-300">N: % Budget</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData && monthlyData.slice(-12).map((month: any) => (
                <tr key={month.month} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-slate-300">{month.month}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.medicalPaid)}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.rxPaid)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    {formatCurrency(month.totalCost)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatCurrency(month.budgetedPremium)}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      month.surplus >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(month.surplus)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {month.percentOfBudget.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>
      </div>
    </ErrorBoundary>
  )
}

