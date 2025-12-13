'use client'

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react'

export interface DashboardContextType {
  clientId: string
  planYearId: string
  setPlanYearId: (planYearId: string) => void
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
  setPlanYearId: () => {},
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
  const DEFAULT_CLIENT_ID = 'demo-client-id'
  const DEFAULT_PLAN_YEAR_ID = 'demo-plan-year-id'
  const STORAGE_PLAN_YEAR_ID_KEY = 'mr.planYearId'

  // In a real app, clientId might come from auth/session.
  const [clientId] = useState(DEFAULT_CLIENT_ID)

  const [planYearId, setPlanYearIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_PLAN_YEAR_ID
    try {
      return window.localStorage.getItem(STORAGE_PLAN_YEAR_ID_KEY) || DEFAULT_PLAN_YEAR_ID
    } catch {
      return DEFAULT_PLAN_YEAR_ID
    }
  })

  const setPlanYearId = (nextPlanYearId: string) => {
    setPlanYearIdState(nextPlanYearId)
    try {
      window.localStorage.setItem(STORAGE_PLAN_YEAR_ID_KEY, nextPlanYearId)
    } catch {
      // ignore
    }
  }

  const [dateRange, setDateRange] = useState('ytd')
  const [plan, setPlan] = useState('all')
  const [benchmark, setBenchmark] = useState('budget')

  const resetFilters = () => {
    setDateRange('ytd')
    setPlan('all')
    setBenchmark('budget')
  }

  const value = useMemo(
    () => ({
      clientId,
      planYearId,
      setPlanYearId,
      dateRange,
      setDateRange,
      plan,
      setPlan,
      benchmark,
      setBenchmark,
      resetFilters,
    }),
    [clientId, planYearId, dateRange, plan, benchmark]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

