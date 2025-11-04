import Link from 'next/link'
import { Button } from '@medical-reporting/ui'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Medical Reporting Platform
        </h1>
        <p className="text-center text-slate-400 mb-8">
          Enterprise-grade, HIPAA-conscious web application for Self-Funded Medical & Pharmacy Reporting
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
