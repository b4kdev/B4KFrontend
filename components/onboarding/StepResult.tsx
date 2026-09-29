'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { useMapOnboarding } from '@/contexts/MapOnboardingContext';
import EmptyState from '@/components/shared/EmptyState';
import NaverMapCanvas from '@/components/map/NaverMapCanvas';
import type { MapPoi } from '@/hooks/useMapPois';
import { useCourseRoutes, COURSE_TRAVEL_MODE } from '@/hooks/useCourseRoutes';
import { RESULT_LIMIT, placeName, type OnboardingPlace } from '@/lib/onboarding';
import { buildCourse, courseDayCount, courseDayDate, type CoursePlace } from '@/lib/onboarding-course';
import type { DateRange } from './RangeCalendar';

interface Props {
  /** /places?region= 값 (한글 시·도). null 이면 전국. */
  region:     string | null;
  tags:       string[];
  range:      DateRange;
  labelFor:   (slug: string) => string;
  onNavigate: () => void;
}

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`);

export default function StepResult({ region, tags, range, labelFor, onNavigate }: Props) {
  const t    = useTranslations('mapOnboarding.result');
  const lang = useLocale();
  const [dayIndex, setDayIndex]   = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { savePlan, planSave } = useMapOnboarding();

  const params = new URLSearchParams({ limit: String(RESULT_LIMIT) });
  if (region) params.set('region', region);
  if (tags.length > 0) { params.set('tags', tags.join(',')); params.set('sort', 'match'); }

  const { data, error, isLoading, mutate } = useSWR(
    ['onboarding-places', params.toString()],
    () => apiFetch<OnboardingPlace[]>(`/places?${params.toString()}`),
    { revalidateOnFocus: false },
  );

  // 일수 = 캘린더 기간(없으면 1일). 코스는 클라이언트에서 만든다 — 일정(itinerary) 저장은 하지 않는다.
  const dayCount = courseDayCount(range.start, range.end);
  const days     = useMemo(() => buildCourse(data ?? [], dayCount), [data, dayCount]);
  const { routes, isLoading: routesLoading } = useCourseRoutes(days);

  const day    = days[Math.min(dayIndex, days.length - 1)] ?? [];
  const route  = routes?.[Math.min(dayIndex, days.length - 1)] ?? null;

  const toPoi = (p: CoursePlace): MapPoi => ({
    poi_id: String(p.poi_id), name_ko: p.name_ko, name_preferred: placeName(p, lang),
    coords_lat: p.coords_lat, coords_lng: p.coords_lng, display_region: p.display_region,
    primary_image_url: p.primary_image_url ?? undefined,
  });
  const dayPois = useMemo(() => day.map(toPoi), [day, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const stopIds = useMemo(() => dayPois.map(p => p.poi_id), [dayPois]);
  const routeLegs = useMemo(() => route?.legs.map(l => ({ path: l.path })), [route]);

  // 코스 전체(모든 일차)를 내 일정으로 저장 — 로그인 여부에 따른 분기·로그인 후 자동 저장은 컨텍스트가 처리.
  function saveToItinerary() {
    if (planSave !== 'idle') return;
    savePlan({
      days: days.map((stops, i) => ({
        day_number: i + 1,
        places: stops.map((p, j) => ({ poi_id: p.poi_id, visit_order: j + 1, travel_mode: COURSE_TRAVEL_MODE })),
      })),
      start_date: range.start ?? undefined,
      region:     region ?? undefined,
      status:     'confirmed',
    });
  }

  if (isLoading) return <p className="text-f-base text-muted py-sp-12 text-center" role="status">{t('loading')}</p>;
  if (error) {
    return (
      <div className="py-sp-12 text-center">
        <p className="text-f-base text-muted mb-sp-3">{t('error')}</p>
        <button type="button" onClick={() => mutate()} className="min-h-touch px-sp-4 border border-line text-f-sm text-fg hover:bg-muted-3 rounded-none">
          {t('retry')}
        </button>
      </div>
    );
  }
  if (days.length === 0) {
    return <EmptyState icon={SearchX} title={t('emptyTitle')} description={t('emptyDesc')} bordered={false} />;
  }

  return (
    <div className="flex flex-col gap-sp-3">
      {/* 일차 탭 — 날짜를 골랐다면 기간만큼 1일차, 2일차 … */}
      <div className="flex flex-wrap items-center gap-sp-2" role="tablist" aria-label={t('dayTabs')}>
        {days.map((_, i) => {
          const date = courseDayDate(range.start, i);
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === dayIndex}
              onClick={() => { setDayIndex(i); setSelectedId(null); }}
              className={[
                'min-h-touch px-sp-4 text-f-sm rounded-none border transition-colors',
                i === dayIndex ? 'bg-fg text-bg border-fg' : 'text-fg border-line hover:bg-muted-3',
              ].join(' ')}
            >
              {t('dayTab', { n: i + 1 })}
              {date && <span className="ml-sp-2 text-f-xs opacity-60">{date.slice(5).replace('-', '/')}</span>}
            </button>
          );
        })}
        <p className="ml-auto text-f-sm text-muted" aria-live="polite">
          {routesLoading || !route
            ? t('routing')
            : t('summary', { count: day.length, dist: formatDistance(route.distance_m), min: Math.round(route.duration_sec / 60) })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row border border-line rounded-none min-h-0">
        {/* 지도: 핀 + 경로. 일차가 바뀌면 카메라를 다시 맞추도록 key 로 재마운트. */}
        <div className="relative h-[280px] lg:h-[400px] lg:flex-1 min-w-0">
          <NaverMapCanvas
            key={dayIndex}
            pois={dayPois}
            restrictToPois={dayPois}
            selectedPoiId={selectedId}
            planStopIds={stopIds}
            routeLegs={routeLegs}
            onPoiSelect={setSelectedId}
            showAiPill={false}
            onAiPillDismiss={() => {}}
            onAiPillExpand={() => {}}
          />
        </div>

        {/* 타임라인 — 동선순 */}
        <div className="lg:w-[240px] shrink-0 lg:max-h-[400px] flex flex-col border-t lg:border-t-0 lg:border-l border-line">
        <ol className="flex-1 min-h-0 overflow-y-auto p-sp-4 flex flex-col">
          {day.map((p, i) => {
            const leg = route?.legs[i];
            return (
              <li key={p.poi_id} className="flex gap-sp-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className={`w-[20px] h-[20px] flex items-center justify-center rounded-full text-f-xxs ${String(p.poi_id) === selectedId ? 'bg-lav text-bg' : 'bg-fg text-bg'}`}>{i + 1}</span>
                  {i < day.length - 1 && <span className="w-px flex-1 bg-line my-sp-1" aria-hidden="true" />}
                </div>
                <div className="min-w-0 pb-sp-3">
                  <Link href={`/place/${p.poi_id}`} prefetch={false} onClick={onNavigate} className="block text-f-base font-medium text-fg truncate hover:underline">
                    {placeName(p, lang)}
                  </Link>
                  <p className="text-f-xs text-muted truncate">
                    {[p.display_region, (p.interest_tags ?? []).filter(s => tags.includes(s)).slice(0, 2).map(labelFor).join(', ')].filter(Boolean).join(' · ')}
                  </p>
                  {leg && leg.duration_sec != null && (
                    <p className="text-f-xs text-muted-2 mt-sp-1">{t('leg', { min: Math.max(1, Math.round(leg.duration_sec / 60)), dist: formatDistance(leg.distance_m) })}</p>
                  )}
                </div>
              </li>
            );
          })}
          {route?.approximate && <li className="text-f-xs text-muted-2 mt-auto pt-sp-2">{t('approximate')}</li>}
        </ol>
        <div className="border-t border-line p-sp-3">
          <button
            type="button"
            onClick={saveToItinerary}
            disabled={planSave !== 'idle'}
            className="w-full min-h-touch border border-line text-f-sm font-medium text-fg hover:bg-muted-3 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {planSave === 'saving' ? t('savingPlan') : planSave === 'saved' ? t('savedPlan') : t('saveToPlan')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
