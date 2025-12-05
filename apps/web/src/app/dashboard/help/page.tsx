'use client'

import { ReportCard } from '@medical-reporting/ui'

export default function HelpPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">User Guide & Documentation</h1>
        <p className="text-text-muted mt-2 text-lg">
          Comprehensive instructions for navigating, interpreting, and managing your health plan dashboard.
        </p>
      </div>

      {/* 1. Global Navigation & Controls */}
      <ReportCard title="1. Global Navigation & Controls">
        <div className="space-y-6">
          <p className="text-sm text-text-secondary">
            The top section of the application stays consistent across all pages, providing primary navigation and global data filters.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-gallagher-blue mb-3 border-b border-border pb-2">Top Navigation Bar</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">Dashboard</span>
                  <span>Click to return to the main Executive Summary view. This is your landing page showing high-level KPIs.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">Costs by Component</span>
                  <span>Access the detailed Claims & Expenses (C&E) Statement. Use this for line-item analysis of medical and pharmacy spend.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">High-Cost Claimants</span>
                  <span>View and manage individual high-risk members. Includes stop-loss analysis and status tracking.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">Upload Data</span>
                  <span><strong>(Admin Only)</strong> Interface for importing monthly claims data, claimant lists, and plan inputs via CSV/XLSX.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">Definitions</span>
                  <span>A glossary of insurance terms and calculation formulas used throughout the application.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[140px]">Export Button</span>
                  <span>Located in the top right. Click to generate and download a PDF report of the current view. Ideally used for printing or offline presentations.</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gallagher-blue mb-3 border-b border-border pb-2">Filter Bar Controls</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[120px]">Period Selector</span>
                  <div className="space-y-1">
                    <p>Controls the timeframe for all charts and tables.</p>
                    <ul className="list-disc pl-4 text-xs text-text-muted">
                      <li><strong>Year to Date:</strong> From start of plan year to current month.</li>
                      <li><strong>Last 12 Months:</strong> Rolling 12-month window.</li>
                      <li><strong>Current Plan Year:</strong> Full plan year projection.</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[120px]">Plan Selector</span>
                  <span>Toggle between "All Plans" (consolidated view) or specific plans like "Medical – HDHP" or "Medical – PPO Base" to isolate performance.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-semibold min-w-[120px]">Benchmark</span>
                  <span>Choose your comparison baseline: "Vs Budget", "Vs Prior Year", or "Vs Both". This updates trend lines and variance calculations.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* 2. Executive Dashboard */}
      <ReportCard title="2. Executive Dashboard Guide">
        <div className="space-y-6 text-sm text-text-secondary">
          <p>
            The Dashboard gives an "at-a-glance" view of plan health. Here is how to interpret each section:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-border">
              <h4 className="font-bold text-gallagher-blue mb-2">Hero Metrics (Top Row)</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Total Plan Cost:</strong> The absolute sum of all paid claims and fixed costs.</li>
                <li><strong>Budgeted Cost:</strong> Your expected spend based on the annual plan.</li>
                <li><strong>Variance:</strong> The difference between Actual and Budget. <span className="text-green-600 font-medium">Green</span> indicates under budget (good), <span className="text-red-600 font-medium">Red</span> indicates over budget (warning).</li>
                <li><strong>Loss Ratio:</strong> Claims / Premium. A ratio above 100% means the plan is spending more on claims than it collects in premiums.</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-border">
              <h4 className="font-bold text-gallagher-blue mb-2">Trend Chart & Interactions</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Hover:</strong> Move your mouse over any data point on the line chart to see the exact dollar amount for that month.</li>
                <li><strong>Legend:</strong> Click on items in the legend (e.g., "Budget") to toggle them on/off in the chart view.</li>
                <li><strong>Alert Threshold:</strong> The dashed red line represents a critical spending limit. Consistently crossing this line may trigger alerts.</li>
              </ul>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* 3. Detailed Cost Analysis */}
      <ReportCard title="3. Detailed Cost Analysis (C&E Statement)">
        <div className="space-y-6 text-sm text-text-secondary">
          <p>
            Navigate to <strong>Costs by Component</strong> for a granular financial statement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-text-primary mb-2">View Options</h4>
              <p className="mb-2">Use the toggle buttons in the top right of the page:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>YTD:</strong> Shows cumulative totals for the year.</li>
                <li><strong>Last 12 Mo:</strong> Shows a rolling 12-month view.</li>
                <li><strong>Custom:</strong> Allows for specific date range selection (if enabled).</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-2">Reading the Table</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Rows:</strong> Breakdown of Fixed Costs, Medical Claims, Pharmacy Claims, and Adjustments.</li>
                <li><strong>Columns:</strong> "Monthly" shows the most recent closed month. "Cumulative" shows the total for the selected period.</li>
                <li><strong>Color Codes:</strong> <span className="bg-gallagher-orange-light px-1 rounded">Orange tint</span> indicates an adjustment row. <span className="bg-gray-100 px-1 rounded">Grey background</span> indicates a subtotal or total row.</li>
              </ul>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* 4. High-Cost Claimants (HCC) */}
      <ReportCard title="4. Managing High-Cost Claimants">
        <div className="space-y-6 text-sm text-text-secondary">
          <p>
            The HCC page helps track members exceeding the specific deductible.
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-gallagher-blue pl-4 py-1">
              <h4 className="font-bold text-text-primary">Step 1: Adjust the Threshold</h4>
              <p className="mt-1">
                Use the <strong>ISL Threshold Slider</strong> at the top of the page to filter the claimant list. 
                Moving the slider updates both the chart and the table below. It defaults to your plan's specific deductible (e.g., $200k).
              </p>
            </div>

            <div className="border-l-4 border-gallagher-blue pl-4 py-1">
              <h4 className="font-bold text-text-primary">Step 2: Analyze the Split</h4>
              <p className="mt-1">
                The <strong>Bar Chart</strong> visualizes the cost split.
                The <span className="text-gallagher-blue font-bold">Dark Blue</span> portion is the Employer Share (your liability).
                The <span className="text-gallagher-blue-light font-bold">Light Blue</span> portion is the Stop-Loss Share (reimbursable amount).
              </p>
            </div>

            <div className="border-l-4 border-gallagher-blue pl-4 py-1">
              <h4 className="font-bold text-text-primary">Step 3: Manage Status</h4>
              <p className="mt-1">
                In the <strong>Claimant Details Table</strong>, locate the "Status" column.
                Click the dropdown menu to change a claimant's status:
              </p>
              <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                <li><strong>Open:</strong> New case, monitoring active.</li>
                <li><strong>Under Review:</strong> Case management is investigating.</li>
                <li><strong>Resolved:</strong> Case closed or claimant no longer active.</li>
              </ul>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* 5. Data Upload Wizard */}
      <ReportCard title="5. Data Upload Wizard (Admin)">
        <div className="space-y-6 text-sm text-text-secondary">
          <p>
            Use the <strong>Upload Data</strong> page to update the dashboard. This is a strict 3-step process to ensure data integrity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background p-4 rounded border border-border">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Step 1</span>
              <h4 className="font-bold text-gallagher-blue mb-2">Select File</h4>
              <p className="text-xs mb-2">Choose the data type (Monthly, HCC, or Inputs).</p>
              <p className="text-xs text-gallagher-orange font-medium">
                Important: Always download the latest template before uploading to ensure column headers match.
              </p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Step 2</span>
              <h4 className="font-bold text-gallagher-blue mb-2">Validate</h4>
              <p className="text-xs">
                Click "Validate". The system checks for date formats, required columns, and logical consistency. Errors will be displayed in red.
              </p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Step 3</span>
              <h4 className="font-bold text-gallagher-blue mb-2">Confirm</h4>
              <p className="text-xs">
                Review the preview table. Check that the "Detected Months" and "Rows" count match your expectations. Click "Confirm Import" to commit the data.
              </p>
            </div>
          </div>
        </div>
      </ReportCard>
      
      {/* Support Footer */}
      <ReportCard>
        <div className="text-center py-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Need Technical Assistance?</h3>
          <p className="text-sm text-text-muted mb-4 max-w-lg mx-auto">
            If you encounter system errors, data discrepancies, or need access to additional plan years, please contact the Gallagher Analytics Support Team.
          </p>
          <a
            href="mailto:support@ajg.com"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gallagher-blue text-white text-sm font-medium rounded-lg hover:bg-gallagher-blue-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Support
          </a>
        </div>
      </ReportCard>
    </div>
  )
}
