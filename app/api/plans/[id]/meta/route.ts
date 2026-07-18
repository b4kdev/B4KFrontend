import { NextRequest, NextResponse } from 'next/server'

export interface PlanMeta {
  isOwner: boolean
}

// SC-35 (S-DEGJDE) — ownership is a per-session authorization check, kept out
// of the main GET /api/plans/[id] payload on purpose: that response is the
// same for every viewer (share links, previews) and must never carry a
// client-trusted owner flag. This route re-derives it from the real session
// on every call.
//
// No data store wired yet — there is no real plan to check ownership against,
// so the honest fallback is always `false` (no one owns a plan that doesn't
// exist). Contract (API-CONTRACT.md) returns 200 always, never 401/404 here.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  void params
  return NextResponse.json({ isOwner: false } satisfies PlanMeta)
}
