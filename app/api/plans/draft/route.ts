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
