'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Chip, DateRangePicker, ListItem, QuickPlan, Spinner, type DateRange } from '@/components/library'
import { useAuth } from '@/contexts/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { apiFetch } from '@/lib/api'
import { cityToApiRegion, labelOf, placeName, RESULT_LIMIT, saveCourseHandoff, saveDraftTags, toISODate, type QuickPlanCity, type QuickPlanPlace } from '@/lib/quickplan'
import { buildCourse, courseDayCount } from '@/lib/quickplan-course'
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

  const body =
    step === 1 ? (
      <div className="flex flex-col gap-[var(--space-6)]">
        <p className="type-body-base text-ui-fg-muted">{t('CD1345')}</p>
        <fieldset className="flex flex-col gap-[var(--space-2)]">
          <legend className="mb-[var(--space-2)] type-body-label text-ui-fg-muted">{t('CD0791')}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {CITIES.map((c) => <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{t(CITY_CD[c])}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-[var(--space-2)]">
          <legend className="mb-[var(--space-2)] type-body-label text-ui-fg-muted">{t('CD0797')}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {WHO.map(([id, cd]) => <Chip key={id} selected={who === id} onClick={() => setWho(id)}>{t(cd)}</Chip>)}
          </div>
        </fieldset>
      </div>
    ) : step === 2 ? (
      <div className="flex flex-col gap-[var(--space-5)]">
        <p className="type-body-base text-ui-fg-muted">{t('CD1347')}</p>
        <p aria-live="polite" className="type-eyebrow-category text-ui-fg-muted">{t('CD0785')} · {picked.length} / {MAX}</p>
        {isLoading ? <Spinner label={t('CD0781')} /> : null}
        {isError ? (
          <p role="alert" className="type-body-base text-ui-danger">
            {t('CD0780')} <button type="button" onClick={retry} className="underline underline-offset-2">{t('CD0784')}</button>
          </p>
        ) : null}
        {categories.map((g) => (
          <fieldset key={g.slug} className="flex flex-col gap-[var(--space-2)]">
            <legend className="mb-[var(--space-2)] type-body-label text-ui-fg-muted">{labelOf(g, lang)}</legend>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {g.chips.map((c) => {
                const on = picked.includes(c.slug)
                return (
                  <Chip key={c.slug} selected={on} disabled={!on && picked.length >= MAX} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.slug) : [...p, c.slug]))}>
                    {labelOf(c, lang)}
                  </Chip>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-[var(--space-4)]">
        <p className="type-body-base text-ui-fg-muted">{t('CD0764')}</p>
        <ul className="border-t border-ui-border">
          <ListItem title={t('CD0762')} trailing={t(CITY_CD[city])} chevron onClick={() => setStep(1)} />
          <ListItem title={t('CD0759')} trailing={who ? t(WHO.find((w) => w[0] === who)![1]) : t('CD0767')} chevron onClick={() => setStep(1)} />
          <ListItem title={t('CD0761')} trailing={dates} chevron onClick={() => setStep(1)} />
          <ListItem title={t('CD0765', { count: picked.length })} trailing={picked.length ? picked.length : t('CD0767')} chevron onClick={() => setStep(2)} />
        </ul>
      </div>
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
      close()
      router.push('/v2/map?from=quickplan')
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
      aside={step === 1 ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="type-body-label text-ui-fg-muted">{t('CD0790')}</span>
          <DateRangePicker value={range} onValueChange={setRange} previousLabel={t('CD0740')} nextLabel={t('CD0739')} clearLabel={t('CD0789')} maxDays={8} className="self-center" />
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
