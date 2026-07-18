import { NextResponse } from 'next/server'

export interface HomePartnerPackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
}

const MOCK: HomePartnerPackage[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
