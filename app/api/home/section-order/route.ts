import { NextResponse } from 'next/server'
import { HOME_SECTION_ORDER, type HomeSectionOrder } from './order'

/**
 * Home content-section ordering.
 *
 * MOCK STUB. Real impl weights this order by the user's behavioral signals —
 * category/tag weights derived from search history (raw queries never stored,
 * Model A), saves, and interests — to rank the personalizable Home
 * sections. Guests (no signals) receive HOME_SECTION_ORDER unchanged.
 *
 * Only the CONTENT sections are ordered here. Fixed sections (hero carousel,
 * weather widget) stay pinned client-side and are NOT included in this list.
 * Unknown keys returned here are ignored by the client; missing keys fall back
 * to their default position, so the payload can never break the page.
 */
export async function GET() {
  // Real impl: resolve session → load behavioral weights → reorder.
  // Guests / no signals → HOME_SECTION_ORDER.
  return NextResponse.json<HomeSectionOrder>({ order: HOME_SECTION_ORDER })
}
