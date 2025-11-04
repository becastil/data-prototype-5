/**
 * Budget vs Actuals Variance Calculator
 * 
 * Calculates monthly and YTD variance between actual claims/expenses and budgeted amounts.
 * Supports multiple fee types, effective date windows, and proration logic.
 */

export type FeeUnitType = 'ANNUAL' | 'MONTHLY' | 'PEPM' | 'PEPEM' | 'PERCENT_OF_CLAIMS' | 'FLAT'
export type RoundingMode = 'BANKERS' | 'HALF_UP'

export interface FeeWindow {
  id: string
  category: string
  unitType: FeeUnitType
  rate: number
  startDate: Date
  endDate: Date
}

export interface MonthlyActuals {
  serviceMonth: Date
  domesticFacilityIpOp: number
  nonDomesticIpOp: number
  nonHospitalMedical: number
  rxClaims: number
  eeCountActiveCobra: number
  memberCount: number
}

export interface MonthlyConfig {
  serviceMonth: Date
  expectedClaims: number
  stopLossReimbursement: number
  rxRebates: number
}

export interface BudgetConfig {
  roundingMode: RoundingMode
  precision: number
}

export interface MonthlyVariance {
  month: Date
  actualClaims: number
  fixedCosts: number
  stopLossReimbursement: number
  rxRebates: number
  actualTotal: number
  budgetClaims: number
  budgetFixed: number
  budgetTotal: number
  varianceDollars: number
  variancePercent: number
  pepm: number
  members: number
}

export interface BudgetCalculationResult {
  months: MonthlyVariance[]
  ytd: {
    actualTotal: number
    budgetTotal: number
    varianceDollars: number
    variancePercent: number
    avgPepm: number
  }
  lastThreeMonths: {
    actualTotal: number
    budgetTotal: number
    varianceDollars: number
    variancePercent: number
    avgPepm: number
  }
}

/**
 * Calculates the number of days a fee window is effective in a given month
 */
function getEffectiveDays(windowStart: Date, windowEnd: Date, monthStart: Date, monthEnd: Date): number {
  const effectiveStart = new Date(Math.max(windowStart.getTime(), monthStart.getTime()))
  const effectiveEnd = new Date(Math.min(windowEnd.getTime(), monthEnd.getTime()))
  
  if (effectiveStart > effectiveEnd) {
    return 0
  }
  
  const daysDiff = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return daysDiff
}

/**
 * Gets the number of days in a month
 */
function getDaysInMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Calculates prorated fee amount for a fee window in a specific month
 */
function calculateProratedFee(
  feeWindow: FeeWindow,
  monthStart: Date,
  monthEnd: Date,
  actuals: MonthlyActuals,
  _expectedClaims: number
): number {
  const daysInMonth = getDaysInMonth(monthStart)
  const effectiveDays = getEffectiveDays(feeWindow.startDate, feeWindow.endDate, monthStart, monthEnd)
  
  if (effectiveDays === 0) {
    return 0
  }
  
  const prorationFactor = effectiveDays / daysInMonth
  
  switch (feeWindow.unitType) {
    case 'ANNUAL':
      return (feeWindow.rate / 12) * prorationFactor
    
    case 'MONTHLY':
      return feeWindow.rate * prorationFactor
    
    case 'PEPM':
      return feeWindow.rate * actuals.memberCount * prorationFactor
    
    case 'PEPEM':
      return feeWindow.rate * actuals.eeCountActiveCobra * prorationFactor
    
    case 'PERCENT_OF_CLAIMS':
      const totalClaims = actuals.domesticFacilityIpOp + actuals.nonDomesticIpOp + 
                         actuals.nonHospitalMedical + actuals.rxClaims
      return (feeWindow.rate / 100) * totalClaims * prorationFactor
    
    case 'FLAT':
      return effectiveDays === daysInMonth ? feeWindow.rate : feeWindow.rate * prorationFactor
    
    default:
      return 0
  }
}

/**
 * Rounds a number according to the specified rounding mode
 */
function roundNumber(value: number, precision: number, mode: RoundingMode): number {
  const multiplier = Math.pow(10, precision)
  
  if (mode === 'HALF_UP') {
    return Math.round(value * multiplier) / multiplier
  } else {
    // Banker's rounding (round half to even)
    const scaled = value * multiplier
    const rounded = Math.round(scaled)
    
    // Check if we're exactly at 0.5
    if (Math.abs(scaled - rounded) === 0.5) {
      // Round to even
      return (rounded % 2 === 0 ? rounded : rounded - 1) / multiplier
    }
    
    return rounded / multiplier
  }
}

/**
 * Calculate budget variance for a set of months
 */
