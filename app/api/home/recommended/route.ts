import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

// Server-side: real impl checks session + computes affinity, returns [] if no history.
export async function GET() {
  const empty: HomeTrendingPoi[] = []
  return NextResponse.json(empty)
}
