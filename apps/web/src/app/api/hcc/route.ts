import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  filterHighClaimants,
  calculateHighClaimantSummary,
} from '@medical-reporting/lib'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const islThreshold = parseFloat(searchParams.get('islThreshold') || '200000')
    const minPercentThreshold = parseFloat(searchParams.get('minPercentThreshold') || '0.5')

    if (!clientId || !planYearId) {
      return NextResponse.json(
        { error: 'clientId and planYearId are required' },
        { status: 400 }
      )
    }

    // Get plan year for ISL limit
    const planYear = await prisma.planYear.findUnique({
      where: { id: planYearId },
    })

    if (!planYear || planYear.clientId !== clientId) {
      return NextResponse.json({ error: 'Plan year not found' }, { status: 404 })
    }

    const effectiveIslThreshold = planYear.islLimit
      ? Number(planYear.islLimit)
      : islThreshold

    // Get all claimants
    const claimants = await prisma.highClaimant.findMany({
      where: {
        clientId,
        planYearId,
      },
      include: {
        plan: true,
      },
      orderBy: {
        totalPaid: 'desc',
      },
    })

    // Filter and process
    const filtered = filterHighClaimants(
      claimants.map((c) => ({
        claimantKey: c.claimantKey,
        planId: c.planId,
        medPaid: Number(c.medPaid),
        rxPaid: Number(c.rxPaid),
        totalPaid: Number(c.totalPaid),
      })),
      effectiveIslThreshold,
      minPercentThreshold
    )

    // Calculate summary
    const summary = calculateHighClaimantSummary(filtered)

    // Enrich with plan names and status
    const enriched = filtered.map((f) => {
      const claimant = claimants.find((c) => c.claimantKey === f.claimantKey)
      return {
        ...f,
        planName: claimant?.plan.name || 'Unknown',
        status: claimant?.status || 'OPEN',
      }
    })

    return NextResponse.json({
      claimants: enriched,
      summary,
      islThreshold: effectiveIslThreshold,
    })
  } catch (error) {
    console.error('Error in HCC API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claimantKey, status, notes } = body

    if (!claimantKey || !status) {
      return NextResponse.json(
        { error: 'claimantKey and status are required' },
        { status: 400 }
      )
    }

    // Get claimant to find clientId
    const claimant = await prisma.highClaimant.findFirst({
      where: { claimantKey },
    })

    if (!claimant) {
      return NextResponse.json({ error: 'Claimant not found' }, { status: 404 })
    }

    // Update status
    const updated = await prisma.highClaimant.update({
      where: { id: claimant.id },
      data: {
        status,
        notes: notes || claimant.notes,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        clientId: claimant.clientId,
        entityType: 'HighClaimant',
        entityId: claimant.id,
        action: 'UPDATE',
        before: { status: claimant.status },
        after: { status: updated.status },
      },
    })

    return NextResponse.json({ success: true, claimant: updated })
  } catch (error) {
    console.error('Error updating claimant:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
