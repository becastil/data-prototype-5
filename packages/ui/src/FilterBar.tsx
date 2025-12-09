import * as React from 'react'

export interface FilterBarProps {
  dateRange: string
  onDateRangeChange: (value: string) => void
  plan?: string
  onPlanChange?: (value: string) => void
  plans?: { value: string; label: string }[]
  benchmark: string
  onBenchmarkChange: (value: string) => void
  dataAsOf?: string
  onExport?: () => void
  onReset?: () => void
}

export function FilterBar({
  dateRange,
  onDateRangeChange,
  plan,
  onPlanChange,
  plans = [],
  benchmark,
  onBenchmarkChange,
  dataAsOf,
  onExport,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side: Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label htmlFor="dateRange" className="sr-only">
                Period
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className="filter-select"
                aria-label="Select Period"
              >
                <option value="ytd">Year to Date</option>
                <option value="last12">Last 12 Months</option>
                <option value="planYear">Current Plan Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Plan Selector */}
            {plans.length > 0 && onPlanChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="plan" className="sr-only">
                  Plan
                </label>
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => onPlanChange(e.target.value)}
                  className="filter-select"
                  aria-label="Select Plan"
                >
                  <option value="all">All Plans</option>
                  {plans.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Benchmark Toggle */}
            <div className="flex items-center gap-2">
              <label htmlFor="benchmark" className="sr-only">
                Compare to
              </label>
              <select
                id="benchmark"
                value={benchmark}
                onChange={(e) => onBenchmarkChange(e.target.value)}
                className="filter-select"
                aria-label="Select Comparison"
              >
                <option value="budget">Vs Budget</option>
                <option value="priorYear">Vs Prior Year</option>
                <option value="both">Vs Both</option>
              </select>
            </div>

            {/* Reset Button */}
            {onReset && (
              <button
                onClick={onReset}
                className="text-xs text-gallagher-blue hover:text-gallagher-blue-dark underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Right side: Data freshness & Export */}
          <div className="flex items-center gap-4">
            {dataAsOf && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-text-muted">
                  Data as of <span className="font-medium text-text-secondary">{dataAsOf}</span>
                </span>
              </div>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gallagher-blue border border-gallagher-blue rounded-lg hover:bg-gallagher-blue-lighter transition-colors"
              >
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
                Export
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
