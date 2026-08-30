import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Canonical illustrated-empty-state (icon + title + description + optional action slot) —
// DoD gate 2 requires every screen have one; most pages copy-pasted this same shape
// (SearchClient.tsx, ExplorePage.tsx, MasonryGrid.tsx, ...) instead of sharing it.
interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** Two icon treatments already exist across the app (dim text-fg vs muted, full
   *  opacity) — default matches the more common hub/grid empty-state look; pass
   *  'text-muted' to match SearchClient's original instead of restyling call sites. */
  iconClassName?: string
  /** Card chrome (bg-2 + border) is the default; pass 'border-none' + no bg to opt out
   *  for a page that renders its own container around this. */
  bordered?: boolean
}

export default function EmptyState({
  icon: Icon, title, description, action, className, iconClassName = 'text-fg opacity-[0.15]', bordered = true,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center text-center py-sp-16 px-sp-6${className ? ` ${className}` : ''}`}
      style={bordered ? { background: 'var(--bg-2)', border: '1px solid var(--bdr)' } : undefined}
    >
      <Icon size={40} strokeWidth={2} className={`${iconClassName} mb-sp-4`} aria-hidden="true" />
      <p className="text-f-lg font-semibold text-fg mb-sp-2">{title}</p>
      {description && <p className="text-f-base text-muted max-w-[320px] mb-sp-6">{description}</p>}
      {action}
    </div>
  )
}
