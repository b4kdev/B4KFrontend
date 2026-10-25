import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { seoText } from '@/lib/seo'

// Web app manifest per language (installable, no service worker): opens on the visitor's language,
// colors from the dark color-bg token (the icons are the white mark on it).
const BG = '#0a0a0a'

export async function GET(_req: Request, { params }: { params: { locale: string } }) {
  if (!routing.locales.includes(params.locale as (typeof routing.locales)[number])) return new NextResponse(null, { status: 404 })
  const { t } = await seoText(params.locale)
  return NextResponse.json(
    {
      name: 'B4K',
      short_name: 'B4K',
      description: t('CD0799'),
      lang: params.locale,
      start_url: `/${params.locale}`,
      scope: '/',
      display: 'standalone',
      background_color: BG,
      theme_color: BG,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=86400' } },
  )
}
