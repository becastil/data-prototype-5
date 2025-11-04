import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calculateExecutiveYtd,
  calculateMedVsRxSplit,
  calculateClaimantBuckets,
  calculatePlanMix,
} from '@medical-reporting/lib'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const through = searchParams.get('through') // YYYY-MM format

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Get plan year
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
    })

    if (!planYear || planYear.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan year not found' }, { status: 404 })
    }

    // Determine end date
    const endDate = through
      ? new Date(through + '-01')
      : new Date() // Use current date if not specified

    // Get monthly snapshots up to end date
    const snapshots = await prisma.monthSnapshot.findMany({
      where: {
        clientId,
        planYearId,
        monthDate: {
          lte: endDate,
        },
      },
      include: {
        monthlyStats: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        monthDate: 'asc',
      },
    })

    // Flatten and aggregate monthly data for "All Plans"
    const allPlansData = snapshots.flatMap((snapshot) =>
      snapshot.monthlyStats.map((stat) => ({
        budgetedPremium: Number(stat.budgetedPremium),
        medicalPaid: Number(stat.medicalPaid),
        rxPaid: Number(stat.rxPaid),
        specStopLossReimb: Number(stat.specStopLossReimb),
        estRxRebates: Number(stat.estRxRebates),
        adminFees: Number(stat.adminFees),
        stopLossFees: Number(stat.stopLossFees),
      }))
    )

    // Calculate YTD totals
    const ytdTotals = calculateExecutiveYtd(allPlansData)

    // Get plan-specific totals for mix
    const plans = await prisma.plan.findMany({
      where: { clientId, type: { not: 'ALL_PLANS' } },
    })

    const planMixData = await Promise.all(
      plans.map(async (plan) => {
        const planStats = snapshots.flatMap((snapshot) => {
          const stat = snapshot.monthlyStats.find((s) => s.planId === plan.id)
          if (!stat) return []
          return [
            {
              budgetedPremium: Number(stat.budgetedPremium),
              medicalPaid: Number(stat.medicalPaid),
              rxPaid: Number(stat.rxPaid),
              specStopLossReimb: Number(stat.specStopLossReimb),
              estRxRebates: Number(stat.estRxRebates),
              adminFees: Number(stat.adminFees),
              stopLossFees: Number(stat.stopLossFees),
            },
          ]
        })

        const planYtd = calculateExecutiveYtd(planStats)
        return {
          planName: plan.name,
          totalCost: planYtd.totalCost,
        }
      })
    )

    const planMix = calculatePlanMix(planMixData)

    // Calculate Med vs Rx split
    const medVsRx = calculateMedVsRxSplit(ytdTotals.medicalPaid, ytdTotals.rxPaid)

    // Get high-cost claimants for buckets
    const claimants = await prisma.highClaimant.findMany({
      where: {
        clientId,
        planYearId,
      },
    })

    const claimantBuckets = calculateClaimantBuckets(
      claimants.map((c) => ({ totalPaid: Number(c.totalPaid) }))
    )

    return NextResponse.json({
      ytd: ytdTotals,
      planMix,
      medVsRx,
      claimantBuckets,
    })
  } catch (error) {
    console.error('Error in exec-summary API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
