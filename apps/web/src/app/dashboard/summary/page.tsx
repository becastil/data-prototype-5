'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  KpiPill,
  Button,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'

export default function SummaryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, planYearId }),
        })
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

  const handleExport = () => {
    window.open(
      `/api/summary/export?clientId=${clientId}&planYearId=${planYearId}&format=csv`,
      '_blank'
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-32" />
        <SkeletonLoader variant="table" lines={28} />
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

  const { cumulative, kpis } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getRowColor = (colorCode?: string) => {
    switch (colorCode) {
      case 'adjustment':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'total':
        return 'bg-blue-500/10 text-blue-400 font-semibold'
      case 'variance-positive':
        return 'bg-emerald-500/10 text-emerald-400 font-semibold'
      case 'variance-negative':
        return 'bg-red-500/10 text-red-400 font-semibold'
      default:
        return ''
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">C&E Summary</h1>
          <p className="mt-2 text-slate-400">
            28-row Claims & Expenses statement with monthly and cumulative values
          </p>
        </div>
        <Button onClick={handleExport}>Export CSV</Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <KpiPill
            label="Monthly C&E"
            value={kpis.monthlyCE}
            formatCurrency={true}
          />
          <KpiPill
            label="PEPM Actual"
            value={kpis.pepmActual}
            formatCurrency={true}
          />
          <KpiPill
            label="Budget Variance"
            value={kpis.budgetVariance}
            formatCurrency={true}
          />
          <KpiPill
            label="Cumulative C&E"
            value={kpis.cumulativeCE}
            formatCurrency={true}
          />
        </div>
      )}

      {/* 28-Row Table */}
      <ReportCard title="C&E Statement">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Row</th>
                <th className="px-4 py-3 text-slate-300">Item</th>
                <th className="px-4 py-3 text-right text-slate-300">Monthly</th>
                <th className="px-4 py-3 text-right text-slate-300">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {cumulative && cumulative.map((row: any, index: number) => {
                if (row.rowType === 'HEADER') {
                  return (
                    <tr key={index} className="border-t-2 border-slate-700">
                      <td
                        colSpan={4}
                        className="px-4 py-2 font-semibold text-slate-200 bg-slate-800/50"
                      >
                        {row.itemName}
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={index}
                    className={`border-b border-slate-800/50 ${getRowColor(row.colorCode)}`}
                  >
                    <td className="px-4 py-2 text-slate-300">
                      #{row.itemNumber}
                      {row.isUserEditable && (
                        <span className="ml-2 text-xs text-yellow-400">✎</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{row.itemName}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(row.monthlyValue)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.cumulativeValue !== undefined
                        ? formatCurrency(row.cumulativeValue)
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          <p><strong>Legend:</strong></p>
          <p className="mt-1">✎ = User-editable field (rows #6, #9, #11)</p>
          <p className="mt-1">
            <span className="text-yellow-400">Yellow</span> = Adjustments |{' '}
            <span className="text-blue-400">Blue</span> = Totals |{' '}
            <span className="text-emerald-400">Green</span> = Favorable Variance |{' '}
            <span className="text-red-400">Red</span> = Unfavorable Variance
          </p>
        </div>
      </ReportCard>
      </div>
    </ErrorBoundary>
  )
}

