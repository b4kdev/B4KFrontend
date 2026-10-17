'use client'

import NextImage from 'next/image'
import { useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/cn'

// Avatar (UI-61, UI-83; Figma Atoms › Avatar): a person, always round. Sizes avatar/size-xs 24 to
// xl 80. Photo, else initials (1 to 2 letters) on state-selected, else the user icon.

const SIZE = {
  xs: 'size-[var(--avatar-size-xs)] type-avatar-initials-xs [&>svg]:size-[var(--icon-size-xs)]',
  sm: 'size-[var(--avatar-size-sm)] type-avatar-initials-sm [&>svg]:size-[var(--icon-size-sm)]',
  md: 'size-[var(--avatar-size-md)] type-avatar-initials-md [&>svg]:size-[var(--icon-size-md)]',
  lg: 'size-[var(--avatar-size-lg)] type-avatar-initials-lg [&>svg]:size-[var(--icon-size-xl)]',
  xl: 'size-[var(--avatar-size-xl)] type-avatar-initials-xl [&>svg]:size-[var(--icon-size-2xl)]',
} as const

const PX = { xs: 24, sm: 32, md: 40, lg: 64, xl: 80 } as const

export type AvatarProps = {
  size?: keyof typeof SIZE
  /** Photo URL (Type=Photo). */
  src?: string | null
  /** The person's name: alt text and the source of the initials. */
  name?: string
  /** Figma Initials, when they should not come from the name. */
  initials?: string
  /** The name is printed next to the avatar: empty alt. */
  decorative?: boolean
  className?: string
}

const initialsOf = (name?: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') ?? ''

export function Avatar({ size = 'md', src, name, initials, decorative, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const letters = initials ?? initialsOf(name)
  const box = cn(
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-state-selected text-ui-fg',
    SIZE[size],
    className,
  )
  if (src && !failed) {
    return (
      <span className={box}>
        <NextImage src={src} alt={decorative ? '' : (name ?? '')} width={PX[size]} height={PX[size]} className="size-full object-cover" onError={() => setFailed(true)} />
      </span>
    )
  }
  return (
    <span className={box} role={!decorative && name ? 'img' : undefined} aria-label={!decorative && name ? name : undefined} aria-hidden={decorative || !name || undefined}>
      {letters ? <span aria-hidden>{letters}</span> : <User aria-hidden />}
    </span>
  )
}
