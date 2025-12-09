/**
 * C&E (Claims & Expenses) 28-Row Summary Formula Engine
 * 
 * Calculates the comprehensive monthly and cumulative Claims & Expenses statement
 * with sections for Medical, Pharmacy, Stop Loss, Admin, Totals, Enrollment, PEPM, Budget, and Variance.
 */

export interface CESummaryInput {
  // Medical (#1-7)
  domesticClaims: number
  nonDomesticClaims: number
  nonHospitalMedical: number
  medicalSubtotal: number // Auto-calculated: #1 + #2 + #3
  medicalAdjustment: number // Row #6 - User configurable adjustment
  medicalTotal: number // Auto-calculated: #4 + #5 + #6
  
  // Pharmacy (#8-9)
  rxClaims: number
  rxRebates: number // Typically negative
  
  // Stop Loss (#10-11)
  stopLossPremiums: number
  stopLossReimbursements: number // Typically negative
  
  // Admin (#12-14)
  asoFees: number
  stopLossCoordFees: number
  adminTotal: number // Auto-calculated: #12 + #13
  
  // Enrollment (#17-18)
  employeeCount: number
  memberCount: number
  
  // Budget (#22-24)
  budgetedClaims: number
  budgetedFixed: number
  totalBudget: number // Auto-calculated: #22 + #23
}

export interface CESummaryRow {
  itemNumber: number
  itemName: string
  monthlyValue: number
  cumulativeValue?: number
  rowType: 'HEADER' | 'DATA' | 'SUBTOTAL' | 'TOTAL'
  formula?: string
  isUserEditable?: boolean
  colorCode?: 'adjustment' | 'total' | 'variance-positive' | 'variance-negative'
  format?: 'currency' | 'number' | 'percent' // NEW: Formatting control
}

export interface CESummaryResult {
  rows: CESummaryRow[]
  kpis: {
    monthlyCE: number // Row #15
    pepmActual: number // Row #21
    budgetVariance: number // Row #27
    cumulativeCE: number // Cumulative of #15
  }
}

