'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ImageOff } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import TypeFilterChips from './TypeFilterChips'
import type { CollectionCard } from '@/app/api/explore/[category]/collections/route'

// Figma "Section Entry" — flat card-grid + type-filter-chips over the section's real
// entity_type='collection' rows (confirmed live 2026-08-30). Added as its own section on
// each of the 5 explore hub pages rather than replacing the existing trending/tours/etc
// POI rows — those browse real individual places, this browses curated multi-place
// collections; different content, both real, no reason to drop one for the other.
const PRIMARY_TYPE_LABELS: Record<string, { ko: string; en: string }> = {
  FAN_THEME: { ko: '팬덤·테마', en: 'Fandom' },
  ROUTE: { ko: '루트', en: 'Route' },
  CHALLENGE: { ko: '챌린지', en: 'Challenge' },
  SHOPPING: { ko: '쇼핑', en: 'Shopping' },
  STORY: { ko: '스토리', en: 'Story' },
  EXPERIENCE: { ko: '체험', en: 'Experience' },
  MOMENT: { ko: '시즌', en: 'Moment' },
}

function typeLabel(type: string | null, locale: string): string {
  if (!type) return locale === 'ko' ? '기타' : 'Other'
  const known = PRIMARY_TYPE_LABELS[type]
  if (known) return locale === 'ko' ? known.ko : known.en
  return type
}

export default function ExploreCollectionsGrid({ category }: { category: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading } = useSWR<{ items: CollectionCard[] }>(
    [`/api/explore/${category}/collections`, locale],
    ([url]) => fetcher<{ items: CollectionCard[] }>(url),
    { revalidateOnFocus: false },
  )
  const items = data?.items ?? []

  if (!isLoading && items.length === 0) return null

  const visible = typeFilter === 'all' ? items : items.filter(i => (i.primaryType ?? 'other') === typeFilter)

  return (
    <div className="mb-sp-10">
      <h2 className="font-display text-fg text-f-xl mb-sp-4">{t('collectionsGrid.title')}</h2>

      {isLoading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-sp-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse" style={{ background: 'var(--bg-2)' }} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          <TypeFilterChips
            active={typeFilter}
            onChange={setTypeFilter}
            options={[
              { key: 'all', label: t('collectionsGrid.filterAll'), count: items.length },
              ...Array.from(new Set(items.map(i => i.primaryType ?? 'other'))).map(key => ({
                key, label: typeLabel(key === 'other' ? null : key, locale),
              })),
            ]}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-sp-3">
            {visible.map(item => (
              <Link
                key={item.slug}
                href={`/explore/collections/${item.slug}`}
                className="block overflow-hidden transition-opacity hover:opacity-80"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <div className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-3)' }}>
                  {item.primary_image_url ? (
                    <Image src={item.primary_image_url} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  ) : (
                    <ImageOff size={20} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                  )}
                </div>
                <div className="p-sp-3">
                  <span className="text-f-sm font-semibold text-fg leading-tight line-clamp-2">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
