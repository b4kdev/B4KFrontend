import { NextResponse } from 'next/server'
import { withSafePartnerUrls } from '@/lib/partner-url'

export interface HomePartnerPackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
}

const MOCK: HomePartnerPackage[] = []

// Same answer for everyone, built once (Next 15 no longer makes such GET handlers static by default).
export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json(withSafePartnerUrls(MOCK))
}
