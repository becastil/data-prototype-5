import React from 'react'
import { Button } from './Button'

export interface EmptyStatePlaceholderProps {
  title?: string
  message?: string
  onAction?: () => void
  actionLabel?: string
}

export const EmptyStatePlaceholder = ({
  title = 'No Data Available',
  message = 'Please upload data to view this report.',
  onAction,
  actionLabel = 'Upload Data'
}: EmptyStatePlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-12 text-center h-[50vh]">
      <div className="rounded-full bg-slate-800 p-4 mb-4">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-slate-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400 mb-6">{message}</p>
      {onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}