export function calculateCESummary(
  input: CESummaryInput,
  cumulativeInput?: CESummaryInput
): CESummaryResult {
  // Calculate derived values
  const medicalSubtotal = input.domesticClaims + input.nonDomesticClaims + input.nonHospitalMedical
  const medicalTotal = medicalSubtotal + 0 + input.medicalAdjustment // Row #5 placeholder = 0
  
  // Monthly C&E calculation (Row #15)
  // Formula: #7 + #8 + #9 + #10 - #11 + #14
  const monthlyCE = 
    medicalTotal + 
    input.rxClaims + 
    input.rxRebates + 
    input.stopLossPremiums + 
    input.stopLossReimbursements + 
    input.adminTotal
  
  // PEPM calculations
  const pepmActual = input.memberCount > 0 ? monthlyCE / input.memberCount : 0
  const pepmBudget = input.memberCount > 0 ? input.totalBudget / input.memberCount : 0
  
  // Variance calculations
  const varianceDollars = monthlyCE - input.totalBudget
  const variancePercent = input.totalBudget !== 0 ? (varianceDollars / input.totalBudget) * 100 : 0
  
  // Cumulative values
  const cumulativeCE = cumulativeInput 
    ? calculateCESummary(cumulativeInput).kpis.monthlyCE 
    : monthlyCE

  const rows: CESummaryRow[] = [
    // Medical Section (#1-7)
    {
      itemNumber: 0,
      itemName: 'MEDICAL CLAIMS',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 1,
      itemName: 'Domestic Facility (IP/OP)',
      monthlyValue: input.domesticClaims,
      cumulativeValue: cumulativeInput?.domesticClaims,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 2,
      itemName: 'Non-Domestic (IP/OP)',
      monthlyValue: input.nonDomesticClaims,
      cumulativeValue: cumulativeInput?.nonDomesticClaims,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 3,
      itemName: 'Non-Hospital Medical',
      monthlyValue: input.nonHospitalMedical,
      cumulativeValue: cumulativeInput?.nonHospitalMedical,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 4,
      itemName: 'Medical Claims Subtotal',
      monthlyValue: medicalSubtotal,
      cumulativeValue: cumulativeInput 
        ? (cumulativeInput.domesticClaims + cumulativeInput.nonDomesticClaims + cumulativeInput.nonHospitalMedical)
        : undefined,
      rowType: 'SUBTOTAL',
      formula: '#1 + #2 + #3',
      colorCode: 'total',
      format: 'currency',
    },
    {
      itemNumber: 5,
      itemName: 'Reserved',
      monthlyValue: 0,
      cumulativeValue: 0,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 6,
      itemName: 'Adjustment',
      monthlyValue: input.medicalAdjustment,
      cumulativeValue: cumulativeInput?.medicalAdjustment,
      rowType: 'DATA',
      isUserEditable: true,
      colorCode: 'adjustment',
      format: 'currency',
    },
    {
      itemNumber: 7,
      itemName: 'Total Medical',
      monthlyValue: medicalTotal,
      cumulativeValue: cumulativeInput
        ? (cumulativeInput.domesticClaims + cumulativeInput.nonDomesticClaims + 
           cumulativeInput.nonHospitalMedical + cumulativeInput.medicalAdjustment)
        : undefined,
      rowType: 'SUBTOTAL',
      formula: '#4 + #5 + #6',
      colorCode: 'total',
      format: 'currency',
    },
    
    // Pharmacy Section (#8-9)
    {
      itemNumber: 0,
      itemName: 'PHARMACY',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 8,
      itemName: 'Rx Claims',
      monthlyValue: input.rxClaims,
      cumulativeValue: cumulativeInput?.rxClaims,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 9,
      itemName: 'Rx Rebates',
      monthlyValue: input.rxRebates,
      cumulativeValue: cumulativeInput?.rxRebates,
      rowType: 'DATA',
      isUserEditable: true,
      colorCode: 'adjustment',
      format: 'currency',
    },
    
    // Stop Loss Section (#10-11)
    {
      itemNumber: 0,
      itemName: 'STOP LOSS',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 10,
      itemName: 'Stop Loss Premiums',
      monthlyValue: input.stopLossPremiums,
      cumulativeValue: cumulativeInput?.stopLossPremiums,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 11,
      itemName: 'Stop Loss Reimbursements',
      monthlyValue: input.stopLossReimbursements,
      cumulativeValue: cumulativeInput?.stopLossReimbursements,
      rowType: 'DATA',
      isUserEditable: true,
      colorCode: 'adjustment',
      format: 'currency',
    },
    
    // Admin Section (#12-14)
    {
      itemNumber: 0,
      itemName: 'ADMINISTRATIVE FEES',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 12,
      itemName: 'ASO Fees',
      monthlyValue: input.asoFees,
      cumulativeValue: cumulativeInput?.asoFees,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 13,
      itemName: 'Stop Loss Coordination',
      monthlyValue: input.stopLossCoordFees,
      cumulativeValue: cumulativeInput?.stopLossCoordFees,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 14,
      itemName: 'Total Admin Fees',
      monthlyValue: input.adminTotal,
      cumulativeValue: cumulativeInput?.adminTotal,
      rowType: 'SUBTOTAL',
      formula: '#12 + #13',
      colorCode: 'total',
      format: 'currency',
    },
    
    // Totals Section (#15-16)
    {
      itemNumber: 0,
      itemName: 'TOTALS',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 15,
      itemName: 'Monthly C&E',
      monthlyValue: monthlyCE,
      cumulativeValue: cumulativeCE,
      rowType: 'TOTAL',
      formula: '#7 + #8 + #9 + #10 + #11 + #14',
      colorCode: 'total',
      format: 'currency',
    },
    {
      itemNumber: 16,
      itemName: 'Reserved',
      monthlyValue: 0,
      cumulativeValue: 0,
      rowType: 'DATA',
      format: 'currency',
    },
    
    // Enrollment Section (#17-18)
    {
      itemNumber: 0,
      itemName: 'ENROLLMENT',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 17,
      itemName: 'Employee Count',
      monthlyValue: input.employeeCount,
      cumulativeValue: cumulativeInput?.employeeCount,
      rowType: 'DATA',
      format: 'number', // Explicit number format
    },
    {
      itemNumber: 18,
      itemName: 'Member Count',
      monthlyValue: input.memberCount,
      cumulativeValue: cumulativeInput?.memberCount,
      rowType: 'DATA',
      format: 'number', // Explicit number format
    },
    
    // PEPM Section (#19-21)
    {
      itemNumber: 0,
      itemName: 'PER EMPLOYEE PER MONTH',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 19,
      itemName: 'PEPM Budget',
      monthlyValue: pepmBudget,
      cumulativeValue: cumulativeInput && cumulativeInput.memberCount > 0
        ? cumulativeInput.totalBudget / cumulativeInput.memberCount
        : undefined,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 20,
      itemName: 'Reserved',
      monthlyValue: 0,
      cumulativeValue: 0,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 21,
      itemName: 'PEPM Actual',
      monthlyValue: pepmActual,
      cumulativeValue: cumulativeInput && cumulativeInput.memberCount > 0
        ? cumulativeCE / cumulativeInput.memberCount
        : undefined,
      rowType: 'DATA',
      colorCode: 'total',
      format: 'currency',
    },
    
    // Budget Section (#22-24)
    {
      itemNumber: 0,
      itemName: 'BUDGET',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 22,
      itemName: 'Budgeted Claims',
      monthlyValue: input.budgetedClaims,
      cumulativeValue: cumulativeInput?.budgetedClaims,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 23,
      itemName: 'Budgeted Fixed Costs',
      monthlyValue: input.budgetedFixed,
      cumulativeValue: cumulativeInput?.budgetedFixed,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 24,
      itemName: 'Total Budget',
      monthlyValue: input.totalBudget,
      cumulativeValue: cumulativeInput?.totalBudget,
      rowType: 'SUBTOTAL',
      formula: '#22 + #23',
      colorCode: 'total',
      format: 'currency',
    },
    
    // Variance Section (#25-28)
    {
      itemNumber: 0,
      itemName: 'VARIANCE (ACTUAL - BUDGET)',
      monthlyValue: 0,
      rowType: 'HEADER',
    },
    {
      itemNumber: 25,
      itemName: 'Reserved',
      monthlyValue: 0,
      cumulativeValue: 0,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 26,
      itemName: 'Reserved',
      monthlyValue: 0,
      cumulativeValue: 0,
      rowType: 'DATA',
      format: 'currency',
    },
    {
      itemNumber: 27,
      itemName: 'Variance $',
      monthlyValue: varianceDollars,
      cumulativeValue: cumulativeInput
        ? (cumulativeCE - cumulativeInput.totalBudget)
        : undefined,
      rowType: 'TOTAL',
      formula: '#15 - #24',
      colorCode: varianceDollars >= 0 ? 'variance-negative' : 'variance-positive',
      format: 'currency',
    },
    {
      itemNumber: 28,
      itemName: 'Variance %',
      monthlyValue: variancePercent,
      cumulativeValue: cumulativeInput && cumulativeInput.totalBudget !== 0
        ? ((cumulativeCE - cumulativeInput.totalBudget) / cumulativeInput.totalBudget) * 100
        : undefined,
      rowType: 'TOTAL',
      formula: '#27 / #24 × 100',
      colorCode: variancePercent >= 0 ? 'variance-negative' : 'variance-positive',
      format: 'percent', // Explicit percent format
    },
  ]

  return {
    rows,
    kpis: {
      monthlyCE,
      pepmActual,
      budgetVariance: varianceDollars,
      cumulativeCE,
    },
  }
}

