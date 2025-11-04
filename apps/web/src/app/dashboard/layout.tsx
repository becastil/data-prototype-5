import Link from 'next/link'
import { StatusPill } from '@medical-reporting/ui'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/executive', label: 'Executive Summary' },
    { href: '/dashboard/monthly', label: 'Monthly Detail' },
    { href: '/dashboard/hcc', label: 'High-Cost Claimants' },
    { 
      label: 'Plan Pages', 
      children: [
        { href: '/dashboard/plan/hdhp', label: 'HDHP' },
        { href: '/dashboard/plan/ppo-base', label: 'PPO Base' },
        { href: '/dashboard/plan/ppo-buyup', label: 'PPO Buy-Up' },
      ]
    },
    { href: '/dashboard/inputs', label: 'Inputs Configuration' },
    { href: '/dashboard/summary', label: 'C&E Summary' },
    { href: '/dashboard/fees', label: 'Fees Manager' },
    { href: '/dashboard/upload', label: 'Upload Data' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-100">Medical Reporting</h1>
          <StatusPill status="up-to-date" className="mt-2" />
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <div key={item.href || item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                >
                  {item.label}
                </Link>
              ) : (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </div>
                  {item.children?.map((child: any) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-lg px-8 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
