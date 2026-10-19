# v2 — new design screens

Every screen of the new design (Figma "B4K UI Screens", areas A1 to A5) built from
`components/library`, on live data, under `/[locale]/v2/...`, and served at the live addresses of
the areas listed in `lib/v2-live.ts` (PD-53 update 2, Option A). Screen IDs (SCR-nnn) are rows in the "B4K UI Worksheet" Screens tab.

한국어 요약은 아래 [한국어](#한국어) 참고.

## How it fits

| Piece | Where | Note |
|---|---|---|
| Routes | `app/[locale]/v2/**` | `layout.tsx`: texts, `V2Shell`; preview addresses noindex. Pages with a live counterpart use its metadata and JSON-LD (`app/[locale]/_seo/page-metadata.ts` and the `*-seo.ts` modules) |
| Live areas | `lib/v2-live.ts`, `middleware.ts` | which live addresses the v2 screens serve (see below) |
| Live shell guard | `app/[locale]/_shell/ShellClient.tsx` | v2 pages get the providers and Analytics, none of the live chrome |
| Shell | `V2Shell.tsx`, `V2Gates.tsx` | Header + Navigation rail (desktop), Navigation bar (phone, hidden on map surfaces), Drawer, Quick plan, Language sheet, Cookie banner (live consent, `lib/consent`), offline notice, terms gate (`lib/terms-consent`), post-login draft migration (`useDraftMigration`) |
| Page template | `V2Page.tsx` | Top app bar, `main#main`, 1280 container, Footer |
| Screens | `screens/A1Map.tsx`, `A1Plan.tsx`, `A2Home.tsx`, `A2Explore.tsx`, `A3Saved.tsx`, `A3Account.tsx`, `A4Auth.tsx`, `A4Pages.tsx` | one file per area part |
| Map | `map/V2MapCanvas.tsx`, `map/usePlanDraft.ts` | Naver SDK, token-styled markers, day-colored routes (`tokens/colors.ts`); the plan draft as live: localStorage for guests, the account draft (`/api/plans/draft`, autosaved) when signed in |
| Texts | `messages/v2/{locale}.json`, `messages/v2/keys.json`, `cd.ts`, `messages.ts` | `t('CD0807')` = Copy Deck row; `k('help.title')` = live key through its Copy Deck row. Built by `copydeck_to_messages.py` (B4K_v4.0 `ui-catalog/work/code`) from approved rows |
| Texts not in the deck yet | `messages/v2/supplement/{locale}.json`, `gaps.ts` | `cd`: translations of rows the deck has not translated (or holds in English), to review into the deck; an approved deck translation always wins. `gap`: texts with no deck row yet (`useGap()`), English source plus translations; each becomes a deck row (2nd review) |
| Line breaks | `v2.css`, `text.ts` | UI-102: default breaks in ko/ja/zh-TW on v2 (live `globals.css` keeps its own), K-names never split |

## Live areas

Signed-off areas serve their live addresses from the same v2 screens: `V2_LIVE_PATHS` in
`lib/v2-live.ts`. Middleware rewrites `/[locale]<path>` to the v2 screen (the address stays) and
redirects the old `/[locale]/v2<path>` address there (307). Live addresses without a screen of
their own move to one (`V2_LIVE_ALIASES`: `/plan` and the old `/profile/*` tabs). The v2 screens
link to the live addresses. The live screens stay in the code base; removing a line switches that
area back.

Live now: every area (A1 to A5), including `/place/[poiId]` (the map with the place selected,
keeping the indexable SSR shell). Still on the old screens: `/plan/ai`, `/plan/auto`,
`/plan/manual` (they only redirect), `/auth/callback` (no screen), `/offline` and `/sitemap`
(placeholder pages nothing links to).

## Areas

### A1 Map and planning
| SCR | Screen | Route | Data |
|---|---|---|---|
| 004 | Map browse | `/v2/map` | `useMapPois` (BFF), filter chips |
| 003 | Place selected | `/v2/map?poi=id` | `usePlaceDetail`, `/api/saved/poi`, `/api/likes/poi` |
| 005, 013 | Plan in progress | `/v2/map` (Plan cart) | `usePlanDraft` (localStorage, same draft as live), 8 days, 6 stops a day, 48 stops (PD-30) |
| 006 | Save plan | Plan cart › Save | `POST /api/plans` then `PATCH is_published` (as live, DEC-29) |
| 007 | Published plan | `/v2/plan/[id]` | `useItinerary`, `useItineraryMeta`; owner: Edit, Share, Delete, leg mode `PATCH`; visitor: Save, Like, Share |
| 008 | Save or discard before editing | `/v2/map?plan=edit&id=` | Dialog when a draft exists; Save changes / Stop editing |
| 009 | Quick plan | shell (rail, FAB, drawer) → `/v2/map?from=quickplan` | `useInterests`, `/places`, `buildCourse` (as live) |
| 011 | Saved on the map | `/v2/map?saved=1` | `/api/saved` |
| 035 | Plan from saved places | `/v2/saved/plan` | `/api/saved` → course hand-off |
| 012 | AI assistant | — | not built: Later, off at launch (PD-27) |

### A2 Explore and Home
| SCR | Screen | Route | Data |
|---|---|---|---|
| 001, 036 | Home (+ Interests card) | `/v2` | `/api/home/carousel`, `/api/home/trending`, `/api/home/events` |
| 002 | Category page | `/v2/explore/[category]` (k-pop, k-drama, k-beauty, k-culture, k-food) | `/api/explore/[category]`, collections |
| 010 | See all | `/v2/explore/[category]/[row]` | same |
| 014 | Collection | `/v2/explore/collections/[slug]` | `/api/explore/collections/[slug]` |
| 015 | Special pages | `/v2/explore/k-pop/[teamId]/footsteps`, `k-drama/[workId]/filming-spots`, `k-culture/[region]/heritage`, `k-beauty/perfume-flagships`, `k-food/michelin-noodles` | live explore APIs |

Static category folders each carry their own `[row]` pages so they do not shadow `[category]/[row]`.

### A3 Saved and profile
| SCR | Screen | Route | Data |
|---|---|---|---|
| 016 | Saved | `/v2/saved` | `/api/saved`, `/api/folders`, `/api/saved/plan` |
| 017 | Profile (own) | `/v2/profile` | `/api/profile`, `/api/profile/trips` |
| 018 | Profile (visitor) | `/v2/profile/[id]` | `/api/profile/[id]`, badges, trips |
| 019 | Badges | `/v2/badges` | `/api/badges`, pin |
| 020 | Leaderboard | `/v2/leaderboard` | `/api/leaderboard?window=` |
| 021 | Notifications | `/v2/notifications` | `/api/notifications` |
| 022 | Settings | `/v2/settings` | `/api/account/*` |

### A4 Navigation, auth and search
| SCR | Screen | Route | Data |
|---|---|---|---|
| 023 | Sign in | `/v2/login` | Supabase browser client, `/api/auth/signup` (as live `AuthForm`) |
| 024 | Reset password | `/v2/auth/reset-password` | Supabase |
| 025 | Consent step | `/v2/consent` | `lib/terms-consent` |
| 026 | Cookie banner | every v2 page | own key `b4k-v2-preview-cookie-choice` (does not touch the live choice) |
| 027 | Search | `/v2/search` | `/api/search`, `/api/search/suggestions` |
| 028 | Menu drawer | shell (phone) | — |
| 029 | Legal pages | `/v2/legal/terms`, `privacy`, `cookies` | `content/legal/*` |
| 030 | Help | `/v2/help` | static |
| 031 | Not found, error | `/v2/<unknown>`, `error.tsx` | real 404 status |
| 032 | Offline | shell notice | `navigator.onLine` |

### A5 System
| SCR | Screen | Route |
|---|---|---|
| 034 | Language and theme | `/v2/settings` (Preferences), Language sheet in the shell; theme Light / Dark / Match device (PD-03) |

## Checked

- Screenshots at 375 and 1512, light and dark, next to the Figma frames.
- axe-core WCAG 2.2 AA: 0 violations on every route above.
- Messages: no missing or broken messages in en, ko, ja, zh-TW, pt-BR.
- Overflow: 21 routes × 5 locales × 375/1512, no horizontal scroll, no cut text, no split K-names.

## Open for the devs

1. **Preview origins.** The Naver Maps key and the BFF CORS accept known origins only: allow the Vercel preview domain, or the map and places stay empty there. Locally use port 3000.
2. **No plan update route.** Edit mode's Save changes saves a new plan (as live). Same link needs a route that replaces the stops (BFF `PUT /itineraries/:id` with days).
3. **Map tiles in dark mode** stay light until the Naver styles exist (T-27).
4. **Content in English.** Not in the language files, so not translated: the editorial texts of the Home carousel and the Explore heroes (`app/api/home/carousel/data.ts`, `app/api/explore/[category]/route.ts`), place regions from the BFF (`display_region`), badge descriptions (`unlock_criteria`), and the legal documents (`content/legal`). Same as live.
5. **Supplement review.** `messages/v2/supplement/*.json` holds machine-made translations of rows the deck has not translated, and the `gap` texts: review them into the Copy Deck; an approved deck row replaces its supplement entry automatically.

## 한국어

새 디자인(Figma "B4K UI Screens", A1~A5)의 모든 화면을 `components/library`로 만들어 실데이터로 연결했습니다. 화면은 `/[locale]/v2/...`에 있고, `lib/v2-live.ts`에 등록된 영역은 라이브 주소(`/ko/explore` 등)에서 같은 화면을 보여줍니다(PD-53 업데이트 2, 옵션 A). 지금은 모든 영역이 등록되어 있고, 줄을 지우면 그 영역은 이전 화면으로 돌아갑니다.

- **라이브 연결**: 미들웨어가 라이브 주소를 v2 화면으로 rewrite(주소 유지), 예전 `/v2/...` 주소는 라이브 주소로 307. `/plan`, `/profile/trips|saved|badges|settings`는 v2 화면 주소로 이동. 메타데이터·canonical·JSON-LD는 라이브와 같은 함수를 씁니다.
- **라이브 기능 유지**: 약관 동의 게이트, 쿠키 동의(라이브 저장값 공유, GA 동의 모드), Analytics, 로그인 후 초안 이전과 충돌 선택, 로그인 사용자 초안 서버 자동 저장.
- **텍스트**: Copy Deck 승인 행 → `messages/v2/*.json`. 덱에 번역이 없는 행과 덱에 없는 문구(`gap`)는 `messages/v2/supplement/*.json`(검수 전 번역). 덱에 승인 번역이 들어오면 그게 우선입니다.
- **줄바꿈(UI-102)**: v2에서만 한·일·중 기본 줄바꿈, K-Pop 등 하이픈에서 끊기지 않음. 라이브 `globals.css`는 그대로.

**개발팀 확인 필요**
1. Naver 지도 키와 BFF CORS에 Vercel 프리뷰 도메인 허용 (안 하면 프리뷰에서 지도·장소가 비어 보임. 로컬은 3000 포트).
2. 플랜 수정 저장 라우트 없음: 편집 후 "변경 사항 저장"은 라이브처럼 새 플랜으로 저장. 같은 링크 유지하려면 스톱 교체 라우트 필요 (BFF `PUT /itineraries/:id`).
3. 다크 모드 지도 타일은 Naver 스타일(T-27) 전까지 밝게 표시.
4. 영어로 남는 콘텐츠(언어 파일 밖): 홈 캐러셀·Explore 히어로 문구, BFF 지역명, 배지 설명, 법률 문서. 라이브와 같습니다.
5. AI 어시스턴트(SCR-012)는 출시 때 꺼져 있어(PD-27) 만들지 않았음.
