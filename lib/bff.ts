// lib/bff.ts — server-side BFF caller for app/api route handlers.
// Converts the cookie session to a Bearer token and proxies to the Supabase
// Edge Function BFF (B4KBackend supabase/functions/api). Client code must not
// import this — browser calls go through app/api routes (or lib/api.ts for
// the live map).
import 'server-only'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

const BFF_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL

export class BffError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Validated user + access token from the cookie session. Null when signed out. */
export async function getSessionAuth(): Promise<{ user: User; token: string } | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return { user, token: session.access_token }
}

/** The visitor's IP as the host gives it (Vercel sets x-real-ip and x-forwarded-for itself and
 *  overwrites what a client sends). Null outside a request (build, scripts). */
export async function visitorIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}

interface BffFetchOptions extends RequestInit {
  /** Pre-fetched token (from getSessionAuth). undefined = look up the cookie
   *  session; null = force anonymous call. */
  token?: string | null
  /** The visitor's IP for the BFF's guest limits. undefined = this request's visitor (uncached
   *  calls only: an IP header would split the data cache per visitor); null = none. */
  clientIp?: string | null
}

/** Call the BFF. Attaches Bearer when a session exists. Throws BffError on non-2xx. Uncached calls
 *  carry the visitor's IP, so the BFF's guest limits count each visitor, not the website server. */
export async function bffFetch<T = unknown>(path: string, init: BffFetchOptions = {}): Promise<T> {
  if (!BFF_URL) throw new BffError('BFF not configured', 503)
  const { token, clientIp, ...rest } = init
  const accessToken = token !== undefined ? token : (await getSessionAuth())?.token ?? null
  const cached = rest.next?.revalidate !== undefined || ('cache' in rest && rest.cache !== 'no-store')
  const ip = clientIp !== undefined ? clientIp : cached ? null : await visitorIp()
  const res = await fetch(`${BFF_URL}${path}`, {
    cache: 'no-store',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(ip ? { 'X-Forwarded-For': ip } : {}),
      ...rest.headers,
    },
    signal: rest.signal ?? AbortSignal.timeout(8000),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 429) reportLimited(path)
  if (!res.ok) {
    const message = (json as { error?: string })?.error ?? res.statusText
    throw new BffError(message, res.status)
  }
  return json as T
}

// A BFF guest limit answered 429: one Sentry issue for all of them (warning level), at most one
// event per route every 10 minutes per server instance, so a busy hour cannot use up the quota.
// The route only: no query, ids or visitor IP.
const LIMIT_REPORT_MS = 10 * 60 * 1000
const lastLimitReport = new Map<string, number>()
function reportLimited(path: string) {
  const route = path.split('?')[0].replace(/\/[^/]*\d[^/]*/g, '/:id')
  const now = Date.now()
  if (now - (lastLimitReport.get(route) ?? 0) < LIMIT_REPORT_MS) return
  lastLimitReport.set(route, now)
  Sentry.captureMessage('BFF guest limit reached (429)', { level: 'warning', fingerprint: ['bff-429'], tags: { bff_route: route } })
}

/** Map a caught error to a JSON error response (preserves BFF status codes). */
export function bffErrorResponse(e: unknown): NextResponse {
  if (e instanceof BffError) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  if (e instanceof Error && e.name === 'TimeoutError') {
    return NextResponse.json({ error: 'Upstream timeout' }, { status: 504 })
  }
  return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
}

export const unauthorized = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
