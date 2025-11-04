'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  Button,
  SkeletonLoader,
  ErrorBoundary,
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
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-32" />
        <SkeletonLoader variant="chart" className="h-96" />
        <SkeletonLoader variant="table" lines={10} />
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
    OPEN: 'bg-blue-500/20 text-blue-400',
    UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400',
    RESOLVED: 'bg-green-500/20 text-green-400',
  }

  // Prepare chart data for employer vs stop loss
  const chartData = claimants.slice(0, 10).map((c: any) => ({
    claimant: c.claimantKey.substring(0, 8),
    employer: c.employerShare,
    stopLoss: c.stopLossShare,
  }))

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">High-Cost Claimants</h1>
        <p className="mt-2 text-slate-400">ISL-based filtering with employer vs stop loss analysis</p>
      </div>

      {/* ISL Threshold Control */}
      <ReportCard title="ISL Threshold Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300">
              ISL Threshold: {formatCurrency(islThreshold)}
            </label>
            <input
              type="range"
              min="100000"
              max="500000"
              step="10000"
              value={islThreshold}
              onChange={handleThresholdChange}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing claimants ≥50% of ISL threshold ({formatCurrency(effectiveIsl * 0.5)})
          </div>
        </div>
      </ReportCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <ReportCard>
          <div className="text-xs text-slate-400">Count</div>
          <div className="text-2xl font-bold text-slate-100">{summary.count}</div>
        </ReportCard>
        <ReportCard>
          <div className="text-xs text-slate-400">Total Paid</div>
          <div className="text-2xl font-bold text-slate-100">
            {formatCurrency(summary.totalPaid)}
          </div>
        </ReportCard>
        <ReportCard>
          <div className="text-xs text-slate-400">Employer Share</div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.employerShare)}
          </div>
        </ReportCard>
        <ReportCard>
          <div className="text-xs text-slate-400">Stop Loss Share</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatCurrency(summary.stopLossShare)}
          </div>
        </ReportCard>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <ReportCard title="Top 10 Claimants: Employer vs Stop Loss">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="claimant" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }} />
              <Bar dataKey="employer" stackId="a" fill="#10b981" name="Employer" />
              <Bar dataKey="stopLoss" stackId="a" fill="#3b82f6" name="Stop Loss" />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      )}

      {/* Claimants Table */}
      <ReportCard title="Claimants">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Claimant Key</th>
                <th className="px-4 py-3 text-slate-300">Plan</th>
                <th className="px-4 py-3 text-slate-300">Total Paid</th>
                <th className="px-4 py-3 text-slate-300">Employer</th>
                <th className="px-4 py-3 text-slate-300">Stop Loss</th>
                <th className="px-4 py-3 text-slate-300">% of ISL</th>
                <th className="px-4 py-3 text-slate-300">Status</th>
                <th className="px-4 py-3 text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claimants.map((claimant: any) => (
                <tr key={claimant.claimantKey} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-slate-100">{claimant.claimantKey}</td>
                  <td className="px-4 py-3 text-slate-300">{claimant.planName}</td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatCurrency(claimant.totalPaid)}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">
                    {formatCurrency(claimant.employerShare)}
                  </td>
                  <td className="px-4 py-3 text-blue-400">
                    {formatCurrency(claimant.stopLossShare)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {claimant.percentOfIsl.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
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
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
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
      </ReportCard>
      </div>
    </ErrorBoundary>
  )
}
