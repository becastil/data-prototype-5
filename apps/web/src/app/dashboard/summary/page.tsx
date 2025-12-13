'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  KpiPill,
  Button,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'
import { useDashboard } from '@/context/DashboardContext'

export default function SummaryPage() {
  const { clientId, planYearId, dateRange } = useDashboard()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'ytd' | 'last12' | 'custom'>('ytd')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clientId, 
            planYearId,
            // Pass viewMode logic if needed or dateRange
          }),
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
  }, [clientId, planYearId, viewMode, dateRange])

  const handleExport = () => {
    window.open(
      `/api/summary/export?clientId=${clientId}&planYearId=${planYearId}&format=csv`,
      '_blank'
    )
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <SkeletonLoader variant="metric" className="h-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" className="h-24" />
          ))}
        </div>
        <SkeletonLoader variant="card" className="h-96" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <div className="text-accent-orange mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Unable to load data</h3>
        <p className="text-text-muted">{error || 'No data available'}</p>
      </div>
    )
  }

  const { cumulative, kpis } = data

  const formatValue = (value: number, format?: 'currency' | 'number' | 'percent') => {
    if (value === undefined || value === null) return '—'
    
    if (format === 'percent') {
       return `${value.toFixed(1)}%`
    }
    
    if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(value)
    }

    // Default to currency
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
        return 'border-l-4 border-accent-orange-light'
      case 'total':
        return 'bg-gray-50 font-semibold'
      case 'variance-positive':
        return 'text-primary-blue font-semibold'
      case 'variance-negative':
        return 'text-accent-orange font-semibold'
      default:
        return 'border-l-4 border-transparent'
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Costs by Component</h1>
            <p className="mt-1 text-text-muted">
              Detailed claims & expenses breakdown
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'ytd', label: 'YTD' },
                { key: 'last12', label: 'Last 12 Mo' },
                { key: 'custom', label: 'Custom' },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key as any)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode.key
                      ? 'bg-primary-blue text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiPill
              label="Monthly C&E"
              value={kpis.monthlyCE}
              formatCurrency={true}
              definition="Total claims & expenses for the current month"
            />
            <KpiPill
              label="PEPM Actual"
              value={kpis.pepmActual}
              formatCurrency={true}
              definition="Per Employee Per Month actual cost"
            />
            <KpiPill
              label="Budget Variance"
              value={kpis.budgetVariance}
              formatCurrency={true}
              status={kpis.budgetVariance < 0 ? 'positive' : 'warning'}
              definition="Difference between actual and budgeted costs"
            />
            <KpiPill
              label="Cumulative C&E"
              value={kpis.cumulativeCE}
              formatCurrency={true}
              definition="Year-to-date total claims & expenses"
            />
          </div>
        )}

        {/* C&E Statement Table */}
        <ReportCard 
          title="C&E Statement" 
          action={
            <span className="text-sm text-text-muted">
              28-row format
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-primary-blue">
                  <th className="px-4 py-3 text-text-secondary font-semibold">Item</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Monthly</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {cumulative && cumulative.map((row: any, index: number) => {
                  if (row.rowType === 'HEADER') {
                    return (
                      <tr key={index} className="section-header">
                        <td
                          colSpan={3}
                          className="px-4 py-2 font-semibold text-primary-blue"
                        >
                          {row.itemName}
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={index}
                      className={`table-row hover:bg-gray-50 transition-colors ${getRowColor(row.colorCode)}`}
                    >
                      <td className="px-4 py-2.5 text-text-primary">
                        {row.itemName}
                        {row.isUserEditable && (
                          <span className="ml-2 text-xs text-accent-orange" title="Editable">✎</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-text-primary font-mono">
                        {formatValue(row.monthlyValue, row.format)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-text-primary font-mono">
                        {formatValue(row.cumulativeValue, row.format)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-text-secondary mb-2">Legend</p>
            <div className="flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="text-accent-orange">✎</span> User-editable field
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-orange-light"></span> Adjustments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-blue-lighter"></span> Totals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-blue-lighter border border-primary-blue"></span> Favorable
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-orange-light border border-accent-orange"></span> Unfavorable
              </span>
            </div>
          </div>
        </ReportCard>
      </div>
    </ErrorBoundary>
  )
}
