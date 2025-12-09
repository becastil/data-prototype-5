/**
 * CSV Parser with validation
 * Uses PapaParse for CSV parsing with validation and reconciliation
 */

import type { ParsedRow, ValidationError, ParseResult, ReconciliationResult } from './types'

/**
 * Normalize field value: remove $, commas, trim whitespace
 */
function normalizeValue(value: string): string {
  if (typeof value !== 'string') return value
  return value.replace(/[$,]/g, '').trim()
}

/**
 * Parse a numeric value
 */
function parseNumeric(value: string | number): number | null {
  if (typeof value === 'number') return value
  if (value === '' || value === null || value === undefined) return null
  
  const normalized = normalizeValue(value)
  const parsed = parseFloat(normalized)
  
  return isNaN(parsed) ? null : parsed
}

/**
 * Validate required columns exist
 */
function validateHeaders(headers: string[], requiredColumns: string[]): ValidationError[] {
  const errors: ValidationError[] = []
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
  
  for (const required of requiredColumns) {
    const normalizedRequired = required.toLowerCase()
    if (!normalizedHeaders.includes(normalizedRequired)) {
      errors.push({
        row: 0,
        column: required,
        message: `Missing required column: ${required}`,
      })
    }
  }
  
  return errors
}

/**
 * Validate data types and ranges
 */
function validateDataTypes(
  data: ParsedRow[],
  numericColumns: string[],
  dateColumns: string[] = []
): ValidationError[] {
  const errors: ValidationError[] = []
  
  data.forEach((row, index) => {
    // Validate numeric columns
    numericColumns.forEach(col => {
      const value = row[col]
      if (value !== null && value !== undefined && value !== '') {
        const parsed = parseNumeric(value as string)
        if (parsed === null) {
          errors.push({
            row: index + 1,
            column: col,
            message: `Invalid numeric value: ${value}`,
            value,
          })
        } else if (parsed < 0 && !col.toLowerCase().includes('rebate') && 
                   !col.toLowerCase().includes('reimbursement') &&
                   !col.toLowerCase().includes('adjustment')) {
          errors.push({
            row: index + 1,
            column: col,
            message: `Negative value not allowed: ${value}`,
            value,
          })
        }
      }
    })
    
    // Validate date columns
    dateColumns.forEach(col => {
      const value = row[col]
      if (value) {
        const dateValue = new Date(value as string)
        if (isNaN(dateValue.getTime())) {
          errors.push({
            row: index + 1,
            column: col,
            message: `Invalid date format: ${value}`,
            value,
          })
        }
      }
    })
  })
  
  return errors
}

/**
 * Perform reconciliation check: sum of individual plans should equal "All Plans"
 */
function performReconciliation(
  data: ParsedRow[],
  planColumn: string = 'plan',
  valueColumns: string[] = ['medicalPaid', 'rxPaid']
): ReconciliationResult {
  const tolerance = 0.01
  
  // Find "All Plans" row
  const allPlansRow = data.find(row => {
    const plan = (row[planColumn] as string || '').toLowerCase()
    return plan.includes('all') && plan.includes('plan')
  })
  
  if (!allPlansRow) {
    return {
      passed: false,
      sumDetected: false,
      tolerance,
      allPlansTotal: 0,
      individualPlansTotal: 0,
      difference: 0,
      message: '"All Plans" row not found',
    }
  }
  
  // Get individual plan rows (exclude "All Plans")
  const individualRows = data.filter(row => {
    const plan = (row[planColumn] as string || '').toLowerCase()
    return !(plan.includes('all') && plan.includes('plan'))
  })
  
  // Calculate totals for each value column
  let allMatch = true
  let totalDifference = 0
  
  for (const valueCol of valueColumns) {
    const allPlansValue = parseNumeric(allPlansRow[valueCol] as string) || 0
    const individualSum = individualRows.reduce((sum, row) => {
      return sum + (parseNumeric(row[valueCol] as string) || 0)
    }, 0)
    
    const difference = Math.abs(allPlansValue - individualSum)
    totalDifference += difference
    
    if (difference > tolerance) {
      allMatch = false
    }
  }
  
  return {
    passed: allMatch,
    sumDetected: true,
    tolerance,
    allPlansTotal: parseNumeric(allPlansRow[valueColumns[0]] as string) || 0,
    individualPlansTotal: individualRows.reduce((sum, row) => 
      sum + (parseNumeric(row[valueColumns[0]] as string) || 0), 0
    ),
    difference: totalDifference,
    message: allMatch 
      ? 'Reconciliation passed: Sum of individual plans matches "All Plans"'
      : `Reconciliation failed: Difference of $${totalDifference.toFixed(2)} exceeds tolerance of $${tolerance}`,
  }
}


/**
 * Column mapping for monthly statistics
 */
const MONTHLY_COLUMN_MAPPING: Record<string, string> = {
  'plan': 'plan',
  'month': 'month',
  'subscribers': 'totalSubscribers',
  'medical paid': 'medicalPaid',
  'rx paid': 'rxPaid',
  'admin fees': 'adminFees',
  'stop loss fees': 'stopLossFees',
  'budgeted premium': 'budgetedPremium',
  'spec stop loss reimb': 'specStopLossReimb',
  'est rx rebates': 'estRxRebates',
}

