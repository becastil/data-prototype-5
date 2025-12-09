import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TrendDataPoint {
  period: string
  actual: number
  budget: number
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

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // 0. Fetch Client and Plan Year Metadata
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    const planYear = await prisma.planYear.findUnique({ where: { id: planYearId } })

    // 1. Fetch all monthly snapshots for the plan year (ordered by date)
    const snapshots = await prisma.monthSnapshot.findMany({
      where: { clientId, planYearId },
      include: {
        monthlyStats: {
          where: { plan: { type: 'ALL_PLANS' } }
        }
      },
      orderBy: { monthDate: 'asc' }
    })

    // 2. Fetch High Cost Claimants
    const claimants = await prisma.highClaimant.findMany({
      where: { clientId, planYearId },
      orderBy: { totalPaid: 'desc' }
    })

    // 3. Calculate Trend Data & YTD Totals
    const trend: TrendDataPoint[] = []
    let ytdActual = 0
    let ytdBudget = 0
    let ytdFixed = 0
    let ytdMedical = 0
    let ytdRx = 0
    
    // For months that have passed (snapshots exist)
    snapshots.forEach(snapshot => {
      const stats = snapshot.monthlyStats[0]
      if (!stats) return

      const med = stats.medicalPaid.toNumber()
      const rx = stats.rxPaid.toNumber()
      const fixed = stats.adminFees.toNumber() + stats.stopLossFees.toNumber()
      const rebates = stats.estRxRebates.toNumber()
      const reimb = stats.specStopLossReimb.toNumber()
      const subs = stats.totalSubscribers.toNumber() || 1 // Avoid div by 0

      const monthlyActual = med + rx + fixed + reimb + rebates
      const monthlyBudget = stats.budgetedPremium.toNumber()
      const monthlyClaims = monthlyActual - fixed // Approx claims for Loss Ratio

      ytdActual += monthlyActual
      ytdBudget += monthlyBudget
      ytdFixed += fixed
      ytdMedical += med
      ytdRx += (rx + rebates)

      const monthName = snapshot.monthDate.toLocaleString('default', { month: 'short' })
      
      trend.push({
        period: monthName,
        actual: monthlyActual,
        budget: monthlyBudget,
        isAlert: monthlyActual > monthlyBudget,
        cost: monthlyActual,
        costBudget: monthlyBudget,
        lossRatio: monthlyBudget ? (monthlyClaims / monthlyBudget) * 100 : 0,
        lossRatioBudget: 85, // Target LR
        pepm: monthlyActual / subs,
        pepmBudget: monthlyBudget / subs
      })
    })

    // 4. Calculate HCC Component (Excess Risk)
    let hccExcessTotal = 0
    claimants.forEach(c => {
      if (c.amountExceedingIsl) {
        hccExcessTotal += c.amountExceedingIsl.toNumber()
      }
    })

    // 5. Adjust Medical/Rx to be "Attritional" (remove HCC excess)
    const adjustedMedical = ytdMedical - hccExcessTotal

    // 6. Calculate Component Budgets
    const budgetFixed = ytdBudget * 0.20
    const budgetHcc = ytdBudget * 0.15
    const budgetRx = ytdBudget * 0.20
    const budgetMed = ytdBudget * 0.45

    // 7. HCC Summary Stats
    const totalClaimantsCount = 1200
    const topClaimantsTotal = claimants.reduce((sum, c) => sum + c.totalPaid.toNumber(), 0)
    
    // 8. Metadata Construction
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

    // 9. Construct Response
    const variance = ytdActual - ytdBudget
    const response = {
      meta: {
        clientName: client?.name || 'Unknown Client',
        renewalPeriod,
        experiencePeriod
      },
      ytd: {
        totalCost: ytdActual,
        budgetedCost: ytdBudget,
        variance: variance,
        variancePercent: ytdBudget ? (variance / ytdBudget) * 100 : 0,
        lossRatio: ytdBudget ? ((ytdActual - ytdFixed) / ytdBudget) * 100 : 0,
        percentOfBudget: ytdBudget ? (ytdActual / ytdBudget) * 100 : 0
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
          actual: hccExcessTotal, 
          budget: budgetHcc, 
          percentOfTotal: ytdActual ? (hccExcessTotal / ytdActual) * 100 : 0 
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
