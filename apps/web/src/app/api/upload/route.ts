import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseMonthlyCSV, validateAndReconcile, ParseResult, ParsedRow } from '@medical-reporting/lib'

/**
 * POST /api/upload
 * Upload and validate CSV/XLSX files
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const planYearId = formData.get('planYearId') as string
    const fileType = formData.get('fileType') as string
    const preview = formData.get('preview') === 'true'

    if (!file || !clientId || !planYearId || !fileType) {
      return NextResponse.json(
        { error: 'file, clientId, planYearId, and fileType are required' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()

    // Parse based on file type
    let parseResult: ParseResult<ParsedRow>
    if (fileType === 'monthly') {
      parseResult = parseMonthlyCSV(content)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only "monthly" is supported currently.' },
        { status: 400 }
      )
    }

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        preview: parseResult.preview,
        errors: parseResult.errors,
        message: 'Validation failed',
      })
    }

    // Perform reconciliation
    const reconciliation = validateAndReconcile(parseResult.data)

    // Extract months and plans
    const months = [...new Set(parseResult.data.map((row) => row.month as string))]
    const plans = [...new Set(parseResult.data.map((row) => row.plan as string))]

    if (preview) {
      return NextResponse.json({
        success: true,
        preview: parseResult.preview,
        validation: {
          dataRows: parseResult.data.length,
          sumRowDetected: reconciliation.sumDetected,
          sumValidationPassed: reconciliation.passed,
          reconciliation,
        },
        detectedMonths: months,
        detectedPlans: plans,
        saved: false,
        message: 'Validation passed. Data not saved (preview mode).',
      })
    }

    // Import data
    let rowsImported = 0

    for (const row of parseResult.data) {
      const month = row.month as string
      const planName = row.plan as string

      // Find or create plan
      const plan = await prisma.plan.findFirst({
        where: {
          clientId,
          name: planName,
        },
      })

      if (!plan) {
        console.warn(`Plan not found: ${planName}, skipping row`)
        continue
      }

      // Find or create snapshot
      const snapshot = await prisma.monthSnapshot.upsert({
        where: {
          clientId_planYearId_monthDate: {
            clientId,
            planYearId,
            monthDate: new Date(month + '-01'),
          },
        },
        create: {
          clientId,
          planYearId,
          monthDate: new Date(month + '-01'),
        },
        update: {},
      })

      // Upsert monthly stat
      await prisma.monthlyPlanStat.upsert({
        where: {
          snapshotId_planId: {
            snapshotId: snapshot.id,
            planId: plan.id,
          },
        },
        create: {
          snapshotId: snapshot.id,
          planId: plan.id,
          totalSubscribers: (row.totalSubscribers as number) || 0,
          medicalPaid: (row.medicalPaid as number) || 0,
          rxPaid: (row.rxPaid as number) || 0,
          specStopLossReimb: (row.specStopLossReimb as number) || 0,
          estRxRebates: (row.estRxRebates as number) || 0,
          adminFees: (row.adminFees as number) || 0,
          stopLossFees: (row.stopLossFees as number) || 0,
          budgetedPremium: (row.budgetedPremium as number) || 0,
        },
        update: {
          totalSubscribers: (row.totalSubscribers as number) || 0,
          medicalPaid: (row.medicalPaid as number) || 0,
          rxPaid: (row.rxPaid as number) || 0,
          specStopLossReimb: (row.specStopLossReimb as number) || 0,
          estRxRebates: (row.estRxRebates as number) || 0,
          adminFees: (row.adminFees as number) || 0,
          stopLossFees: (row.stopLossFees as number) || 0,
          budgetedPremium: (row.budgetedPremium as number) || 0,
        },
      })

      rowsImported++
    }

    return NextResponse.json({
      success: true,
      preview: parseResult.preview,
      validation: {
        dataRows: parseResult.data.length,
        sumRowDetected: reconciliation.sumDetected,
        sumValidationPassed: reconciliation.passed,
        reconciliation,
      },
      saved: true,
      import: {
        monthsImported: months.length,
        rowsImported,
      },
      detectedMonths: months,
      detectedPlans: plans,
      message: `Validation passed and data saved successfully. Imported ${rowsImported} rows for ${months.length} months.`,
    })
  } catch (error) {
    console.error('Error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

