import { NextResponse } from 'next/server'

export interface HomePartnerPackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
}

const MOCK: HomePartnerPackage[] = [
  { id: 'pkg-01', title: 'K-Beauty VIP Tour',       partner_name: 'Visit Korea',    partner_url: 'https://english.visitkorea.or.kr', cover_image_url: null },
  { id: 'pkg-02', title: 'Seoul Royal Palace Pass', partner_name: 'KTO Official',   partner_url: 'https://english.visitkorea.or.kr', cover_image_url: null },
  { id: 'pkg-03', title: 'Jeju Nature Escape',      partner_name: 'Jeju Tourism',   partner_url: 'https://www.visitjeju.net/en',     cover_image_url: null },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
