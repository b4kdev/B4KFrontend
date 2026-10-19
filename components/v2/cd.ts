'use client'

import { useTranslations } from 'next-intl'
import keys from '@/messages/v2/keys.json'

/** Copy Deck texts (DOC-197): t('CD0807') = Home. Keys are Copy Deck ids without the dash. */
export const useCd = () => useTranslations('cd')

const KEY_TO_CD = keys as Record<string, string>

/** A live message key through its Copy Deck row (so approved changes apply): k('help.title'). */
export function useCdKey() {
  const t = useTranslations('cd')
  return (key: string, values?: Record<string, string | number>) => {
    const id = KEY_TO_CD[key]
    return id ? t(id, values) : key
  }
}
