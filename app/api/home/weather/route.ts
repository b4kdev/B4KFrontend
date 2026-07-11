import { NextResponse } from 'next/server'

export interface HomeWeather {
  temp_c: number
  condition: string
  forecast: { day: string; high: number; low: number; condition: string }[]
}

export async function GET() {
  // OQ-HM-03: weather API provider not yet defined — return null to hide widget
  return NextResponse.json(null)
}
