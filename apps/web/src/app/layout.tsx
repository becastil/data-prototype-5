import type { Metadata } from 'next'
import './globals.css'
import './print.css'

export const metadata: Metadata = {
  title: 'Medical Reporting Platform',
  description: 'Enterprise-grade Medical & Pharmacy Reporting with C&E Analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