/**
 * Parse CSV file for monthly statistics
 */
export function parseMonthlyCSV(csvContent: string): ParseResult {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, column: '', message: 'Empty file' }],
      warnings: [],
      preview: { rowCount: 0, columnCount: 0, columns: [], sampleRows: [] },
    }
  }
  
  // Parse headers
  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  // Map headers to internal keys
  const headers = rawHeaders.map(h => {
    const normalized = h.toLowerCase().trim()
    return MONTHLY_COLUMN_MAPPING[normalized] || h
  })
  
  // Required columns for monthly stats
  const requiredColumns = ['month', 'plan', 'medicalPaid', 'rxPaid']
  const numericColumns = [
    'medicalPaid', 'rxPaid', 'totalSubscribers', 'specStopLossReimb',
    'estRxRebates', 'adminFees', 'stopLossFees', 'budgetedPremium'
  ]
  
  // Validate headers
  let errors = validateHeaders(headers, requiredColumns)
  if (errors.length > 0) {
    return {
      success: false,
      data: [],
      errors,
      warnings: [],
      preview: { rowCount: 0, columnCount: headers.length, columns: headers, sampleRows: [] },
    }
  }
  
  // Parse data rows
  const data: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: ParsedRow = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      if (numericColumns.includes(header)) {
        row[header] = parseNumeric(value)
      } else {
        row[header] = value
      }
    })
    
    data.push(row)
  }
  
  // Validate data types
  errors = [...errors, ...validateDataTypes(data, numericColumns, ['month'])]
  
  const success = errors.length === 0
  
  return {
    success,
    data,
    errors,
    warnings: [],
    preview: {
      rowCount: data.length,
      columnCount: headers.length,
      columns: headers,
      sampleRows: data.slice(0, 10),
    },
  }
}

/**
 * Parse CSV file for high-cost claimants
 */
export function parseHCCCSV(csvContent: string): ParseResult {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, column: '', message: 'Empty file' }],
      warnings: [],
      preview: { rowCount: 0, columnCount: 0, columns: [], sampleRows: [] },
    }
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const requiredColumns = ['claimantKey', 'plan', 'medPaid', 'rxPaid', 'totalPaid']
  const numericColumns = ['medPaid', 'rxPaid', 'totalPaid', 'amountExceedingIsl']
  
  let errors = validateHeaders(headers, requiredColumns)
  if (errors.length > 0) {
    return {
      success: false,
      data: [],
      errors,
      warnings: [],
      preview: { rowCount: 0, columnCount: headers.length, columns: headers, sampleRows: [] },
    }
  }
  
  const data: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: ParsedRow = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      if (numericColumns.includes(header)) {
        row[header] = parseNumeric(value)
      } else {
        row[header] = value
      }
    })
    
    data.push(row)
  }
  
  errors = [...errors, ...validateDataTypes(data, numericColumns)]
  
  return {
    success: errors.length === 0,
    data,
    errors,
    warnings: [],
    preview: {
      rowCount: data.length,
      columnCount: headers.length,
      columns: headers,
      sampleRows: data.slice(0, 10),
    },
  }
}

/**
 * Parse CSV file for budget actuals
 */
export function parseBudgetCSV(csvContent: string): ParseResult {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, column: '', message: 'Empty file' }],
      warnings: [],
      preview: { rowCount: 0, columnCount: 0, columns: [], sampleRows: [] },
    }
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const requiredColumns = [
    'service_month',
    'domestic_facility_ip_op',
    'non_domestic_ip_op',
    'non_hospital_medical',
    'rx_claims',
    'ee_count_active_cobra',
    'member_count'
  ]
  const numericColumns = [
    'domestic_facility_ip_op',
    'non_domestic_ip_op',
    'non_hospital_medical',
    'rx_claims',
    'ee_count_active_cobra',
    'member_count'
  ]
  
  let errors = validateHeaders(headers, requiredColumns)
  if (errors.length > 0) {
    return {
      success: false,
      data: [],
      errors,
      warnings: [],
      preview: { rowCount: 0, columnCount: headers.length, columns: headers, sampleRows: [] },
    }
  }
  
  const data: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: ParsedRow = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      if (numericColumns.includes(header)) {
        row[header] = parseNumeric(value)
      } else {
        row[header] = value
      }
    })
    
    data.push(row)
  }
  
  errors = [...errors, ...validateDataTypes(data, numericColumns, ['service_month'])]
  
  return {
    success: errors.length === 0,
    data,
    errors,
    warnings: [],
    preview: {
      rowCount: data.length,
      columnCount: headers.length,
      columns: headers,
      sampleRows: data.slice(0, 10),
    },
  }
}

/**
 * Validate and reconcile monthly data
 */
export function validateAndReconcile(data: ParsedRow[]): ReconciliationResult {
  return performReconciliation(data, 'plan', ['medicalPaid', 'rxPaid'])
}

