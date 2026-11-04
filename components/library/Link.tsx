import type { ComponentProps } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

// Link (Figma B4K UI Components › Atoms › Link). Always an anchor, never a button.
// Inline: inside body text, always underlined (the underline is the cue, the color equals the
//   text color, WCAG 1.4.1); color/link, hover color/link-hover. In code it inherits the size of
//   the text around it (Figma draws it in body/link, the same as body/base).
// Standalone: alone under a section (See all), label/button with a trailing arrow, no underline,
//   44 tap area.
// Focus: keyboard ring. Visited is not styled. External links open in a new tab and say so.

type Common = {
  /** Figma Type. */
  type?: 'inline' | 'standalone'
  className?: string
  children: React.ReactNode
}

type InternalProps = Common & Omit<ComponentProps<typeof IntlLink>, 'type' | 'className' | 'children'> & {
  external?: false
}

type ExternalProps = Common & Omit<ComponentProps<'a'>, 'type' | 'className' | 'children'> & {
  href: string
  external: true
  /** Screen reader note for the new tab, e.g. "(opens in a new tab)" from the messages. */
  newTabLabel: string
}

export type LinkProps = InternalProps | ExternalProps

const base =
  'text-ui-link hover:text-ui-link-hover transition-colors duration-short4 ease-standard focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus'
const types = {
  inline: 'underline decoration-from-font underline-offset-auto [text-underline-position:from-font]',
  standalone:
    "relative inline-flex items-center gap-[var(--space-1-5)] type-label-button before:absolute before:inset-x-0 before:top-1/2 before:h-[var(--target-touch-min)] before:-translate-y-1/2 before:content-['']",
}

export function Link(props: LinkProps) {
  const { type = 'inline', className, children } = props
  const classes = cn(base, types[type], className)
  const content = (
    <>
      {children}
      {type === 'standalone' ? <ArrowRight aria-hidden className="size-[var(--icon-size-sm)]" /> : null}
    </>
  )

  if (props.external) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type: _t, className: _c, children: _ch, external: _e, newTabLabel, ...rest } = props
    return (
      <a {...rest} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
        <span className="sr-only"> {newTabLabel}</span>
      </a>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type: _t, className: _c, children: _ch, external: _e, ...rest } = props
  return (
    <IntlLink {...rest} className={classes}>
      {content}
    </IntlLink>
  )
}
