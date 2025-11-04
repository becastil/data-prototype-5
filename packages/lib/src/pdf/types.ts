/**
 * PDF Export Types
 */

export interface PdfExportOptions {
  baseUrl: string
  clientId: string
  planYearId: string
  pages: string[]
  filename?: string
}

export interface PdfExportResult {
  success: boolean
  filename: string
  buffer?: Buffer
  error?: string
  pageCount: number
}

export type PagePath = 
  | '/dashboard/executive'
  | '/dashboard/monthly'
  | '/dashboard/hcc'
  | '/dashboard/plan/hdhp'
  | '/dashboard/plan/ppo-base'
  | '/dashboard/plan/ppo-buyup'
  | '/dashboard/inputs'
  | '/dashboard/summary'

