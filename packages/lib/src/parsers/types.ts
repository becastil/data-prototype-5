/**
 * Shared types for file parsers
 */

export interface ParsedRow {
  [key: string]: string | number | null
}

export interface ValidationError {
  row: number
  column: string
  message: string
  value?: any
}

export type FileType = 'monthly' | 'hcc' | 'inputs' | 'budget'

export interface ParseResult<T = ParsedRow> {
  success: boolean
  data: T[]
  errors: ValidationError[]
  warnings: string[]
  preview: {
    rowCount: number
    columnCount: number
    columns: string[]
    sampleRows: T[]
  }
}

export interface ReconciliationResult {
  passed: boolean
  sumDetected: boolean
  tolerance: number
  allPlansTotal: number
  individualPlansTotal: number
  difference: number
  message: string
}

export interface UploadResult extends ParseResult {
  validation: {
    dataRows: number
    sumRowDetected: boolean
    sumValidationPassed: boolean
    reconciliation?: ReconciliationResult
  }
  fileType: FileType
  detectedMonths?: string[]
  detectedPlans?: string[]
}

