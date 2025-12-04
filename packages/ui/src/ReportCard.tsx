import * as React from 'react'

export interface ReportCardProps {
  title?: string
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  action?: React.ReactNode
}

export function ReportCard({ 
  title, 
  children, 
  className = '',
  noPadding = false,
  action,
}: ReportCardProps) {
  return (
    <div
      className={`card ${noPadding ? '' : 'p-6'} ${className}`}
    >
      {(title || action) && (
        <div className={`flex items-center justify-between ${noPadding ? 'px-6 pt-6' : ''} ${title ? 'mb-4' : ''}`}>
          {title && (
            <h2 className="text-card-title text-text-primary">{title}</h2>
          )}
          {action && (
            <div>{action}</div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
