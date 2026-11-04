# Organisms audit part 1 (Shell, Surfaces, ContentOrganisms, MapOrganisms AI panel, Overlay account menu, Table)
Files: Shell = components/library/Shell.tsx, Surfaces = Surfaces.tsx, CO = ContentOrganisms.tsx, MO = MapOrganisms.tsx

Token drift: modal/padding 40 → 24 — ALREADY FIXED (tokens.json + tokens.css).

## Navigation rail (159:350) Shell
| rail | padding-bottom | space-3 12 | pb-[var(--space-4)] 16 (Shell:81) |
| Show logo=on | rail | padding-top before logo cell | space-2 8 | none (Shell:82-87) |
| item list | gap | space-1 4 | none (Shell:87) |
| bottom group (Notifications, Profile) | gap | space-1 4 | gap-[var(--space-2)] 8 (Shell:105) |
| Nav item cell | width | 56 | w-full 64 (Nav.tsx:114, NAV_ITEM_TARGET Nav.tsx:130) |
| Profile/Account cell | width | 56 | 64 (Shell:114, Shell:293) |
| Map icon | icon | icon/map-pin | lucide Map (Shell:59) — VERIFIED |
| Signed in unread dot | position | top ≈ -2, right ≈ -2.5 from the 20 icon | -top-[4px] -right-[6px] (Nav.tsx:121) |

## Navigation bar (159:181) Shell
| bar | padding | px space-2 8, py space-1 4 | none (Shell:135-136) |
| Map icon | icon/map-pin | lucide Map (Shell:59) |

## Header (163:266) Shell
| header | gap | space-6 24 | gap-[var(--space-4)] 16 (Shell:160) — VERIFIED |
| search | width | fixed 480 | w-full max-w-[560px] (Shell:164) |
| Actions | gap | space-1 4 | gap-[var(--space-2)] 8 (Shell:165) |
| Signed out | Sign in | Button Secondary sm: h32, 1px border-strong, no fill, fg | filled bg-inverse h40 fg-inverse no border (Shell:173) — VERIFIED |

## Top app bar (163:309) Shell
| Home, Search | bar | padding | left space-1 4, right space-3 12 | px-2 8/8 (Shell:201) |
| Page | bar | padding/gap | left 4, right 8, gap 4 | 8/8, gap 8 (Shell:201) |
| Map | bar | padding | 12/12 | 8/8 (Shell:201) |
| Home, Map | search pill (SearchPill) | fill | bg-raised | bg-ui-bg (Shell:331) |

## Drawer (163:421) Shell
| header | right padding | space-1 4 | px-4 + Close -mr-2 → 8 (Shell:245,247) |
| Account section | padding-top | space-2 8 | none (Shell:249) |
| Signed in | account name | text style | body/base fg | type-title-card (Shell:252) |
| Signed in/out | account row | trailing | chevron-right 16 | missing (Shell:249-255) |
| Signed out | account row | leading | plain icon/user 20 | 40 circle on state-selected (Shell:250) |
| space after account | height | 17 (Separator frame py 8) | h-[var(--space-4)] 16 (Shell:256) |
| menu rows | vertical padding | space-3 12 (List item) | none, only min-h 44 (Shell:240) |
| Notifications, Language | trailing value | body/base size, fg-muted | type-body-caption (Shell:265,272) |
| Legal row | trailing | chevron-right 16 | missing (Shell:277) |

## Account menu (583:12409) Overlay.tsx + Shell
| surface | width | 280 | min-w-[240px] (Overlay.tsx:79) |
| surface | vertical padding | space-1 4 | py-2 + MenuGroup py-1 → 12 (Overlay.tsx:79,91) |
| between groups | height | 9 (Separator py 4) | 8 (Overlay.tsx:91) |
| Signed in | profile row | structure | List item: py 12, Avatar md 40, ≥64 high | MenuItem 44 (Menu.tsx:30), Avatar xs 24 in 16 slot (Shell:301, Menu.tsx:38) |
| Signed in | profile row | trailing | chevron-right 16 | missing (Shell:301-303) |
| Signed in | Sign out | leading icon | none | LogOut (Shell:312) |

## Universal search — matches

