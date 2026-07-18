// lib/bff.ts — server-side BFF caller for app/api route handlers.
// Converts the cookie session to a Bearer token and proxies to the Supabase
// Edge Function BFF (B4KBackend supabase/functions/api). Client code must not
// import this — browser calls go through app/api routes (or lib/api.ts for
// the live map).
import 'server-only'
import { NextResponse } from 'next/server'
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
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return { user, token: session.access_token }
}

interface BffFetchOptions extends RequestInit {
  /** Pre-fetched token (from getSessionAuth). undefined = look up the cookie
   *  session; null = force anonymous call. */
  token?: string | null
}

/** Call the BFF. Attaches Bearer when a session exists. Throws BffError on non-2xx. */
export async function bffFetch<T = unknown>(path: string, init: BffFetchOptions = {}): Promise<T> {
  if (!BFF_URL) throw new BffError('BFF not configured', 503)
  const { token, ...rest } = init
  const accessToken = token !== undefined ? token : (await getSessionAuth())?.token ?? null
  const res = await fetch(`${BFF_URL}${path}`, {
    cache: 'no-store',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...rest.headers,
    },
    signal: rest.signal ?? AbortSignal.timeout(8000),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (json as { error?: string })?.error ?? res.statusText
    throw new BffError(message, res.status)
  }
  return json as T
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
