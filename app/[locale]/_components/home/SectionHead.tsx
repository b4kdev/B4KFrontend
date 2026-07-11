import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

interface Props {
  title: string
  subtitle?: string
  viewAllLabel?: string
  viewAllHref?: string
}

export default function SectionHead({ title, subtitle, viewAllLabel, viewAllHref }: Props) {
  return (
    <div className="flex items-end justify-between mb-sp-4">
      <div>
        <h2 className="text-f-xl font-semibold text-fg">{title}</h2>
        {subtitle && <p className="text-f-sm text-muted mt-[2px]">{subtitle}</p>}
      </div>
      {viewAllLabel && viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-f-sm text-lav hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 ml-sp-4"
        >
          {viewAllLabel}
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
