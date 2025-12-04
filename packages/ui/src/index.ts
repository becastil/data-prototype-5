// Core components
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { ReportCard } from './ReportCard'
export type { ReportCardProps } from './ReportCard'

export { StatusPill } from './StatusPill'
export type { StatusPillProps, StatusType } from './StatusPill'

export { SkeletonLoader, HeroMetricSkeleton, CostBreakdownSkeleton, DashboardSkeleton } from './SkeletonLoader'
export type { SkeletonLoaderProps, SkeletonVariant } from './SkeletonLoader'

export { ErrorBoundary } from './ErrorBoundary'

// Metric components
export { KpiPill } from './KpiPill'
export type { KpiPillProps, KpiStatus } from './KpiPill'

export { HeroMetricTile } from './HeroMetricTile'
export type { HeroMetricTileProps, HeroMetricStatus } from './HeroMetricTile'

export { CostBreakdownCard } from './CostBreakdownCard'
export type { CostBreakdownCardProps } from './CostBreakdownCard'

export { FuelGauge, FuelGaugeStatus } from './FuelGauge'
export type { FuelGaugeProps } from './FuelGauge'

// Chart components
export { PlanYtdChart } from './PlanYtdChart'
export { PepmTrendChart } from './PepmTrendChart'
export { ClaimantDistributionChart } from './ClaimantDistributionChart'
export { TrendChart } from './TrendChart'
export type { TrendChartProps, TrendDataPoint, MetricType } from './TrendChart'

export { HighCostClaimantSummary } from './HighCostClaimantSummary'
export type { HighCostClaimantSummaryProps, ClaimantBucket } from './HighCostClaimantSummary'

// Navigation & Layout
export { TopNav } from './TopNav'
export type { TopNavProps, NavItem } from './TopNav'

export { FilterBar } from './FilterBar'
export type { FilterBarProps } from './FilterBar'

// Utility components
export { Tooltip, DefinitionTooltip } from './Tooltip'
export type { TooltipProps, DefinitionTooltipProps } from './Tooltip'

export { InsightsPanel, generateInsights } from './InsightsPanel'
export type { InsightsPanelProps, Insight } from './InsightsPanel'
