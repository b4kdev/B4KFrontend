import { cn } from '@/lib/cn'
import { LOGO_PATHS } from './logo-paths'

// Logo (UI-73; Figma Atoms › Logo): the B4K brand files (DOC-146) in currentColor (color/fg), so
// dark and light follow the theme. Wordmark for headers and the drawer; Mark for the desktop rail
// and small spaces. Never recolor or stretch; scale by height only. Wrap it in a link to Home with
// the label B4K; decorative copies are hidden.

export type LogoProps = {
  /** Figma Type. */
  type?: 'wordmark' | 'mark'
  /** Height via className; default 24 for both (Figma Wordmark 24, Mark 24). The rail and header pass h-9 (Mark 36, UI-93). */
  className?: string
  /** Accessible name; leave out when the logo is decorative or the link is labelled. */
  label?: string
}

export function Logo({ type = 'wordmark', className, label }: LogoProps) {
  const art = LOGO_PATHS[type]
  return (
    <svg
      viewBox={art.viewBox}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('h-6 w-auto fill-current text-ui-fg', className)}
    >
      {art.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  )
}

/**
 * Provider logo (UI-82): the official four-color Google G, kept as Google's branding rules require
 * (the one place B4K shows brand colors). 20 in buttons; hidden from screen readers, the button
 * text names the provider.
 */
export function ProviderLogo({ provider = 'google', className }: { provider?: 'google'; className?: string }) {
  if (provider !== 'google') return null
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={cn('size-[var(--icon-size-md)] shrink-0', className)}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" /> {/* allow-hex: Google brand */}
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /> {/* allow-hex: Google brand */}
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /> {/* allow-hex: Google brand */}
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /> {/* allow-hex: Google brand */}
    </svg>
  )
}
