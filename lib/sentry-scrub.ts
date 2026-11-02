import type { Breadcrumb, Event, init } from '@sentry/nextjs'
import { withoutQuery } from '@/lib/analytics'

// What the SDK may collect on its own: nothing about the person or the request (no user fields,
// cookies, headers, query strings, bodies, query data or local variables). Errors keep their
// stack trace and source lines.
export const DATA_COLLECTION: NonNullable<Parameters<typeof init>[0]>['dataCollection'] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: false,
}

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
