import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Get plan year
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
    })

    if (!planYear || planYear.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan year not found' }, { status: 404 })
    }

    // Get inputs
    const inputs = await prisma.input.findUnique({
      where: { planYearId },
    })

    // Get premium equivalents
    const plans = await prisma.plan.findMany({
      where: { clientId },
      include: {
        premiumEquivalents: {
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
        adminFeeComponents: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
        },
        stopLossFees: {
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    })

    // Calculate admin fees total (PEPM)
    const totalAdminFees = plans.reduce((sum, plan) => {
      return (
        sum +
        plan.adminFeeComponents
          .filter((f) => f.feeType === 'PEPM')
          .reduce((planSum, fee) => planSum + Number(fee.amount), 0)
      )
    }, 0)

    return NextResponse.json({
      premiumEquivalents: plans.flatMap((plan) =>
        plan.premiumEquivalents.map((pe) => ({
          id: pe.id,
          planId: plan.id,
          planName: plan.name,
          amount: Number(pe.amount),
          effectiveDate: pe.effectiveDate,
        }))
      ),
      adminFeeComponents: plans.flatMap((plan) =>
        plan.adminFeeComponents.map((fee) => ({
          id: fee.id,
          planId: plan.id,
          planName: plan.name,
          label: fee.label,
          feeType: fee.feeType,
          amount: Number(fee.amount),
          isActive: fee.isActive,
        }))
      ),
      stopLossFeesByTier: plans.flatMap((plan) =>
        plan.stopLossFees.map((fee) => ({
          id: fee.id,
          planId: plan.id,
          planName: plan.name,
          islRate: Number(fee.islRate),
          aslRate: fee.aslRate ? Number(fee.aslRate) : null,
        }))
      ),
      otherInputs: inputs
        ? {
            rxRebatePepm: inputs.rxRebatePepm ? Number(inputs.rxRebatePepm) : null,
            ibnr: inputs.ibnr ? Number(inputs.ibnr) : null,
            aggregateFactor: inputs.aggregateFactor ? Number(inputs.aggregateFactor) : null,
            aslFee: inputs.aslFee ? Number(inputs.aslFee) : null,
            notes: inputs.notes,
          }
        : null,
      totals: {
        adminFees: totalAdminFees,
      },
    })
  } catch (error) {
    console.error('Error in inputs API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, planYearId, premiumEquivalents, adminFeeComponents, otherInputs } = body

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Verify plan year
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
    })

    if (!planYear || planYear.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan year not found' }, { status: 404 })
    }

    // Update other inputs
    if (otherInputs) {
      await prisma.input.upsert({
        where: { planYearId },
        update: {
          rxRebatePepm: otherInputs.rxRebatePepm !== undefined ? otherInputs.rxRebatePepm : undefined,
          ibnr: otherInputs.ibnr !== undefined ? otherInputs.ibnr : undefined,
          aggregateFactor: otherInputs.aggregateFactor !== undefined ? otherInputs.aggregateFactor : undefined,
          aslFee: otherInputs.aslFee !== undefined ? otherInputs.aslFee : undefined,
          notes: otherInputs.notes,
        },
        create: {
          planYearId,
          rxRebatePepm: otherInputs.rxRebatePepm,
          ibnr: otherInputs.ibnr,
          aggregateFactor: otherInputs.aggregateFactor,
          aslFee: otherInputs.aslFee,
          notes: otherInputs.notes,
        },
      })
    }

    // Update premium equivalents (if provided)
    if (premiumEquivalents) {
      // Implementation would update premium equivalents
      // This is simplified - in production, you'd handle upserts
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating inputs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
