import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PrintModeListener } from '@/components/PrintModeListener'
import './globals.css'
import './print.css'

export const metadata: Metadata = {
  title: 'Gallagher Benefits Dashboard',
  description: 'Executive financial reporting for self-funded health plans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <Suspense fallback={null}>
          <PrintModeListener />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
