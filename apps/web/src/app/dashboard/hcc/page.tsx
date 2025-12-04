'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  KpiPill,
  SkeletonLoader,
  ErrorBoundary,
  HighCostClaimantSummary,
} from '@medical-reporting/ui'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

export default function HighCostClaimantsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [islThreshold, setIslThreshold] = useState(200000)

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/hcc?clientId=${clientId}&planYearId=${planYearId}&islThreshold=${islThreshold}`
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
  }, [clientId, planYearId, islThreshold])

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIslThreshold(parseFloat(e.target.value))
  }

  const handleStatusUpdate = async (claimantKey: string, newStatus: string) => {
    try {
      const response = await fetch('/api/hcc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimantKey, status: newStatus }),
      })
      if (response.ok) {
        // Refetch data
        const json = await fetch(
          `/api/hcc?clientId=${clientId}&planYearId=${planYearId}&islThreshold=${islThreshold}`
        ).then((r) => r.json())
        setData(json)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <SkeletonLoader variant="card" className="h-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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

  const { claimants, summary, islThreshold: effectiveIsl } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const statusColors = {
    OPEN: 'bg-gallagher-blue-lighter text-gallagher-blue',
    UNDER_REVIEW: 'bg-gallagher-orange-light text-gallagher-orange',
    RESOLVED: 'bg-green-100 text-green-700',
  }

  // Prepare chart data for employer vs stop loss
  const chartData = claimants.slice(0, 10).map((c: any) => ({
    claimant: c.claimantKey.substring(0, 8),
    employer: c.employerShare,
    stopLoss: c.stopLossShare,
    total: c.totalPaid,
  }))

  // Calculate HCC summary for the component
  const hccSummaryData = {
    topClaimantCount: Math.min(claimants.length, 10),
    topClaimantPercent: summary.totalPaid > 0 
      ? (claimants.slice(0, 10).reduce((sum: number, c: any) => sum + c.totalPaid, 0) / summary.totalPaid) * 100
      : 0,
    totalClaimants: claimants.length,
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">High-Cost Claimants</h1>
          <p className="mt-1 text-text-muted">ISL-based filtering with employer vs stop-loss analysis</p>
        </div>

        {/* ISL Threshold Control */}
        <ReportCard title="ISL Threshold Configuration">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Specific Deductible (ISL Threshold)
                </label>
                <span className="text-lg font-bold text-gallagher-blue">
                  {formatCurrency(islThreshold)}
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="500000"
                step="10000"
                value={islThreshold}
                onChange={handleThresholdChange}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gallagher-blue"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>$100K</span>
                <span>$300K</span>
                <span>$500K</span>
              </div>
            </div>
            <div className="text-sm text-text-muted bg-gallagher-blue-lighter/50 px-3 py-2 rounded-lg">
              Showing claimants at or exceeding 50% of ISL threshold ({formatCurrency(effectiveIsl * 0.5)})
            </div>
          </div>
        </ReportCard>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <KpiPill
            label="Claimant Count"
            value={summary.count}
            definition="Number of claimants meeting the threshold criteria"
          />
          <KpiPill
            label="Total Paid"
            value={summary.totalPaid}
            formatCurrency
            definition="Total claims paid for all high-cost claimants"
          />
          <KpiPill
            label="Employer Share"
            value={summary.employerShare}
            formatCurrency
            status="positive"
            definition="Amount paid by employer up to the specific deductible"
          />
          <KpiPill
            label="Stop-Loss Share"
            value={summary.stopLossShare}
            formatCurrency
            definition="Amount reimbursed by stop-loss carrier"
          />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <ReportCard title="Top 10 Claimants: Employer vs Stop-Loss Split">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="claimant" 
                  stroke="#6B7280" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>}
                />
                <ReferenceLine 
                  y={islThreshold} 
                  stroke="#FF8400" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: 'ISL Threshold', 
                    position: 'right', 
                    fill: '#FF8400',
                    fontSize: 11 
                  }} 
                />
                <Bar dataKey="employer" stackId="a" fill="#00263E" name="Employer Share" radius={[0, 0, 0, 0]} />
                <Bar dataKey="stopLoss" stackId="a" fill="#003A5C" name="Stop-Loss Share" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportCard>
        )}

        {/* Claimants Table */}
        <ReportCard 
          title="Claimant Details" 
          action={
            <span className="text-sm text-text-muted">
              {claimants.length} claimants
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gallagher-blue">
                  <th className="px-4 py-3 text-text-secondary font-semibold">Claimant ID</th>
                  <th className="px-4 py-3 text-text-secondary font-semibold">Plan</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Total Paid</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Employer</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Stop-Loss</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">% of ISL</th>
                  <th className="px-4 py-3 text-text-secondary font-semibold">Status</th>
                  <th className="px-4 py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claimants.map((claimant: any, index: number) => (
                  <tr 
                    key={claimant.claimantKey} 
                    className={`border-b border-border hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? '' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-text-primary">
                      {claimant.claimantKey}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{claimant.planName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">
                      {formatCurrency(claimant.totalPaid)}
                    </td>
                    <td className="px-4 py-3 text-right text-gallagher-blue">
                      {formatCurrency(claimant.employerShare)}
                    </td>
                    <td className="px-4 py-3 text-right text-gallagher-blue-light">
                      {formatCurrency(claimant.stopLossShare)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        claimant.percentOfIsl >= 100 ? 'text-gallagher-orange' : 'text-text-primary'
                      }`}>
                        {claimant.percentOfIsl.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColors[claimant.status as keyof typeof statusColors] ||
                          statusColors.OPEN
                        }`}
                      >
                        {claimant.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={claimant.status}
                        onChange={(e) => handleStatusUpdate(claimant.claimantKey, e.target.value)}
                        className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-gallagher-blue"
                      >
                        <option value="OPEN">Open</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {claimants.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <svg className="w-12 h-12 mx-auto mb-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No claimants meet the current threshold criteria</p>
            </div>
          )}
        </ReportCard>
      </div>
    </ErrorBoundary>
  )
}
