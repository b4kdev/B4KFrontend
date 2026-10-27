import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

// Share image for pages without a photo of their own: the page title in the display face on the
// dark background, the B4K mark below. Colors are the dark theme's token values (color-bg,
// color-fg, color-fg-muted); ImageResponse needs literal colors. The face is the display face of
// the language (Archivo Black; Noto Sans KR / JP / TC Black), loaded from Google Fonts as a subset
// of the title's characters; when that fails the image shows the mark alone. Cache: set below.

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }
const BG = '#0a0a0a' // allow-hex — color-bg (dark); ImageResponse requires literal colours
const FG = '#f7f6f3' // allow-hex — color-fg (dark)
const MUTED = '#8f8e8c' // allow-hex — color-fg-muted (dark)
const FACE: Record<string, string> = { ko: 'Noto Sans KR', ja: 'Noto Sans JP', 'zh-TW': 'Noto Sans TC' }

async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const weight = family === 'Archivo Black' ? '400' : '900'
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(4000) }).then((r) => r.text())
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1]
    return url ? await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer()) : null
  } catch {
    return null
  }
}

let mark: string | null = null
async function markSrc(): Promise<string> {
  mark ??= `data:image/svg+xml;base64,${(await readFile(path.join(process.cwd(), 'public/brand/B4K_BrandLogo_Square_White.svg'))).toString('base64')}`
  return mark
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const title = (url.searchParams.get('title') ?? '').slice(0, 90)
  const kind = (url.searchParams.get('kind') ?? '').slice(0, 40)
  const locale = url.searchParams.get('locale') ?? 'en'
  const family = FACE[locale] ?? 'Archivo Black'
  const font = title ? await loadFont(family, `${title}${kind}`) : null
  const logo = await markSrc()
  const res = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, backgroundColor: BG }}>
        {font ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {kind ? <div style={{ fontFamily: 'Display', fontSize: 28, color: MUTED, textTransform: 'uppercase', letterSpacing: 2 }}>{kind}</div> : null}
            <div style={{ fontFamily: 'Display', fontSize: title.length > 40 ? 64 : 80, lineHeight: 1.1, color: FG, display: 'flex' }}>{title}</div>
          </div>
        ) : (
          <div style={{ display: 'flex' }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse can't use next/image */}
        <img src={logo} alt="" width={font ? 104 : 240} height={font ? 96 : 222} style={font ? {} : { alignSelf: 'center', marginBottom: 120 }} />
      </div>
    ),
    {
      ...SIZE,
      ...(font ? { fonts: [{ name: 'Display', data: font, style: 'normal' as const, weight: 400 as const }] } : {}),
    },
  )
  // Share images (title cards) change only with the title in their address: a day, a week at the CDN.
  // Replaces ImageResponse's own year-long value, so the response carries one Cache-Control.
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800')
  return res
}
