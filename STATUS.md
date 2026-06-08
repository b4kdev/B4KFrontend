# B4K_MVP_01 — Live Status
> Clean-architecture restart. Started: 2026-06-06.
> This file is the single source of project state. Update every session.

---

## DEADLINE — UI done this weekend. Testing starts Tuesday.

---

## PROJECT STATE

| Area | Status | Notes |
|---|---|---|
| Next.js 14 scaffold | ✅ Done | TypeScript + Tailwind + App Router |
| Core deps | ✅ Done | next-intl, next-auth, swr, lucide-react, supabase |
| Spec docs | ✅ Copied | /docs — FRD, schema, design system, prototype |
| Prototype reference | ✅ Available | /docs/prototype/*.jsx + tokens.css |
| CSS token system | ✅ Done | globals.css + tailwind.config.ts |
| Shell (Sidebar + TopNav) | ✅ Done | Sidebar 52px + TopNav 52px + MobileBottomNav |
| Auth (NextAuth Google) | ❌ Not started | |
| i18n (next-intl 7 locales) | ✅ Done | 7 locale message files + routing + middleware |
| Home page | ⚠️ 5/6 gates | Carousel + Itineraries + Packages + Leaderboard + POIs. Gate 5 (data wired) ❌ — sections use inline mock arrays, no SWR. Blocked by missing `/api/*` routes. |
| Map page | ❌ Not started | |
| Contents page | ❌ Not started | |
| Packages page | ❌ Not started | |
| Plan (FL1 manual) | ❌ Not started | |
| Profile | ❌ Not started | |

---

## SCREEN CHECKLIST
> DoD: [1] Token-aligned [2] 4 states [3] A11y [4] i18n [5] Data wired [6] FRD matched

### Shell / Navigation
| Screen | ID | Status | DoD |
|---|---|---|---|
| Sidebar / SideNav | SN_01–06 | ❌ | — |
| TopBar | TB_01–11 | ❌ | — |
| Left Panel | LP_01–17 | ❌ | — |
| Mobile Bottom Tab | BTB_01–05 | ❌ | — |
| Mobile Drawer | HD_01–08 | ❌ | — |

### Map
| Screen | ID | Status | DoD |
|---|---|---|---|
| Map Default | MP_01–08 | ❌ | — |
| POI Selected | MP_10–13 | ❌ | — |
| Plan Active | MP_20–23 | ❌ | — |
| AI Overlay | MP_30–35 | ❌ | — |

### Planning
| Screen | ID | Status | DoD |
|---|---|---|---|
| Manual Plan Builder | FL1_01–06 | ❌ | — |
| Auto-gen Plan | FL2_01–04 | ❌ | — |
| AI Chat | FL3_01–08 | ❌ | — |

### Contents
| Screen | ID | Status | DoD |
|---|---|---|---|
| K-Pop | CT_KP_* | ❌ | — |
| K-Drama | CT_KD_* | ❌ | — |
| K-Beauty | CT_KB_* | ❌ | — |
| K-Culture | CT_KC_* | ❌ | — |

### Packages
| Screen | ID | Status | DoD |
|---|---|---|---|
| Package Grid | PK_01–08 | ❌ | — |
| Package Detail | PK_10–14 | ❌ | — |

### Profile
| Screen | ID | Status | DoD |
|---|---|---|---|
| Profile Header | PR_01–08 | ❌ | — |
| My Trips | PR_10–16 | ❌ | — |
| Saved | PR_20–22 | ❌ | — |
| Badges | PR_30–32 | ❌ | — |
| Community | PR_40–49 | ❌ | — |
| Settings | PR_50–55 | ❌ | — |

### Gamification
| Screen | ID | Status | DoD |
|---|---|---|---|
| Badges | BD_01–12 | ❌ | — |
| Leaderboard | LB_01–04 | ❌ | — |

### Utility
| Screen | ID | Status | DoD |
|---|---|---|---|
| Auth Gate | AG_01–04 | ❌ | — |
| Notifications | NTF_01–08 | ❌ | — |
| Help | HLP_01–05 | ❌ | — |
| Onboarding | ON_01–04 | ❌ | — |
| Error States | ERR_01–05 | ❌ | — |
| Empty States | EMP_01–04 | ❌ | — |

---

## OPEN BLOCKERS

| Blocker | Affects | Status |
|---|---|---|
| POST /api/plans | FL1 save, FL2 save | ⚠️ Dev task |
| Leaderboard formula weights | LB_01–04 | ⚠️ Open — UI only |
| Flow 2 clustering algorithm | FL2_02 | ⚠️ Dev task |
| Notification delivery | TB_05, NTF_07 | ⚠️ Dev task |
| Offline mode | App arch | ⚠️ Open |

---

## BUILD ORDER (recommended)
1. **Foundation** — globals.css + tailwind.config.ts + CLAUDE.md
2. **Shell** — Sidebar + TopNav + layout system
3. **Auth** — NextAuth Google + Auth Gate screens
4. **i18n** — next-intl setup + 7 locale files
5. **Home** — carousel + sections (prototype reference in docs/prototype/)
6. **Map** — Naver Map + POI panel + Plan Active
7. **Contents / Packages / Plan / Profile** — in FRD priority order
