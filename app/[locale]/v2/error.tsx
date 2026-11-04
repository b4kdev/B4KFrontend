'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { ErrorScreen } from '@/components/v2/screens/A4Pages'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Same reporting as the fallback boundary in app/[locale]/error.tsx.
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return <ErrorScreen reset={reset} />
}
