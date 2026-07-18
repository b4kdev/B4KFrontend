'use client'

import { useAuth } from '@/contexts/AuthContext'
import PoiCardRowSection from './PoiCardRowSection'

export default function YouMightLike() {
  const { user } = useAuth()

  // Hidden for guest
  if (!user) return null

  return (
    <PoiCardRowSection
      namespace="home.youMightLike"
      endpoint="/api/home/recommended"
      showError={false}
    />
  )
}
