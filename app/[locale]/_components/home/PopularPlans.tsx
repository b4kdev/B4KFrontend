'use client'

import PlanCardRowSection from './PlanCardRowSection'

export default function PopularPlans() {
  return <PlanCardRowSection namespace="home.popularPlans" endpoint="/api/home/popular-plans" />
}
