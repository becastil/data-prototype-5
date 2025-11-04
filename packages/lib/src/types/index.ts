export enum PlanType {
  ALL_PLANS = 'ALL_PLANS',
  HDHP = 'HDHP',
  PPO_BASE = 'PPO_BASE',
  PPO_BUYUP = 'PPO_BUYUP',
}

export enum ClaimantStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum FuelGaugeStatus {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export interface MonthlyPlanData {
  totalSubscribers: number
  medicalPaid: number // Column C
  rxPaid: number // Column D
  specStopLossReimb: number // Column F (negative)
  estRxRebates: number // Column G (negative)
  adminFees: number // Column I
  stopLossFees: number // Column J
  budgetedPremium: number // Column L
}

export interface MonthlyColumnsResult {
  totalPaid: number // E = C + D
  netPaid: number // H = E + F + G
  totalCost: number // K = H + I + J
  surplus: number // M = L - K
  percentOfBudget: number // N = K / L * 100
}

export interface PepmDataPoint {
  month: string
  current?: number
  prior?: number
}

export interface PlanYtdDataPoint {
  planName: string
  medical: number
  rx: number
  total: number
}

export interface ClaimantBucket {
  name: string
  value: number
  count: number
  color: string
}

export interface HighClaimantResult {
  claimantKey: string
  planId: string
  medPaid: number
  rxPaid: number
  totalPaid: number
  employerShare: number
  stopLossShare: number
  percentOfIsl: number
}
