'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PrintModeListener() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const isPrint = searchParams.get('print') === 'true'
    if (isPrint) {
      document.documentElement.dataset.print = 'true'
    } else {
      delete document.documentElement.dataset.print
    }
  }, [searchParams])

  return null
}




