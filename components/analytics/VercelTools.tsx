'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { withoutQuery } from '@/lib/analytics'

// Vercel Web Analytics and Speed Insights run without the cookie banner (cookieless, no
// identity), so the page address they send drops its query: no search text, id or token.
export default function VercelTools() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: withoutQuery(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: withoutQuery(event.url) })} />
    </>
  )
}