## Bottom sheet (169:997) Surfaces
| Handle | area/bar | py 8: area 20, bar 8 from top | pt-1 + grabber h-6: area 28, bar 14 (Surfaces:183, Plan.tsx:70) |
| Map | Header | padding | left 16, right 4, bottom 8, gap 8 | px-4 pb-2 (right 16) (Surfaces:207) |
| Map | Content | padding/gap | px 16, top 8, bottom 24, gap 16 | px-4 pb-4 (Surfaces:208) |
| Modal | Content | padding/gap | px 24, py 8, gap 8 | px 16, pb 16 (Surfaces:208) |
| Modal | Actions | block | stacked, gap 8, px 24, top 16, bottom 24 | not modelled |
| Modal | Show third action | prop | Ghost button under the two | no prop |

## Dialog (169:1026) Surfaces
| all | title | text style | title/card | type-display-h3 (Surfaces:117) — VERIFIED |
| phone (Bottom sheet Modal) | Handle | grabber, padding 8 (title starts at 28) | no grabber, pt-6 (Surfaces:114) |

## Modal (169:1120) Surfaces
| Header | padding | left 24, right 12, top/bottom 12 | px-6 pt-5 pb-2, Close -mr-2 → right 16, top 20, bottom 8 (Surfaces:45,47) |
| title | text style | title/card | type-display-h3 (Surfaces:46) — VERIFIED |
| Body | padding/gap | 24 all sides, gap 16 | px-6 py-2 (Surfaces:76) — VERIFIED |
| Footer | padding | px 24, py 16 | pt-4 pb-6 (Surfaces:51) |
| Sheet | surface | fill | bg-elevated | bg-raised via SHEET (Surfaces:19) |
| Sheet | Handle | bottom padding | 8 | none (Surfaces:74) |

## Footer (174:1408) CO
| links | gap | 8 between rows, 16 between links (gap-x 16, gap-y 8) | gap-4 16/16 (CO:127) |
| Mobile | layout | column, gap 12, items start, px 16 | row wrap gap 16 (CO:125) |

## Form (174:1618) CO
| Actions | padding-top | space-1 4 (24 total from fields with gap 20) | none (CO:172) |
| Actions | layout | always column full width gap 8 (Figma has only a 400 frame; description says full width on phones) | row from md up — leave as is (uncertain) |
| Error | summary body | one sentence (body/base fg-muted) | list of anchor links (CO:163-167) — keep links (a11y), skip |

## Table (178:1780) Table.tsx
| header row | border | bottom only 1px border | border on 4 sides (Table:38) |
| body cells after first column | color | fg-muted | text-ui-fg (Table:70) |
| Multi | select column | width | hugs: 16+20+16 = 52 | w-[var(--space-12)] 48 (Table:39) |
| header | sticky | sticky top (description) | not sticky (Table:37-38) |

## Hero (179:1790) CO
| Mobile | content | padding | px 24, top 24, bottom 40 | max-md:p-4 16 all (CO:38) |
| Desktop | title | width | 960 | max-w-[1000px] in padded container (CO:38) |

## Carousel (179:2063) CO
| Hero | dots | bottom | 16 | bottom-6 24 (CO:103) |
| Hero Mobile | dots | left | 24 | max-md:left-4 16 (CO:103) |
| Hero Desktop | arrows | bottom/right | 20 / 24 | bottom-4 16 / right-11 44 (CO:106) |
| Rail | track | gap | space-3 12 | gap-4 16 (CO:84) |
| Rail | section | padding | page-level — skip | — |
| Rail | cards max-sm:w-[78%] | Figma 280 | (CO) — make 280 like RowSection |

## AI panel (249:3248) MO
| surface | fill | color/bg-raised | bg-ui-bg-elevated (MO:48) |
| Desktop | surface | radius | none | rounded-2xl (MO:48) |
| Header | border | 1px color/border bottom | none (MO:50) |
| Desktop | Header | padding | left 16, right 4, py 4 | px-4 py-2, Close -mr-2 → right 8 (MO:50,56) |
| Mobile | Header | padding | 4 all sides | py-2, Back -ml-2 → left 8 (MO:50,51) |
| Header | assistant icon | sparkles 16 before title | missing (MO:52) |
| Messages | padding/gap | 16 all, gap 12 | px-4 py-2 gap-2 (MO:60) |
| Empty | block | centered both axes, sparkles 32 icon, gap 12 | left, no icon, gap-4 (MO:62) |
| Empty | greeting | fg-muted, centered, 300 wide | fg, left (MO:63) |
| Empty | suggestion chips | justify center | start (MO:64) |
| Composer | padding/border | 12 all, 1px border top | px-4 pb-4 pt-2, no border (MO:73) |
