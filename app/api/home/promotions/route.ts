import { NextResponse } from 'next/server'

export interface HomePromotion {
  id: string
  headline: string
  image_url: string | null
  cta_url: string
  cta_label: string
}

// Interim content seed — real, publicly-known partner org homepages (not
// fabricated URLs). No per-item DB row to cross-check (these are programs/
// services, not POIs). image_url null pending Cloudinary wiring.
const SEED: HomePromotion[] = [
  { id: 'tmoney-airport', headline: 'T-money Card — Free Pickup at Incheon Airport', image_url: '/images/home/promotions/tmoney-airport.png', cta_url: 'https://www.t-money.co.kr', cta_label: 'Learn more' },
  { id: 'kto-myeongdong-tours', headline: 'Korea Tourism Organization — Free Walking Tours in Myeongdong', image_url: '/images/home/promotions/kto-myeongdong-tours.png', cta_url: 'https://english.visitkorea.or.kr', cta_label: 'Reserve a spot' },
  { id: 'discover-seoul-pass', headline: 'Discover Seoul Pass — Skip the Line at Top Attractions', image_url: '/images/home/promotions/discover-seoul-pass.png', cta_url: 'https://www.discoverseoulpass.com', cta_label: 'See pass options' },
]

export async function GET() {
  return NextResponse.json(SEED)
}
