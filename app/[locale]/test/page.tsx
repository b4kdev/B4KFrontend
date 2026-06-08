import { MapPin, Image as ImageIcon, CheckCircle, XCircle, Clock, ArrowRight, Languages } from 'lucide-react'
import { getPlacesByDomain, searchPlaces, getPlace, getPlacePins } from '@/lib/places'
import type { Place } from '@/types/place'

// ── locale helpers ────────────────────────────────────────────────────────────

const LOCALES = [
  { code: 'en',    label: 'EN' },
  { code: 'ko',    label: 'KO' },
  { code: 'ja',    label: 'JA' },
  { code: 'zh-CN', label: '简' },
  { code: 'zh-TW', label: '繁' },
  { code: 'th',    label: 'TH' },
  { code: 'pt-BR', label: 'PT' },
] as const

type Translations = {
  [lang: string]: { name?: string; description?: string } | undefined
}

function localeName(p: Pick<Place, 'name_ko'> & Partial<Pick<Place, 'translations'>>, locale: string): string {
  if (locale === 'ko') return p.name_ko
  const t = (p.translations as Translations)?.[locale]
  return t?.name ?? p.name_ko
}

function localeAddress(
  p: Pick<Place, 'address_ko' | 'address_en'>,
  locale: string
): string | null {
  return locale === 'ko' ? p.address_ko : p.address_en
}

function localeDesc(p: Pick<Place, 'translations'>, locale: string): string | null {
  const t = (p.translations as Translations)?.[locale]
  return t?.description ?? null
}

function translationCoverage(p: Pick<Place, 'name_ko' | 'translations'>): Record<string, boolean> {
  const t = (p.translations as Translations) ?? {}
  return Object.fromEntries(
    LOCALES.map(l => [l.code, l.code === 'ko' ? true : !!(t[l.code]?.name)])
  )
}

// ── data fetch ────────────────────────────────────────────────────────────────

async function fetchAll() {
  const start = Date.now()

  const [kfood, searched, pins] = await Promise.allSettled([
    getPlacesByDomain('kfood', 1, 4),
    searchPlaces('강남'),
    getPlacePins({ north: 37.70, south: 37.45, east: 127.18, west: 126.80 }),
  ])

  const kfoodData = kfood.status === 'fulfilled' ? kfood.value.data : []
  const detail = kfoodData.length
    ? await getPlace(kfoodData[0].place_id).catch(() => null)
    : null

  return {
    kfood:  { ok: kfood.status === 'fulfilled',    data: kfoodData,                                                  total: kfood.status  === 'fulfilled' ? kfood.value.total : 0, error: kfood.status  === 'rejected' ? String(kfood.reason)  : null },
    search: { ok: searched.status === 'fulfilled', data: searched.status === 'fulfilled' ? searched.value : [],      error: searched.status === 'rejected' ? String(searched.reason) : null },
    detail: { ok: !!detail, data: detail },
    pins:   { ok: pins.status === 'fulfilled',     data: pins.status === 'fulfilled' ? pins.value : [],              error: pins.status   === 'rejected' ? String(pins.reason)   : null },
    ms: Date.now() - start,
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function LanguageToggle({ current }: { current: string }) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap rounded-[10px] p-3 mb-8"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <div className="flex items-center gap-1.5 mr-1 text-muted">
        <Languages size={14} strokeWidth={2} />
        <span className="text-[11px] font-semibold tracking-[0.06em] uppercase">Locale</span>
      </div>
      {LOCALES.map(l => {
        const active = l.code === current
        return (
          <a
            key={l.code}
            href={`/${l.code}/test`}
            className="text-[12px] font-bold tracking-[0.04em] px-3 py-1.5 rounded-[6px] transition-colors"
            style={{
              background: active ? 'var(--lav-dim)' : 'var(--bg-3)',
              color: active ? 'var(--lav)' : 'var(--muted)',
              border: active ? '1px solid var(--lav-border)' : '1px solid transparent',
              textDecoration: 'none',
            }}
          >
            {l.label}
          </a>
        )
      })}
      <span className="ml-auto text-[10px] text-muted font-mono">
        /{current}/test
      </span>
    </div>
  )
}

function SectionHead({ title, sub, count }: { title: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[16px] font-extrabold tracking-[0.04em] uppercase text-fg mb-1 font-display">
          {title}
        </h2>
        {sub && <p className="text-[12px] text-muted leading-[1.5]">{sub}</p>}
      </div>
      {count !== undefined && (
        <span className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">
          {count} rows
          <ArrowRight size={12} strokeWidth={2} />
        </span>
      )}
    </div>
  )
}

