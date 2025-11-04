import { NextRequest, NextResponse } from 'next/server'
import { getPdfExporter } from '@medical-reporting/lib'

/**
 * POST /api/export/pdf
 * Generate PDF from dashboard pages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, planYearId, pages, filename } = body

    if (!clientId || !planYearId || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'clientId, planYearId, and pages are required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

    const exporter = getPdfExporter()
    await exporter.init()

    try {
      const result = await exporter.export({
        baseUrl,
        clientId,
        planYearId,
        pages,
        filename: filename || 'medical-report.pdf',
      })

      if (!result.success || !result.buffer) {
        return NextResponse.json(
          { error: result.error || 'PDF generation failed' },
          { status: 500 }
        )
      }

      return new NextResponse(result.buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      })
    } finally {
      await exporter.close()
    }
  } catch (error) {
    console.error('Error in POST /api/export/pdf:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/export/pdf/preview
 * Generate PDF preview for a single page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const clientId = searchParams.get('clientId')
    const planYearId = searchParams.get('planYearId')

    if (!page || !clientId || !planYearId) {
      return NextResponse.json(
        { error: 'page, clientId, and planYearId are required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}${page}?clientId=${clientId}&planYearId=${planYearId}&print=true`

    const exporter = getPdfExporter()
    await exporter.init()

    try {
      const buffer = await exporter.exportPage(url)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
        },
      })
    } finally {
      await exporter.close()
    }
  } catch (error) {
    console.error('Error in GET /api/export/pdf/preview:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

