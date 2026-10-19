'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Chip, DateRangePicker, QuickPlan, Spinner, type DateRange } from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { apiFetch } from '@/lib/api'
import { cityToApiRegion, labelOf, placeName, RESULT_LIMIT, saveCourseHandoff, saveDraftTags, toISODate, type QuickPlanCity, type QuickPlanPlace } from '@/lib/quickplan'
import { buildCourse, courseDayCount } from '@/lib/quickplan-course'
import { COURSE_HANDOFF_EVENT } from './map/usePlanDraft'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Quick plan (planning flow 4, PD-33, PD-45; SCR-009): Where, who and when; Interests (up to 10);
// Review. Make my plan builds the course the same way as live (/places + buildCourse) and opens
// it in the Plan editor unsaved (/v2/map?from=quickplan).

const CITIES = ['Seoul', 'Busan', 'Jeju', 'Gyeongju', 'Incheon', 'Gangwon', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan', 'Sejong', 'Gyeonggi', 'Chungbuk', 'Chungnam', 'Jeonbuk', 'Jeonnam', 'Gyeongnam'] as const
const CITY_CD: Record<string, string> = {
  Busan: 'CD0741', Chungbuk: 'CD0742', Chungnam: 'CD0743', Daegu: 'CD0744', Daejeon: 'CD0745', Gangwon: 'CD0746', Gwangju: 'CD0747',
  Gyeonggi: 'CD0748', Gyeongju: 'CD0749', Gyeongnam: 'CD0750', Incheon: 'CD0751', Jeju: 'CD0752', Jeonbuk: 'CD0753', Jeonnam: 'CD0754',
  Sejong: 'CD0755', Seoul: 'CD0756', Ulsan: 'CD0757',
}
const WHO = [['solo', 'CD0798'], ['couple', 'CD0794'], ['friends', 'CD0796'], ['family', 'CD0795']] as const
const MAX = 10

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
  const close = () => {
    onClose()
    setStep(1)
  }
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  const dates = range.start ? `${fmt.format(range.start)}${range.end ? ` – ${fmt.format(range.end)}` : ''}` : t('CD0767')
  const progress = step === 1 ? t('CD1344') : step === 2 ? t('CD1346') : t('CD1356')

  const lbl = 'type-eyebrow-category text-ui-fg-muted'
  const chipLabel = new Map(categories.flatMap((g) => g.chips.map((c) => [c.slug, labelOf(c, lang)] as const)))
  const group = categories.find((g) => g.slug === activeGroup) ?? categories[0]
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length < MAX ? [...p, slug] : p))

  // Figma A1 / Quick plan / Step 1 to 3 (SCR-009).
  const body =
    step === 1 ? (
      <div className="flex flex-col gap-[var(--space-5)]">
        <fieldset className="flex flex-col gap-[var(--space-2)]">
          <legend className={`mb-[var(--space-2)] ${lbl}`}>{t('CD0791')}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {CITIES.map((c) => <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{t(CITY_CD[c])}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-[var(--space-2)]">
          <legend className={`mb-[var(--space-2)] ${lbl}`}>{t('CD0797')}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {WHO.map(([id, cd]) => <Chip key={id} selected={who === id} onClick={() => setWho(id)}>{t(cd)}</Chip>)}
          </div>
        </fieldset>
      </div>
    ) : step === 2 ? (
      <div className="flex flex-col gap-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <p aria-live="polite" className={lbl}>{t('CD0785')} · {picked.length} / {MAX}</p>
          {picked.length ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {picked.map((slug) => <Chip key={slug} type="dismissible" dismissLabel={t('CD0783', { label: chipLabel.get(slug) ?? slug })} onClick={() => toggle(slug)}>{chipLabel.get(slug) ?? slug}</Chip>)}
            </div>
          ) : <p className="type-body-caption text-ui-fg-muted">{t('CD0779')}</p>}
        </div>
        {isLoading ? <Spinner label={t('CD0781')} /> : null}
        {isError ? (
          <p role="alert" className="type-body-base text-ui-danger">
            {t('CD0780')} <button type="button" onClick={retry} className="underline underline-offset-2">{t('CD0784')}</button>
          </p>
        ) : null}
        {group ? (
          <div className={phone ? 'flex flex-col gap-[var(--space-4)]' : 'flex gap-[var(--space-6)]'}>
            {/* Categories: a list on desktop, a row of chips on phones (Figma Step 2 Mobile). */}
            <div role="group" aria-label={t('CD0778')} className={phone ? '-mx-[var(--space-4)] flex gap-[var(--space-2)] overflow-x-auto px-[var(--space-4)] [scrollbar-width:none]' : 'flex w-[136px] shrink-0 flex-col items-start gap-[var(--space-3)]'}>
              {categories.map((g) =>
                phone ? (
                  <Chip key={g.slug} selected={g.slug === group.slug} onClick={() => setActiveGroup(g.slug)} className="shrink-0">{labelOf(g, lang)}</Chip>
                ) : (
                  <button
                    key={g.slug}
                    type="button"
                    aria-pressed={g.slug === group.slug}
                    onClick={() => setActiveGroup(g.slug)}
                    className={`text-left focus-visible:shadow-focus-ring focus-visible:outline-none ${g.slug === group.slug ? 'type-body-label text-ui-fg' : 'type-body-base text-ui-fg-muted hover:text-ui-fg'}`}
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
                  <Chip key={c.slug} selected={on} disabled={!on && picked.length >= MAX} onClick={() => toggle(c.slug)}>
                    {labelOf(c, lang)}
                  </Chip>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <ul className="rounded-md border border-ui-border">
        {[
          { key: t('CD0762'), value: t(CITY_CD[city]), to: 1 as const },
          { key: t('CD0759'), value: who ? t(WHO.find((w) => w[0] === who)![1]) : t('CD0767'), to: 1 as const },
          { key: t('CD0761'), value: dates, to: 1 as const },
          { key: `${t('CD0776')} · ${picked.length}`, value: picked.length ? picked.map((x) => chipLabel.get(x) ?? x).join(', ') : t('CD0767'), to: 2 as const },
        ].map((r, i) => (
          <li key={r.key} className={i ? 'border-t border-ui-border' : undefined}>
            <button
              type="button"
              onClick={() => setStep(r.to)}
              aria-label={`${t('CD0760')} ${r.key}: ${r.value}`}
              className="flex w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))] focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              <span className={phone ? 'type-body-label text-ui-fg' : 'w-[140px] shrink-0 type-body-label text-ui-fg'}>{r.key}</span>
              <span className="min-w-0 flex-1 type-body-base text-ui-fg-muted">{r.value}</span>
              <span aria-hidden className="inline-flex shrink-0 items-center gap-[var(--space-1-5)] type-label-button text-ui-link">
                {t('CD0760')}
                <ArrowRight className="size-[var(--icon-size-sm)]" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    )

  const make = async () => {
    setBuilding(true)
    try {
      if (user) await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags: picked, completed: true }) }).catch(() => {})
      else saveDraftTags(picked)
      const params = new URLSearchParams({ limit: String(RESULT_LIMIT), region: cityToApiRegion(city as QuickPlanCity) })
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
      saveCourseHandoff(stops)
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
          <span className={lbl}>{t('CD0790')}</span>
          <DateRangePicker value={range} onValueChange={setRange} previousLabel={t('CD0740')} nextLabel={t('CD0739')} clearLabel={t('CD0789')} maxDays={8} className={phone ? 'self-center' : undefined} />
        </div>
      ) : undefined}
      back={step > 1 ? { label: t('CD0769'), onClick: () => setStep((s) => (s - 1) as 1 | 2) } : undefined}
      next={
        step < 3
          ? { label: t('CD0768'), onClick: () => setStep((s) => (s + 1) as 2 | 3) }
          : { label: building ? t('CD0774') : t('CD0763'), onClick: make, disabled: building }
      }
    >
      {body}
    </QuickPlan>
  )
}
