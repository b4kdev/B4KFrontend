import { NextRequest, NextResponse } from 'next/server'
import { bffFetch } from '@/lib/bff'
import { pickEntityTitle } from '@/lib/entity-i18n'
import { collectionHasContent, collectionTypeCode } from '@/lib/collections'

// Real entity_type='collection' rows for one Explore section (k-pop/k-drama/k-beauty/
// k-food/k-culture), confirmed live 2026-08-30 via GET /entities?type=collection (108
// rows total across 5 domains, metadata.frd_domain is the real filter field — no
// domain-scoped query param exists so this fetches all and filters server-side).
// CHILD-kind entities (e.g. individual theme parks under a "pick a theme park" hub) are
// excluded — they're reached through their HUB card, not listed twice at top level.
// A collection with no places yet is left out: its page has nothing to show.

interface EntitySummary {
  slug: string
  entity_id: number
  name_ko: string
  name_en?: string | null
  translations?: Record<string, { name?: string; description?: string }>
  primary_image_url: string | null
  /** Up to 4 photos of the collection's places, most liked first. */
  cover_images?: string[]
  metadata?: { frd_domain?: string; primary_type?: string; runtime_kind?: string }
}

export interface CollectionCard {
  slug: string
  title: string
  primary_image_url: string | null
  /** The 2x2 cover: up to 4 place photos (fewer when the collection has fewer). */
  cover_images: string[]
  primaryType: string | null
}

export async function GET(req: NextRequest, props: { params: Promise<{ category: string }> }) {
  const params = await props.params;
  try {
    const locale = req.nextUrl.searchParams.get('locale') ?? 'en'
    const [page1, page2] = await Promise.all([
      bffFetch<EntitySummary[]>('/entities?type=collection&limit=100&offset=0', { token: null }),
      bffFetch<EntitySummary[]>('/entities?type=collection&limit=100&offset=100', { token: null }),
    ])
    const all = [...page1, ...page2]
    const listed = all.filter(e => e.metadata?.frd_domain === params.category && e.metadata?.runtime_kind !== 'CHILD')
    const shown = await Promise.all(listed.map(collectionHasContent))
    const items: CollectionCard[] = listed
      .filter((_, i) => shown[i])
      .map(e => ({
        slug: e.slug,
        title: pickEntityTitle(e, locale),
        primary_image_url: e.primary_image_url,
        cover_images: (e.cover_images ?? []).slice(0, 4),
        primaryType: collectionTypeCode(e.metadata?.primary_type),
      }))
    return NextResponse.json({ items })
  } catch {
    // A failed read is an error, not an empty row: the page shows the row error with Try again.
    return NextResponse.json({ items: [] }, { status: 502 })
  }
}
