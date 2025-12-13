'use client'

import { useState } from 'react'
import {
  ReportCard,
  Button,
  StatusPill,
  ErrorBoundary,
} from '@medical-reporting/ui'
import { useDashboard } from '@/context/DashboardContext'

export default function UploadPage() {
  const { clientId, planYearId } = useDashboard()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('monthly')
  const [preview, setPreview] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDownloadTemplate = () => {
    let csvContent = ''
    let filename = ''

    switch (fileType) {
      case 'monthly':
        csvContent = 'Plan,Month,Subscribers,Medical Paid,Rx Paid,Admin Fees,Stop Loss Fees,Budgeted Premium,Spec Stop Loss Reimb,Est Rx Rebates\n' +
                     'HDHP,2025-01,150,45000.00,12000.00,2500.00,5000.00,60000.00,0.00,0.00\n' +
                     'PPO Base,2025-01,200,65000.00,18000.00,3500.00,7000.00,90000.00,0.00,0.00'
        filename = 'monthly-template.csv'
        break
      case 'hcc':
        csvContent = 'Member ID,Plan,Member Type,Age Band,Primary Diagnosis Category,Specific Diagnosis Details Short,Specific Diagnosis Details,% of Plan Paid,% of Plan Paid w/o UC claims settlement,% of large claims,Total,Facility Inpatient,Facility Outpatient,Professional,Pharmacy,Top Provider,Enrolled (Y/N),Stop-Loss Deductible,Estimated Stop-Loss Reimbursement,Hit Stop Loss?\n' +
                     '1,HDHP,Dependent,<1 - 19,G71.01 - Duchenne or Becker muscular dystrophy,Drugs/IV Therapy,A genetic muscle disease causing progressive muscle weakness mostly in boys.,0.166952379,0.168533073,0.34871535,3270326.11,40895.65,3216530.02,12496.34,404.1,HOSPITAL NAME,Yes,350000,2920326.11,Yes'
        filename = 'hcc-template.csv'
        break
      case 'inputs':
        csvContent = 'Plan Year,Rx Rebate PEPM,IBNR,Aggregate Factor,ASL Fee\n' +
                     '2025,5.50,50000,1.05,12000'
        filename = 'inputs-template.csv'
        break
      default:
        return
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      // Basic validation for CSV/XLSX
      if (
        droppedFile.name.endsWith('.csv') ||
        droppedFile.name.endsWith('.xlsx')
      ) {
        setFile(droppedFile)
      } else {
        setError('Invalid file type. Please upload a CSV or XLSX file.')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleValidate = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)
      formData.append('planYearId', planYearId)
      formData.append('fileType', fileType)
      formData.append('preview', 'true')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setPreview(result)
        setStep(3)
      } else {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const errorList = result.errors
            .slice(0, 10) // Limit to first 10 errors
            .map((e: any) => `Row ${e.row}: ${e.message}`)
            .join('\n')
          
          const remaining = result.errors.length - 10
          const finalMessage = remaining > 0 
            ? `${errorList}\n...and ${remaining} more errors.`
            : errorList
            
          setError(finalMessage)
        } else {
          setError(result.message || 'Validation failed')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)
      formData.append('planYearId', planYearId)
      formData.append('fileType', fileType)
      formData.append('preview', 'false')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert('Data imported successfully!')
        // Reset form
        setStep(1)
        setFile(null)
        setPreview(null)
      } else {
        setError('Import failed: ' + result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Upload Data</h1>
        <p className="mt-2 text-slate-400">
          Import monthly statistics, high-cost claimants, or configuration data
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm ${
                step >= s ? 'text-slate-200' : 'text-slate-400'
              }`}
            >
              {s === 1 ? 'Select File' : s === 2 ? 'Validate' : 'Confirm'}
            </span>
            {s < 3 && <div className="h-px w-12 bg-slate-800" />}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400 whitespace-pre-wrap font-mono text-sm">
          {error}
        </div>
      )}

      {/* Step 1: File Selection */}
      {step === 1 && (
        <ReportCard title="Step 1: Select File">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                File Type
              </label>
              <div className="flex gap-3">
                <select
                  aria-label="File Type"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"
                >
                  <option value="monthly">Monthly Statistics</option>
                  <option value="hcc">High-Cost Claimants</option>
                  <option value="inputs">Configuration Inputs</option>
                </select>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  Download Template
                </Button>
              </div>
            </div>

            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-slate-700 hover:border-emerald-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="text-slate-400">
                  <svg
                    className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-emerald-500' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-lg font-medium text-slate-200">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="mt-1 text-sm">CSV or XLSX files only</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <Button onClick={() => setStep(2)} disabled={!file}>
                Next: Validate
              </Button>
            </div>
          </div>
        </ReportCard>
      )}

      {/* Step 2: Validation */}
      {step === 2 && (
        <ReportCard title="Step 2: Validation">
          <div className="space-y-6">
            <div className="text-center">
              <StatusPill status="idle" label="Ready to validate" />
              <p className="mt-4 text-slate-400">
                Click the button below to validate your file before importing.
              </p>
            </div>

            <div className="flex justify-between gap-4">
              <Button
                onClick={() => setStep(1)}
                disabled={uploading}
              >
                Back
              </Button>
              <Button
                onClick={handleValidate}
                disabled={uploading}
              >
                {uploading ? 'Validating...' : 'Validate File'}
              </Button>
            </div>
          </div>
        </ReportCard>
      )}

      {/* Step 3: Preview & Confirm */}
      {step === 3 && preview && (
        <ReportCard title="Step 3: Preview & Confirm">
          <div className="space-y-6">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
              <h3 className="font-semibold text-emerald-400">Validation Passed</h3>
              <div className="mt-2 text-sm text-slate-300">
                <p>Rows: {preview.preview.rowCount}</p>
                <p>Detected Months: {preview.detectedMonths?.join(', ')}</p>
                <p>Detected Plans: {preview.detectedPlans?.join(', ')}</p>
              </div>
            </div>

            {/* Sample Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {preview.preview.columns.map((col: string) => (
                      <th key={col} className="px-4 py-3 text-slate-300">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.sampleRows.slice(0, 5).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {preview.preview.columns.map((col: string) => (
                        <td key={col} className="px-4 py-3 text-slate-100">
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between gap-4">
              <Button
                onClick={() => setStep(1)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={uploading}
              >
                {uploading ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </div>
        </ReportCard>
      )}

      {/* FAQ Section */}
      <div className="mt-8 border-t border-slate-800 pt-8">
        <h2 className="text-xl font-semibold text-slate-200 mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">How should I format dates?</h3>
            <p className="text-sm text-slate-400">
              Dates should be in <strong>YYYY-MM</strong> format (e.g., 2025-01). 
              Excel dates are also supported if formatted correctly as dates.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">What file formats are supported?</h3>
            <p className="text-sm text-slate-400">
              We support <strong>.csv</strong> (Comma Separated Values) and <strong>.xlsx</strong> (Excel) files.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">Do I need to include all columns?</h3>
            <p className="text-sm text-slate-400">
              Yes, the header row must match the template exactly. You can leave individual cells empty (or 0.00) if there is no data for that specific metric, but the column itself must exist.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">Can I upload data for multiple plans at once?</h3>
            <p className="text-sm text-slate-400">
              Yes! The template includes a "Plan" column. You can include rows for "HDHP", "PPO Base", etc., in the same file.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">What happens when I upload a new file?</h3>
            <p className="text-sm text-slate-400">
              Uploading a new file will <strong>replace all existing data</strong> for that category (Monthly Statistics or High-Cost Claimants) in the current Plan Year. Only the data in the new file will be saved.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-slate-100">How do I handle negative numbers?</h3>
            <p className="text-sm text-slate-400">
              Use a standard minus sign (e.g., -1500.00) for reimbursements or rebates. Parentheses (1500.00) are not supported in CSV mode.
            </p>
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  )
}
