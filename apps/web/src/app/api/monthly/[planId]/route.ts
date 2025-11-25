import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calculateMonthlyColumns,
  calculatePepm,
  split24Months,
  createPepmTrendData,
} from '@medical-reporting/lib'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const through = searchParams.get('through')

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    const planId = params.planId

    // Verify plan belongs to client
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan || plan.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get plan year
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
    })

    if (!planYear || planYear.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan year not found' }, { status: 404 })
    }

    // Determine end date
    const endDate = through ? new Date(through + '-01') : new Date()

    // Get monthly snapshots (up to 24 months) for this plan only
    const snapshots = await prisma.monthSnapshot.findMany({
      where: {
        clientId,
        planYearId,
        monthDate: {
          lte: endDate,
        },
        monthlyStats: {
          some: {
            planId,
          },
        },
      },
      include: {
        monthlyStats: {
          where: {
            planId,
          },
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        monthDate: 'desc',
      },
      take: 24,
    })

    // Reverse to get chronological order
    snapshots.reverse()

    // Process monthly data for this plan
    const monthlyData = snapshots
      .filter((snapshot) => snapshot.monthlyStats.length > 0)
      .map((snapshot) => {
        const stat = snapshot.monthlyStats[0] // Should only be one per plan per snapshot
        const monthKey = format(snapshot.monthDate, 'yyyy-MM')

        const aggregated = {
          totalSubscribers: Number(stat.totalSubscribers),
          medicalPaid: Number(stat.medicalPaid),
          rxPaid: Number(stat.rxPaid),
          specStopLossReimb: Number(stat.specStopLossReimb),
          estRxRebates: Number(stat.estRxRebates),
          adminFees: Number(stat.adminFees),
          stopLossFees: Number(stat.stopLossFees),
          budgetedPremium: Number(stat.budgetedPremium),
        }

        const columns = calculateMonthlyColumns(aggregated)

        return {
          month: monthKey,
          ...aggregated,
          ...columns,
        }
      })

    // Calculate PEPM trends
    const { current12, prior12 } = split24Months(
      monthlyData.map((m) => ({ month: m.month, value: m }))
    )

    const currentMedicalTotal = current12.reduce(
      (sum: number, m) => sum + m.value.medicalPaid,
      0
    )
    const currentRxTotal = current12.reduce((sum: number, m) => sum + m.value.rxPaid, 0)
    const currentSubscriberMonths = current12.reduce(
      (sum: number, m) => sum + m.value.totalSubscribers,
      0
    )

    const priorMedicalTotal = prior12.reduce(
      (sum: number, m) => sum + m.value.medicalPaid,
      0
    )
    const priorRxTotal = prior12.reduce((sum: number, m) => sum + m.value.rxPaid, 0)
    const priorSubscriberMonths = prior12.reduce(
      (sum: number, m) => sum + m.value.totalSubscribers,
      0
    )

    const medicalPepm = {
      current: calculatePepm(
        currentMedicalTotal,
        currentSubscriberMonths,
        current12.length || 12
      ),
      prior: calculatePepm(
        priorMedicalTotal,
        priorSubscriberMonths,
        prior12.length || 12
      ),
    }

    const rxPepm = {
      current: calculatePepm(
        currentRxTotal,
        currentSubscriberMonths,
        current12.length || 12
      ),
      prior: calculatePepm(priorRxTotal, priorSubscriberMonths, prior12.length || 12),
    }

    // Create trend data
    const medicalTrend = createPepmTrendData(
      monthlyData.map((m) => m.month),
      Object.fromEntries(
        current12.map((m) => [
          m.month,
          calculatePepm(m.value.medicalPaid, m.value.totalSubscribers, 1),
        ])
      ),
      Object.fromEntries(
        prior12.map((m) => [
          m.month,
          calculatePepm(m.value.medicalPaid, m.value.totalSubscribers, 1),
        ])
      )
    )

    const rxTrend = createPepmTrendData(
      monthlyData.map((m) => m.month),
      Object.fromEntries(
        current12.map((m) => [
          m.month,
          calculatePepm(m.value.rxPaid, m.value.totalSubscribers, 1),
        ])
      ),
      Object.fromEntries(
        prior12.map((m) => [
          m.month,
          calculatePepm(m.value.rxPaid, m.value.totalSubscribers, 1),
        ])
      )
    )

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        type: plan.type,
      },
      monthlyData,
      pepm: {
        medical: medicalPepm,
        rx: rxPepm,
      },
      trends: {
        medical: medicalTrend,
        rx: rxTrend,
      },
    })
  } catch (error) {
    console.error('Error in monthly/[planId] API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

