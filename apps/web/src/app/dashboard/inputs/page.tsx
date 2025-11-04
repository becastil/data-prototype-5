'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  Button,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'

export default function InputsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/inputs?clientId=${clientId}&planYearId=${planYearId}`
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/inputs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          planYearId,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      alert('Configuration saved successfully')
    } catch (err) {
      alert('Error saving: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-64" />
        <SkeletonLoader variant="card" className="h-96" />
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

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Inputs Configuration</h1>
          <p className="mt-2 text-slate-400">
            Premium equivalents, fees, and plan year settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Premium Equivalents */}
      <ReportCard title="Premium Equivalents">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Plan</th>
                <th className="px-4 py-3 text-slate-300">Tier</th>
                <th className="px-4 py-3 text-slate-300">Amount</th>
                <th className="px-4 py-3 text-slate-300">Effective Date</th>
              </tr>
            </thead>
            <tbody>
              {data.premiumEquivalents && data.premiumEquivalents.map((pe: any) => (
                <tr key={pe.id} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-slate-100">{pe.planName || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-100">{pe.tierName || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-100">
                    ${pe.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(pe.effectiveDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>

      {/* Admin Fee Components */}
      <ReportCard title="Admin Fee Components">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-slate-300">Label</th>
                <th className="px-4 py-3 text-slate-300">Type</th>
                <th className="px-4 py-3 text-slate-300">Amount</th>
                <th className="px-4 py-3 text-slate-300">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.adminFeeComponents && data.adminFeeComponents.map((fee: any) => (
                <tr key={fee.id} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-slate-100">{fee.label}</td>
                  <td className="px-4 py-3 text-slate-100">{fee.feeType}</td>
                  <td className="px-4 py-3 text-slate-100">
                    ${fee.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs ${
                        fee.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {fee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.totals && (
          <div className="mt-4 flex justify-end text-sm">
            <div className="rounded-lg bg-slate-800/50 px-4 py-2">
              <span className="text-slate-400">Total Admin Fees: </span>
              <span className="font-semibold text-slate-100">
                ${data.totals.adminFees.toFixed(2)} PEPM
              </span>
            </div>
          </div>
        )}
      </ReportCard>

      {/* Other Inputs */}
      {data.otherInputs && (
        <ReportCard title="Other Inputs">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Rx Rebate PEPM
              </label>
              <input
                type="number"
                value={data.otherInputs.rxRebatePepm?.value || 0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">IBNR</label>
              <input
                type="number"
                value={data.otherInputs.ibnr?.value || 0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Aggregate Factor
              </label>
              <input
                type="number"
                step="0.01"
                value={data.otherInputs.aggregateFactor?.value || 0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                ASL Fee
              </label>
              <input
                type="number"
                value={data.otherInputs.aslFee?.value || 0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"
                disabled
              />
            </div>
          </div>
        </ReportCard>
      )}
      </div>
    </ErrorBoundary>
  )
}

