
export interface SkeletonLoaderProps {
  className?: string
  lines?: number
  variant?: 'text' | 'card' | 'table' | 'chart'
}

export function SkeletonLoader({
  className = '',
  lines = 3,
  variant = 'text',
}: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div
        className={`animate-pulse rounded-lg border border-slate-800 bg-slate-900/50 p-6 ${className}`}
      >
        <div className="mb-4 h-6 w-1/3 rounded bg-slate-700" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-700" />
          <div className="h-4 w-5/6 rounded bg-slate-700" />
          <div className="h-4 w-4/6 rounded bg-slate-700" />
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-4 border-b border-slate-800 pb-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 flex-1 rounded bg-slate-700" />
            ))}
          </div>
          {/* Rows */}
          {[...Array(lines)].map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {[...Array(6)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 flex-1 rounded bg-slate-700" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div
        className={`animate-pulse rounded-lg border border-slate-800 bg-slate-900/50 p-6 ${className}`}
      >
        <div className="mb-4 h-6 w-1/4 rounded bg-slate-700" />
        <div className="h-64 w-full rounded bg-slate-700" />
      </div>
    )
  }

  // Default text variant
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-slate-700 ${i === lines - 1 ? 'w-5/6' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
