'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'

export interface TooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      
      // Prefer top, but use bottom if not enough space
      setPosition(spaceAbove < 100 && spaceBelow > spaceAbove ? 'bottom' : 'top')
    }
  }, [isVisible])

  const defaultTrigger = (
    <button
      ref={triggerRef}
      type="button"
      className="inline-flex items-center justify-center w-4 h-4 text-text-muted hover:text-text-secondary transition-colors"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-label="More information"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  )

  return (
    <div className="relative inline-flex">
      {children || defaultTrigger}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 w-64 p-3 text-sm bg-gallagher-blue text-white rounded-lg shadow-elevated
            ${position === 'top' 
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' 
              : 'top-full mt-2 left-1/2 -translate-x-1/2'
            }
          `}
        >
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 bg-gallagher-blue transform rotate-45
              ${position === 'top' 
                ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' 
                : 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
              }
            `}
          />
          
          {/* Content */}
          <div className="relative">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

// Named export for inline definitions
export interface DefinitionTooltipProps {
  term: string
  definition: string
  formula?: string
}

export function DefinitionTooltip({ term, definition, formula }: DefinitionTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <div className="font-semibold">{term}</div>
          <div className="text-white/90">{definition}</div>
          {formula && (
            <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded mt-2">
              {formula}
            </div>
          )}
        </div>
      }
    />
  )
}