export function calculateBudgetVariance(
  actuals: MonthlyActuals[],
  configs: MonthlyConfig[],
  feeWindows: FeeWindow[],
  budgetConfig: BudgetConfig
): BudgetCalculationResult {
  // Sort actuals by month
  const sortedActuals = [...actuals].sort((a, b) => a.serviceMonth.getTime() - b.serviceMonth.getTime())
  
  const months: MonthlyVariance[] = sortedActuals.map(actual => {
    // Find matching config
    const config = configs.find(c => 
      c.serviceMonth.getTime() === actual.serviceMonth.getTime()
    )
    
    if (!config) {
      throw new Error(`No config found for month ${actual.serviceMonth.toISOString()}`)
    }
    
    // Calculate actual claims
    const actualClaims = 
      actual.domesticFacilityIpOp +
      actual.nonDomesticIpOp +
      actual.nonHospitalMedical +
      actual.rxClaims
    
    // Calculate month boundaries
    const monthStart = new Date(actual.serviceMonth)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    
    // Calculate fixed costs from fee windows
    let fixedCosts = 0
    for (const feeWindow of feeWindows) {
      fixedCosts += calculateProratedFee(feeWindow, monthStart, monthEnd, actual, actualClaims)
    }
    
    // Calculate actuals total (claims + fixed - adjustments)
    const actualTotal = actualClaims + fixedCosts + config.stopLossReimbursement + config.rxRebates
    
    // Calculate budget total
    let budgetFixed = 0
    for (const feeWindow of feeWindows) {
      // For budget, use expected values instead of actuals
      const budgetActuals: MonthlyActuals = {
        ...actual,
        domesticFacilityIpOp: config.expectedClaims * 0.4, // Approximate split
        nonDomesticIpOp: config.expectedClaims * 0.1,
        nonHospitalMedical: config.expectedClaims * 0.3,
        rxClaims: config.expectedClaims * 0.2,
      }
      budgetFixed += calculateProratedFee(feeWindow, monthStart, monthEnd, budgetActuals, actualClaims)
    }
    
    const budgetTotal = config.expectedClaims + budgetFixed
    
    // Calculate variance
    const varianceDollars = actualTotal - budgetTotal
    const variancePercent = budgetTotal !== 0 ? (varianceDollars / budgetTotal) * 100 : 0
    
    // Calculate PEPM
    const pepm = actual.memberCount > 0 ? actualTotal / actual.memberCount : 0
    
    // Apply rounding
    return {
      month: actual.serviceMonth,
      actualClaims: roundNumber(actualClaims, budgetConfig.precision, budgetConfig.roundingMode),
      fixedCosts: roundNumber(fixedCosts, budgetConfig.precision, budgetConfig.roundingMode),
      stopLossReimbursement: roundNumber(config.stopLossReimbursement, budgetConfig.precision, budgetConfig.roundingMode),
      rxRebates: roundNumber(config.rxRebates, budgetConfig.precision, budgetConfig.roundingMode),
      actualTotal: roundNumber(actualTotal, budgetConfig.precision, budgetConfig.roundingMode),
      budgetClaims: roundNumber(config.expectedClaims, budgetConfig.precision, budgetConfig.roundingMode),
      budgetFixed: roundNumber(budgetFixed, budgetConfig.precision, budgetConfig.roundingMode),
      budgetTotal: roundNumber(budgetTotal, budgetConfig.precision, budgetConfig.roundingMode),
      varianceDollars: roundNumber(varianceDollars, budgetConfig.precision, budgetConfig.roundingMode),
      variancePercent: roundNumber(variancePercent, 1, budgetConfig.roundingMode),
      pepm: roundNumber(pepm, budgetConfig.precision, budgetConfig.roundingMode),
      members: actual.memberCount,
    }
  })
  
  // Calculate YTD
  const ytdActualTotal = months.reduce((sum, m) => sum + m.actualTotal, 0)
  const ytdBudgetTotal = months.reduce((sum, m) => sum + m.budgetTotal, 0)
  const ytdVarianceDollars = ytdActualTotal - ytdBudgetTotal
  const ytdVariancePercent = ytdBudgetTotal !== 0 ? (ytdVarianceDollars / ytdBudgetTotal) * 100 : 0
  const totalMembers = months.reduce((sum, m) => sum + m.members, 0)
  const avgPepm = totalMembers > 0 ? ytdActualTotal / totalMembers : 0
  
  // Calculate last 3 months
  const lastThree = months.slice(-3)
  const l3ActualTotal = lastThree.reduce((sum, m) => sum + m.actualTotal, 0)
  const l3BudgetTotal = lastThree.reduce((sum, m) => sum + m.budgetTotal, 0)
  const l3VarianceDollars = l3ActualTotal - l3BudgetTotal
  const l3VariancePercent = l3BudgetTotal !== 0 ? (l3VarianceDollars / l3BudgetTotal) * 100 : 0
  const l3TotalMembers = lastThree.reduce((sum, m) => sum + m.members, 0)
  const l3AvgPepm = l3TotalMembers > 0 ? l3ActualTotal / l3TotalMembers : 0
  
  return {
    months,
    ytd: {
      actualTotal: roundNumber(ytdActualTotal, budgetConfig.precision, budgetConfig.roundingMode),
      budgetTotal: roundNumber(ytdBudgetTotal, budgetConfig.precision, budgetConfig.roundingMode),
      varianceDollars: roundNumber(ytdVarianceDollars, budgetConfig.precision, budgetConfig.roundingMode),
      variancePercent: roundNumber(ytdVariancePercent, 1, budgetConfig.roundingMode),
      avgPepm: roundNumber(avgPepm, budgetConfig.precision, budgetConfig.roundingMode),
    },
    lastThreeMonths: {
      actualTotal: roundNumber(l3ActualTotal, budgetConfig.precision, budgetConfig.roundingMode),
      budgetTotal: roundNumber(l3BudgetTotal, budgetConfig.precision, budgetConfig.roundingMode),
      varianceDollars: roundNumber(l3VarianceDollars, budgetConfig.precision, budgetConfig.roundingMode),
      variancePercent: roundNumber(l3VariancePercent, 1, budgetConfig.roundingMode),
      avgPepm: roundNumber(l3AvgPepm, budgetConfig.precision, budgetConfig.roundingMode),
    },
  }
}

