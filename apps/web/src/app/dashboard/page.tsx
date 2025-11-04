'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KpiPill, ReportCard, Button, SkeletonLoader, ErrorBoundary } from '@medical-reporting/ui'

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<any>(null)
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
        setKpiData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, planYearId])

  // Calculate KPIs from API data
  const kpis = kpiData
    ? [
        {
          label: '% of Budget',
          value: kpiData.ytd.percentOfBudget,
          formatCurrency: false,
        },
        {
          label: 'Total Cost',
          value: kpiData.ytd.totalCost,
          formatCurrency: true,
        },
        {
          label: 'Surplus',
          value: kpiData.ytd.surplus,
          formatCurrency: true,
        },
        {
          label: 'PEPM',
          value: kpiData.ytd.totalCost / (kpiData.ytd.totalSubscribers || 1) / 12,
          formatCurrency: true,
        },
      ]
    : [
        { label: '% of Budget', value: 0, formatCurrency: false },
        { label: 'Total Cost', value: 0, formatCurrency: true },
        { label: 'Surplus', value: 0, formatCurrency: true },
        { label: 'PEPM', value: 0, formatCurrency: true },
      ]

  const reportCards = [
    {
      title: 'Executive Summary',
      description: 'YTD metrics, fuel gauge, and plan mix analysis',
      href: '/dashboard/executive',
    },
    {
      title: 'Monthly Detail',
      description: 'A-N columns with PEPM trends (rolling 24 months)',
      href: '/dashboard/monthly',
    },
    {
      title: 'High-Cost Claimants',
      description: 'ISL-based filtering with employer vs stop loss analysis',
      href: '/dashboard/hcc',
    },
  ]

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard Overview</h1>
          <p className="mt-2 text-slate-400">
            Welcome to the Medical Reporting Platform
          </p>
        </div>

        {/* KPI Row */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-red-400">
            Error: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiPill
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                formatCurrency={kpi.formatCurrency}
              />
            ))}
          </div>
        )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <ReportCard key={card.href} title={card.title}>
            <p className="mb-4 text-sm text-slate-400">{card.description}</p>
            <Link href={card.href}>
              <Button variant="secondary">View Report</Button>
            </Link>
          </ReportCard>
        ))}
      </div>
      </div>
    </ErrorBoundary>
  )
}
