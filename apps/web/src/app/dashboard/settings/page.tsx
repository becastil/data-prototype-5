import {
  ReportCard,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'

export default function SettingsPage() {
  const loading = false
  const error: string | null = null

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-red-400">
        Error: {error}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
            <p className="mt-2 text-slate-400">
              Configuration and preferences
            </p>
          </div>
        </div>

        <ReportCard title="Settings">
          <div className="max-w-md space-y-2 text-slate-300">
            <p>No settings available yet.</p>
          </div>
        </ReportCard>
      </div>
    </ErrorBoundary>
  )
}






