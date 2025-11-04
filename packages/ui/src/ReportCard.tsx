import React from 'react'

export interface ReportCardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function ReportCard({ title, children, className = '' }: ReportCardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-slate-200">{title}</h2>
      )}
      {children}
    </div>
  )
}
