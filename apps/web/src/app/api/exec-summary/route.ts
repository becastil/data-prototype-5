import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'

interface TrendDataPoint {
  period: string
  actual: number
  budget: number
  priorYear?: number
  isAlert?: boolean
  cost: number
  costBudget: number
  lossRatio: number
  lossRatioBudget: number
  pepm: number
  pepmBudget: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const planFilter = searchParams.get('plan') // 'all' or planId
    const dateRange = searchParams.get('dateRange') // 'ytd', 'last12', 'planYear'
    const benchmark = searchParams.get('benchmark') // 'budget', 'priorYear', 'both'

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // 0. Fetch Client and Plan Year Metadata
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    const planYear = await prisma.planYear.findUnique({ where: { id: planYearId } })

    // Determine Date Range
    let dateFilter: any = {}
    let startDate: Date | undefined
    let endDate: Date | undefined
    
    const now = new Date()
    
    if (dateRange === 'last12') {
      const oneYearAgo = new Date(now)
      oneYearAgo.setFullYear(now.getFullYear() - 1)
      startDate = oneYearAgo
      endDate = now
    } else {
      // Default to Plan Year (YTD)
      if (planYear) {
        startDate = planYear.yearStart
        endDate = planYear.yearEnd
      }
    }

    if (startDate && endDate) {
      dateFilter = {
        monthDate: {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // Determine Prior Date Range
    let priorDateFilter: any = {}
    if (startDate && endDate) {
        const priorStart = new Date(startDate)
        priorStart.setFullYear(priorStart.getFullYear() - 1)
        const priorEnd = new Date(endDate)
        priorEnd.setFullYear(priorEnd.getFullYear() - 1)
        priorDateFilter = {
            monthDate: {
                gte: priorStart,
                lte: priorEnd
            }
        }
    }

    // Determine Plan Filter
    let planWhere: any = { plan: { type: PlanType.ALL_PLANS } }
    if (planFilter && planFilter !== 'all') {
      planWhere = { planId: planFilter }
    } else {
       planWhere = { plan: { type: PlanType.ALL_PLANS } }
    }

    // 1. Fetch monthly snapshots
    const snapshots = await prisma.monthSnapshot.findMany({
      where: { 
        clientId, 
        planYearId,
        ...dateFilter
      },
      include: {
        monthlyStats: {
          where: planWhere
        }
      },
      orderBy: { monthDate: 'asc' }
    })

    // 1b. Fetch Prior Year snapshots (if needed for benchmark or trend)
    // We always fetch if we want to support 'Prior' or 'Both' or just show the line
    // Since we don't know the prior planYearId, we search by clientId and date
    // Note: prior data might belong to a different planYearId
    const priorSnapshots = await prisma.monthSnapshot.findMany({
        where: {
            clientId,
            ...priorDateFilter
        },
        include: {
            monthlyStats: {
                where: planWhere
            }
        },
        orderBy: { monthDate: 'asc' }
    })

    // Map prior snapshots by month index (0-11) or name for alignment
    // Use Month-Day key (e.g. "0-1" for Jan 1) to match relative position?
    // Or just match by Month index (0=Jan)
    const priorMap = new Map<number, number>() // Month (0-11) -> Total Cost
    
    priorSnapshots.forEach(snap => {
        const stats = snap.monthlyStats[0]
        if (stats) {
            const val = stats.medicalPaid.toNumber() + 
                        stats.rxPaid.toNumber() + 
                        stats.adminFees.toNumber() + 
                        stats.stopLossFees.toNumber() + 
                        stats.specStopLossReimb.toNumber() + 
                        stats.estRxRebates.toNumber()
            priorMap.set(snap.monthDate.getMonth(), val)
        }
    })


    // 2. Fetch High Cost Claimants
    let claimantWhere: any = { clientId, planYearId }
    if (planFilter && planFilter !== 'all') {
      claimantWhere.planId = planFilter
    }

    const claimants = await prisma.highClaimant.findMany({
      where: claimantWhere,
      orderBy: { totalPaid: 'desc' }
    })

    // 3. Calculate Trend Data & YTD Totals
    const trend: TrendDataPoint[] = []
    let ytdActual = 0
    let ytdBudget = 0
    let ytdPrior = 0
    let ytdFixed = 0
    let ytdMedical = 0
    let ytdRx = 0
    let ytdReimb = 0
    
    snapshots.forEach(snapshot => {
      const stats = snapshot.monthlyStats[0]
      if (!stats) return

      const med = stats.medicalPaid.toNumber()
      const rx = stats.rxPaid.toNumber()
      const fixed = stats.adminFees.toNumber() + stats.stopLossFees.toNumber()
      const rebates = stats.estRxRebates.toNumber()
      const reimb = stats.specStopLossReimb.toNumber()
      const subs = stats.totalSubscribers.toNumber() || 1

      const monthlyActual = med + rx + fixed + reimb + rebates
      const monthlyBudget = stats.budgetedPremium.toNumber()

      const monthIndex = snapshot.monthDate.getMonth()
      const monthlyPrior = priorMap.get(monthIndex) || 0

      ytdActual += monthlyActual
      ytdBudget += monthlyBudget
      ytdPrior += monthlyPrior
      ytdFixed += fixed
      ytdMedical += med
      ytdRx += (rx + rebates)
      ytdReimb += reimb

      const monthName = snapshot.monthDate.toLocaleString('default', { month: 'short' })
      
      trend.push({
        period: monthName,
        actual: monthlyActual,
        budget: monthlyBudget,
        priorYear: monthlyPrior,
        isAlert: monthlyActual > monthlyBudget,
        cost: monthlyActual,
        costBudget: monthlyBudget,
        lossRatio: monthlyBudget ? (monthlyActual / monthlyBudget) * 100 : 0,
        lossRatioBudget: 85,
        pepm: monthlyActual / subs,
        pepmBudget: monthlyBudget / subs
      })
    })

    // 4. Calculate HCC Component
    let hccExcessTotal = 0
    claimants.forEach(c => {
      if (c.amountExceedingIsl) {
        hccExcessTotal += c.amountExceedingIsl.toNumber()
      }
    })

    // 5. Adjust Medical/Rx
    const adjustedMedical = Math.max(0, ytdMedical - hccExcessTotal)

    // 6. Calculate Component Budgets
    const budgetFixed = ytdBudget * 0.20
    const budgetHcc = ytdBudget * 0.15
    const budgetRx = ytdBudget * 0.20
    const budgetMed = ytdBudget * 0.45

    // 7. HCC Summary Stats
    const totalClaimantsCount = 1200
    const topClaimantsTotal = claimants.reduce((sum, c) => sum + c.totalPaid.toNumber(), 0)
    
    // 8. Metadata
    const renewalStart = planYear?.yearStart 
      ? new Date(planYear.yearStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : ''
    const renewalEnd = planYear?.yearEnd 
      ? new Date(planYear.yearEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : ''
    const renewalPeriod = renewalStart && renewalEnd ? `${renewalStart} - ${renewalEnd}` : 'N/A'

    let experiencePeriod = 'N/A'
    if (snapshots.length > 0) {
      const start = snapshots[0].monthDate
      const end = snapshots[snapshots.length - 1].monthDate
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      experiencePeriod = `${fmt(start)} - ${fmt(end)}`
    }

    // 9. Construct Response with Benchmark Logic
    let comparisonValue = ytdBudget

    if (benchmark === 'priorYear') {
        comparisonValue = ytdPrior
    } else if (benchmark === 'both') {
        comparisonValue = ytdBudget // Default to budget for variance calc, but show both in UI?
    }

    const variance = ytdActual - comparisonValue
    
    // Check if we have any data
    const hasData = snapshots.length > 0
    
    const response = {
      hasData,
      meta: {
        // Intentionally avoid exposing tenant/customer-specific names in the UI
        clientName: 'Client',
        renewalPeriod,
        experiencePeriod
      },
      ytd: {
        totalCost: ytdActual,
        budgetedCost: comparisonValue, // This changes label meaning if priorYear
        variance: variance,
        variancePercent: comparisonValue ? (variance / comparisonValue) * 100 : 0,
        lossRatio: ytdBudget ? (ytdActual / ytdBudget) * 100 : 0, // LR always vs Premium? Yes usually.
        percentOfBudget: comparisonValue ? (ytdActual / comparisonValue) * 100 : 0
      },
      components: {
        fixed: { 
          actual: ytdFixed, 
          budget: budgetFixed, 
          percentOfTotal: ytdActual ? (ytdFixed / ytdActual) * 100 : 0 
        },
        medical: { 
          actual: adjustedMedical, 
          budget: budgetMed, 
          percentOfTotal: ytdActual ? (adjustedMedical / ytdActual) * 100 : 0 
        },
        pharmacy: { 
          actual: ytdRx, 
          budget: budgetRx, 
          percentOfTotal: ytdActual ? (ytdRx / ytdActual) * 100 : 0 
        },
        hcc: { 
          actual: hccExcessTotal + ytdReimb, 
          budget: budgetHcc, 
          percentOfTotal: ytdActual ? ((hccExcessTotal + ytdReimb) / ytdActual) * 100 : 0 
        }
      },
      trend,
      hccSummary: {
        topClaimantCount: claimants.length,
        topClaimantPercent: ytdActual ? (topClaimantsTotal / ytdActual) * 100 : 0,
        totalClaimants: totalClaimantsCount,
        buckets: [
          {
            label: 'Claimants > ISL',
            count: claimants.length,
            totalCost: topClaimantsTotal,
            percentOfTotal: ytdActual ? (topClaimantsTotal / ytdActual) * 100 : 0
          }
        ],
        stopLossThreshold: 200000
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in exec-summary API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
