
export interface StatusPillProps {
  status: 'on-our-way' | 'up-to-date' | 'needs-review'
  label?: string
}

export function StatusPill({ status, label }: StatusPillProps) {
  const config = {
    'on-our-way': {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      label: label || 'On our way',
    },
    'up-to-date': {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      dot: 'bg-blue-500',
      label: label || 'Up to date',
    },
    'needs-review': {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      dot: 'bg-yellow-500',
      label: label || 'Needs review',
    },
  }

  const { bg, text, dot, label: pillLabel } = config[status]

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${bg}`}>
      {status === 'on-our-way' && (
        <div className="flex gap-1">
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${dot} [animation-delay:0ms]`} />
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${dot} [animation-delay:150ms]`} />
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${dot} [animation-delay:300ms]`} />
        </div>
      )}
      {status !== 'on-our-way' && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      <span className={`text-xs font-medium ${text}`}>{pillLabel}</span>
    </div>
  )
}
