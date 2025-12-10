'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReportCard,
  Button,
  SkeletonLoader,
  ErrorBoundary,
  EmptyStatePlaceholder,
} from '@medical-reporting/ui'

export default function FeesPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'admin' | 'adjustments' | 'settings'>('admin')

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'
  const planYearId = 'demo-plan-year-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/fees?clientId=${clientId}&planYearId=${planYearId}`
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

  if (data.hasData === false) {
    return (
      <EmptyStatePlaceholder
        title="No Fees Data"
        message="No admin fees or adjustments found. Please upload monthly statistics or configuration inputs."
        onAction={() => router.push('/dashboard/upload')}
      />
    )
  }

  const tabs = [
    { id: 'admin', label: 'Admin Fees' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'settings', label: 'Settings' },
  ] as const

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Fees Manager</h1>
        <p className="mt-2 text-slate-400">
          Configure admin fees and C&E adjustments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-emerald-500 text-emerald-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Admin Fees Tab */}
      {activeTab === 'admin' && (
        <ReportCard title="Admin Fee Components">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-slate-300">Label</th>
                  <th className="px-4 py-3 text-slate-300">Type</th>
                  <th className="px-4 py-3 text-slate-300">Amount</th>
                  <th className="px-4 py-3 text-slate-300">Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {data.adminFees && data.adminFees.map((fee: any) => (
                  <tr key={fee.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-slate-100">{fee.label}</td>
                    <td className="px-4 py-3 text-slate-100">{fee.feeType}</td>
                    <td className="px-4 py-3 text-slate-100">
                      ${fee.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(fee.effectiveDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totals && (
            <div className="mt-4 flex justify-end text-sm">
              <div className="rounded-lg bg-slate-800/50 px-4 py-2">
                <span className="text-slate-400">Total PEPM: </span>
                <span className="font-semibold text-slate-100">
                  ${data.totals.pepmFees.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </ReportCard>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="space-y-6">
          <ReportCard title="Adjustment (#6)">
            <div className="text-sm text-slate-400">
              <p>User-configurable adjustment for C&E row #6</p>
              <p className="mt-2">Recent adjustments:</p>
              {data.adjustments[6]?.slice(0, 3).map((adj: any) => (
                <div key={adj.id} className="mt-2 flex justify-between">
                  <span>{adj.monthDate}</span>
                  <span className="font-semibold">${adj.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard title="Rx Rebates (#9)">
            <div className="text-sm text-slate-400">
              <p>Rx rebates adjustment for C&E row #9</p>
              <p className="mt-2">Recent adjustments:</p>
              {data.adjustments[9]?.slice(0, 3).map((adj: any) => (
                <div key={adj.id} className="mt-2 flex justify-between">
                  <span>{adj.monthDate}</span>
                  <span className="font-semibold">${adj.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard title="Stop Loss Reimbursements (#11)">
            <div className="text-sm text-slate-400">
              <p>Stop loss reimbursements adjustment for C&E row #11</p>
              <p className="mt-2">Recent adjustments:</p>
              {data.adjustments[11]?.slice(0, 3).map((adj: any) => (
                <div key={adj.id} className="mt-2 flex justify-between">
                  <span>{adj.monthDate}</span>
                  <span className="font-semibold">${adj.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ReportCard>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ReportCard title="Fee Calculation Documentation">
          <div className="space-y-4 text-sm text-slate-400">
            <div>
              <h3 className="font-semibold text-slate-200">Fee Types</h3>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li><strong>PEPM</strong> - Per Employee Per Month</li>
                <li><strong>PMPM</strong> - Per Member Per Month</li>
                <li><strong>FLAT</strong> - Flat monthly fee</li>
                <li><strong>PERCENT_OF_CLAIMS</strong> - Percentage of total claims</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">C&E Integration</h3>
              <p className="mt-2">
                Admin fees are automatically included in the C&E statement calculation.
                User adjustments (#6, #9, #11) can be configured independently for
                custom monthly values.
              </p>
            </div>
          </div>
        </ReportCard>
      )}
      </div>
    </ErrorBoundary>
  )
}

