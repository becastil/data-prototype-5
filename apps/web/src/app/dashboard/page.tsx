import Link from 'next/link'
import { KpiPill, ReportCard, Button } from '@medical-reporting/ui'

export default function DashboardPage() {
  // TODO: Fetch real data from API
  const kpis = [
    { label: '% of Budget', value: 94.3, formatCurrency: false },
    { label: 'Total Cost', value: 5268182, formatCurrency: true },
    { label: 'Surplus', value: 317471, formatCurrency: true },
    { label: 'PEPM', value: 450, formatCurrency: true },
  ]

  const reportCards = [
    {
      title: 'Executive Summary',
      description: 'YTD metrics, fuel gauge, and plan mix analysis',
      href: '/dashboard/executive',
    },
    {
      title: 'Monthly Detail',
      description: 'A-N columns with PEPM trends (rolling 24 months)',
      href: '/dashboard/monthly',
    },
    {
      title: 'High-Cost Claimants',
      description: 'ISL-based filtering with employer vs stop loss analysis',
      href: '/dashboard/hcc',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard Overview</h1>
        <p className="mt-2 text-slate-400">
          Welcome to the Medical Reporting Platform
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiPill
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            formatCurrency={kpi.formatCurrency}
          />
        ))}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <ReportCard key={card.href} title={card.title}>
            <p className="mb-4 text-sm text-slate-400">{card.description}</p>
            <Link href={card.href}>
              <Button variant="secondary">View Report</Button>
            </Link>
          </ReportCard>
        ))}
      </div>
    </div>
  )
}
