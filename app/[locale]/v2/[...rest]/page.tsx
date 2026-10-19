import { notFound } from 'next/navigation'

// Any unknown /v2 path: Page not found (SCR-031) with a real 404 status (v2/not-found.tsx).
export default function Page() {
  notFound()
}
