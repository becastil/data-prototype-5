'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  PepmTrendChart,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'
import type { PepmDataPoint } from '@medical-reporting/lib'

export default function MonthlyDetailPage() {
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
          `/api/monthly/all-plans?clientId=${clientId}&planYearId=${planYearId}`
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
        <SkeletonLoader variant="chart" className="h-96" />
        <SkeletonLoader variant="chart" className="h-96" />
        <SkeletonLoader variant="table" count={12} />
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

  const { monthlyData, pepm, trends } = data

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
        <h1 className="text-3xl font-bold text-slate-100">Monthly Detail</h1>
        <p className="mt-2 text-slate-400">Rolling 24 months with A-N column calculations</p>
      </div>

      {/* PEPM Charts */}
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

      {/* A-N Columns Table */}
      <ReportCard title="Monthly A-N Columns">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Month</th>
                <th className="px-4 py-3 text-slate-300">C: Medical</th>
                <th className="px-4 py-3 text-slate-300">D: Rx</th>
                <th className="px-4 py-3 text-slate-300">E: Total Paid</th>
                <th className="px-4 py-3 text-slate-300">F: Stop Loss</th>
                <th className="px-4 py-3 text-slate-300">G: Rx Rebates</th>
                <th className="px-4 py-3 text-slate-300">H: Net Paid</th>
                <th className="px-4 py-3 text-slate-300">I: Admin</th>
                <th className="px-4 py-3 text-slate-300">J: Stop Loss Fees</th>
                <th className="px-4 py-3 text-slate-300">K: Total Cost</th>
                <th className="px-4 py-3 text-slate-300">L: Budget</th>
                <th className="px-4 py-3 text-slate-300">M: Surplus</th>
                <th className="px-4 py-3 text-slate-300">N: % Budget</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.slice(-12).map((month: any) => (
                <tr key={month.month} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-slate-300">{month.month}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.medicalPaid)}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.rxPaid)}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.totalPaid)}</td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatCurrency(month.specStopLossReimb)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatCurrency(month.estRxRebates)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.netPaid)}</td>
                  <td className="px-4 py-3 text-slate-100">{formatCurrency(month.adminFees)}</td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatCurrency(month.stopLossFees)}
                  </td>
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
        <div className="mt-4 text-xs text-slate-400">
          <p>
            <strong>Formulas:</strong> E = C + D | H = E + F + G | K = H + I + J | M = L - K | N =
            K / L × 100
          </p>
          <p className="mt-1">
            Earned Pharmacy Rebates are estimated and subject to final reconciliation.
          </p>
        </div>
      </ReportCard>
      </div>
    </ErrorBoundary>
  )
}
