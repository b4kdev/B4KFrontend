# B4K_MVP_01 — Build Log
> Append-only. Newest entry at top.
> Types: SCREEN_DONE · SCREEN_FAIL · DECISION · BLOCKER_OPEN · BLOCKER_RESOLVED · ARCH

---

## [ARCH] — API infra Phase 1 — Supabase client + SWR hooks + NextAuth — 2026-06-06

### Built / Changed
- `lib/supabase/server.ts`: server-only createServerClient() factory — SUPABASE_URL + SUPABASE_ANON_KEY (no NEXT_PUBLIC_)
- `lib/fetcher.ts`: shared SWR fetcher — unwraps { data: T } envelope, throws on non-ok
- `types/supabase.ts`: Place (service.places_snapshot shape) + PlacePin types
- `types/next-auth.d.ts`: Session + JWT type augmentation (user.id)
- `lib/hooks/usePlaces.ts`: SWR → GET /api/places?lang=
- `lib/hooks/usePlace.ts`: SWR → GET /api/places/[id]?lang=
- `lib/hooks/useSearch.ts`: SWR → GET /api/search?q=&lang= (key=null when query empty)
- `lib/hooks/useMapPins.ts`: SWR → GET /api/map/pins?north=&south=&east=&west=
- `lib/auth.ts`: NextAuth config — GoogleProvider + SupabaseAdapter, JWT strategy, Facebook/Kakao commented
- `app/api/auth/[...nextauth]/route.ts`: NextAuth GET + POST handler

### Decisions
- SUPABASE_URL / SUPABASE_ANON_KEY only — no NEXT_PUBLIC_ prefix anywhere in server code
- SUPABASE_SERVICE_ROLE_KEY referenced in SupabaseAdapter — value to be provided by backend friend
- All hooks return { data, loading, error } and accept locale: string param
- fetcher unwraps json.data first, falls back to json — works for both { data: T } and bare T responses
- JWT session strategy chosen — avoids extra DB round-trip on every request

### Next
Auth Gate screens (AG_01–04). Then Map page.

---

## [DECISION] — No gradient placeholders on content — 2026-06-06

### Decisions
- All content card thumbnails (itineraries, packages, POIs) use bg-3 + centered ImageIcon placeholder — NOT color gradients
- Hero carousel also uses bg-2 flat base + faint ImageIcon — NOT color gradients
- Gradients were prototype shorthand; real images will come from Cloudinary
- When real images land: swap placeholder div for next/image with Cloudinary URL

### Next
Auth setup (NextAuth Google OAuth). Then Map page.

---

## [ARCH] — Foundation + Shell + Home Page — 2026-06-06

### Built / Changed
- app/globals.css: full B4K token system (dark default + light override + locale :lang() stacks)
- tailwind.config.ts: color/spacing/fontFamily aliases → CSS vars; safelist 52px layout classes
- app/layout.tsx: Work Sans via next/font/google (--font-work-sans var), B4K metadata
- next.config.mjs: withNextIntl plugin wired
- middleware.ts: next-intl createMiddleware with 7-locale routing
- i18n/routing.ts + request.ts + navigation.ts: next-intl 4.x setup
- messages/*.json: all 7 locales (en full, ko full, ja/zh-CN/zh-TW/th/pt-BR accurate translations)
- app/[locale]/layout.tsx: NextIntlClientProvider wrapping
- app/[locale]/_shell/ShellClient.tsx: client shell — state bridge for mobile menu
- components/layout/Sidebar.tsx: 52px fixed rail; desktop icon-only, mobile 280px drawer
- components/layout/TopNav.tsx: 52px fixed header; desktop full, mobile hamburger+search overlay
- components/layout/MobileBottomNav.tsx: 56px fixed bottom tabs (4 items)
- components/layout/PageLayout.tsx: pt-[52px] + lg:ml-[52px] content wrapper
- app/[locale]/_components/home/MainCarousel.tsx: opacity-crossfade hero, 3 slides, dot+arrow controls
- app/[locale]/_components/home/SectionHead.tsx: reusable section header with "See All" CTA
- app/[locale]/_components/home/TopItineraries.tsx: 3-col grid, 2-part cards (gradient thumb + body)
- app/[locale]/_components/home/BestPackages.tsx: 4-col grid (2-col mobile), 16/9 thumb cards
- app/[locale]/_components/home/LeaderboardStrip.tsx: horizontal leaderboard CTA banner
- app/[locale]/_components/home/SeasonalPois.tsx: 6-item 3-col grid, category badge + location
- app/[locale]/page.tsx: home page — breadcrumb + all 5 sections
- lib/display-name.ts: getDisplayName() utility

### Decisions
- next-intl 4.x routing: defineRouting + createNavigation + createMiddleware
- Root layout: html/body (no locale-specific); locale layout: NextIntlClientProvider
- ShellClient: client component bridges mobile menu state between Sidebar and TopNav
- Carousel: opacity crossfade (NOT translateX) — matches prototype exactly
- Cards: 2-part (gradient thumbnail + bg-2 card body with bdr border) — matches prototype

### Next
Auth setup (NextAuth Google OAuth). Then Map page.

---

## [ARCH] — Project Bootstrap — 2026-06-06

### Built / Changed
- Next.js 14 scaffolded: TypeScript + Tailwind + ESLint + App Router
- Core deps installed: next-intl, next-auth, @supabase/supabase-js, swr, lucide-react, simple-icons
- docs/: FRD xlsx, schema SOT, design system, color palette, font system, icon system, AI workflow manual
- docs/prototype/: prototype JSX source files + tokens.css (visual reference only)
- logs/: build-log.md + sessions/
- STATUS.md: fresh checklist, 0 screens done

### Decisions
- Clean architecture — not a copy of B4KView
- Prototype JSX in docs/prototype/ = visual reference only, not source
- CLAUDE.md authority: docs/ files > CLAUDE.md > inline prompt

### Next
Set up globals.css (B4K tokens), tailwind.config.ts token registry, CLAUDE.md. Then build shell.
