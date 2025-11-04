import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/fees
 * Fetch admin fees and user adjustments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Fetch plan year to get plans
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
      include: {
        client: {
          include: {
            plans: {
              include: {
                adminFeeComponents: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    })

    if (!planYear) {
      return NextResponse.json(
        { error: 'Plan year not found' },
        { status: 404 }
      )
    }

    // Aggregate admin fees across all plans
    const adminFees = planYear.client.plans.flatMap((plan) => 
      plan.adminFeeComponents.map((fee) => ({
        id: fee.id,
        planId: fee.planId,
        label: fee.label,
        feeType: fee.feeType,
        amount: fee.amount.toNumber(),
        effectiveDate: fee.effectiveDate.toISOString(),
      }))
    )

    // Fetch user adjustments for C&E rows #6, #9, #11
    const adjustments = await prisma.userAdjustment.findMany({
      where: {
        clientId,
        planYearId,
        itemNumber: { in: [6, 9, 11] },
      },
      orderBy: { monthDate: 'desc' },
    })

    const adjustmentMap = {
      6: adjustments.filter((a) => a.itemNumber === 6).map((a) => ({
        id: a.id,
        itemNumber: a.itemNumber,
        itemName: 'Adjustment',
        monthDate: a.monthDate.toISOString().substring(0, 7),
        amount: a.amount.toNumber(),
        notes: a.notes,
      })),
      9: adjustments.filter((a) => a.itemNumber === 9).map((a) => ({
        id: a.id,
        itemNumber: a.itemNumber,
        itemName: 'Rx Rebates',
        monthDate: a.monthDate.toISOString().substring(0, 7),
        amount: a.amount.toNumber(),
        notes: a.notes,
      })),
      11: adjustments.filter((a) => a.itemNumber === 11).map((a) => ({
        id: a.id,
        itemNumber: a.itemNumber,
        itemName: 'Stop Loss Reimbursements',
        monthDate: a.monthDate.toISOString().substring(0, 7),
        amount: a.amount.toNumber(),
        notes: a.notes,
      })),
    }

    // Calculate totals
    const pepmFees = adminFees
      .filter((f) => f.feeType === 'PEPM')
      .reduce((sum, f) => sum + f.amount, 0)

    const pmpmFees = adminFees
      .filter((f) => f.feeType === 'PMPM')
      .reduce((sum, f) => sum + f.amount, 0)

    const flatFees = adminFees
      .filter((f) => f.feeType === 'FLAT')
      .reduce((sum, f) => sum + f.amount, 0)

    return NextResponse.json({
      adminFees,
      adjustments: adjustmentMap,
      totals: {
        pepmFees,
        pmpmFees,
        flatFees,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fees
 * Create a new admin fee or adjustment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, clientId, planYearId, data } = body

    if (!type || !clientId || !planYearId || !data) {
      return NextResponse.json(
        { error: 'type, clientId, planYearId, and data are required' },
        { status: 400 }
      )
    }

    if (type === 'admin') {
      // Create admin fee component
      const { planId, label, feeType, amount, effectiveDate } = data

      // Get a plan from the client (or use first one)
      let targetPlanId = planId
      if (!targetPlanId) {
        const firstPlan = await prisma.plan.findFirst({
          where: { clientId },
        })
        if (!firstPlan) {
          return NextResponse.json(
            { error: 'No plans found for client' },
            { status: 404 }
          )
        }
        targetPlanId = firstPlan.id
      }

      const fee = await prisma.adminFeeComponent.create({
        data: {
          planId: targetPlanId,
          label: label || 'New Fee',
          feeType: feeType || 'PEPM',
          amount: amount || 0,
          isActive: true,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        },
      })

      return NextResponse.json({ success: true, fee })
    } else if (type === 'adjustment') {
      // Create user adjustment
      const { itemNumber, monthDate, amount, notes } = data

      if (![6, 9, 11].includes(itemNumber)) {
        return NextResponse.json(
          { error: 'itemNumber must be 6, 9, or 11' },
          { status: 400 }
        )
      }

      const adjustment = await prisma.userAdjustment.upsert({
        where: {
          clientId_planYearId_itemNumber_monthDate: {
            clientId,
            planYearId,
            itemNumber,
            monthDate: new Date(monthDate + '-01'),
          },
        },
        create: {
          clientId,
          planYearId,
          itemNumber,
          monthDate: new Date(monthDate + '-01'),
          amount: amount || 0,
          notes: notes || '',
        },
        update: {
          amount: amount || 0,
          notes: notes || '',
        },
      })

      return NextResponse.json({ success: true, adjustment })
    } else {
      return NextResponse.json(
        { error: 'type must be "admin" or "adjustment"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fees
 * Delete an admin fee or adjustment
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { error: 'id and type are required' },
        { status: 400 }
      )
    }

    if (type === 'admin') {
      await prisma.adminFeeComponent.delete({
        where: { id },
      })
    } else if (type === 'adjustment') {
      await prisma.userAdjustment.delete({
        where: { id },
      })
    } else {
      return NextResponse.json(
        { error: 'type must be "admin" or "adjustment"' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

