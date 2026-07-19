'use client'

import { useTranslations } from 'next-intl'
import PoiCardRowSection from './PoiCardRowSection'

export default function NewOnB4K() {
  const t = useTranslations('home.newOnB4K')
  return <PoiCardRowSection namespace="home.newOnB4K" endpoint="/api/home/new" badge={t('newBadge')} />
}
