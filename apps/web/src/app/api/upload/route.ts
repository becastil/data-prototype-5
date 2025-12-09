import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseMonthlyCSV, validateAndReconcile, ParseResult, ParsedRow } from '@medical-reporting/lib'
import { PlanType } from '@prisma/client'

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

    // Auto-calculate "All Plans" if missing
    const hasAllPlans = parseResult.data.some((row: ParsedRow) => 
      (row.plan as string || '').toLowerCase().includes('all') && 
      (row.plan as string || '').toLowerCase().includes('plan')
    )

    if (!hasAllPlans && parseResult.data.length > 0) {
      // Group by month
      const monthlyAggregates = new Map<string, ParsedRow>()

      for (const row of parseResult.data) {
        const month = row.month as string
        if (!monthlyAggregates.has(month)) {
          monthlyAggregates.set(month, {
            month,
            plan: 'All Plans',
            totalSubscribers: 0,
            medicalPaid: 0,
            rxPaid: 0,
            specStopLossReimb: 0,
            estRxRebates: 0,
            adminFees: 0,
            stopLossFees: 0,
            budgetedPremium: 0,
          })
        }

        const agg = monthlyAggregates.get(month)!
        agg.totalSubscribers = (agg.totalSubscribers as number) + ((row.totalSubscribers as number) || 0)
        agg.medicalPaid = (agg.medicalPaid as number) + ((row.medicalPaid as number) || 0)
        agg.rxPaid = (agg.rxPaid as number) + ((row.rxPaid as number) || 0)
        agg.specStopLossReimb = (agg.specStopLossReimb as number) + ((row.specStopLossReimb as number) || 0)
        agg.estRxRebates = (agg.estRxRebates as number) + ((row.estRxRebates as number) || 0)
        agg.adminFees = (agg.adminFees as number) + ((row.adminFees as number) || 0)
        agg.stopLossFees = (agg.stopLossFees as number) + ((row.stopLossFees as number) || 0)
        agg.budgetedPremium = (agg.budgetedPremium as number) + ((row.budgetedPremium as number) || 0)
      }

      // Append aggregates
      parseResult.data.push(...Array.from(monthlyAggregates.values()))
    }

    // Perform reconciliation
    const reconciliation = validateAndReconcile(parseResult.data)

    // Extract months and plans
    const months = [...new Set(parseResult.data.map((row: ParsedRow) => row.month as string))]
    const plans = [...new Set(parseResult.data.map((row: ParsedRow) => row.plan as string))]

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
      let plan = await prisma.plan.findFirst({
        where: {
          clientId,
          name: planName,
        },
      })

      // Auto-create "All Plans" if missing
      if (!plan && (planName.toLowerCase() === 'all plans' || planName === 'Total')) {
        try {
          plan = await prisma.plan.create({
            data: {
              clientId,
              name: 'All Plans',
              code: 'ALL',
              type: PlanType.ALL_PLANS,
            },
          })
        } catch (e) {
            // Check if it was created concurrently
            plan = await prisma.plan.findFirst({
                where: { clientId, name: 'All Plans' }
            })
        }
      }

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

