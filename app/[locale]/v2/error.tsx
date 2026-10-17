'use client'

import { ErrorScreen } from '@/components/v2/screens/A4Pages'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} />
}
