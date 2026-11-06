'use client'

import { useEffect, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Chip, DateRangePicker, QuickPlan, Spinner, type DateRange } from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { apiFetch } from '@/lib/api'
import { track } from '@/lib/analytics'
import { cityToApiRegion, labelOf, placeName, readDraftTags, RESULT_LIMIT, saveCourseHandoff, saveDraftAnswers, saveDraftTags, toISODate, type QuickPlanAnswers, type QuickPlanCity, type QuickPlanPlace } from '@/lib/quickplan'
import { buildCourse, courseDayCount } from '@/lib/quickplan-course'
import { COURSE_HANDOFF_EVENT } from './map/usePlanDraft'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Quick plan (planning flow 4): Where, who and when; Interests (up to 10);
// Review. Make my plan builds the course the same way as live (/places + buildCourse) and opens
// it in the Plan editor unsaved (/v2/map?from=quickplan).

// Destinations as drawn (in its order). A city inside a province searches its province and the
// city itself (district, as the place data writes it).
const CITIES = ['Seoul', 'Busan', 'Jeju', 'Gyeongju', 'Incheon', 'Jeonju', 'Gangneung', 'Sokcho', 'Yeosu'] as const
const CITY_CD: Record<string, string> = {
  Seoul: 'CD0756', Busan: 'CD0741', Jeju: 'CD0752', Gyeongju: 'CD0749', Incheon: 'CD0751', Jeonju: 'CD0211',
  Gangneung: 'CD1809', Sokcho: 'CD1810', Yeosu: 'CD1811',
}
const CITY_REGION: Record<string, string> = { Jeonju: 'Jeonbuk', Gangneung: 'Gangwon', Sokcho: 'Gangwon', Yeosu: 'Jeonnam' }
const CITY_DISTRICT: Record<string, string> = { Gyeongju: '경주시', Jeonju: '전주시', Gangneung: '강릉시', Sokcho: '속초시', Yeosu: '여수시' }
const WHO = [['solo', 'CD0798'], ['couple', 'CD0794'], ['friends', 'CD0796'], ['family', 'CD0795']] as const
const MAX = 10

const WHO_KEY = 'b4k_quickplan_who'

/** Radio group keys: arrows move the choice and the focus to the next or previous chip. */
function radioKeys<T extends string>(ids: readonly T[], current: T | null, set: (id: T) => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const i = current ? ids.indexOf(current) : -1
    const n = (i + step + ids.length) % ids.length
    set(ids[n])
    const radios = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')
    requestAnimationFrame(() => radios[n]?.focus())
  }
}

