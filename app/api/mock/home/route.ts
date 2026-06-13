import { NextResponse } from 'next/server'
import { HOME_MOCK } from '@/lib/mock/home'

export async function GET() {
  return NextResponse.json(HOME_MOCK)
}
