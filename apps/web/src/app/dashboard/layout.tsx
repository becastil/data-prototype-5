'use client'

import React, { useEffect, useState } from 'react'
import { TopNav, FilterBar } from '@medical-reporting/ui'
import { DashboardProvider, useDashboard } from '@/context/DashboardContext'

function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    dateRange,
    setDateRange,
    plan,
    setPlan,
    benchmark,
    setBenchmark,
    clientId,
    planYearId,
    resetFilters,
  } = useDashboard()

  const [dataAsOf, setDataAsOf] = useState<string>('')
  const [currentYear, setCurrentYear] = useState<number>(2025)
  const [plans, setPlans] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    setDataAsOf(new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }))
    setCurrentYear(new Date().getFullYear())

    async function fetchPlans() {
      if (!clientId) return
      try {
        const res = await fetch(`/api/plans?clientId=${clientId}`)
        if (res.ok) {
          const data = await res.json()
          setPlans(data.map((p: any) => ({ value: p.id, label: p.name })))
        }
      } catch (e) {
        console.error('Failed to fetch plans', e)
      }
    }
    fetchPlans()
  }, [clientId])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/summary', label: 'Costs by Component' },
    { href: '/dashboard/hcc', label: 'High-Cost Claimants' },
    { href: '/dashboard/upload', label: 'Upload Data' },
    { href: '/dashboard/definitions', label: 'Definitions' },
    { href: '/dashboard/settings', label: 'Settings' },
    { href: '/dashboard/help', label: 'Help' },
  ]

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          planYearId,
          pages: [
            '/dashboard/print', // Spreadsheet-style C&E table
          ],
          filename: `benefits-dashboard-${new Date().toISOString().split('T')[0]}.pdf`
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || 'Export failed')
        } catch (e) {
           throw new Error(`Export failed: ${response.status} - ${errorText}`)
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `benefits-dashboard-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF Export failed:', error)
      alert(`Failed to generate PDF report: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNav
        items={navItems}
        rightContent={
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gallagher-blue hover:bg-gallagher-blue-lighter rounded-lg transition-colors ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExporting ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        plan={plan}
        onPlanChange={setPlan}
        plans={plans}
        benchmark={benchmark}
        onBenchmarkChange={setBenchmark}
        dataAsOf={dataAsOf}
        onReset={resetFilters}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-4">
              <span>© {currentYear} Arthur J. Gallagher & Co.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">All amounts in thousands unless otherwise noted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Data updated:</span>
              <span className="text-xs font-medium text-text-secondary">{dataAsOf}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  )
}
