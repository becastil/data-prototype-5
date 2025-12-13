import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planYearId = params.id
    const body = await request.json()
    const { yearStart, yearEnd } = body

    if (!yearStart || !yearEnd) {
      return NextResponse.json(
        { error: 'yearStart and yearEnd are required' },
        { status: 400 }
      )
    }

    const updatedPlanYear = await prisma.planYear.update({
      where: { id: planYearId },
      data: {
        yearStart: new Date(yearStart),
        yearEnd: new Date(yearEnd),
      },
    })

    return NextResponse.json(updatedPlanYear)
  } catch (error) {
    console.error('Error updating plan year:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




