import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge knows the Tailwind defaults; these are the extra theme keys from the token
// preset (tokens/tailwind-preset.ts) so that, for example, `text-2xs` replaces `text-sm`
// instead of being read as a color. Colors need no entry: any bg-*/text-*/border-* color merges.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['2xs'] }],
      shadow: [{ shadow: ['focus-ring'] }],
      duration: [
        {
          duration: [
            'short1', 'short2', 'short3', 'short4',
            'medium1', 'medium2', 'medium3', 'medium4',
            'long1', 'long2', 'long3', 'long4',
            'extra-long1', 'extra-long2', 'extra-long3', 'extra-long4',
          ],
        },
      ],
      ease: [
        {
          ease: [
            'standard', 'standard-accelerate', 'standard-decelerate',
            'emphasized', 'emphasized-accelerate', 'emphasized-decelerate',
          ],
        },
      ],
    },
  },
})

/** Joins class names and resolves Tailwind conflicts (the last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
