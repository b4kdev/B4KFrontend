# Molecules audit (32)

## Fieldset (112:2422) FormGroups.tsx, Field.tsx
| all | root | gap | space-3 12 between legend group and options | gap-[var(--space-1)] 4 + legend mb-space-1 (FormGroups.tsx:29-30) |
| all | structure | order | Legend group (legend → hint → error, gap 4) ABOVE Options | FieldMessage after children (FormGroups.tsx:32) |
| all | Options | gap | space-2 8 | inherits 4 (FormGroups.tsx:29) |
| all | legend | required asterisk | Label Required=true shows "*" (may be Label default — Figma conflict, skip) | no required prop |
| Error | hint + error | visibility | hint stays and error shows below it | error replaces hint (Field.tsx:41-48) |
| Error | error row | alignment | items-center | items-start + mt-2px (Field.tsx:42-43) |
| Disabled | hint | color | fg-disabled | fg-muted always (Field.tsx:48) |

## Stepper (113:229) FormGroups.tsx
| Text column | gap | space-0-5 2 | none (:59) |
| Controls | gap | space-1 4 | space-3 12 (:63) |
| value | width | 40 fixed | min-w-[var(--space-8)] 32 (:65) |
| Disabled | label/hint/value | color | fg-disabled | fg / fg-muted / fg (:60,:61,:65) |

## File upload (113:351) FormGroups.tsx
| Button/Uploading | Upload button | state+label | disabled look, label "Uploading" (copy — only if a Copy Deck row exists) | enabled, same label (:100) |
| Uploading | hint | visibility | Progress bar AND hint both shown | ProgressBar replaces hint (:95) |
| Drop zone | zone | padding | px space-4 16, py space-6 24 | px space-6, no py, min-h 128 (:125) |
| Drop zone | zone text | style/color | body/label fg | type-body-base fg-muted (:125) |
| Drop zone Default/Error | "Choose file" | element | Secondary Button sm 32 inside zone (copy needed) | missing |
| Drop zone Uploading | content | structure | filename (body/base fg) + full-width Progress bar + "Uploading, 60%" caption inside zone | zone unchanged, bar outside (:134) |
| Drop zone | hover | fill | no hover state | hover:bg-ui-state-hover (:127) — extra |

## Dropdown menu (126:555) Overlay.tsx
| all | surface | padding-y | space-1 4 | space-2 8 (:79) |
| Actions | group spacer | height | 9 (Separator py 4) | MenuGroup py 4+4 = 8 (:91) |
| Select | group label | padding | pt 8, pb 4, px 16 | py 8, px 16 (:92) |
| Select | group label | text style | eyebrow/category | type-body-label (:92) |

## Popover (126:556) Overlay.tsx
| panel | padding | pt 8, pr 8, pb 16, pl 16 | p-4 (close -mt/-mr 8) (:134,:141) |
| structure | layout | Header row (title + close, items-center, 40 high), then Content (body + action, gap 12, pr 8); header→content gap 4 | column beside close, items-start (:136-139) |

## Combobox (127:616) Overlay.tsx + Menu.tsx + SearchInput.tsx
| listbox | padding-y | space-1 4 | space-2 8 (Overlay.tsx:218) |
| Recent/Results | group header | padding | pt 8, pb 4, px 16 | py 8 px 16 (:220) |
| Recent/Results | group header | text style | eyebrow/category | type-body-label (:221) |
| Results | group header ("Places") | element | present | not rendered for results (:219-228) |
| Recent | Clear all | style | Link Inline: body/link 14, underlined, color/link | type-body-caption fg-muted, hover underline (:223) |
| Empty | status | content | title body/base fg + hint body/caption fg-muted, min-h 44, gap 12 | single p body/base fg-muted (:232) |
| Loading | status | content | row px 16 py 12: Spinner 16 + "Searching" (body/base fg-muted), left | centered Spinner only, py 16 (:230) |
| Results | option match | weight | semibold 600 | font-weight-bold 700 (Menu.tsx:70) |
| Focus | Search input | fill | bg-raised | transparent (SearchInput.tsx:27) |

