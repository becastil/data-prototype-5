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
    setPlanYearId,
    resetFilters,
  } = useDashboard()

  const [dataAsOf, setDataAsOf] = useState<string>('')
  const [currentYear, setCurrentYear] = useState<number>(2025)
  const [plans, setPlans] = useState<{ value: string; label: string }[]>([])
  const [planYears, setPlanYears] = useState<{ value: string; label: string }[]>([])

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

    async function fetchPlanYears() {
      if (!clientId) return
      try {
        const res = await fetch(`/api/plan-years?clientId=${clientId}`)
        if (!res.ok) return
        const data = await res.json()
        const options = (Array.isArray(data) ? data : []).map((py: any) => {
          const start = py.yearStart ? new Date(py.yearStart) : null
          const end = py.yearEnd ? new Date(py.yearEnd) : null
          const label =
            start && end
              ? `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              : py.id
          return { value: py.id, label }
        })
        setPlanYears(options)
      } catch (e) {
        console.error('Failed to fetch plan years', e)
      }
    }
    fetchPlans()
    fetchPlanYears()
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
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const downloadResponse = async (response: Response, downloadName: string) => {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleExportPdf = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportMenuOpen(false)

    try {
      const stamp = new Date().toISOString().split('T')[0]
      const downloadName = `benefits-dashboard-${stamp}.pdf`
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 90_000)
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          clientId,
          planYearId,
          pages: [
            '/dashboard/print', // Spreadsheet-style C&E table
          ],
          filename: downloadName,
        }),
      }).finally(() => {
        window.clearTimeout(timeoutId)
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

      await downloadResponse(response, downloadName)
    } catch (error) {
      console.error('PDF Export failed:', error)
      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('PDF export timed out. Please try again.')
      } else {
        alert(`Failed to generate PDF report: ${error instanceof Error ? error.message : String(error)}`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXlsx = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportMenuOpen(false)

    try {
      const stamp = new Date().toISOString().split('T')[0]
      const downloadName = `benefits-dashboard-${stamp}.xlsx`
      const response = await fetch('/api/export/xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          planYearId,
          filename: downloadName,
        }),
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

      await downloadResponse(response, downloadName)
    } catch (error) {
      console.error('XLSX Export failed:', error)
      alert(`Failed to generate Excel report: ${error instanceof Error ? error.message : String(error)}`)
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
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={isExporting}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-blue hover:bg-primary-blue-lighter rounded-lg transition-colors ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isExporting ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {exportMenuOpen && !isExporting && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                <button
                  onClick={handleExportPdf}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleExportXlsx}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        planYearId={planYearId}
        onPlanYearChange={setPlanYearId}
        planYears={planYears}
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
              <span>© {currentYear} All rights reserved</span>
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
