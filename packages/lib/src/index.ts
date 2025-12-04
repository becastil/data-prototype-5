// Types (browser-safe)
export * from './types'
// Explicit re-exports for proper TypeScript project reference support
// Enums need regular export (they are values), interfaces use export type
export { PlanType, ClaimantStatus, FuelGaugeStatus } from './types'
export type {
  MonthlyPlanData,
  MonthlyColumnsResult,
  PepmDataPoint,
  PlanYtdDataPoint,
  ClaimantBucket,
  HighClaimantResult,
} from './types'

// Formula engines (browser-safe)
export * from './formulas/monthly-columns'
export * from './formulas/pepm'
export * from './formulas/executive'
export * from './formulas/high-claimants'
export * from './formulas/ce-summary'
export * from './formulas/budget-vs-actuals'

// Parsers (browser-safe - no Node.js dependencies)
export * from './parsers/types'
export * from './parsers/csv-parser'
export * from './parsers/xlsx-parser'
// Explicit type exports for parser types (for TypeScript project reference support)
export type { ParsedRow, ParseResult, ValidationError, FileType, ReconciliationResult, UploadResult } from './parsers/types'

// PDF Export types only (browser-safe)
export * from './pdf/types'

// Note: PDF export implementation (PdfExporter, getPdfExporter) is available 
// via '@medical-reporting/lib/server' for server-side usage only

// Explicit type exports for C&E Summary (for TypeScript project reference support)
export type { CESummaryInput, CESummaryRow, CESummaryResult } from './formulas/ce-summary'

// Explicit type exports for Executive (for TypeScript project reference support)
export type { KpiStatus } from './formulas/executive'