## Tabs (132:897) — matches. Known extras: × in tab, scroll arrows. (Organisms audit: Tabs always draws border-b; in Figma only Profile header tabs have a baseline; Plan cart, Itinerary panel and Sign-in tabs have none.)

## Segmented control (131:913) NavGroups.tsx / Nav.tsx
| track | padding | space-1 4 | space-0-5 2 (NavGroups.tsx:127) |
| track | gap | space-1 4 | none (:127) |
| unselected | label | color | fg | fg-muted (Nav.tsx:59) |

## Breadcrumbs (135:883) NavGroups.tsx
| row | gap | space-2 8 | space-1-5 6 (:152) |
| Collapsed | ellipsis | element | text glyph "…" eyebrow/category fg-muted | Lucide Ellipsis 14 (:158) |

## Pagination (135:920) NavGroups.tsx
| Numbered | gap "…" | box/style | 40×40 centered cell, body/base fg-muted | px-1 span, no type style (:214) |

## Progress indicator, Toast, Zoom control — match

## Alert (143:1052) Feedback.tsx
| root | padding | pt 12, pr 12, pb 16, pl 16 | p-4 (:35) |
| icon | size | 20 (icon-size-md) in slot with pt 4 | icon-size-sm 16 + mt 2px (:40) |
| content | padding-top | space-1 4 | none (:41) |
| body | color | fg-muted | text-ui-fg (:43) |
| Critical | title | color | fg | text-ui-danger (:42) |
| Dismissible | dismiss | element | bare 16 x icon top right | IconButton 40 with 20 icon (:46) |

## Empty state (143:1193) Feedback.tsx
| icon → title | spacing | 24 (gap 8 + 8 spacer + gap 8) | 12 (:75) |
| title → body | spacing | 8 | 12 (:75) |
| Show action | body → action | 24 (gap 8 + pt 16) | 20 (gap 12 + mt 8) (:85) |
| body | width | 320 fixed | max-w-[40ch] (:84) |
| default | container | Bordered | 'plain' (:69) |
(Saved hub empty uses icon bookmark; EmptyState default icon is Info, Feedback.tsx:51 — callers should pass the Figma icon)

## List item (147:1474) Lists.tsx
| row | padding-y | space-3 12 | space-2 8 (:33) |
| Leading=Icon | icon | size | 20 | icon-size-sm 16 (:39) |
| title/secondary | overflow | single line ellipsis | wraps (:41-42) |
| Disabled | secondary | color | fg-disabled | fg-muted (:42) |
| Disabled | leading icon, chevron | color | fg-disabled | fg-muted (:39,:45) |

## Accordion item (147:1508) Lists.tsx
| header | padding | p-4 (16 all sides) | px 16, py 12 (:84) |

## Tree item (147:1638) Lists.tsx
| level 1 | row | padding | pl space-2 8 + 16 per level (8/24/40), pr space-3 12 | pl space-4 × level (16/32/48), pr 16 (:117-118) |
| label | overflow | ellipsis nowrap | wraps (:129) |
| Selected | fill | extent | starts at the indent (indent outside the fill) | full row (:117) |
| Focus | ring | extent | inset ring around whole row | inset ring on label button only (:128) |

## Button group (148:1639) Groups.tsx
| Selection bar | order | count → Ghost sm → Danger sm → clear (×) LAST | clear first (:46) |
| Selection bar | padding | pl 16 / pr 4 / py 4 | px 8, py 4 (:45) |
| Selection bar | gap | space-2 8 | space-3 12 (:45) |
| Selection bar | count | text style | title/card | type-body-label (:47) |
| Selection bar | min-height | 48 | not set (:45) |

