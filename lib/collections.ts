// Explore content-detail pages, generalized. 16 wireframe-spec concepts (Fandom-Theme,
// Real-Route, Mission-Challenge, Shopping-Challenge, Experience-Reservation, Route+Hours,
// Route+Waypoint, Scene-vs-Reality, Content-type Detail, Han River Integrated, Hub Entry,
// Child+Sibling-Switch, B-only Exception) all turned out to be the SAME underlying data
// shape: a `core.entities` row with entity_type='collection', addressed by its own real
// `slug` — confirmed 2026-08-30 via GET /entities?type=collection (108 rows) against the
// correct project ref (rojxjrsdscohupyxvbdd — see reference-supabase-project memory).
//
// The UI variant per page is NOT something we invent — `metadata.primary_type` (FAN_THEME /
// STORY / EXPERIENCE / ROUTE / CHALLENGE) is a real field the content team already tags
// each collection with, and `metadata.runtime_kind` (HUB / LEAF / CHILD) distinguishes a
// hub-with-children (e.g. "수도권 테마파크 골라가기") from a single detail page from a
// child-of-a-hub (e.g. "에버랜드 처음이라면"). One dynamic route + one client component
// dispatches on these two real fields instead of 16 hand-built page types.
import 'server-only'
import { bffFetch } from './bff'
import { pickEntityTitle } from './entity-i18n'

export type CollectionPrimaryType = 'FAN_THEME' | 'STORY' | 'EXPERIENCE' | 'ROUTE' | 'CHALLENGE' | 'SHOPPING'
export type CollectionRuntimeKind = 'HUB' | 'LEAF' | 'CHILD'

export interface CollectionItem {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  relation: string
  coords_lat: number
  coords_lng: number
}

export interface CollectionSummary {
  slug: string
  title: string
  primary_image_url: string | null
}

export interface CollectionDetail {
  slug: string
  entityId: number
  title: string
  section: string
  isOrdered: boolean
  totalCount: number
  runtimeKind: CollectionRuntimeKind
  primaryType: CollectionPrimaryType | null
  items: CollectionItem[]
  /** HUB only — its children, for a hub-entry landing grid. */
  children?: CollectionSummary[]
  /** CHILD only — every slug in the same hub (including this one), for a sibling switcher. */
  siblings?: CollectionSummary[]
}

// No DB relation exists between a HUB collection and its children (GET /entities/:slug's
// related_entities is empty for all 4 hubs below, confirmed 2026-08-30) — the only real
// link is the slug numbering convention itself (hub `h142` -> children `c142-121..124`).
// Static map, not fabricated: every slug here was confirmed live via GET /entities?type=
// collection before being added. All 4 real k-culture HUB rows as of that check —
// re-verify this list if the count in GET /entities?type=collection ever changes.
const HUB_CHILDREN: Record<string, string[]> = {
  'slide-kculture-h142': ['slide-kculture-c142-121', 'slide-kculture-c142-122', 'slide-kculture-c142-123', 'slide-kculture-c142-124'],
  'slide-kculture-h190': ['slide-kculture-c190-161', 'slide-kculture-c190-162', 'slide-kculture-c190-165'],
  'slide-kculture-h191': ['slide-kculture-c191-163', 'slide-kculture-c191-164', 'slide-kculture-c191-166'],
  'slide-kculture-h192': ['slide-kculture-c192-167', 'slide-kculture-c192-168', 'slide-kculture-c192-169'],
}

function findSiblingSlugs(slug: string): string[] {
  for (const children of Object.values(HUB_CHILDREN)) {
    if (children.includes(slug)) return children
  }
  return []
}

interface EntityProfile {
  entity_id: number
  slug: string
  name_ko: string
  name_en: string | null
  primary_image_url: string | null
  translations?: Record<string, { name?: string; description?: string }>
  metadata?: {
    section?: string
    primary_type?: string
    runtime_kind?: string
    is_ordered?: string
  }
}

interface ContextItem {
  poi_id: number
  name_ko: string
  relation: string
  coords_lat: number
  coords_lng: number
  primary_image_url: string | null
  display_region: string | null
  /** 맥락별 오버레이 이름(예: 특정 콜렉션에서만 쓰는 설명) — 있으면 base_translations보다 우선. */
  translations?: Record<string, { name?: string; description?: string }>
  /** poi_translations 원본 — 맥락 오버레이가 없는 언어의 fallback. */
  base_translations?: Record<string, { name?: string; description?: string }>
}

async function fetchSummary(slug: string, locale: string): Promise<CollectionSummary | null> {
  try {
    const p = await bffFetch<EntityProfile>(`/entities/${slug}`, { token: null })
    return { slug, title: pickEntityTitle(p, locale), primary_image_url: p.primary_image_url }
  } catch {
    return null
  }
}

export async function fetchCollectionDetail(slug: string, locale: string): Promise<CollectionDetail | null> {
  try {
    const profile = await bffFetch<EntityProfile>(`/entities/${slug}`, { token: null })
    const runtimeKind = (profile.metadata?.runtime_kind as CollectionRuntimeKind | undefined) ?? 'LEAF'
    const primaryType = (profile.metadata?.primary_type as CollectionPrimaryType | undefined) ?? null
    const isOrdered = profile.metadata?.is_ordered === 'TRUE'

    let items: CollectionItem[] = []
    if (runtimeKind !== 'HUB') {
      const context = await bffFetch<ContextItem[]>(`/context/entity:${profile.entity_id}?limit=50`, { token: null })
      items = context.map(c => ({
        poi_id: String(c.poi_id),
        name_ko: c.name_ko,
        name_en: pickEntityTitle(
          { name_ko: c.name_ko, translations: { ...c.base_translations, ...c.translations } },
          locale,
        ),
        primary_image_url: c.primary_image_url,
        display_region: c.display_region ?? '',
        relation: c.relation,
        coords_lat: c.coords_lat,
        coords_lng: c.coords_lng,
      }))
      if (!items.length) return null
    }

    let children: CollectionSummary[] | undefined
    if (runtimeKind === 'HUB') {
      const childSlugs = HUB_CHILDREN[slug] ?? []
      const fetched = await Promise.all(childSlugs.map(s => fetchSummary(s, locale)))
      children = fetched.filter((c): c is CollectionSummary => c !== null)
      if (!children.length) return null
    }

    let siblings: CollectionSummary[] | undefined
    if (runtimeKind === 'CHILD') {
      const siblingSlugs = findSiblingSlugs(slug)
      const fetched = await Promise.all(siblingSlugs.map(s => fetchSummary(s, locale)))
      siblings = fetched.filter((c): c is CollectionSummary => c !== null)
    }

    return {
      slug,
      entityId: profile.entity_id,
      title: pickEntityTitle(profile, locale),
      section: profile.metadata?.section ?? '',
      isOrdered,
      totalCount: items.length,
      runtimeKind,
      primaryType,
      items,
      children,
      siblings,
    }
  } catch {
    return null
  }
}
