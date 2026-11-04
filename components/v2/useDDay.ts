'use client'

import { useCd } from './cd'

/** Event badge on a card: D-3 before the day, D-DAY on the day, Ended after (local calendar days). */
export function useDDay() {
  const t = useCd()
  return (iso: string) => {
    const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    const days = Math.round((day(new Date(iso)) - day(new Date())) / 864e5)
    return days > 0 ? t('CD0148', { days }) : days === 0 ? t('CD0150') : t('CD0149')
  }
}
