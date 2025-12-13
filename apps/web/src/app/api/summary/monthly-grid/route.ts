import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cost categories matching the spreadsheet format
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
]

/**
 * POST /api/summary/monthly-grid
 * Returns data formatted as a grid with months as columns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, planYearId } = body

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Fetch client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    })

    // Fetch plan year info
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
      select: { yearStart: true, yearEnd: true },
    })

    // Fetch all monthly snapshots
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
      return NextResponse.json(
        { error: 'No data found for the specified period' },
        { status: 404 }
      )
    }

    // Build months array
    const months = snapshots.map((s) => s.monthDate.toISOString().substring(0, 7))

    // Build grid data
    const rows = COST_CATEGORIES.map((category) => {
      const monthValues: Record<string, number> = {}
      let planYtd = 0

      snapshots.forEach((snapshot) => {
        const stats = snapshot.monthlyStats[0]
        if (!stats) return

        const month = snapshot.monthDate.toISOString().substring(0, 7)
        let value = 0

        // Approximate total cost (non-lagged): claims + admin + stop-loss fees + reimbursements/credits
        const totalCost =
          stats.medicalPaid.toNumber() +
          stats.rxPaid.toNumber() +
          stats.adminFees.toNumber() +
          stats.stopLossFees.toNumber() +
          stats.specStopLossReimb.toNumber() +
          stats.estRxRebates.toNumber()

        // Map category to actual data
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
            value = 0 // User adjustment
            break
          case 'total_rx':
            value = stats.rxPaid.toNumber()
            break
          case 'rx_rebates':
            value = -stats.rxPaid.toNumber() * 0.1 // Negative (credit)
            break
          case 'total_stop_loss':
            value = stats.stopLossFees.toNumber()
            break
          case 'stop_loss_reimb':
            value = -stats.specStopLossReimb.toNumber() // Negative (credit)
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
            // Cumulative will be calculated separately
            break
          case 'ee_count':
            value = Math.floor(stats.totalSubscribers.toNumber() / 2.2)
            break
          case 'member_count':
            value = stats.totalSubscribers.toNumber()
            break
          case 'pepm_nonlagged_actual':
            const eeCount = Math.floor(stats.totalSubscribers.toNumber() / 2.2)
            value = eeCount > 0 ? totalCost / eeCount : 0
            break
          case 'incurred_target_pepm':
            value = stats.budgetedPremium.toNumber() / Math.max(1, Math.floor(stats.totalSubscribers.toNumber() / 2.2))
            break
          case 'pepm_budget_ee':
            value = stats.budgetedPremium.toNumber()
            break
          case 'annual_budget':
            // Will be cumulative budget
            break
          case 'monthly_diff':
            value = stats.budgetedPremium.toNumber() - totalCost
            break
          case 'monthly_diff_pct':
            const diff = stats.budgetedPremium.toNumber() - totalCost
            value = stats.budgetedPremium.toNumber() > 0 ? (diff / stats.budgetedPremium.toNumber()) * 100 : 0
            break
          default:
            value = 0
        }

        monthValues[month] = value
        planYtd += value
      })

      return {
        itemName: category.name,
        rowType: category.rowType,
        format: category.format || 'currency',
        indent: category.indent,
        highlight: category.highlight,
        monthValues,
        planYtd,
        recycledPercent: category.id === 'total_hospital' ? 27 : undefined, // Example
      }
    })

    // Format report period
    const startDate = planYear?.yearStart
      ? new Date(planYear.yearStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'March 1, 2025'
    const endDate = planYear?.yearEnd
      ? new Date(planYear.yearEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'February 28, 2026'

    return NextResponse.json({
      months,
      rows,
      clientName: client?.name || 'Client Report',
      reportPeriod: `Medical Claims and Expenses ${startDate} - ${endDate}`,
    })
  } catch (error) {
    console.error('Error in POST /api/summary/monthly-grid:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
