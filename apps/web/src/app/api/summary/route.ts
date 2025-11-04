import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateCESummary, aggregateCESummary, type CESummaryInput } from '@medical-reporting/lib'

/**
 * POST /api/summary
 * Calculate C&E Summary for a given month range
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, planYearId, through } = body

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Fetch monthly snapshots up to the specified month
    const snapshots = await prisma.monthSnapshot.findMany({
      where: {
        clientId,
        planYearId,
        ...(through && { monthDate: { lte: new Date(through + '-01') } }),
      },
      include: {
        monthlyStats: {
          where: {
            plan: {
              type: 'ALL_PLANS',
            },
          },
        },
      },
      orderBy: { monthDate: 'asc' },
    })

    if (snapshots.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified period' },
        { status: 404 }
      )
    }

    // Fetch user adjustments for rows #6, #9, #11
    const adjustments = await prisma.userAdjustment.findMany({
      where: {
        clientId,
        planYearId,
        itemNumber: { in: [6, 9, 11] },
      },
    })

    // Calculate monthly C&E summaries
    const monthlyResults = await Promise.all(
      snapshots.map(async (snapshot) => {
        const stats = snapshot.monthlyStats[0]
        if (!stats) return null

        // Get adjustments for this month
        const monthAdj = adjustments.filter(
          (adj) => adj.monthDate.toISOString().substring(0, 7) === 
                   snapshot.monthDate.toISOString().substring(0, 7)
        )

        const medAdj = monthAdj.find((a) => a.itemNumber === 6)?.amount.toNumber() || 0
        const rxRebates = monthAdj.find((a) => a.itemNumber === 9)?.amount.toNumber() || 0
        const slReimb = monthAdj.find((a) => a.itemNumber === 11)?.amount.toNumber() || 0

        const input: CESummaryInput = {
          domesticClaims: stats.medicalPaid.toNumber() * 0.5, // Approximate split
          nonDomesticClaims: stats.medicalPaid.toNumber() * 0.2,
          nonHospitalMedical: stats.medicalPaid.toNumber() * 0.3,
          medicalSubtotal: stats.medicalPaid.toNumber(),
          medicalAdjustment: medAdj,
          medicalTotal: stats.medicalPaid.toNumber() + medAdj,
          rxClaims: stats.rxPaid.toNumber(),
          rxRebates: rxRebates,
          stopLossPremiums: stats.stopLossFees.toNumber(),
          stopLossReimbursements: slReimb,
          asoFees: stats.adminFees.toNumber() * 0.7, // Approximate split
          stopLossCoordFees: stats.adminFees.toNumber() * 0.3,
          adminTotal: stats.adminFees.toNumber(),
          employeeCount: Math.floor(stats.totalSubscribers.toNumber() / 2.2),
          memberCount: stats.totalSubscribers.toNumber(),
          budgetedClaims: stats.budgetedPremium.toNumber() * 0.85,
          budgetedFixed: stats.budgetedPremium.toNumber() * 0.15,
          totalBudget: stats.budgetedPremium.toNumber(),
        }

        return {
          month: snapshot.monthDate.toISOString().substring(0, 7),
          ...calculateCESummary(input),
        }
      })
    )

    const validResults = monthlyResults.filter((r) => r !== null)

    // Calculate cumulative (YTD)
    const cumulativeInputs: CESummaryInput[] = validResults.map((r) => {
      // Extract input from first result for aggregation
      const stats = snapshots[validResults.indexOf(r)].monthlyStats[0]
      const monthAdj = adjustments.filter(
        (adj) => adj.monthDate.toISOString().substring(0, 7) === 
                 snapshots[validResults.indexOf(r)].monthDate.toISOString().substring(0, 7)
      )

      const medAdj = monthAdj.find((a) => a.itemNumber === 6)?.amount.toNumber() || 0
      const rxRebates = monthAdj.find((a) => a.itemNumber === 9)?.amount.toNumber() || 0
      const slReimb = monthAdj.find((a) => a.itemNumber === 11)?.amount.toNumber() || 0

      return {
        domesticClaims: stats.medicalPaid.toNumber() * 0.5,
        nonDomesticClaims: stats.medicalPaid.toNumber() * 0.2,
        nonHospitalMedical: stats.medicalPaid.toNumber() * 0.3,
        medicalSubtotal: stats.medicalPaid.toNumber(),
        medicalAdjustment: medAdj,
        medicalTotal: stats.medicalPaid.toNumber() + medAdj,
        rxClaims: stats.rxPaid.toNumber(),
        rxRebates: rxRebates,
        stopLossPremiums: stats.stopLossFees.toNumber(),
        stopLossReimbursements: slReimb,
        asoFees: stats.adminFees.toNumber() * 0.7,
        stopLossCoordFees: stats.adminFees.toNumber() * 0.3,
        adminTotal: stats.adminFees.toNumber(),
        employeeCount: Math.floor(stats.totalSubscribers.toNumber() / 2.2),
        memberCount: stats.totalSubscribers.toNumber(),
        budgetedClaims: stats.budgetedPremium.toNumber() * 0.85,
        budgetedFixed: stats.budgetedPremium.toNumber() * 0.15,
        totalBudget: stats.budgetedPremium.toNumber(),
      }
    })

    const cumulativeInput = aggregateCESummary(cumulativeInputs)
    const cumulative = calculateCESummary(cumulativeInput)

    return NextResponse.json({
      monthlyResults: validResults,
      cumulative: cumulative.rows,
      kpis: cumulative.kpis,
    })
  } catch (error) {
    console.error('Error in POST /api/summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/summary/export
 * Export C&E Summary as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const format = searchParams.get('format') || 'csv'

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Fetch data (same as POST)
    const snapshots = await prisma.monthSnapshot.findMany({
      where: {
        clientId,
        planYearId,
      },
      include: {
        monthlyStats: {
          where: {
            plan: {
              type: 'ALL_PLANS',
            },
          },
        },
      },
      orderBy: { monthDate: 'asc' },
    })

    if (snapshots.length === 0) {
      return NextResponse.json(
        { error: 'No data found' },
        { status: 404 }
      )
    }

    // Generate CSV
    const headers = ['Row', 'Item', 'Monthly', 'Cumulative']
    const rows = [headers.join(',')]

    // For simplicity, just export last month's data
    const lastSnapshot = snapshots[snapshots.length - 1]
    const stats = lastSnapshot.monthlyStats[0]

    if (stats) {
      const input: CESummaryInput = {
        domesticClaims: stats.medicalPaid.toNumber() * 0.5,
        nonDomesticClaims: stats.medicalPaid.toNumber() * 0.2,
        nonHospitalMedical: stats.medicalPaid.toNumber() * 0.3,
        medicalSubtotal: stats.medicalPaid.toNumber(),
        medicalAdjustment: 0,
        medicalTotal: stats.medicalPaid.toNumber(),
        rxClaims: stats.rxPaid.toNumber(),
        rxRebates: 0,
        stopLossPremiums: stats.stopLossFees.toNumber(),
        stopLossReimbursements: 0,
        asoFees: stats.adminFees.toNumber() * 0.7,
        stopLossCoordFees: stats.adminFees.toNumber() * 0.3,
        adminTotal: stats.adminFees.toNumber(),
        employeeCount: Math.floor(stats.totalSubscribers.toNumber() / 2.2),
        memberCount: stats.totalSubscribers.toNumber(),
        budgetedClaims: stats.budgetedPremium.toNumber() * 0.85,
        budgetedFixed: stats.budgetedPremium.toNumber() * 0.15,
        totalBudget: stats.budgetedPremium.toNumber(),
      }

      const result = calculateCESummary(input)

      result.rows.forEach((row) => {
        if (row.itemNumber > 0) {
          rows.push(
            [
              `#${row.itemNumber}`,
              row.itemName,
              row.monthlyValue.toFixed(2),
              row.cumulativeValue?.toFixed(2) || '',
            ].join(',')
          )
        }
      })
    }

    const csv = '\uFEFF' + rows.join('\n') // UTF-8 BOM

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ce-summary-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/summary/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