/**
 * Helper function to aggregate multiple months into cumulative C&E summary
 */
export function aggregateCESummary(inputs: CESummaryInput[]): CESummaryInput {
  if (inputs.length === 0) {
    throw new Error('Cannot aggregate empty inputs array')
  }
  
  return inputs.reduce((acc, curr) => ({
    domesticClaims: acc.domesticClaims + curr.domesticClaims,
    nonDomesticClaims: acc.nonDomesticClaims + curr.nonDomesticClaims,
    nonHospitalMedical: acc.nonHospitalMedical + curr.nonHospitalMedical,
    medicalSubtotal: acc.medicalSubtotal + curr.medicalSubtotal,
    medicalAdjustment: acc.medicalAdjustment + curr.medicalAdjustment,
    medicalTotal: acc.medicalTotal + curr.medicalTotal,
    rxClaims: acc.rxClaims + curr.rxClaims,
    rxRebates: acc.rxRebates + curr.rxRebates,
    stopLossPremiums: acc.stopLossPremiums + curr.stopLossPremiums,
    stopLossReimbursements: acc.stopLossReimbursements + curr.stopLossReimbursements,
    asoFees: acc.asoFees + curr.asoFees,
    stopLossCoordFees: acc.stopLossCoordFees + curr.stopLossCoordFees,
    adminTotal: acc.adminTotal + curr.adminTotal,
    employeeCount: curr.employeeCount, // Use latest month
    memberCount: curr.memberCount, // Use latest month
    budgetedClaims: acc.budgetedClaims + curr.budgetedClaims,
    budgetedFixed: acc.budgetedFixed + curr.budgetedFixed,
    totalBudget: acc.totalBudget + curr.totalBudget,
  }))
}
