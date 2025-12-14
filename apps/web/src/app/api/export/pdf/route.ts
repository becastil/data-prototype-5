import { NextRequest, NextResponse } from 'next/server'
import { getPdfExporter, PdfExporter } from '@medical-reporting/lib/server'

function getBaseUrlFromRequest(request: NextRequest): string {
  // Explicit override (recommended for deployments)
  if (process.env.BASE_URL) return process.env.BASE_URL

  // Prefer Origin header if present
  const origin = request.headers.get('origin')
  if (origin && origin.startsWith('http')) return origin

  // Common proxy headers
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (host) return `${proto}://${host}`

  // Fallback to request URL
  return new URL(request.url).origin
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

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

    const baseUrl = getBaseUrlFromRequest(request)

    const exporter = getPdfExporter() as unknown as PdfExporter
    try {
      await withTimeout(exporter.init(), 45_000, 'exporter.init')
    } catch (initError) {
      throw initError
    }

    try {
      const result = await withTimeout(
        exporter.export({
        baseUrl,
        clientId,
        planYearId,
        pages,
        filename: filename || 'medical-report.pdf',
        }),
        90_000,
        'exporter.export'
      )

      if (!result.success || !result.buffer) {
        return NextResponse.json(
          { error: result.error || 'PDF generation failed' },
          { status: 500 }
        )
      }

      return new NextResponse(new Uint8Array(result.buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      })
    } finally {
      await withTimeout(exporter.close(), 5_000, 'exporter.close').catch(() => {
        // best-effort cleanup
      })
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

    const baseUrl = getBaseUrlFromRequest(request)
    const url = `${baseUrl}${page}?clientId=${clientId}&planYearId=${planYearId}&print=true`

    const exporter = getPdfExporter() as unknown as PdfExporter
    await withTimeout(exporter.init(), 45_000, 'exporter.init')

    try {
      const buffer = await withTimeout(exporter.exportPage(url), 60_000, 'exporter.exportPage')

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
        },
      })
    } finally {
      await withTimeout(exporter.close(), 5_000, 'exporter.close').catch(() => {
        // best-effort cleanup
      })
    }
  } catch (error) {
    console.error('Error in GET /api/export/pdf/preview:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