export default function V2QuickPlan({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useCd()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [city, setCity] = useState<string>('Seoul')
  const [who, setWho] = useState<string | null>(null)
  const [range, setRange] = useState<DateRange>({ start: null, end: null })
  const [picked, setPicked] = useState<string[]>([])
  const [building, setBuilding] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const phone = usePhone()
  const lang = useLocale()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const { categories, isLoading, isError, retry } = useInterests(open)
  // Prefill from the last answers: interests and the Quick plan answers from the account (or this
  // device for guests), who with also from this device; dates only while they are still ahead.
  // Who with is kept as an answer only; the course does not use it.
  useEffect(() => {
    if (!open) return
    try {
      const w = localStorage.getItem(WHO_KEY)
      if (w && WHO.some(([id]) => id === w)) setWho((cur) => cur ?? w)
    } catch {}
    if (user) {
      apiFetch<{ interest_tags?: string[] }>('/me/interests')
        .then((r) => { if (r?.interest_tags?.length) setPicked((cur) => (cur.length ? cur : r.interest_tags!.slice(0, MAX))) })
        .catch(() => {})
      apiFetch<{ quick_plan?: QuickPlanAnswers | null }>('/me')
        .then((r) => {
          const a = r?.quick_plan
          if (!a) return
          const c = CITIES.find((x) => x.toLowerCase() === a.destination)
          if (c) setCity(c)
          if (a.who_with && WHO.some(([id]) => id === a.who_with)) setWho((cur) => cur ?? a.who_with!)
          if (a.start_date && a.start_date >= toISODate(new Date())) {
            const at = (d: string) => new Date(`${d}T00:00:00`)
            setRange((cur) => (cur.start ? cur : { start: at(a.start_date!), end: a.end_date ? at(a.end_date) : null }))
          }
        })
        .catch(() => {})
    } else {
      const tags = readDraftTags()
      if (tags?.length) setPicked((cur) => (cur.length ? cur : tags.slice(0, MAX)))
    }
  }, [open, user])
  // Closing while the plan is being made would open the map after the dialog is gone: wait for it.
  const close = () => {
    if (building) return
    onClose()
    setStep(1)
  }
  // Dates in the page's language, not the browser's.
  const fmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' })
  const dates = range.start ? (range.end ? fmt.formatRange(range.start, range.end) : fmt.format(range.start)) : t('CD0767')
  const progress = step === 1 ? t('CD1344') : step === 2 ? t('CD1346') : t('CD1356')

  // Group labels in sentence case at title size, not small caps.
  const lbl = 'type-title-card text-ui-fg'
  const chipLabel = new Map(categories.flatMap((g) => g.chips.map((c) => [c.slug, labelOf(c, lang)] as const)))
  const group = categories.find((g) => g.slug === activeGroup) ?? categories[0]
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length < MAX ? [...p, slug] : p))

  // Figma A1 / Quick plan / Step 1 to 3.
  const body =
    step === 1 ? (
      <div className="flex flex-col gap-[var(--space-6)]">
        {/* One choice each: radio groups (arrow keys move and pick). */}
        <fieldset className="flex flex-col gap-[var(--space-3)]">
          <legend className={`mb-[var(--space-3)] ${lbl}`}>{t('CD0791')}</legend>
          <div role="radiogroup" aria-label={t('CD0791')} onKeyDown={radioKeys(CITIES, city, setCity)} className="flex flex-wrap gap-[var(--space-2)]">
            {CITIES.map((c) => <Chip key={c} role="radio" aria-checked={city === c} aria-pressed={undefined} tabIndex={city === c ? 0 : -1} selected={city === c} leadingIcon={city === c ? <Check /> : undefined} onClick={() => setCity(c)}>{t(CITY_CD[c])}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-[var(--space-3)]">
          <legend className={`mb-[var(--space-3)] ${lbl}`}>{t('CD0797')}</legend>
          <div role="radiogroup" aria-label={t('CD0797')} onKeyDown={radioKeys(WHO.map(([id]) => id), who, setWho)} className="flex flex-wrap gap-[var(--space-2)]">
            {WHO.map(([id, cd], i) => <Chip key={id} role="radio" aria-checked={who === id} aria-pressed={undefined} tabIndex={who === id || (!who && i === 0) ? 0 : -1} selected={who === id} leadingIcon={who === id ? <Check /> : undefined} onClick={() => setWho(id)}>{t(cd)}</Chip>)}
          </div>
        </fieldset>
      </div>
    ) : step === 2 ? (
      <div className="flex flex-col gap-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <p aria-live="polite" className="type-body-caption text-ui-fg-muted">{t('CD1348', { count: picked.length, max: MAX })}</p>
          {/* Picked: every pick in plain sight, wrapping; a new pick lands at the end (Sun 2026-11-06). */}
          {picked.length ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {picked.map((slug) => <Chip key={slug} type="dismissible" dismissLabel={t('CD0783', { label: chipLabel.get(slug) ?? slug })} onClick={() => toggle(slug)}>{chipLabel.get(slug) ?? slug}</Chip>)}
            </div>
          ) : <p className="flex h-[var(--control-height-sm)] items-center type-body-caption text-ui-fg-muted">{t('CD0779')}</p>}
        </div>
        {isLoading ? <Spinner label={t('CD0781')} /> : null}
        {isError ? (
          <p role="alert" className="type-body-base text-ui-danger">
            {t('CD0780')} <button type="button" onClick={retry} className="underline decoration-[length:var(--border-width-1-5)] underline-offset-4">{t('CD0784')}</button>
          </p>
        ) : null}
        {group ? (
          <div className={phone ? 'flex flex-col gap-[var(--space-6)]' : 'flex gap-[var(--space-6)]'}>
            {/* Categories: a list on desktop, a row of chips on phones (Figma Step 2 Mobile). */}
            <div role="group" aria-label={t('CD0778')} className={phone ? 'b4k-focus-room flex gap-[var(--space-2)] overflow-x-auto overscroll-x-contain overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'flex w-[136px] shrink-0 flex-col items-start gap-[var(--space-3)]'}>
              {categories.map((g) =>
                phone ? (
                  <Chip key={g.slug} selected={g.slug === group.slug} onClick={() => setActiveGroup(g.slug)} className="shrink-0">{labelOf(g, lang)}</Chip>
                ) : (
                  <button
                    key={g.slug}
                    type="button"
                    aria-pressed={g.slug === group.slug}
                    onClick={() => setActiveGroup(g.slug)}
                    className={`relative -ml-[var(--space-3)] border-l-2 pl-[calc(var(--space-3)-2px)] text-left type-body-base focus-visible:shadow-focus-ring focus-visible:outline-none ${g.slug === group.slug ? 'border-ui-fg text-ui-fg' : 'border-transparent text-ui-fg-muted hover:text-ui-fg'}`}
                  >
                    {labelOf(g, lang)}
                  </button>
                ),
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap content-start gap-[var(--space-2)]">
              {group.chips.map((c) => {
                const on = picked.includes(c.slug)
                return (
                  <Chip key={c.slug} selected={on} leadingIcon={on ? <Check /> : undefined} disabled={!on && picked.length >= MAX} onClick={() => toggle(c.slug)}>
                    {labelOf(c, lang)}
                  </Chip>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <ul>
        {[
          { key: t('CD0762'), value: t(CITY_CD[city]), to: 1 as const },
          { key: t('CD0759'), value: who ? t(WHO.find((w) => w[0] === who)![1]) : t('CD0767'), to: 1 as const },
          { key: t('CD0761'), value: dates, to: 1 as const },
          { key: `${t('CD0776')} · ${picked.length}`, value: picked.length ? picked.map((x) => chipLabel.get(x) ?? x).join(', ') : t('CD0767'), to: 2 as const },
        ].map((r, i) => (
          <li key={r.key} className={i ? 'border-t border-ui-border-subtle' : undefined}>
            <button
              type="button"
              onClick={() => setStep(r.to)}
              aria-label={`${t('CD0760')} ${r.key}: ${r.value}`}
              className="-mx-[var(--space-3)] flex w-[calc(100%+var(--space-3)*2)] items-center gap-[var(--space-3)] rounded-sq-md px-[var(--space-3)] py-[var(--space-4)] text-left hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              {/* The row is the Edit button (its name says so); the arrow is the only mark. */}
              <span className={phone ? 'w-[96px] shrink-0 type-body-base text-ui-fg-muted' : 'w-[140px] shrink-0 type-body-base text-ui-fg-muted'}>{r.key}</span>
              <span className="min-w-0 flex-1 type-body-base text-ui-fg">{r.value}</span>
              <ArrowRight aria-hidden className="size-[var(--icon-size-md)] shrink-0 text-ui-fg-muted" />
            </button>
          </li>
        ))}
      </ul>
    )

  const make = async () => {
    setBuilding(true)
    try {
      try {
        if (who) localStorage.setItem(WHO_KEY, who)
      } catch {}
      // The answers, once per submit: city slug, day count, days to the start and its month (with
      // dates only), who with, the picked interests (slugs, up to 10).
      const start = range.start ? toISODate(range.start) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      track('quick_plan_submit', {
        destination: city.toLowerCase(),
        trip_days: courseDayCount(start, range.end ? toISODate(range.end) : null),
        ...(range.start ? { days_until_trip: Math.max(0, Math.round((range.start.getTime() - today.getTime()) / 86400000)), trip_month: start!.slice(0, 7) } : {}),
        ...(who ? { who_with: who } : {}),
        interests: picked.slice(0, MAX).join(','),
        interest_count: picked.length,
        is_guest: !user,
        locale: lang,
        screen_id: 'quick_plan',
      })
      // The answers on the account (a guest's after the sign-in, as the interests).
      const answers: QuickPlanAnswers = {
        destination: city.toLowerCase(),
        ...(start ? { start_date: start, ...(range.end ? { end_date: toISODate(range.end) } : {}) } : {}),
        ...(who ? { who_with: who } : {}),
      }
      if (user) {
        await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags: picked, completed: true }) }).catch(() => {})
        await apiFetch('/me/quick-plan', { method: 'PUT', body: JSON.stringify(answers) }).catch(() => {})
      } else {
        saveDraftTags(picked)
        saveDraftAnswers(answers)
      }
      const params = new URLSearchParams({ limit: String(RESULT_LIMIT), region: cityToApiRegion((CITY_REGION[city] ?? city) as QuickPlanCity) })
      if (CITY_DISTRICT[city]) params.set('district', CITY_DISTRICT[city])
      if (picked.length) {
        params.set('tags', picked.join(','))
        params.set('sort', 'match')
      }
      const places = await apiFetch<QuickPlanPlace[]>(`/places?${params.toString()}`)
      const course = buildCourse(places ?? [], courseDayCount(range.start ? toISODate(range.start) : null, range.end ? toISODate(range.end) : null))
      const stops = course.flatMap((day, i) =>
        day.map((p) => ({ poi_id: String(p.poi_id), name_ko: p.name_ko, name_preferred: placeName(p, lang), coords_lat: p.coords_lat, coords_lng: p.coords_lng, display_region: p.display_region, primary_image_url: p.primary_image_url ?? undefined, day: i + 1 })),
      )
      if (!stops.length) {
        toast({ type: 'warning', message: t('CD0770') })
        return
      }
      // Named from the city and day count, e.g. "Seoul in 3 days".
      saveCourseHandoff(stops, t('CD1637', { Region: t(CITY_CD[city]), n: course.length }))
      // Already on the map: it does not remount on the same address, so it listens for this.
      window.dispatchEvent(new Event(COURSE_HANDOFF_EVENT))
      close()
      router.push('/map?from=quickplan')
    } catch {
      toast({ type: 'critical', message: t('CD0771') })
    } finally {
      setBuilding(false)
    }
  }
  return (
    <QuickPlan
      open={open}
      onClose={close}
      step={step}
      title={t('CD1361')}
      closeLabel={t('CD0758')}
      progressLabel={progress}
      stepTitle={step === 1 ? t('CD0793') : step === 2 ? t('CD0787') : t('CD0766')}
      stepSubtitle={step === 1 ? t('CD1345') : step === 2 ? t('CD1347') : t('CD0764')}
      aside={step === 1 ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className={`mb-[var(--space-1)] ${lbl}`}>{t('CD0790')}</span>
          <DateRangePicker value={range} onValueChange={setRange} previousLabel={t('CD0740')} nextLabel={t('CD0739')} clearLabel={t('CD0789')} maxDays={8} className={phone ? 'w-full' : undefined} />
        </div>
      ) : undefined}
      back={step > 1 ? { label: t('CD0769'), onClick: () => setStep((s) => (s - 1) as 1 | 2) } : undefined}
      next={
        step < 3
          ? { label: t('CD0768'), onClick: () => setStep((s) => (s + 1) as 2 | 3) }
          : { label: t('CD0763'), onClick: make, loading: building }
      }
    >
      {body}
    </QuickPlan>
  )
}
