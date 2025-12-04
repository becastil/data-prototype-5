import * as React from 'react'

export type SkeletonVariant = 'text' | 'card' | 'chart' | 'circle' | 'metric'

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant
  className?: string
  count?: number
}

export function SkeletonLoader({
  variant = 'text',
  className = '',
  count = 1,
}: SkeletonLoaderProps) {
  const baseStyles = 'shimmer rounded'

  const variantStyles: Record<SkeletonVariant, string> = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    chart: 'h-64 w-full rounded-xl',
    circle: 'h-12 w-12 rounded-full',
    metric: 'h-24 w-full rounded-xl',
  }

  const renderSkeleton = () => (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
  )

  if (count === 1) {
    return renderSkeleton()
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
      ))}
    </div>
  )
}

// Compound skeleton for hero metrics
export function HeroMetricSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <div className="shimmer h-3 w-24 rounded" />
      <div className="shimmer h-12 w-32 rounded" />
      <div className="shimmer h-3 w-20 rounded" />
    </div>
  )
}

// Compound skeleton for cost breakdown cards
export function CostBreakdownSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-4 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-full rounded-full" />
      </div>
      <div className="shimmer h-8 w-full rounded" />
    </div>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <HeroMetricSkeleton key={i} />
        ))}
      </div>
      
      {/* Cost breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <CostBreakdownSkeleton key={i} />
        ))}
      </div>
      
      {/* Chart */}
      <div className="card p-6">
        <div className="shimmer h-4 w-32 rounded mb-6" />
        <div className="shimmer h-80 w-full rounded-lg" />
      </div>
    </div>
  )
}
