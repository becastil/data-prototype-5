import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseMonthlyCSV, parseHCCCSV, validateAndReconcile, ParseResult, ParsedRow } from '@medical-reporting/lib'
import { PlanType, ClaimantStatus } from '@prisma/client'

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
    let reconciliation: any = { passed: true, sumDetected: false }

    if (fileType === 'monthly') {
      parseResult = parseMonthlyCSV(content)
      
      if (parseResult.success) {
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
        reconciliation = validateAndReconcile(parseResult.data)
      }
    } else if (fileType === 'hcc') {
      parseResult = parseHCCCSV(content)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only "monthly" and "hcc" are supported currently.' },
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

    // Extract months and plans
    const months = fileType === 'monthly' 
      ? [...new Set(parseResult.data.map((row: ParsedRow) => row.month as string))]
      : []
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

    if (fileType === 'monthly') {
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
    } else if (fileType === 'hcc') {
      // Fetch Plan Year for ISL limit
      const planYear = await prisma.planYear.findUnique({
        where: { id: planYearId }
      })
      const islLimit = planYear?.islLimit ? Number(planYear.islLimit) : 200000

      for (const row of parseResult.data) {
        const planName = row.plan as string
        const claimantKey = row.claimantKey as string
        
        // Find plan
        const plan = await prisma.plan.findFirst({
          where: {
            clientId,
            name: planName,
          },
        })

        if (!plan) {
          console.warn(`Plan not found: ${planName}, skipping claimant ${claimantKey}`)
          continue
        }

        const medPaid = (row.medPaid as number) || 0
        const rxPaid = (row.rxPaid as number) || 0
        const totalPaid = (row.totalPaid as number) || (medPaid + rxPaid)
        const amountExceedingIsl = Math.max(0, totalPaid - islLimit)
        
        // Determine status (default to OPEN or use provided)
        let status: ClaimantStatus = ClaimantStatus.OPEN
        if (row.status) {
          const s = (row.status as string).toUpperCase()
          if (s === 'RESOLVED') status = ClaimantStatus.RESOLVED
          else if (s === 'UNDER_REVIEW' || s === 'REVIEW') status = ClaimantStatus.UNDER_REVIEW
        }

        // Find existing claimant to update or create new
        // Since there is no unique constraint on claimantKey + planYearId, we search first
        const existingClaimant = await prisma.highClaimant.findFirst({
          where: {
            clientId,
            planYearId,
            claimantKey,
          }
        })

        if (existingClaimant) {
          await prisma.highClaimant.update({
            where: { id: existingClaimant.id },
            data: {
              planId: plan.id,
              medPaid,
              rxPaid,
              totalPaid,
              amountExceedingIsl,
              status,
              notes: (row.notes as string) || existingClaimant.notes,
            }
          })
        } else {
          await prisma.highClaimant.create({
            data: {
              clientId,
              planYearId,
              planId: plan.id,
              claimantKey,
              medPaid,
              rxPaid,
              totalPaid,
              amountExceedingIsl,
              status,
              notes: (row.notes as string) || null,
            }
          })
        }
        
        rowsImported++
      }
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
      message: `Validation passed and data saved successfully. Imported ${rowsImported} rows${months.length > 0 ? ` for ${months.length} months` : ''}.`,
    })
  } catch (error) {
    console.error('Error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

