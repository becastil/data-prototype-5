import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    const plans = await prisma.plan.findMany({
      where: {
        clientId,
        type: {
          not: PlanType.ALL_PLANS // Exclude "All Plans" aggregate record
        }
      },
      select: {
        id: true,
        name: true,
        type: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

