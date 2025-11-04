import type { MonthlyPlanData, MonthlyColumnsResult } from '../types'

/**
 * Calculate monthly A-N columns for a plan
 * Formulas:
 * - E = C + D (Total Paid)
 * - H = E + F + G (Net Paid)
 * - K = H + I + J (Total Cost)
 * - M = L - K (Surplus)
 * - N = K / L (% of Budget)
 */
export function calculateMonthlyColumns(data: MonthlyPlanData): MonthlyColumnsResult {
  // E = C + D (Total Paid)
  const totalPaid = data.medicalPaid + data.rxPaid

  // H = E + F + G (Net Paid)
  // Note: F and G are typically negative (reimbursements/rebates)
  const netPaid = totalPaid + data.specStopLossReimb + data.estRxRebates

  // K = H + I + J (Total Cost)
  const totalCost = netPaid + data.adminFees + data.stopLossFees

  // M = L - K (Surplus/Deficit)
  const surplus = data.budgetedPremium - totalCost

  // N = K / L (% of Budget)
  const percentOfBudget =
    data.budgetedPremium > 0 ? (totalCost / data.budgetedPremium) * 100 : 0

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    netPaid: Math.round(netPaid * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    surplus: Math.round(surplus * 100) / 100,
    percentOfBudget: Math.round(percentOfBudget * 100) / 100,
  }
}

/**
 * Calculate columns for multiple months
 */
export function calculateMonthlyColumnsBatch(
  dataArray: MonthlyPlanData[]
): MonthlyColumnsResult[] {
  return dataArray.map(calculateMonthlyColumns)
}
