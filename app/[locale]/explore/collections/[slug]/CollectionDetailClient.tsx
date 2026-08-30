'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, RefreshCw, ImageOff } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import { getRelationLabel } from '@/lib/content-relation-labels'
import type { CollectionDetail } from '@/lib/collections'
import MasonryGrid from '../../_components/MasonryGrid'
import TypeFilterChips from '../../_components/TypeFilterChips'

// Generalized client for every entity_type='collection' page (16 wireframe concepts +
// every other real collection row) — dispatches on primaryType/runtimeKind instead of
// being one bespoke component per concept. See lib/collections.ts's header comment.

function ChildGrid({ items }: { items: NonNullable<CollectionDetail['children']> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-sp-3">
      {items.map(c => (
        <Link
          key={c.slug}
          href={`/explore/collections/${c.slug}`}
          className="block overflow-hidden transition-opacity hover:opacity-80"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
        >
          <div className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-3)' }}>
            {c.primary_image_url ? (
              <Image src={c.primary_image_url} alt={c.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
            ) : (
              <ImageOff size={20} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
            )}
          </div>
          <div className="p-sp-3">
            <span className="text-f-md font-semibold text-fg leading-tight">{c.title}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function SiblingSwitcher({ siblings, currentSlug }: { siblings: NonNullable<CollectionDetail['siblings']>; currentSlug: string }) {
  return (
    <div className="flex gap-sp-2 overflow-x-auto pb-sp-2 mb-sp-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group">
      {siblings.map(s => {
        const active = s.slug === currentSlug
        return (
          <Link
            key={s.slug}
            href={`/explore/collections/${s.slug}`}
            aria-current={active ? 'page' : undefined}
            className="shrink-0 flex items-center min-h-touch px-sp-4 rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors duration-[80ms]"
            style={active
              ? { background: 'var(--fg)', color: 'var(--bg)' }
              : { background: 'var(--bg-3)', color: 'var(--muted)', border: '1px solid var(--bdr)' }}
          >
            {s.title}
          </Link>
        )
      })}
    </div>
  )
}

function RouteList({ items }: { items: CollectionDetail['items'] }) {
  return (
    <ol className="flex flex-col">
      {items.map((poi, i) => {
        const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
        return (
          <li key={poi.poi_id} className="flex gap-sp-3">
            <div className="flex flex-col items-center shrink-0">
              <span
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-f-sm font-semibold shrink-0"
                style={{ background: 'var(--fg)', color: 'var(--bg)' }}
              >
                {i + 1}
              </span>
              {i < items.length - 1 && <span className="w-px flex-1" style={{ background: 'var(--bdr)', minHeight: 'var(--sp-6)' }} />}
            </div>
            <Link
              href={`/place/${poi.poi_id}`}
              className="flex-1 flex gap-sp-3 mb-sp-4 p-sp-3 transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            >
              <div className="w-sp-16 h-sp-16 shrink-0 flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-3)' }}>
                {poi.primary_image_url ? (
                  <Image src={poi.primary_image_url} alt={name} fill sizes="64px" className="object-cover" />
                ) : (
                  <ImageOff size={16} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-[2px] min-w-0">
                <span className="text-f-md font-semibold text-fg leading-tight truncate">{name}</span>
                {poi.display_region && <span className="text-f-xxs text-muted">{poi.display_region}</span>}
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

export default function CollectionDetailClient({ slug }: { slug: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading, error, mutate } = useSWR<CollectionDetail>(
    [`/api/explore/collections/${slug}`, locale],
    ([url]) => fetcher<CollectionDetail>(url),
    { revalidateOnFocus: false },
  )
  const isError = !!error

  return (
    <div className="px-sp-4 lg:px-sp-6 pt-sp-5 pb-sp-20 max-w-[900px] mx-auto">
      {isLoading && !data && (
        <div aria-busy="true" aria-label={t('loading')} className="h-[400px] animate-pulse" style={{ background: 'var(--bg-2)' }} />
      )}

      {isError && !data && (
        <div
          className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-fg hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t('error.retry')}
          </button>
        </div>
      )}

      {!isError && data && (
        <>
          <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-4">
            <Link href="/explore" className="text-muted-2 hover:text-fg transition-colors">{t('breadcrumb')}</Link>
            {data.section && (
              <>
                <span>›</span>
                <span className="text-fg">{data.section}</span>
              </>
            )}
          </div>

          <h1 className="font-display text-fg text-f-display-tile mb-sp-2">{data.title}</h1>
          {data.runtimeKind !== 'HUB' && (
            <p className="text-f-md text-muted mb-sp-5">{t('collections.itemCount', { count: data.totalCount })}</p>
          )}

          {data.runtimeKind === 'HUB' && data.children && <ChildGrid items={data.children} />}

          {data.runtimeKind !== 'HUB' && (
            <>
              {data.runtimeKind === 'CHILD' && data.siblings && data.siblings.length > 1 && (
                <SiblingSwitcher siblings={data.siblings} currentSlug={slug} />
              )}

              {data.isOrdered ? (
                <RouteList items={data.items} />
              ) : (
                <>
                  {new Set(data.items.map(p => p.relation)).size > 1 && (
                    <TypeFilterChips
                      active={typeFilter}
                      onChange={setTypeFilter}
                      options={[
                        { key: 'all', label: t('collections.filterAll'), count: data.totalCount },
                        ...Array.from(new Set(data.items.map(p => p.relation))).map(key => ({
                          key, label: getRelationLabel(key, locale),
                        })),
                      ]}
                    />
                  )}
                  <MasonryGrid
                    items={(typeFilter === 'all' ? data.items : data.items.filter(p => p.relation === typeFilter)).map(p => ({
                      poi_id: p.poi_id,
                      name_ko: p.name_ko,
                      name_en: p.name_en,
                      primary_image_url: p.primary_image_url,
                      display_region: p.display_region,
                      relationship_ko: getRelationLabel(p.relation, 'ko'),
                      relationship_en: getRelationLabel(p.relation, 'en'),
                    }))}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
