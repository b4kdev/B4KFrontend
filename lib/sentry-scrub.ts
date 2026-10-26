import type { Breadcrumb, Event } from '@sentry/nextjs'
import { withoutQuery } from '@/lib/analytics'

// Sentry runs without the cookie banner: crash telemetry only. Every event and breadcrumb leaves
// without user identifiers, cookies, request bodies or query strings (search text, ids, tokens).
export function scrubEvent<E extends Event>(event: E): E {
  delete event.user
  const req = event.request
  if (req) {
    if (req.url) req.url = withoutQuery(req.url)
    delete req.query_string
    delete req.data
    delete req.cookies
    if (req.headers) {
      for (const h of Object.keys(req.headers)) {
        if (/^(cookie|authorization)$/i.test(h)) delete req.headers[h]
        else if (/^referer$/i.test(h)) req.headers[h] = withoutQuery(req.headers[h])
      }
    }
  }
  event.breadcrumbs = event.breadcrumbs?.map(scrubBreadcrumb)
  return event
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const data = crumb.data
  if (data) {
    for (const k of ['url', 'from', 'to']) {
      if (typeof data[k] === 'string') data[k] = withoutQuery(data[k])
    }
  }
  return crumb
}
