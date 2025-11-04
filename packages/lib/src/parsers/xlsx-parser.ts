/**
 * XLSX Parser
 * Uses xlsx library to parse Excel files and converts to CSV format for validation
 */

import type { ParseResult } from './types'
import { parseMonthlyCSV, parseHCCCSV, parseBudgetCSV } from './csv-parser'

/**
 * Convert XLSX buffer to CSV string
 * This is a placeholder - actual implementation will use xlsx library in the API route
 */
export function xlsxToCSV(_buffer: Buffer, _sheetName?: string): string {
  // This function will be implemented in the API route using the xlsx library
  // because it's a Node.js-specific library
  throw new Error('xlsxToCSV should be called from server-side code')
}

/**
 * Parse XLSX file for monthly statistics
 * This delegates to CSV parser after conversion
 */
export function parseMonthlyXLSX(csvContent: string): ParseResult {
  return parseMonthlyCSV(csvContent)
}

/**
 * Parse XLSX file for high-cost claimants
 */
export function parseHCCXLSX(csvContent: string): ParseResult {
  return parseHCCCSV(csvContent)
}

/**
 * Parse XLSX file for budget actuals
 */
export function parseBudgetXLSX(csvContent: string): ParseResult {
  return parseBudgetCSV(csvContent)
}

/**
 * Detect file type from buffer (CSV vs XLSX)
 */
export function detectFileType(buffer: Buffer): 'csv' | 'xlsx' | 'unknown' {
  // Check for Excel file signatures
  if (buffer.length < 4) return 'unknown'
  
  // XLSX (ZIP-based) starts with PK
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    return 'xlsx'
  }
  
  // XLS (OLE2) starts with D0 CF 11 E0
  if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
    return 'xlsx'
  }
  
  // Assume CSV if text-based
  const sample = buffer.slice(0, 100).toString('utf-8')
  if (/^[a-zA-Z0-9,\s"'\-_]+/.test(sample)) {
    return 'csv'
  }
  
  return 'unknown'
}

