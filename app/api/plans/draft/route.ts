import { NextResponse } from 'next/server'

export interface PlanDraft {
  id: string
  title: string
  stop_count: number
  updated_at: string
}

export async function GET() {
  // Stub — real impl: getServerSession() → ai.plans WHERE author_id = user AND is_published = false LIMIT 1
  return NextResponse.json(null)
}

export async function POST(request: Request) {
  // Stub — real impl: getServerSession() → check existing draft (T1 conflict) → INSERT ai.plans is_published=false
  await request.json()
  return NextResponse.json({ ok: true })
}
