'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavItem {
  href: string
  label: string
}

export interface TopNavProps {
  items: NavItem[]
  logo?: React.ReactNode
  rightContent?: React.ReactNode
}

export function TopNav({ items, logo, rightContent }: TopNavProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo || (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-lg font-bold text-primary-blue hidden sm:block">
                  Dashboard
                </span>
              </Link>
            )}
          </div>

          {/* Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${
                    isActive ? 'nav-pill-active' : 'nav-pill-inactive'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Content (Export, Settings, etc.) */}
          <div className="flex items-center gap-3">
            {rightContent}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <nav className="flex overflow-x-auto px-4 py-2 gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pill whitespace-nowrap ${
                  isActive ? 'nav-pill-active' : 'nav-pill-inactive'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}












