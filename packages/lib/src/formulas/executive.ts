import type { FuelGaugeStatus, ClaimantBucket } from '../types'
import { FuelGaugeStatus as FuelGaugeStatusEnum } from '../types'

/**
 * Calculate fuel gauge status based on % of budget
 * Green: <95%, Yellow: 95-105%, Red: >105%
 */
export function calculateFuelGaugeStatus(percentOfBudget: number): FuelGaugeStatus {
  if (percentOfBudget < 95) {
    return FuelGaugeStatusEnum.GREEN
  } else if (percentOfBudget <= 105) {
    return FuelGaugeStatusEnum.YELLOW
  } else {
    return FuelGaugeStatusEnum.RED
  }
}

/**
 * Calculate YTD totals across all metrics
 */
export interface ExecutiveYtdTotals {
  budgetedPremium: number
  medicalPaid: number
  rxPaid: number
  totalPaid: number
  specStopLossReimb: number
  estRxRebates: number
  netPaid: number
  adminFees: number
  stopLossFees: number
  totalCost: number
  surplus: number
  percentOfBudget: number
  fuelGaugeStatus: FuelGaugeStatus
}

export function calculateExecutiveYtd(
  monthlyData: Array<{
    budgetedPremium: number
    medicalPaid: number
    rxPaid: number
    specStopLossReimb: number
    estRxRebates: number
    adminFees: number
    stopLossFees: number
  }>
): ExecutiveYtdTotals {
  const totals = monthlyData.reduce(
    (acc, month) => ({
      budgetedPremium: acc.budgetedPremium + month.budgetedPremium,
      medicalPaid: acc.medicalPaid + month.medicalPaid,
      rxPaid: acc.rxPaid + month.rxPaid,
      specStopLossReimb: acc.specStopLossReimb + month.specStopLossReimb,
      estRxRebates: acc.estRxRebates + month.estRxRebates,
      adminFees: acc.adminFees + month.adminFees,
      stopLossFees: acc.stopLossFees + month.stopLossFees,
    }),
    {
      budgetedPremium: 0,
      medicalPaid: 0,
      rxPaid: 0,
      specStopLossReimb: 0,
      estRxRebates: 0,
      adminFees: 0,
      stopLossFees: 0,
    }
  )

  const totalPaid = totals.medicalPaid + totals.rxPaid
  const netPaid = totalPaid + totals.specStopLossReimb + totals.estRxRebates
  const totalCost = netPaid + totals.adminFees + totals.stopLossFees
  const surplus = totals.budgetedPremium - totalCost
  const percentOfBudget =
    totals.budgetedPremium > 0 ? (totalCost / totals.budgetedPremium) * 100 : 0

  return {
    ...totals,
    totalPaid: Math.round(totalPaid * 100) / 100,
    netPaid: Math.round(netPaid * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    surplus: Math.round(surplus * 100) / 100,
    percentOfBudget: Math.round(percentOfBudget * 100) / 100,
    fuelGaugeStatus: calculateFuelGaugeStatus(percentOfBudget),
  }
}

/**
 * Calculate plan mix distribution (percentage by plan)
 */
export function calculatePlanMix(
  planData: Array<{ planName: string; totalCost: number }>
): Array<{ planName: string; amount: number; percentage: number }> {
  const total = planData.reduce((sum, plan) => sum + plan.totalCost, 0)
  if (total === 0) {
    return planData.map((plan) => ({ planName: plan.planName, amount: 0, percentage: 0 }))
  }

  return planData.map((plan) => ({
    planName: plan.planName,
    amount: plan.totalCost,
    percentage: Math.round((plan.totalCost / total) * 100 * 100) / 100,
  }))
}

/**
 * Calculate Med vs Rx split (typically 87% / 13%)
 */
export function calculateMedVsRxSplit(medicalPaid: number, rxPaid: number): {
  medicalPercent: number
  rxPercent: number
  medicalAmount: number
  rxAmount: number
} {
  const total = medicalPaid + rxPaid
  if (total === 0) {
    return { medicalPercent: 0, rxPercent: 0, medicalAmount: 0, rxAmount: 0 }
  }

  return {
    medicalAmount: medicalPaid,
    rxAmount: rxPaid,
    medicalPercent: Math.round((medicalPaid / total) * 100 * 100) / 100,
    rxPercent: Math.round((rxPaid / total) * 100 * 100) / 100,
  }
}

/**
 * Calculate claimant buckets ($200K+, $100-200K, Other)
 */
export function calculateClaimantBuckets(
  claimants: Array<{ totalPaid: number }>
): ClaimantBucket[] {
  const buckets = {
    '$200K+': { count: 0, total: 0, color: '#ef4444' },
    '$100-200K': { count: 0, total: 0, color: '#eab308' },
    'Other': { count: 0, total: 0, color: '#64748b' },
  }

  claimants.forEach((claimant) => {
    if (claimant.totalPaid >= 200000) {
      buckets['$200K+'].count++
      buckets['$200K+'].total += claimant.totalPaid
    } else if (claimant.totalPaid >= 100000) {
      buckets['$100-200K'].count++
      buckets['$100-200K'].total += claimant.totalPaid
    } else {
      buckets['Other'].count++
      buckets['Other'].total += claimant.totalPaid
    }
  })

  return Object.entries(buckets).map(([name, data]) => ({
    name,
    value: Math.round(data.total * 100) / 100,
    count: data.count,
    color: data.color,
  }))
}
