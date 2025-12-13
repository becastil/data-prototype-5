import * as React from 'react'

export type StatusType = 'up-to-date' | 'outdated' | 'processing' | 'error' | 'idle'

export interface StatusPillProps {
  status: StatusType
  label?: string
  className?: string
}

export function StatusPill({ status, label, className = '' }: StatusPillProps) {
  const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    'up-to-date': {
      bg: 'bg-primary-blue-lighter',
      text: 'text-primary-blue',
      dot: 'bg-primary-blue',
      defaultLabel: 'Up to date',
    },
    'outdated': {
      bg: 'bg-accent-orange-light',
      text: 'text-accent-orange',
      dot: 'bg-accent-orange',
      defaultLabel: 'Outdated',
    },
    'processing': {
      bg: 'bg-gray-100',
      text: 'text-text-muted',
      dot: 'bg-text-muted animate-pulse',
      defaultLabel: 'Processing',
    },
    'error': {
      bg: 'bg-accent-orange-light',
      text: 'text-accent-orange',
      dot: 'bg-accent-orange',
      defaultLabel: 'Error',
    },
    'idle': {
      bg: 'bg-gray-100',
      text: 'text-text-muted',
      dot: 'bg-gray-400',
      defaultLabel: 'Idle',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label || config.defaultLabel}
    </span>
  )
}
