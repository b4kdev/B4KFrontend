# v2 — new design screens

Every screen of the new design (the Figma screens file, areas A1 to A5) is built from
`components/library` on live data. The code sits under `app/[locale]/v2/...` and is served at the
live addresses (`lib/v2-live.ts`). Screen IDs (SCR-nnn) match the frame names in Figma.

This file is the how-to: where things are and how they connect. Open items and their status are
tracked by the product team outside the repo.

한국어 요약은 아래 [한국어](#한국어) 참고.

## How it fits

| Piece | Where | Note |
|---|---|---|
| Routes | `app/[locale]/v2/**` | `layout.tsx`: texts, `V2Shell`. Pages with a live counterpart use its metadata and JSON-LD (`app/[locale]/_seo/page-metadata.ts` and the `*-seo.ts` modules) |
| Live addresses | `lib/v2-live.ts`, `middleware.ts` | which live addresses the v2 screens serve (see below) |
| Live shell guard | `app/[locale]/_shell/ShellClient.tsx` | v2 pages get the providers and Analytics, none of the old chrome |
| Shell | `V2Shell.tsx`, `V2Gates.tsx` | Header + Navigation rail (desktop), Navigation bar (phone, hidden on map surfaces), Drawer, Quick plan, Language sheet, Cookie banner (live consent, `lib/consent`), offline notice, terms gate (`lib/terms-consent`), post-login draft migration (`useDraftMigration`) |
| Page template | `V2Page.tsx` | Top app bar, `main#main`, 1280 container, Footer |
| Screens | `screens/A1Map.tsx`, `A1Plan.tsx`, `A2Home.tsx`, `A2Explore.tsx`, `A3Saved.tsx`, `A3Account.tsx`, `A4Auth.tsx`, `A4Pages.tsx` | one file per area part |
| Map | `map/V2MapCanvas.tsx`, `map/usePlanDraft.ts` | Naver SDK, token-styled markers, day-colored routes (`tokens/colors.ts`); the plan draft: localStorage for guests, the account draft (`/api/plans/draft`, autosaved) when signed in |
| Texts | `messages/v2/{locale}.json`, `messages/v2/keys.json`, `cd.ts`, `messages.ts` | `t('CD0807')` = a copy deck row; `k('help.title')` = a live key through its copy deck row. Generated from the approved copy deck rows; never edited by hand |
| Texts not in the deck yet | `messages/v2/supplement/{locale}.json`, `gaps.ts` | `cd`: translations of rows the deck has not translated yet; an approved deck translation always wins. `gap`: texts with no deck row yet (`useGap()`), English source plus translations; each becomes a deck row |
| Line breaks | `text.ts` | default breaks in ko, ja and zh-TW; K-names never split |

## Live addresses

Every address is served by the v2 screens (`lib/v2-live.ts`). Middleware rewrites
`/[locale]<path>` to the v2 screen (the address stays; an unknown address gets the v2 Page not
found with a 404) and redirects the old `/[locale]/v2<path>` address there (307). Old addresses
without a screen of their own move to one (`V2_LIVE_ALIASES`: `/plan` and the old `/profile/*`
tabs); `/plan/ai`, `/plan/auto` and `/plan/manual` only redirect. The pre-v2 screens, their
components and `app/legacy.css` were removed on 2026-10-21 (going back means reverting that
commit). `/offline`, `/sitemap` and `/auth/callback` are v2 pages built from the library Empty
state; Figma has no frame for them.

## Areas

Addresses below are the live ones, after `/[locale]`.

### A1 Map and planning
| SCR | Screen | Address | Data |
|---|---|---|---|
| 004 | Map browse | `/map` | `useMapPois` (BFF), filter chips |
| 003 | Place selected | `/map?poi=id` | `usePlaceDetail`, `/api/saved/poi`, `/api/likes/poi` |
| 005, 013 | Plan in progress | `/map` (Plan cart) | `usePlanDraft` (localStorage, same draft as before), 8 days, 6 stops a day, 48 stops |
| 006 | Save plan | Plan cart › Save | `POST /api/plans` then `PATCH is_published` |
| 007 | Published plan | `/plan/[id]` | `useItinerary`, `useItineraryMeta`; owner: Edit, Share, Delete, leg mode `PATCH`; visitor: Save, Like, Share |
| 008 | Save or discard before editing | `/map?plan=edit&id=` | Dialog when a draft exists; Save changes / Stop editing |
| 009 | Quick plan | shell (rail, FAB, drawer) → `/map?from=quickplan` | `useInterests`, `/places`, `buildCourse` |
| 011 | Saved on the map | `/map?saved=1` | `/api/saved` |
| 035 | Plan from saved places | `/saved/plan` | `/api/saved` → course hand-off |
| 012 | AI assistant | — | not built: off at launch |

### A2 Explore and Home
| SCR | Screen | Address | Data |
|---|---|---|---|
| 001, 036 | Home (+ Interests card) | `/` | `/api/home/carousel`, `/api/home/trending`, `/api/home/events` |
| 002 | Category page | `/explore/[category]` (k-pop, k-drama, k-beauty, k-culture, k-food) | `/api/explore/[category]`, collections |
| 010 | See all | `/explore/[category]/[row]` | same |
| 014 | Collection | `/explore/collections/[slug]` | `/api/explore/collections/[slug]` |
| 015 | Special pages | `/explore/k-pop/[teamId]/footsteps`, `k-drama/[workId]/filming-spots`, `k-culture/[region]/heritage`, `k-beauty/perfume-flagships`, `k-food/michelin-noodles` | explore APIs |

Static category folders each carry their own `[row]` pages so they do not shadow `[category]/[row]`.

### A3 Saved and profile
| SCR | Screen | Address | Data |
|---|---|---|---|
| 016 | Saved | `/saved` | `/api/saved`, `/api/folders`, `/api/saved/plan` |
| 017 | Profile (own) | `/profile` | `/api/profile`, `/api/profile/trips` |
| 018 | Profile (visitor) | `/profile/[id]` | `/api/profile/[id]`, badges, trips |
| 019 | Badges | `/badges` | `/api/badges`, pin |
| 020 | Leaderboard | `/leaderboard` | `/api/leaderboard?window=` |
| 021 | Notifications | `/notifications` | `/api/notifications` |
| 022 | Settings | `/settings` | `/api/account/*` |

### A4 Navigation, auth and search
| SCR | Screen | Address | Data |
|---|---|---|---|
| 023 | Sign in | `/login` | Supabase browser client, `/api/auth/signup` |
| 024 | Reset password | `/auth/reset-password` | Supabase |
| 025 | Consent step | `/consent` | `lib/terms-consent` |
| 026 | Cookie banner | every page | live consent (`lib/consent`, key `b4k_analytics_consent`) |
| 027 | Search | `/search` | `/api/search`, `/api/search/suggestions` |
| 028 | Menu drawer | shell (phone) | — |
| 029 | Legal pages | `/legal/terms`, `privacy`, `cookies` | `content/legal/*` |
| 030 | Help | `/help` | static |
| 031 | Not found, error | unknown address, `error.tsx` | real 404 status |
| 032 | Offline | shell notice | `navigator.onLine` |

### A5 System
| SCR | Screen | Address |
|---|---|---|
| 034 | Language and theme | `/settings` (Preferences), Language sheet in the shell; theme Light / Dark / Match device |

## Checks to run

- Screenshots at 375 and 1512, light and dark, next to the Figma frames.
- axe-core WCAG 2.2 AA on every address above.
- Messages: no missing or broken messages in en, ko, ja, zh-TW, pt-BR.
- Overflow: every address × 5 locales × 375/1512: no horizontal scroll, no cut text, no split K-names.

Content outside the language files stays in English (Home carousel and Explore hero texts,
BFF region names, badge descriptions, legal documents).

## 한국어

새 디자인(Figma 화면 파일, A1~A5)의 모든 화면을 `components/library`로 만들어 실데이터로 연결했습니다. 코드는 `app/[locale]/v2/...`에 있고 라이브 주소에서 보여줍니다(`lib/v2-live.ts`). 이 파일은 구조와 사용법만 다룹니다. 남은 작업과 상태는 제품팀이 저장소 밖에서 관리합니다.

- **라이브 연결**: 미들웨어가 라이브 주소를 v2 화면으로 rewrite(주소 유지), 예전 `/v2/...` 주소는 라이브 주소로 307. `/plan`, `/profile/trips|saved|badges|settings`는 v2 화면 주소로 이동. 메타데이터·canonical·JSON-LD는 라이브와 같은 함수를 씁니다. 이전 화면과 `app/legacy.css`는 2026-10-21에 삭제했습니다(되돌리려면 그 커밋을 revert).
- **라이브 기능 유지**: 약관 동의 게이트, 쿠키 동의(라이브 저장값 `b4k_analytics_consent` 공유, GA 동의 모드), Analytics, 로그인 후 초안 이전과 충돌 선택, 로그인 사용자 초안 서버 자동 저장.
- **텍스트**: 승인된 copy deck 행 → `messages/v2/*.json`(손으로 고치지 않음). 덱에 번역이 없는 행과 덱에 없는 문구(`gap`)는 `messages/v2/supplement/*.json`(검수 전 번역). 덱에 승인 번역이 들어오면 그게 우선입니다.
- **줄바꿈**: 한·일·중 기본 줄바꿈, K-Pop 등 하이픈에서 끊기지 않음.
- **영어로 남는 콘텐츠**(언어 파일 밖): 홈 캐러셀·Explore 히어로 문구, BFF 지역명, 배지 설명, 법률 문서.
