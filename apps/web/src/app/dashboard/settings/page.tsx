'use client'

import { useEffect, useState } from 'react'
import {
  ReportCard,
  Button,
  SkeletonLoader,
  ErrorBoundary,
} from '@medical-reporting/ui'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clientName, setClientName] = useState('')
  const [originalName, setOriginalName] = useState('')

  // TODO: Get these from context or URL params
  const clientId = 'demo-client-id'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/client?clientId=${clientId}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch client data')
        }
        const json = await response.json()
        setClientName(json.name)
        setOriginalName(json.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/client', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: clientName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setOriginalName(clientName)
      alert('Settings saved successfully. Please refresh the page to see changes in the header.')
    } catch (err) {
      alert('Error saving: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

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
              Manage client configuration and preferences
            </p>
          </div>
        </div>

        <ReportCard title="Client Settings">
          <div className="max-w-md space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate-300">
                Client Name
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-gallagher-blue focus:outline-none"
                placeholder="Enter client name"
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave} 
                disabled={saving || clientName === originalName}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </ReportCard>
      </div>
    </ErrorBoundary>
  )
}


