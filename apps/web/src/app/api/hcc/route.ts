import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  filterHighClaimants,
  calculateHighClaimantSummary,
  HighClaimantResult,
} from '@medical-reporting/lib'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')
    const planCode = searchParams.get('plan')
    const islThresholdParam = searchParams.get('islThreshold')
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

    // Priority: Query param > DB value > Default 200k
    // If param is provided, we use it (simulation mode)
    const effectiveIslThreshold = islThresholdParam 
      ? parseFloat(islThresholdParam)
      : (planYear.islLimit ? Number(planYear.islLimit) : 200000)

    // Build query filter
    const where: any = {
      clientId,
      planYearId,
    }

    // Filter by plan if specified
    if (planCode && planCode !== 'all') {
      // Find the plan ID from the code (case-insensitive)
      const plan = await prisma.plan.findFirst({
        where: {
          clientId,
          code: {
            equals: planCode,
            mode: 'insensitive',
          },
        },
      })

      if (plan) {
        where.planId = plan.id
      } else {
        // If plan code provided but not found, return empty results (except if it was just unmatched)
        // But to be safe, let's also try matching by name or just ID if it looks like a UUID
        // For now, assuming code or name match
        
        // If it's a UUID, it might be the ID directly
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planCode)
        if (isUuid) {
           where.planId = planCode
        } else {
           // Try matching name if code didn't match
           const planByName = await prisma.plan.findFirst({
             where: {
               clientId,
               name: {
                 equals: planCode,
                 mode: 'insensitive',
               }
             }
           })
           
           if (planByName) {
             where.planId = planByName.id
           } else {
             // Plan specified but not found -> return empty
             // We can achieve this by setting a non-existent planId or just returning empty now
             return NextResponse.json({
               claimants: [],
               summary: {
                 count: 0,
                 totalPaid: 0,
                 employerShare: 0,
                 stopLossShare: 0
               },
               islThreshold: effectiveIslThreshold
             })
           }
        }
      }
    }

    // Get all claimants
    const claimants = await prisma.highClaimant.findMany({
      where,
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
    const enriched = filtered.map((f: HighClaimantResult) => {
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
