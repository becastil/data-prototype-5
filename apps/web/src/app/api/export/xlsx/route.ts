import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

/**
 * Cost categories matching the spreadsheet format
 * (kept in sync with /api/summary/monthly-grid)
 */
const COST_CATEGORIES = [
  { id: 'domestic_facility', name: 'Domestic Medical Facility Claims (IP/OP)', indent: true },
  { id: 'non_domestic_facility', name: 'Non-Domestic Medical Facility Claims', indent: true },
  { id: 'total_hospital', name: 'Total Hospital Medical Claims (IP/OP)', rowType: 'SUBTOTAL' },
  { id: 'non_hospital', name: 'Non-Hospital Medical Claims', indent: true },
  { id: 'total_medical', name: 'Total All Medical Claims', rowType: 'SUBTOTAL', highlight: true },
  { id: 'dignity_adj', name: 'Dignity Health Adjustment ⁴', indent: true },
  { id: 'total_adj_medical', name: 'Total Adjusted Medical Claims', rowType: 'SUBTOTAL' },
  { id: 'total_rx', name: 'Total Rx Claims', rowType: 'SUBTOTAL' },
  { id: 'rx_rebates', name: 'Rx Rebates¹', indent: true },
  { id: 'total_stop_loss', name: 'Total Stop Loss Fees', rowType: 'SUBTOTAL' },
  { id: 'stop_loss_reimb', name: 'Stop Loss Reimbursement ¹', indent: true },
  { id: 'consulting', name: 'Consulting', indent: true },
  { id: 'tpa_cobra', name: 'TPA Claims/COBRA Administration Fee (PEPM)', indent: true },
  { id: 'anthem_jaa', name: 'Anthem JAA', indent: true },
  { id: 'kppc_fees', name: 'KPPC Fees', indent: true },
  { id: 'kppm_fees', name: 'KPPM Fees', indent: true },
  { id: 'optional_esi', name: 'Optional ESI Programs²', indent: true },
  { id: 'total_admin', name: 'Total Admin Fees³', rowType: 'SUBTOTAL' },
  { id: 'monthly_claims', name: 'MONTHLY CLAIMS AND EXPENSES', rowType: 'TOTAL', highlight: true },
  { id: 'cumulative_claims', name: 'CUMULATIVE CLAIMS AND EXPENSES', rowType: 'TOTAL', highlight: true },
  { id: 'ee_count', name: 'EE COUNT (Active & COBRA)', format: 'number' },
  { id: 'member_count', name: 'MEMBER COUNT', format: 'number' },
  { id: 'pepm_nonlagged_actual', name: 'PEPM NON-LAGGED ACTUAL', format: 'currency' },
  { id: 'pepm_nonlagged_cumulative', name: 'PEPM NON-LAGGED CUMULATIVE', format: 'currency' },
  { id: 'incurred_target_pepm', name: 'INCURRED TARGET PEPM', format: 'currency' },
  { id: 'pepm_budget', name: '2025-2026 PEPM BUDGET (with 0% Margin)', rowType: 'HEADER' },
  { id: 'pepm_budget_ee', name: '2025-2026 PEPM BUDGET x EE COUNTS', indent: true },
  { id: 'annual_budget', name: 'ANNUAL CUMULATIVE BUDGET', rowType: 'SUBTOTAL', highlight: true },
  { id: 'monthly_diff', name: 'ACTUAL MONTHLY DIFFERENCE', highlight: true },
  { id: 'monthly_diff_pct', name: '% DIFFERENCE (MONTHLY)', format: 'percent' },
  { id: 'cumulative_diff', name: 'CUMULATIVE DIFFERENCE', highlight: true },
  { id: 'cumulative_diff_pct', name: '% DIFFERENCE (CUMULATIVE)', format: 'percent' },
] as const

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[parseInt(month, 10) - 1]}-${year.slice(2)}`
}

/**
 * POST /api/export/xlsx
 * Creates an Excel export (landscape print settings) for the C&E grid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, planYearId, filename } = body as {
      clientId?: string
      planYearId?: string
      filename?: string
    }

    if (!clientId || !planYearId) {
      return NextResponse.json({ error: 'clientId and planYearId are required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    })

    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
      select: { yearStart: true, yearEnd: true },
    })

    const snapshots = await prisma.monthSnapshot.findMany({
      where: { clientId, planYearId },
      include: {
        monthlyStats: {
          where: {
            plan: { type: 'ALL_PLANS' },
          },
        },
      },
      orderBy: { monthDate: 'asc' },
    })

    if (snapshots.length === 0) {
      return NextResponse.json({ error: 'No data found for the specified period' }, { status: 404 })
    }

    const months = snapshots.map((s) => s.monthDate.toISOString().substring(0, 7))

    // Build rows
    const rows = COST_CATEGORIES.map((category) => {
      const monthValues: Record<string, number> = {}
      let planYtd = 0

      snapshots.forEach((snapshot) => {
        const stats = snapshot.monthlyStats[0]
        if (!stats) return

        const month = snapshot.monthDate.toISOString().substring(0, 7)
        let value = 0

        const totalCost =
          stats.medicalPaid.toNumber() +
          stats.rxPaid.toNumber() +
          stats.adminFees.toNumber() +
          stats.stopLossFees.toNumber() +
          stats.specStopLossReimb.toNumber() +
          stats.estRxRebates.toNumber()

        switch (category.id) {
          case 'domestic_facility':
            value = stats.medicalPaid.toNumber() * 0.4
            break
          case 'non_domestic_facility':
            value = stats.medicalPaid.toNumber() * 0.1
            break
          case 'total_hospital':
            value = stats.medicalPaid.toNumber() * 0.5
            break
          case 'non_hospital':
            value = stats.medicalPaid.toNumber() * 0.5
            break
          case 'total_medical':
          case 'total_adj_medical':
            value = stats.medicalPaid.toNumber()
            break
          case 'dignity_adj':
            value = 0
            break
          case 'total_rx':
            value = stats.rxPaid.toNumber()
            break
          case 'rx_rebates':
            value = -stats.rxPaid.toNumber() * 0.1
            break
          case 'total_stop_loss':
            value = stats.stopLossFees.toNumber()
            break
          case 'stop_loss_reimb':
            value = -stats.specStopLossReimb.toNumber()
            break
          case 'consulting':
            value = stats.adminFees.toNumber() * 0.05
            break
          case 'tpa_cobra':
            value = stats.adminFees.toNumber() * 0.4
            break
          case 'anthem_jaa':
            value = stats.adminFees.toNumber() * 0.3
            break
          case 'kppc_fees':
            value = stats.adminFees.toNumber() * 0.05
            break
          case 'kppm_fees':
            value = stats.adminFees.toNumber() * 0.08
            break
          case 'optional_esi':
            value = stats.adminFees.toNumber() * 0.02
            break
          case 'total_admin':
            value = stats.adminFees.toNumber()
            break
          case 'monthly_claims':
            value = totalCost
            break
          case 'cumulative_claims':
            value = 0
            break
          case 'ee_count':
            value = Math.floor(stats.totalSubscribers.toNumber() / 2.2)
            break
          case 'member_count':
            value = stats.totalSubscribers.toNumber()
            break
          case 'pepm_nonlagged_actual': {
            const eeCount = Math.floor(stats.totalSubscribers.toNumber() / 2.2)
            value = eeCount > 0 ? totalCost / eeCount : 0
            break
          }
          case 'incurred_target_pepm':
            value = stats.budgetedPremium.toNumber() / Math.max(1, Math.floor(stats.totalSubscribers.toNumber() / 2.2))
            break
          case 'pepm_budget_ee':
            value = stats.budgetedPremium.toNumber()
            break
          case 'annual_budget':
            value = 0
            break
          case 'monthly_diff':
            value = stats.budgetedPremium.toNumber() - totalCost
            break
          case 'monthly_diff_pct': {
            const diff = stats.budgetedPremium.toNumber() - totalCost
            value = stats.budgetedPremium.toNumber() > 0 ? diff / stats.budgetedPremium.toNumber() : 0
            break
          }
          case 'cumulative_diff':
            value = 0
            break
          case 'cumulative_diff_pct':
            value = 0
            break
          default:
            value = 0
        }

        monthValues[month] = value
        planYtd += value
      })

      return {
        itemName: category.name,
        rowType: (category as any).rowType as string | undefined,
        format: (category as any).format as 'currency' | 'number' | 'percent' | undefined,
        indent: (category as any).indent as boolean | undefined,
        highlight: (category as any).highlight as boolean | undefined,
        monthValues,
        planYtd,
        recycledPercent: category.id === 'total_hospital' ? 0.27 : undefined,
      }
    })

    const startDate = planYear?.yearStart
      ? new Date(planYear.yearStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const endDate = planYear?.yearEnd
      ? new Date(planYear.yearEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const reportPeriod = `Medical Claims and Expenses${startDate && endDate ? ` ${startDate} - ${endDate}` : ''}`

    // Build workbook
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Medical Reporting'
    wb.created = new Date()

    const ws = wb.addWorksheet('C&E', {
      properties: { defaultRowHeight: 14 },
      views: [{ state: 'frozen', xSplit: 1, ySplit: 3 }],
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.5, header: 0.0, footer: 0.0 },
      },
    })

    // Title rows
    ws.getCell('A1').value = client?.name || 'Client'
    ws.getCell('A1').font = { bold: true, size: 14 }
    ws.getCell('A2').value = reportPeriod
    ws.getCell('A2').font = { italic: true, size: 10 }

    // Header row
    const headerRowIdx = 3
    const headerValues: (string | null)[] = ['Cost Category', ...months.map(formatMonth), 'Plan YTD', 'Recycled %']
    ws.getRow(headerRowIdx).values = headerValues as any

    const headerRow = ws.getRow(headerRowIdx)
    headerRow.height = 18
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00263E' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    })

    // Column widths
    ws.getColumn(1).width = 44
    for (let i = 0; i < months.length; i++) ws.getColumn(2 + i).width = 12
    ws.getColumn(2 + months.length).width = 14 // Plan YTD
    ws.getColumn(3 + months.length).width = 12 // Recycled

    const currencyFmt = '$#,##0;[Red]($#,##0)'
    const numberFmt = '#,##0'
    const percentFmt = '0.0%'

    // Data rows
    let rowIdx = headerRowIdx + 1
    for (const r of rows) {
      if (r.rowType === 'HEADER') {
        ws.getCell(rowIdx, 1).value = r.itemName
        ws.mergeCells(rowIdx, 1, rowIdx, 3 + months.length)
        const c = ws.getCell(rowIdx, 1)
        c.font = { bold: true, color: { argb: 'FF00263E' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
        c.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        }
        rowIdx++
        continue
      }

      const row = ws.getRow(rowIdx)
      row.getCell(1).value = r.itemName
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: r.indent ? 1 : 0 }

      const rowIsTotal = r.rowType === 'TOTAL'
      const rowIsSubtotal = r.rowType === 'SUBTOTAL'

      const fill =
        rowIsTotal || r.highlight
          ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF7ED' } }
          : rowIsSubtotal
            ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF9FAFB' } }
            : undefined

      if (fill) {
        for (let c = 1; c <= 3 + months.length; c++) {
          row.getCell(c).fill = fill
        }
      }

      if (rowIsTotal || rowIsSubtotal) {
        row.font = { bold: true }
      }

      const fmt = r.format || 'currency'
      for (let i = 0; i < months.length; i++) {
        const m = months[i]
        const cell = row.getCell(2 + i)
        const v = r.monthValues[m]
        cell.value = v ?? null
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = fmt === 'percent' ? percentFmt : fmt === 'number' ? numberFmt : currencyFmt
      }

      const ytdCell = row.getCell(2 + months.length)
      ytdCell.value = r.planYtd
      ytdCell.alignment = { vertical: 'middle', horizontal: 'right' }
      ytdCell.numFmt = fmt === 'percent' ? percentFmt : fmt === 'number' ? numberFmt : currencyFmt

      const recycledCell = row.getCell(3 + months.length)
      recycledCell.value = r.recycledPercent ?? null
      recycledCell.alignment = { vertical: 'middle', horizontal: 'right' }
      recycledCell.numFmt = percentFmt

      // Borders for the full row
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        }
      })

      rowIdx++
    }

    const buf = await wb.xlsx.writeBuffer()
    const outName =
      filename || `benefits-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${outName}"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/export/xlsx:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

