'use client'

import { ReportCard } from '@medical-reporting/ui'

export default function HelpPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">How to Use This Dashboard</h1>
        <p className="text-text-muted mt-1">
          A guide to navigating and interpreting your health plan data
        </p>
      </div>

      {/* Navigating the Dashboard */}
      <ReportCard title="Navigating the Dashboard">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            The dashboard is organized into several key sections, accessible from the top navigation bar:
          </p>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="font-semibold text-gallagher-blue w-32 shrink-0">Dashboard</span>
              <span>The main overview showing high-level KPIs, cost trends, and key alerts. Start here for a quick pulse check on plan performance.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gallagher-blue w-32 shrink-0">Costs by Component</span>
              <span>Detailed breakdown of medical and pharmacy spend. Use this to drill down into specific cost drivers like outpatient services or specialty drugs.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gallagher-blue w-32 shrink-0">High-Cost Claimants</span>
              <span>Analysis of members exceeding the specific deductible. Tracks impact on stop-loss reimbursements and overall risk.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gallagher-blue w-32 shrink-0">Upload Data</span>
              <span>Administrative area for updating monthly claims and enrollment figures.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gallagher-blue w-32 shrink-0">Definitions</span>
              <span>Glossary of terms and formulas used throughout the reports.</span>
            </li>
          </ul>
        </div>
      </ReportCard>

      {/* Using Filters */}
      <ReportCard title="Using Filters">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            The filter bar at the top of the page allows you to customize the data displayed across all reports:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background p-4 rounded-lg border border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-2">Time Period</h4>
              <p className="text-xs text-text-muted">
                Select the reporting timeframe (e.g., "Year to Date" or "Last 12 Months"). All charts will automatically update to reflect the chosen period.
              </p>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-2">Plan Selection</h4>
              <p className="text-xs text-text-muted">
                Filter data by specific plan designs (e.g., HDHP vs. PPO) or view "All Plans" for an aggregate view of the entire population.
              </p>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-2">Benchmarks</h4>
              <p className="text-xs text-text-muted">
                Compare current performance against "Budget", "Prior Year", or both. This adds reference lines or comparison bars to the charts.
              </p>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* Understanding Reports */}
      <ReportCard title="Understanding Reports">
        <div className="space-y-4 text-sm text-text-secondary">
          <p>
            Most charts in this dashboard are interactive. Here are some tips for getting the most out of them:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Hover for Details:</strong> Hovering over any bar or line point will reveal a tooltip with exact figures and percentage changes.
            </li>
            <li>
              <strong>Trend Analysis:</strong> Look for the red/green indicators. Green typically indicates favorable performance (e.g., costs below budget), while red indicates areas needing attention.
            </li>
            <li>
              <strong>Exporting:</strong> Use the "Export" button in the top right to generate a PDF summary of the current view for presentations or offline review.
            </li>
          </ul>
        </div>
      </ReportCard>

      {/* Contact Support */}
      <ReportCard>
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Still have questions?</h3>
          <p className="text-sm text-text-muted mb-4">
            Reach out to the support team for assistance with data discrepancies or technical issues.
          </p>
          <a
            href="mailto:support@ajg.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-gallagher-blue hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </ReportCard>
    </div>
  )
}

