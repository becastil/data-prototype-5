
import { PrismaClient } from '@prisma/client'
import { calculatePepm } from '@medical-reporting/lib'

const prisma = new PrismaClient()

async function main() {
  console.log('Connecting to database...')
  
  // Find a client and plan year
  const client = await prisma.client.findFirst()
  if (!client) {
    console.log('No client found')
    return
  }
  
  const planYear = await prisma.planYear.findFirst({
    where: { clientId: client.id }
  })
  
  if (!planYear) {
    console.log('No plan year found')
    return
  }
  
  console.log(`Checking Client: ${client.name}, PlanYear: ${planYear.id}`)
  
  // Get snapshots
  const snapshots = await prisma.monthSnapshot.findMany({
    where: {
      clientId: client.id,
      planYearId: planYear.id,
    },
    include: {
      monthlyStats: true
    },
    take: 5
  })
  
  console.log(`Found ${snapshots.length} snapshots`)
  
  for (const snapshot of snapshots) {
    console.log(`Snapshot: ${snapshot.monthDate.toISOString()}`)
    let totalSubs = 0
    let totalMed = 0
    
    for (const stat of snapshot.monthlyStats) {
      console.log(`  Plan: ${stat.planId}`)
      console.log(`    Subscribers: ${stat.totalSubscribers} (Type: ${typeof stat.totalSubscribers})`)
      console.log(`    Medical Paid: ${stat.medicalPaid}`)
      
      totalSubs += Number(stat.totalSubscribers)
      totalMed += Number(stat.medicalPaid)
    }
    
    console.log(`  Aggregated:`)
    console.log(`    Total Subscribers: ${totalSubs}`)
    console.log(`    Total Medical: ${totalMed}`)
    
    const pepm = calculatePepm(totalMed, totalSubs, 1)
    console.log(`    Calculated PEPM: ${pepm}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })







