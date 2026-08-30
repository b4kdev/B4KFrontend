import { NextRequest, NextResponse } from 'next/server'
import { bffFetch } from '@/lib/bff'

// Real entity_type='collection' rows for one Explore section (k-pop/k-drama/k-beauty/
// k-food/k-culture), confirmed live 2026-08-30 via GET /entities?type=collection (108
// rows total across 5 domains, metadata.frd_domain is the real filter field — no
// domain-scoped query param exists so this fetches all and filters server-side).
// CHILD-kind entities (e.g. individual theme parks under a "pick a theme park" hub) are
// excluded — they're reached through their HUB card, not listed twice at top level.

interface EntitySummary {
  slug: string
  name_ko: string
  primary_image_url: string | null
  metadata?: { frd_domain?: string; primary_type?: string; runtime_kind?: string }
}

export interface CollectionCard {
  slug: string
  title: string
  primary_image_url: string | null
  primaryType: string | null
}

export async function GET(_req: NextRequest, { params }: { params: { category: string } }) {
  try {
    const [page1, page2] = await Promise.all([
      bffFetch<EntitySummary[]>('/entities?type=collection&limit=100&offset=0', { token: null }),
      bffFetch<EntitySummary[]>('/entities?type=collection&limit=100&offset=100', { token: null }),
    ])
    const all = [...page1, ...page2]
    const items: CollectionCard[] = all
      .filter(e => e.metadata?.frd_domain === params.category && e.metadata?.runtime_kind !== 'CHILD')
      .map(e => ({
        slug: e.slug,
        title: e.name_ko,
        primary_image_url: e.primary_image_url,
        primaryType: e.metadata?.primary_type ?? null,
      }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
