import Link from 'next/link'
import { Button } from '@medical-reporting/ui'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gallagher-blue rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-bold text-gallagher-blue">
            Gallagher Benefits Dashboard
          </h1>
        </div>
        
        <p className="text-text-secondary mb-8 text-lg">
          Executive financial reporting for self-funded health plans
        </p>
        
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-gallagher-blue-lighter flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gallagher-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Executive Summary</h3>
            <p className="text-sm text-text-muted">
              At-a-glance financial metrics with budget vs actual comparison
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-gallagher-blue-lighter flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gallagher-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Trend Analysis</h3>
            <p className="text-sm text-text-muted">
              Track costs over time with intelligent alerts for variances
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-gallagher-blue-lighter flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gallagher-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">High-Cost Claimants</h3>
            <p className="text-sm text-text-muted">
              Understand cost concentration and stop-loss impact
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Arthur J. Gallagher & Co. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}
