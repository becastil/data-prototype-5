import type { PepmDataPoint } from '../types'

/**
 * Calculate PEPM (Per Employee Per Month)
 * PEPM = Total metric / Average subscribers
 * Average subscribers = Member-months / # of months
 */
export function calculatePepm(
  totalAmount: number,
  subscriberMonths: number,
  numberOfMonths: number
): number {
  if (numberOfMonths === 0 || subscriberMonths === 0) {
    return 0
  }
  const averageSubscribers = subscriberMonths / numberOfMonths
  return totalAmount / averageSubscribers
}

/**
 * Calculate PEPM for rolling periods (Current 12 vs Prior 12)
 */
export function comparePeriods(
  current12Months: { total: number; subscriberMonths: number },
  prior12Months: { total: number; subscriberMonths: number }
): { current: number; prior: number } {
  return {
    current: calculatePepm(current12Months.total, current12Months.subscriberMonths, 12),
    prior: calculatePepm(prior12Months.total, prior12Months.subscriberMonths, 12),
  }
}

/**
 * Create PEPM trend data points for charts
 */
export function createPepmTrendData(
  months: string[],
  currentPeriod: Record<string, number>,
  priorPeriod?: Record<string, number>
): PepmDataPoint[] {
  return months.map((month) => ({
    month,
    current: currentPeriod[month],
    prior: priorPeriod?.[month],
  }))
}

/**
 * Split 24 months into current 12 and prior 12
 */
export function split24Months<T>(
  data: Array<{ month: string; value: T }>
): { current12: Array<{ month: string; value: T }>; prior12: Array<{ month: string; value: T }> } {
  if (data.length < 24) {
    return { current12: data, prior12: [] }
  }
  return {
    current12: data.slice(0, 12),
    prior12: data.slice(12, 24),
  }
}
