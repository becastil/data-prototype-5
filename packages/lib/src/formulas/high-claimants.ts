import type { HighClaimantResult } from '../types'

/**
 * Filter and process high-cost claimants based on ISL threshold
 * Returns claimants that are ≥50% of ISL threshold
 */
export interface HighClaimantInput {
  claimantKey: string
  planId: string
  medPaid: number
  rxPaid: number
  totalPaid: number
}

export function filterHighClaimants(
  claimants: HighClaimantInput[],
  islThreshold: number = 200000,
  minPercentThreshold: number = 0.5
): HighClaimantResult[] {
  const minAmount = islThreshold * minPercentThreshold

  return claimants
    .filter((c) => c.totalPaid >= minAmount)
    .map((c) => {
      const percentOfIsl = islThreshold > 0 ? (c.totalPaid / islThreshold) * 100 : 0
      // Employer share = min(totalPaid, ISL)
      const employerShare = Math.min(c.totalPaid, islThreshold)
      // Stop Loss share = max(0, totalPaid - ISL)
      const stopLossShare = Math.max(0, c.totalPaid - islThreshold)

      return {
        claimantKey: c.claimantKey,
        planId: c.planId,
        medPaid: c.medPaid,
        rxPaid: c.rxPaid,
        totalPaid: c.totalPaid,
        employerShare: Math.round(employerShare * 100) / 100,
        stopLossShare: Math.round(stopLossShare * 100) / 100,
        percentOfIsl: Math.round(percentOfIsl * 100) / 100,
      }
    })
    .sort((a, b) => b.totalPaid - a.totalPaid) // Sort descending by total paid
}

/**
 * Calculate summary statistics for high claimants
 */
export function calculateHighClaimantSummary(
  claimants: HighClaimantResult[]
): {
  count: number
  totalPaid: number
  employerShare: number
  stopLossShare: number
  averagePaid: number
} {
  if (claimants.length === 0) {
    return {
      count: 0,
      totalPaid: 0,
      employerShare: 0,
      stopLossShare: 0,
      averagePaid: 0,
    }
  }

  const totals = claimants.reduce(
    (acc, c) => ({
      totalPaid: acc.totalPaid + c.totalPaid,
      employerShare: acc.employerShare + c.employerShare,
      stopLossShare: acc.stopLossShare + c.stopLossShare,
    }),
    { totalPaid: 0, employerShare: 0, stopLossShare: 0 }
  )

  return {
    count: claimants.length,
    totalPaid: Math.round(totals.totalPaid * 100) / 100,
    employerShare: Math.round(totals.employerShare * 100) / 100,
    stopLossShare: Math.round(totals.stopLossShare * 100) / 100,
    averagePaid: Math.round((totals.totalPaid / claimants.length) * 100) / 100,
  }
}
