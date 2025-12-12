'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDashboard } from '@/context/DashboardContext'

/**
 * Print-optimized Claims & Expenses table
 * Displays data in spreadsheet format with months as columns
 */
export default function PrintPage() {
  const searchParams = useSearchParams()
  const { clientId, planYearId } = useDashboard()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isPrintMode = searchParams.get('print') === 'true'

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch monthly data for all months
        const response = await fetch('/api/summary/monthly-grid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, planYearId }),
        })

        if (!response.ok) {
          // Fallback to regular summary API
          const fallbackResponse = await fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, planYearId }),
          })
          if (!fallbackResponse.ok) throw new Error('Failed to fetch data')
          const fallbackData = await fallbackResponse.json()
          setData(transformToGrid(fallbackData))
        } else {
          const json = await response.json()
          setData(json)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, planYearId])

  // Transform standard summary data to grid format
  const transformToGrid = (summaryData: any) => {
    if (!summaryData?.monthlyResults) return null

    const months = summaryData.monthlyResults.map((m: any) => m.month)
    const rows = summaryData.cumulative || []

    // Build grid rows
    const gridRows = rows.map((row: any) => {
      const monthValues: Record<string, number> = {}
      summaryData.monthlyResults.forEach((monthData: any) => {
        const matchingRow = monthData.rows?.find((r: any) => r.itemName === row.itemName)
        if (matchingRow) {
          monthValues[monthData.month] = matchingRow.monthlyValue
        }
      })
      return {
        ...row,
        monthValues,
        planYtd: row.cumulativeValue,
      }
    })

    return {
      months,
      rows: gridRows,
      clientName: 'Henry Mayo Newhall Hospital', // Would come from API
      reportPeriod: `Medical Claims and Expenses March 1, 2025 - February 28, 2026`,
    }
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return ''
    const absValue = Math.abs(value)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absValue)
    return value < 0 ? `(${formatted.replace('$', '$')})` : formatted
  }

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return ''
    return `${value.toFixed(1)}%`
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]}-${year.slice(2)}`
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-gallagher-blue border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-text-muted">Loading report data...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading data: {error || 'No data available'}
      </div>
    )
  }

  const { months = [], rows = [], clientName, reportPeriod } = data

  return (
    <div className={`print-report ${isPrintMode ? 'print-mode' : ''}`}>
      {/* Report Header */}
      <div className="report-header mb-4">
        <h1 className="text-lg font-bold text-gallagher-blue">{clientName || 'Medical Claims Report'}</h1>
        <p className="text-sm text-text-secondary">{reportPeriod || 'Claims and Expenses Report'}</p>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="ce-grid-table w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gallagher-blue text-white">
              <th className="px-2 py-1.5 text-left font-semibold border border-gray-300 sticky left-0 bg-gallagher-blue min-w-[200px]">
                Cost Category
              </th>
              {months.map((month: string) => (
                <th key={month} className="px-2 py-1.5 text-right font-semibold border border-gray-300 min-w-[80px]">
                  {formatMonth(month)}
                </th>
              ))}
              <th className="px-2 py-1.5 text-right font-semibold border border-gray-300 bg-amber-100 text-gallagher-blue min-w-[100px]">
                Plan YTD
              </th>
              <th className="px-2 py-1.5 text-right font-semibold border border-gray-300 bg-amber-100 text-gallagher-blue min-w-[80px]">
                Recycled %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, index: number) => {
              const isHeader = row.rowType === 'HEADER'
              const isTotal = row.rowType === 'TOTAL' || row.colorCode === 'total'
              const isSubtotal = row.itemName?.includes('Total') && !isTotal

              if (isHeader) {
                return (
                  <tr key={index} className="bg-gray-100">
                    <td
                      colSpan={months.length + 3}
                      className="px-2 py-1.5 font-bold text-gallagher-blue border border-gray-300"
                    >
                      {row.itemName}
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={index}
                  className={`
                    ${isTotal ? 'bg-amber-50 font-bold' : ''}
                    ${isSubtotal ? 'bg-gray-50 font-semibold' : ''}
                    ${index % 2 === 0 && !isTotal && !isSubtotal ? 'bg-white' : ''}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className={`px-2 py-1 border border-gray-300 sticky left-0 ${isTotal ? 'bg-amber-50' : isSubtotal ? 'bg-gray-50' : 'bg-white'}`}>
                    {row.indent && <span className="ml-4"></span>}
                    {row.itemName}
                  </td>
                  {months.map((month: string) => (
                    <td key={month} className="px-2 py-1 text-right border border-gray-300 font-mono">
                      {row.format === 'percent'
                        ? formatPercent(row.monthValues?.[month])
                        : formatCurrency(row.monthValues?.[month])}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right border border-gray-300 font-mono bg-amber-50">
                    {row.format === 'percent'
                      ? formatPercent(row.planYtd)
                      : formatCurrency(row.planYtd)}
                  </td>
                  <td className="px-2 py-1 text-right border border-gray-300 font-mono bg-amber-50">
                    {row.recycledPercent ? formatPercent(row.recycledPercent) : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      <div className="mt-4 text-xs text-text-muted space-y-1 footnotes">
        <p><sup>1</sup>Stop Loss Reimbursements and Rx Rebates are reported on a paid basis. Rx Rebates are usually sent 6 months after the end of each quarter.</p>
        <p className="ml-2">5/2023 policy: $350,000 deductible w/ TM HCC</p>
        <p className="ml-2">5/2024 policy: $350,000 deductible w/ TM HCC</p>
        <p className="ml-2">5/2025 policy: $350,000 deductible w/ TM HCC</p>
        <p><sup>2</sup>Optional ESI Programs: Advanced Opioid Management Program - $0.43 PMPM, Advanced Utilization Management Programs: $0.39 PMPM, and ScreenRx: $0.25 PMPM</p>
        <p><sup>3</sup>Stop Loss and Admin Fees are estimated using monthly enrollment counts.</p>
      </div>

      {/* Report Footer */}
      <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-center text-xs text-text-muted print-footer-content">
        <span>License No. 0451271</span>
        <span className="font-semibold">Keenan</span>
        <span>{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
      </div>

      <style jsx>{`
        .print-report {
          font-family: 'Arial', sans-serif;
          color: #000;
        }

        .ce-grid-table {
          font-size: 9px;
        }

        .ce-grid-table th,
        .ce-grid-table td {
          white-space: nowrap;
        }

        @media print {
          .print-report {
            padding: 0;
          }

          .ce-grid-table {
            font-size: 7px;
          }

          .ce-grid-table th,
          .ce-grid-table td {
            padding: 2px 4px;
          }
        }
      `}</style>
    </div>
  )
}
