// lib/api.ts — BFF caller (B4KBackend supabase/functions/api). See b4k/API-ARCHITECTURE.md.
// The frontend never calls Supabase Postgres directly — every data read/write goes through this.
import { createSupabaseBrowserClient } from './supabase-browser'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers,
    },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(json?.error ?? res.statusText, res.status)
  }
  return json as T
}