## Rating (148:1685) Groups.tsx
| Display | root | gap | space-2 8 | space-1 4 (:93) |
| Display | stars | gap | space-0-5 2 | none (:95) |
| Display | star | size | 16 | icon-size-xs 14 (:97) |
| Display | score | style | body/label fg | inherits type-body-caption (:93) |
| Input | value text | placement | own row below stars (column gap 4) | inline ml 8 (:86) |

## Leaderboard row (547:12894) Lists.tsx
| row | padding-y/height | py 12 → 64 | py 8 + min-h 60 (:33,:173) |
| Top | trophy | size | 24 | icon-size-md 20 (:162) |
| Other | rank number | style/color | body/base fg-muted | type-numeric-rank fg (:161) |
| name/detail | gap | space-0-5 2 | none (:165) |
| Show trend | trend icon | size | 24 | icon-size-sm 16 (:169) |
| score | style | body/base | type-title-card (:170) |

## Notification item (547:12918) Lists.tsx
| row | padding-y | 12 | 8 (:33) |
| row | align | items-center | items-start (:209) |
| icon | color | fg-muted | text-ui-fg (:197) |
| time | placement | third line in text column (caption fg-muted) | separate trailing column (:206) |
| Unread | dot | placement | trailing element after text (Count badge Dot 8) | overlaid on icon corner (:199) |
| title/body | overflow | ellipsis | wraps (:203-204) |

## Route map preview (223:2078) Groups.tsx
| frame | proportions | 320×140 (~16:7) | aspect-[4/3] (:142) |
| route line | color | Figma conflict (SVG day-1 vs description "fg") — skip | currentColor (:145) |
| badge number | text style | body/label | type-numeric-count (:151) |

## Section header (238:2226) ContentMolecules.tsx
| root | align | items-end, height 40 | items-center (:30) |
| Mobile | root | padding-right | space-4 16 | none (:30) |

## Save-like overlay (238:2498) ContentMolecules.tsx
| order | Save, then Like | Like, then Save (:68-69) |
| gap | space-1 4 | space-2 8 (:67) |

## Achievement badge (239:2315) ContentMolecules.tsx
| icon/lock | size | 32 (icon-size-xl) | icon-size-lg 24 (:98) |
| Common earned | medal | border | none (sunken only) | border-subtle (:75) |
| Legendary | ring | padding | 4 + 1px border (outer 74) | 3 + 1px every rarity (:97) |
| Locked | lock | color | fg-disabled | fg-muted (:98) |

## AI input (248:5182) ContentMolecules.tsx
| root | align | items-center | items-end (:140) |
| Disabled | text/placeholder | color | fg-disabled | fg / fg-placeholder (:151) |

## Plan stop row (257:2710) ContentMolecules.tsx
| row | height | 40 | 48 (Remove 40 + py 8) (:184) |
| Dragging | row | fill | state-dragged | bg-elevated + border-strong outline (:184) |
| Duration | padding-x | 0 | space-1 4 (:194) |
Known extra: 40 thumbnail (keep).

## Itinerary stop (257:2751)
| Stop badge md | number style | body/label | type-numeric-count (Plan.tsx:40) |
| row | height | 80 fixed | auto (minor) |

## Table row (178:1581) Table.tsx
| Header | border | sides | bottom only | border on all four sides (:38) |
| Body | cells after first | color | fg-muted | text-ui-fg (:70) |
| Body | first cell | overflow | ellipsis | none (:70) |

## Step list (337:5255) NavGroups.tsx / Nav.tsx
| chevron | size | 16 | icon-size-xs 14 (NavGroups.tsx:261) |
| Upcoming/Done labels — see Step item (atoms 2) |

## Date range picker (362:5532) DateRangePicker.tsx / Content.tsx
| root | gap | space-1 4 | space-3 12 (DateRangePicker.tsx:69) |
| weekday cell | height | py 4 ~26 high, width 40 | h 32 (:78) |
| week rows | gap | space-0-5 2 | none (:75) |
| Start/Range | Clear | style | Link Inline body/link 14 underlined | type-label-button (:112) |
| Today | ring | — see Calendar day |
