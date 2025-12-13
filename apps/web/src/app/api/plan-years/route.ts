import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/plan-years?clientId=...
 * Lists plan years for a client so users can choose which dataset to view/export.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const planYears = await prisma.planYear.findMany({
      where: { clientId },
      select: { id: true, yearStart: true, yearEnd: true },
      orderBy: { yearStart: 'desc' },
    })

    return NextResponse.json(
      planYears.map((py) => ({
        id: py.id,
        yearStart: py.yearStart,
        yearEnd: py.yearEnd,
      }))
    )
  } catch (error) {
    console.error('Error in GET /api/plan-years:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

