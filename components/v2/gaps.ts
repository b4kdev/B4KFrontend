'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

// Texts the v2 screens need that the Copy Deck does not have yet. They live in the `gap`
// namespace of messages/v2/supplement/{locale}.json (English source plus translations); each one
// becomes a new design-only row in the deck (2nd review), then the screen switches to
// t('CDxxxx') and the entry here goes.
export function useGap() {
  const t = useTranslations('gap')
  return useMemo(
    () => ({
      breadcrumb: t('breadcrumb'),
      lastUpdated: (date: string) => t('lastUpdated', { date }),
      newTab: t('newTab'),
      // Transport mode Estimate label (Figma "About · 15 min"; CD has no row).
      about: t('about'),
      mapError: t('mapError'),
      // Parameterized versions of design rows that carry sample values in the deck:
      addedToDay: (day: number) => t('addedToDay', { day }), // "Added to Day 1"
      discardBody: (count: number) => t('discardBody', { count }),
      editing: (title: string) => t('editing', { title }), // edit-mode panel title (no Copy Deck row yet)
      editDraftBody: (count: number, title: string) => t('editDraftBody', { count, title }),
      createdBy: (name: string) => t('createdBy', { name }), // "Created by Minji"
      deletePlanTitle: (title: string) => t('deletePlanTitle', { title }),
      planStats: (parts: string[]) => parts.join(' · '), // "5 stops · 2 days · 6h 30m · 6.2 km"
      days: (count: number) => t('days', { count }),
      legLabel: (mode: string, time: string) => `${mode} · ${time}`,
      lastAddedMore: (count: number) => t('lastAddedMore', { count }), // "Last added · 2 more"
      // Delete a day of the plan in progress (no Figma or CD row yet).
      deleteDay: (n: number) => t('deleteDay', { n }),
      deleteDayTitle: (n: number) => t('deleteDayTitle', { n }),
      deleteDayBody: (count: number) => t('deleteDayBody', { count }),
      deleteDayConfirm: t('deleteDayConfirm'),
      previousDays: t('previousDays'),
      nextDays: t('nextDays'),
      // Settings: the data and privacy group label and the Delete account row note.
      settingsData: t('settingsData'),
      deleteAccountNote: t('deleteAccountNote'),
      // Own profile: the Plans section subtitle and the link to Saved under the grid.
      profilePlansNote: t('profilePlansNote'),
      openSaved: t('openSaved'),
      // Reset password: the page bar title and the Link expired card title.
      resetPassword: t('resetPassword'),
      linkExpired: t('linkExpired'),
      // Settings Your interests row: the count picked and what they are for.
      interestsPicked: (count: number) => t('interestsPicked', { count }),
      // Map: refetch the filter results for the area in view after a pan.
      searchArea: t('searchArea'),
      dayTotal: (n: number, time: string, count: number, max: number) => t('dayTotal', { n, time, count, max }), // "Day 1 · 3h 15m · 3 of 6 stops"
      allDaysTotal: (time: string, count: number) => t('allDaysTotal', { time, count }), // "All days · 5h 45m · 5 stops"
    }),
    [t],
  )
}
