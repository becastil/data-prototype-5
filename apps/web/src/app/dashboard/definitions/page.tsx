'use client'

import { ReportCard } from '@medical-reporting/ui'

interface Definition {
  term: string
  definition: string
  formula?: string
  category: 'metrics' | 'components' | 'calculations' | 'general'
}

const definitions: Definition[] = [
  // Metrics
  {
    term: 'Total Plan Cost',
    definition: 'The sum of all claims paid (medical + pharmacy), fixed costs, and administrative fees for the specified period.',
    formula: 'Medical Claims + Pharmacy Claims + Fixed Costs + Admin Fees',
    category: 'metrics',
  },
  {
    term: 'Loss Ratio',
    definition: 'The percentage of premium dollars spent on claims. A lower loss ratio indicates better plan performance.',
    formula: 'Total Claims Paid ÷ Total Premium Collected × 100',
    category: 'metrics',
  },
  {
    term: 'PMPM (Per Member Per Month)',
    definition: 'Average monthly cost per enrolled member. Used for benchmarking and trend analysis.',
    formula: 'Total Cost ÷ (Total Members × Number of Months)',
    category: 'metrics',
  },
  {
    term: 'PEPM (Per Employee Per Month)',
    definition: 'Average monthly cost per employee (subscriber). Similar to PMPM but counts employees rather than all covered members.',
    formula: 'Total Cost ÷ (Total Employees × Number of Months)',
    category: 'metrics',
  },
  {
    term: 'Variance',
    definition: 'The difference between actual costs and budgeted costs. Negative variance indicates under-budget performance; positive indicates over-budget.',
    formula: 'Actual Cost - Budgeted Cost',
    category: 'metrics',
  },
  
  // Components
  {
    term: 'Fixed Costs',
    definition: 'Plan expenses that remain constant regardless of claims volume. Includes administrative fees, stop-loss premiums, PBM fees, and other contracted services.',
    category: 'components',
  },
  {
    term: 'Medical Claims',
    definition: 'All healthcare claims paid for professional services, hospital stays, outpatient procedures, lab work, and other medical services. Excludes pharmacy.',
    category: 'components',
  },
  {
    term: 'Pharmacy Claims',
    definition: 'All prescription drug claims paid, including retail, mail-order, and specialty pharmacy.',
    category: 'components',
  },
  {
    term: 'High-Cost Claimants (HCC)',
    definition: 'Members whose total claims exceed a specified threshold, typically the individual stop-loss (ISL) specific deductible. These claims drive a disproportionate share of total plan costs.',
    category: 'components',
  },
  
  // Calculations
  {
    term: 'Individual Stop-Loss (ISL)',
    definition: 'Insurance that reimburses the plan when any individual claimant\'s claims exceed a specified attachment point (specific deductible).',
    category: 'calculations',
  },
  {
    term: 'Aggregate Stop-Loss (ASL)',
    definition: 'Insurance that reimburses the plan when total claims exceed a specified percentage of expected claims (aggregate attachment point).',
    category: 'calculations',
  },
  {
    term: 'Specific Deductible',
    definition: 'The dollar threshold above which individual stop-loss coverage begins. Claims below this amount are the employer\'s responsibility.',
    category: 'calculations',
  },
  {
    term: 'Net Paid Claims',
    definition: 'Total claims paid minus any stop-loss reimbursements received.',
    formula: 'Gross Claims - Stop-Loss Reimbursements',
    category: 'calculations',
  },
  
  // General
  {
    term: 'Plan Year',
    definition: 'The 12-month period for which the benefit plan is designed and budgeted. May differ from the calendar year.',
    category: 'general',
  },
  {
    term: 'YTD (Year-to-Date)',
    definition: 'Cumulative totals from the start of the plan year through the current reporting period.',
    category: 'general',
  },
  {
    term: 'Budget',
    definition: 'The projected costs for the plan year, typically established during the annual renewal process based on prior experience and anticipated changes.',
    category: 'general',
  },
  {
    term: 'Incurred But Not Reported (IBNR)',
    definition: 'An estimate of claims that have been incurred but not yet submitted or processed. Used to project complete plan costs.',
    category: 'general',
  },
]

const categories = [
  { id: 'metrics', label: 'Key Metrics', description: 'Primary measurements used to evaluate plan performance' },
  { id: 'components', label: 'Cost Components', description: 'Categories of expenses that make up total plan cost' },
  { id: 'calculations', label: 'Calculations & Insurance', description: 'Terms related to stop-loss and financial calculations' },
  { id: 'general', label: 'General Terms', description: 'Common terminology used throughout the dashboard' },
]

export default function DefinitionsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Definitions & Assumptions</h1>
        <p className="text-text-muted mt-1">
          Reference guide for metrics, calculations, and terminology used in this dashboard
        </p>
      </div>

      {/* Assumptions Card */}
      <ReportCard title="Data Assumptions">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Data Sources</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Claims data from third-party administrator (TPA)</li>
                <li>• Enrollment data from benefits administration system</li>
                <li>• Budget figures from approved 2025 plan year</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Processing Notes</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Claims reflect paid date, not incurred date</li>
                <li>• IBNR estimates are not included in displayed figures</li>
                <li>• All amounts in USD unless otherwise noted</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-muted">
              Data is typically updated within 2-3 business days of month-end close. 
              Check the "Data as of" indicator in the header for the most recent update date.
            </p>
          </div>
        </div>
      </ReportCard>

      {/* Definitions by Category */}
      {categories.map((category) => (
        <ReportCard key={category.id} title={category.label}>
          <p className="text-sm text-text-muted mb-6">{category.description}</p>
          <dl className="space-y-6">
            {definitions
              .filter((def) => def.category === category.id)
              .map((def) => (
                <div key={def.term} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <dt className="text-base font-semibold text-gallagher-blue mb-2">
                    {def.term}
                  </dt>
                  <dd className="text-sm text-text-secondary leading-relaxed">
                    {def.definition}
                  </dd>
                  {def.formula && (
                    <dd className="mt-2">
                      <code className="text-xs font-mono bg-gallagher-blue-lighter text-gallagher-blue px-2 py-1 rounded">
                        {def.formula}
                      </code>
                    </dd>
                  )}
                </div>
              ))}
          </dl>
        </ReportCard>
      ))}

      {/* Contact Section */}
      <ReportCard>
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Need Help?</h3>
          <p className="text-sm text-text-muted mb-4">
            If you have questions about the data or calculations, contact your Gallagher account team.
          </p>
          <a
            href="mailto:support@ajg.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-gallagher-blue hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@ajg.com
          </a>
        </div>
      </ReportCard>
    </div>
  )
}










