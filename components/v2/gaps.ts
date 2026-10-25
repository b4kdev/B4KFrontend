'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCd } from './cd'

// Texts with parameters or shared by several screens, read from the Copy Deck rows (cd namespace);
// screens may call t('CDxxxx') directly instead. resetPassword still has no deck row: it lives in the
// gap namespace of messages/v2/supplement/{locale}.json until the deck has it.
export function useGap() {
  const t = useCd()
  const g = useTranslations('gap')
  return useMemo(
    () => ({
      breadcrumb: t('CD1640'),
      lastUpdated: (date: string) => t('CD1521', { date }),
      newTab: t('CD1641'),
      // Transport mode Estimate label (Figma "About · 15 min").
      about: t('CD1642'),
      mapError: t('CD0627'),
      discardBody: (count: number) => t('CD0657', { count }),
      editing: (title: string) => t('CD1644', { title }),
      editDraftBody: (count: number, title: string) => t('CD1526', { count, title }),
      createdBy: (name: string) => t('CD1483', { name }),
      deletePlanTitle: (title: string) => t('CD1545', { title }),
      planStats: (parts: string[]) => parts.join(' · '), // "5 stops · 2 days · 6h 30m · 6.2 km"
      days: (count: number) => t('CD1232', { count }),
      legLabel: (mode: string, time: string) => `${mode} · ${time}`,
      lastAddedMore: (count: number) => (count > 0 ? t('CD1478', { count }) : t('CD1816')),
      // Delete a day of the plan in progress.
      deleteDay: (n: number) => t('CD0664', { n }),
      deleteDayTitle: (n: number) => t('CD0666', { n }),
      deleteDayBody: (count: number) => t('CD0667', { count }),
      deleteDayConfirm: t('CD0665'),
      // Settings: the data and privacy group label and the Delete account row note.
      settingsData: t('CD1762'),
      deleteAccountNote: t('CD1768'),
      // Own profile: the Plans section subtitle and the link to Saved under the grid.
      profilePlansNote: t('CD1676'),
      openSaved: t('CD1677'),
      // Reset password: the page bar title and the Link expired card title.
      resetPassword: g('resetPassword'),
      linkExpired: t('CD1690'),
      // Settings Your interests row: the count picked and what they are for.
      interestsPicked: (count: number) => t('CD1817', { count }),
      // Map: refetch the filter results for the area in view after a pan.
      searchArea: t('CD1686'),
      dayTotal: (n: number, time: string, count: number, max: number) => t('CD1481', { n, time, count, max }),
      allDaysTotal: (time: string, count: number) => t('CD1549', { time, count }),
    }),
    [t, g],
  )
}
