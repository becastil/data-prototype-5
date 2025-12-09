'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface DashboardContextType {
  clientId: string
  planYearId: string
  dateRange: string
  setDateRange: (range: string) => void
  plan: string
  setPlan: (plan: string) => void
  benchmark: string
  setBenchmark: (benchmark: string) => void
  resetFilters: () => void
}

const defaultContext: DashboardContextType = {
  clientId: 'demo-client-id',
  planYearId: 'demo-plan-year-id',
  dateRange: 'ytd',
  setDateRange: () => {},
  plan: 'all',
  setPlan: () => {},
  benchmark: 'budget',
  setBenchmark: () => {},
  resetFilters: () => {},
}

const DashboardContext = createContext<DashboardContextType>(defaultContext)

export function useDashboard() {
  return useContext(DashboardContext)
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  // In a real app, these might come from a prop or API
  const [clientId] = useState('demo-client-id')
  const [planYearId] = useState('demo-plan-year-id')
  
  const [dateRange, setDateRange] = useState('ytd')
  const [plan, setPlan] = useState('all')
  const [benchmark, setBenchmark] = useState('budget')

  const resetFilters = () => {
    setDateRange('ytd')
    setPlan('all')
    setBenchmark('budget')
  }

  const value = {
    clientId,
    planYearId,
    dateRange,
    setDateRange,
    plan,
    setPlan,
    benchmark,
    setBenchmark,
    resetFilters,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

