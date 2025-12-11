import { NextRequest, NextResponse } from 'next/server'
import { getPdfExporter, PdfExporter } from '@medical-reporting/lib/server'

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

    const exporter = getPdfExporter() as unknown as PdfExporter
    // #region agent log
    const fs = require('fs')
    const path = require('path')
    try {
      const cwd = process.cwd()
      const logDir = path.join(cwd, '.cursor')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      const logPath = path.join(logDir, 'debug.log')
      const logEntry = JSON.stringify({ location: 'apps/web/src/app/api/export/pdf/route.ts:22', message: 'calling exporter.init()', data: { baseUrl, cwd }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n'
      fs.appendFileSync(logPath, logEntry, 'utf8')
    } catch (e) {
      console.error('Logging failed:', e)
    }
    // #endregion
    try {
      await exporter.init()
      // #region agent log
      try {
        const cwd = process.cwd()
        const logDir = path.join(cwd, '.cursor')
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true })
        }
        const logPath = path.join(logDir, 'debug.log')
        const logEntry = JSON.stringify({ location: 'apps/web/src/app/api/export/pdf/route.ts:23', message: 'exporter.init() succeeded', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n'
        fs.appendFileSync(logPath, logEntry, 'utf8')
      } catch (e) {
        console.error('Logging failed:', e)
      }
      // #endregion
    } catch (initError) {
      // #region agent log
      try {
        const cwd = process.cwd()
        const logDir = path.join(cwd, '.cursor')
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true })
        }
        const logPath = path.join(logDir, 'debug.log')
        const logEntry = JSON.stringify({ location: 'apps/web/src/app/api/export/pdf/route.ts:23', message: 'exporter.init() failed', data: { error: initError instanceof Error ? initError.message : String(initError), stack: initError instanceof Error ? initError.stack : null }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n'
        fs.appendFileSync(logPath, logEntry, 'utf8')
      } catch (e) {
        console.error('Logging failed:', e)
      }
      // #endregion
      throw initError
    }

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

      return new NextResponse(new Uint8Array(result.buffer), {
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

    const exporter = getPdfExporter() as unknown as PdfExporter
    await exporter.init()

    try {
      const buffer = await exporter.exportPage(url)

      return new NextResponse(new Uint8Array(buffer), {
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

