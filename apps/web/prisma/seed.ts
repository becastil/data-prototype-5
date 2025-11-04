import { PrismaClient, PlanType, ClaimantStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create client
  const client = await prisma.client.upsert({
    where: { id: 'demo-client-id' },
    update: {},
    create: {
      id: 'demo-client-id',
      name: 'Acme Corporation',
      cadence: 'monthly',
      active: true,
    },
  })

  console.log('Created client:', client.name)

  // Create plan year (2025)
  const planYear = await prisma.planYear.upsert({
    where: { id: 'demo-plan-year-id' },
    update: {},
    create: {
      id: 'demo-plan-year-id',
      clientId: client.id,
      yearStart: new Date('2025-01-01'),
      yearEnd: new Date('2025-12-31'),
      islLimit: 200000,
      stopLossTrackingMode: 'BY_PLAN',
    },
  })

  console.log('Created plan year:', planYear.yearStart.getFullYear())

  // Create plans
  const allPlans = await prisma.plan.upsert({
    where: { id: 'plan-all' },
    update: {},
    create: {
      id: 'plan-all',
      clientId: client.id,
      name: 'All Plans',
      code: 'ALL',
      type: PlanType.ALL_PLANS,
    },
  })

  const hdhp = await prisma.plan.upsert({
    where: { id: 'plan-hdhp' },
    update: {},
    create: {
      id: 'plan-hdhp',
      clientId: client.id,
      name: 'HDHP',
      code: 'HDHP',
      type: PlanType.HDHP,
    },
  })

  const ppoBase = await prisma.plan.upsert({
    where: { id: 'plan-ppo-base' },
    update: {},
    create: {
      id: 'plan-ppo-base',
      clientId: client.id,
      name: 'PPO Base',
      code: 'PPO-BASE',
      type: PlanType.PPO_BASE,
    },
  })

  const ppoBuyup = await prisma.plan.upsert({
    where: { id: 'plan-ppo-buyup' },
    update: {},
    create: {
      id: 'plan-ppo-buyup',
      clientId: client.id,
      name: 'PPO Buy-Up',
      code: 'PPO-BUYUP',
      type: PlanType.PPO_BUYUP,
    },
  })

  console.log('Created plans')

  // Create premium equivalents
  await prisma.premiumEquivalent.createMany({
    data: [
      {
        planId: hdhp.id,
        amount: 450,
        effectiveDate: new Date('2025-01-01'),
      },
      {
        planId: ppoBase.id,
        amount: 500,
        effectiveDate: new Date('2025-01-01'),
      },
      {
        planId: ppoBuyup.id,
        amount: 600,
        effectiveDate: new Date('2025-01-01'),
      },
    ],
    skipDuplicates: true,
  })

  // Create admin fee components
  await prisma.adminFeeComponent.createMany({
    data: [
      {
        planId: allPlans.id,
        label: 'ASO',
        feeType: 'PEPM',
        amount: 25.0,
        isActive: true,
        effectiveDate: new Date('2025-01-01'),
      },
      {
        planId: allPlans.id,
        label: 'Stop Loss Coord',
        feeType: 'PEPM',
        amount: 5.0,
        isActive: true,
        effectiveDate: new Date('2025-01-01'),
      },
      {
        planId: allPlans.id,
        label: 'Rx Carve Out',
        feeType: 'PEPM',
        amount: 8.5,
        isActive: true,
        effectiveDate: new Date('2025-01-01'),
      },
      {
        planId: allPlans.id,
        label: 'Other',
        feeType: 'PEPM',
        amount: 7.33,
        isActive: true,
        effectiveDate: new Date('2025-01-01'),
      },
    ],
    skipDuplicates: true,
  })

  // Create stop loss fees
  await prisma.stopLossFeeByTier.createMany({
    data: [
      {
        planId: allPlans.id,
        islRate: 0.08,
        aslRate: 0.02,
        effectiveDate: new Date('2025-01-01'),
      },
    ],
    skipDuplicates: true,
  })

  // Create inputs
  await prisma.input.upsert({
    where: { planYearId: planYear.id },
    update: {},
    create: {
      planYearId: planYear.id,
      rxRebatePepm: 5.5,
      ibnr: 50000,
      aggregateFactor: 1.05,
      aslFee: 12000,
      notes: 'Q1 2025 estimates',
    },
  })

  // Create monthly snapshots and stats (12 months)
  const months = []
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(2025, i, 1)
    months.push(monthDate)

    // Sample data matching template targets (94% budget, $5.2M total cost)
    const baseSubscribers = 1200 + Math.floor(Math.random() * 100)
    const monthlyBudget = 465471 // ~$5.585M / 12

    // Aggregate monthly values across all plans
    // Check if snapshot exists first
    let snapshot = await prisma.monthSnapshot.findFirst({
      where: {
        clientId: client.id,
        planYearId: planYear.id,
        monthDate,
      },
    })

    if (!snapshot) {
      snapshot = await prisma.monthSnapshot.create({
        data: {
          clientId: client.id,
          planYearId: planYear.id,
          monthDate,
        },
      })
    }

    // Create stats for each plan
    for (const plan of [allPlans, hdhp, ppoBase, ppoBuyup]) {
      const planFactor = plan.id === allPlans.id ? 1 : 0.33
      
      await prisma.monthlyPlanStat.upsert({
        where: {
          snapshotId_planId: {
            snapshotId: snapshot.id,
            planId: plan.id,
          },
        },
        update: {},
        create: {
          snapshotId: snapshot.id,
          planId: plan.id,
          totalSubscribers: baseSubscribers * planFactor,
          medicalPaid: (375000 + Math.random() * 20000) * planFactor, // ~$4.5M / 12
          rxPaid: (56500 + Math.random() * 5000) * planFactor, // ~$678K / 12
          specStopLossReimb: (-46960 + Math.random() * 5000) * planFactor, // Negative
          estRxRebates: (-35300 + Math.random() * 3000) * planFactor, // Negative
          adminFees: (21575 + Math.random() * 2000) * planFactor, // ~$258K / 12
          stopLossFees: (68165 + Math.random() * 5000) * planFactor, // ~$818K / 12
          budgetedPremium: monthlyBudget * planFactor,
        },
      })
    }
  }

  console.log('Created 12 months of snapshots')

  // Create high-cost claimants (10 claimants, >$1.6M total)
  const claimantsData = [
    { key: 'CLM-001', med: 280000, rx: 15000, plan: hdhp },
    { key: 'CLM-002', med: 250000, rx: 12000, plan: ppoBase },
    { key: 'CLM-003', med: 220000, rx: 18000, plan: ppoBuyup },
    { key: 'CLM-004', med: 200000, rx: 10000, plan: hdhp },
    { key: 'CLM-005', med: 190000, rx: 15000, plan: ppoBase },
    { key: 'CLM-006', med: 180000, rx: 8000, plan: hdhp },
    { key: 'CLM-007', med: 175000, rx: 12000, plan: ppoBuyup },
    { key: 'CLM-008', med: 170000, rx: 10000, plan: ppoBase },
    { key: 'CLM-009', med: 165000, rx: 9000, plan: hdhp },
    { key: 'CLM-010', med: 160000, rx: 11000, plan: ppoBase },
  ]

  for (const claim of claimantsData) {
    const totalPaid = claim.med + claim.rx
    const amountExceedingIsl = Math.max(0, totalPaid - 200000)

    await prisma.highClaimant.create({
      data: {
        clientId: client.id,
        planYearId: planYear.id,
        planId: claim.plan.id,
        claimantKey: claim.key,
        status: ClaimantStatus.OPEN,
        medPaid: claim.med,
        rxPaid: claim.rx,
        totalPaid,
        amountExceedingIsl,
      },
    })
  }

  console.log('Created 10 high-cost claimants')

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