function Thumb({ url, domain }: { url: string | null; domain: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
    )
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
      <ImageIcon size={22} strokeWidth={2} className="text-muted-2" />
      {domain && (
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-muted-2">{domain}</span>
      )}
    </div>
  )
}

function DomainBadge({ domain }: { domain: string | null }) {
  if (!domain) return null
  return (
    <span
      className="absolute top-2.5 right-2.5 text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-[3px] rounded-[2px]"
      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--bdr)', color: 'var(--fg)' }}
    >
      {domain}
    </span>
  )
}

function TranslationDots({ coverage }: { coverage: Record<string, boolean> }) {
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {LOCALES.map(l => (
        <span
          key={l.code}
          title={`${l.code}: ${coverage[l.code] ? 'translated' : 'missing'}`}
          className="text-[8px] font-bold px-1 py-[1px] rounded-[2px]"
          style={{
            background: coverage[l.code] ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
            color: coverage[l.code] ? 'var(--success)' : 'var(--muted-2)',
          }}
        >
          {l.label}
        </span>
      ))}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-[12px]"
      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--danger)' }}
    >
      {msg}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function TestPage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const results = await fetchAll()

  const tests = [
    { label: 'getPlacesByDomain', ok: results.kfood.ok },
    { label: 'searchPlaces',      ok: results.search.ok },
    { label: 'getPlace',          ok: results.detail.ok },
    { label: 'getPlacePins',      ok: results.pins.ok },
  ]
  const allOk = tests.every(t => t.ok)

  return (
    <div className="px-3.5 md:px-8 pt-7 pb-16 max-w-[1200px]">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-5">
        <span className="text-muted-2">B4K</span>
        <span>›</span>
        <span className="text-fg">DB Connection Test</span>
      </div>

      {/* Language toggle */}
      <LanguageToggle current={locale} />

      {/* Status banner */}
      <div
        className="rounded-[10px] px-5 py-4 mb-11 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{
          background: allOk ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
          border: `1px solid ${allOk ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          {allOk
            ? <CheckCircle size={20} strokeWidth={2} className="text-success shrink-0" />
            : <XCircle size={20} strokeWidth={2} className="text-danger shrink-0" />
          }
          <div>
            <p className="text-[14px] font-bold text-fg">
              {allOk ? 'Supabase connected — data flowing' : 'Connection issues detected'}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              service.places_snapshot · locale: <strong className="text-lav">{locale}</strong> · {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tests.map(t => (
            <span
              key={t.label}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.04em] px-2.5 py-1 rounded-[4px]"
              style={{
                background: t.ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                color: t.ok ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {t.ok ? '✓' : '✗'} {t.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted shrink-0">
          <Clock size={12} strokeWidth={2} />
          {results.ms}ms total
        </div>
      </div>

      {/* ① Domain: kfood */}
      <section className="mb-11">
        <SectionHead
          title="K-Food"
          sub={`getPlacesByDomain('kfood', 1, 4) · [${locale}]`}
          count={results.kfood.total}
        />
        {!results.kfood.ok
          ? <ErrorBox msg={results.kfood.error ?? 'unknown error'} />
          : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {results.kfood.data.map(p => {
                const extraImg = (p.extra_info as Record<string, unknown> | null)?.image_url
                const imgUrl = p.primary_image_url ?? (typeof extraImg === 'string' ? extraImg : null)
                const imgSource = p.primary_image_url ? 'primary' : extraImg ? 'extra_info' : null
                return (
                  <div
                    key={p.place_id}
                    className="block rounded-lg overflow-hidden"
                    style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                  >
                    <div className="relative" style={{ aspectRatio: '16/9', background: 'var(--bg-3)' }}>
                      <Thumb url={imgUrl} domain={p.display_domain} />
                      <DomainBadge domain={p.display_domain} />
                      {imgSource && (
                        <span
                          className="absolute bottom-1.5 left-1.5 text-[8px] font-bold tracking-[0.06em] uppercase px-1.5 py-[2px] rounded-[2px]"
                          style={{
                            background: imgSource === 'extra_info' ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.15)',
                            color: imgSource === 'extra_info' ? 'var(--warning)' : 'var(--success)',
                          }}
                        >
                          {imgSource}
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-fg mb-[3px] leading-[1.3]">
                        {localeName(p, locale)}
                      </p>
                      <p className="text-[10px] text-muted">
                        {localeAddress(p, locale) ?? p.display_region ?? '—'}
                      </p>
                    </div>
                  </div>
                )
              })}
              {results.kfood.data.length === 0 && (
                <p className="col-span-4 text-[12px] text-muted py-4">No kfood rows with is_publishable=true</p>
              )}
            </div>
          )
        }
      </section>

      {/* ③ Search */}
      <section className="mb-11">
        <SectionHead
          title='Search "강남"'
          sub={`searchPlaces('강남') · [${locale}]`}
          count={results.search.data.length}
        />
        {!results.search.ok
          ? <ErrorBox msg={results.search.error ?? 'unknown error'} />
          : results.search.data.length === 0
            ? <p className="text-[12px] text-muted">No results for 강남</p>
            : (
              <div className="flex flex-col gap-2">
                {results.search.data.slice(0, 8).map(p => (
                  <div
                    key={p.place_id}
                    className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                    style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                  >
                    <div
                      className="relative shrink-0 rounded overflow-hidden"
                      style={{ width: 44, height: 44, background: 'var(--bg-3)' }}
                    >
                      <Thumb url={p.primary_image_url} domain={null} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-fg leading-snug truncate">
                        {localeName(p, locale)}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        {localeAddress(p, locale) ?? '—'} · {p.display_domain ?? '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </section>

      {/* ④ Place detail */}
      <section className="mb-11">
        <SectionHead
          title="Place Detail"
          sub={`getPlace(${results.kfood.data[0]?.place_id ?? '—'}) · full row · [${locale}]`}
        />
        {!results.detail.data
          ? <ErrorBox msg="getPlace returned null — no kfood rows available" />
          : (() => {
            const p = results.detail.data
            const name = localeName(p, locale)
            const addr = localeAddress(p, locale)
            const desc = localeDesc(p, locale)
            const coverage = translationCoverage(p)
            return (
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <div className="relative" style={{ aspectRatio: '3/1', background: 'var(--bg-3)' }}>
                  <Thumb url={p.primary_image_url} domain={p.display_domain} />
                  <DomainBadge domain={p.display_domain} />
                </div>
                <div className="p-4 md:p-6 grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[18px] font-extrabold text-fg mb-1">{name}</p>
                    {name !== p.name_ko && (
                      <p className="text-[11px] text-muted mb-1">ko: {p.name_ko}</p>
                    )}
                    <p className="flex items-center gap-1 text-[12px] text-muted mb-3">
                      <MapPin size={11} strokeWidth={2} />
                      {addr ?? '—'}
                      {locale !== 'ko' && p.address_en && p.address_ko && (
                        <span className="text-muted-2 ml-1">· ko: {p.address_ko}</span>
                      )}
                    </p>
                    {desc
                      ? <p className="text-[12px] text-muted leading-relaxed">{desc}</p>
                      : <p className="text-[11px] text-muted-2 italic">No [{locale}] description</p>
                    }
                    <TranslationDots coverage={coverage} />
                  </div>
                  <div className="text-[11px] text-muted space-y-1.5 font-mono">
                    <div><span className="text-muted-2">coords:</span> {p.coords_lat}, {p.coords_lng}</div>
                    <div><span className="text-muted-2">quality:</span> {p.quality_score}</div>
                    <div><span className="text-muted-2">domains:</span> {(p.domains ?? []).join(', ') || '—'}</div>
                    <div><span className="text-muted-2">region:</span> {p.display_region ?? '—'}</div>
                    <div><span className="text-muted-2">extra_info:</span> {Object.keys(p.extra_info ?? {}).join(', ') || 'empty'}</div>
                    <div><span className="text-muted-2">address_ko:</span> {p.address_ko ?? '—'}</div>
                    <div><span className="text-muted-2">address_en:</span> {p.address_en ?? '—'}</div>
                  </div>
                </div>
              </div>
            )
          })()
        }
      </section>

      {/* ⑤ Map pins */}
      <section className="mb-11">
        <SectionHead
          title="Map Pins — Seoul"
          sub="getPlacePins(Seoul bbox) · coords only (locale-independent)"
          count={results.pins.data.length}
        />
        {!results.pins.ok
          ? <ErrorBox msg={results.pins.error ?? 'unknown error'} />
          : (
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            >
              <p className="text-[12px] text-muted mb-3">
                {results.pins.data.length} pins in viewport · showing first 6
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {results.pins.data.slice(0, 6).map(p => {
                  const addr = localeAddress(p, locale)
                  return (
                    <div
                      key={p.place_id}
                      className="flex items-center gap-2 rounded px-2.5 py-2"
                      style={{ background: 'var(--bg-3)' }}
                    >
                      <MapPin size={12} strokeWidth={2} className="text-lav shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-fg truncate">{p.name_ko}</p>
                        {addr && (
                          <p className="text-[9px] text-muted truncate">{addr}</p>
                        )}
                        <p className="text-[9px] font-mono" style={{ color: 'var(--muted-2)' }}>
                          {p.coords_lat?.toFixed(4)}, {p.coords_lng?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
      </section>

    </div>
  )
}
