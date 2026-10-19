# Atoms audit part 2 (FAB … Calendar day)

## FAB (110:2041) Fab.tsx
| Extended all states | root | padding-right | space-6 24 (pl space-5 20) | px-[var(--space-5)] pr 20 (Fab.tsx:32) |
| Open | root | hover | no Open-Hover variant | hover:bg-ui-state-hover (Fab.tsx:34) — code only |

## Slider (110:2114) Slider.tsx
| Hover (Single, Range) | thumb | state layer | 36px circle state-hover behind thumb | none (Slider.tsx:27-31) |
| Disabled | label, value | color | fg-disabled | opacity-60 whole slider (Slider.tsx:39) |
| Disabled | fill + thumbs | fill | fg-disabled; track stays state-selected | bg-ui-fg dimmed (Slider.tsx:29-30,47) |
| all | header | alignment | items-start | items-baseline (Slider.tsx:40) |

## Logo (209:2382) Brand.tsx
| Mark | svg | default height | 24 (25.895×24) | h-9 = 36 (Brand.tsx:26; comment cites UI-93) |

## Stop badge (209:2388) Plan.tsx:33-49, map V2MapCanvas.tsx:61
| md (all days) | number | text style | body/label (12/semibold/1.25/0.05em) | type-numeric-count for both sizes (Plan.tsx:40) |
| md on map | number | font | body/label | var(--font-weight-bold) var(--font-size-2xs)/1 (V2MapCanvas.tsx:61) |
| map, selected | badge | outline | no Selected variant | 2px map-pin-selected outline (V2MapCanvas.tsx:61) — code only |

## Transport mode (200:2446) Plan.tsx:103-128
| Estimate | root | padding-left | 0 (no rail) | pl-[var(--space-3)] always (Plan.tsx:113) |
| Loading | icon | content | mode icon kept (fg-muted) | Spinner replaces icon (Plan.tsx:107) |
| Loading | time text | content | "· Calculating" replaces the time | still `· {time}` (Plan.tsx:109) |

## Search input (113:156) SearchInput.tsx
| Default/Hover/Focus/Filled | root | fill | color/bg-raised | transparent (SearchInput.tsx:27) |
| Hover | root | border | 1px color/border-focus | hover:border-ui-fg-muted (SearchInput.tsx:28) |
| Disabled | root | fill | color/bg-disabled | none (SearchInput.tsx:30) |
| Disabled | search icon | color | fg-disabled | text-ui-fg-muted always (SearchInput.tsx:34) |
| Disabled | placeholder | color | fg-disabled | placeholder:text-ui-fg-placeholder (SearchInput.tsx:41) |

## Menu item (126:486) Menu.tsx:19-43
| Danger Hover and Focus | root | fill | color/danger-bg | state-hover for all variants (Menu.tsx:31) |

## Tab (131:871) Nav.tsx:21-44
| Focus | ring | position | 2px border-focus OUTSIDE the tab (2–4px) — Figma description says "inset", node says outside | FOCUS_RING_INSET (Nav.tsx:35) — Figma conflict, leave |
| all | root | justify | justify-center | not set (Nav.tsx:30) (minor) |

## Segment (131:900) Nav.tsx:49-69
| Unselected Default/Focus | label | color | color/fg | text-ui-fg-muted (Nav.tsx:59) |
| Selected + Disabled | root | fill | color/bg-disabled | keeps bg-ui-bg-inverse (Nav.tsx:59) |

## Map pin (223:1989) Map.tsx:29-53, V2MapCanvas.tsx:48,55
| Selected | icon | size | 20 (icon-size-md) | icon-size-sm 16 (Map.tsx:50) |
| Selected, map markers | icon | size | 20 | always 14 (size={14}, V2MapCanvas.tsx:48, used :55) |
| Focus | ring | — | no Focus variant | FOCUS_RING (Map.tsx:44) — code only, keep (a11y) |

## Cluster bubble (223:1996) V2MapCanvas.tsx:58
| all map markers | count | line-height/letter-spacing | body/label 1.25 / 0.05em | font semibold xs/1, no letter-spacing (V2MapCanvas.tsx:58) |

## Map control (223:2018) Map.tsx:93-114
| Focus | ring | offset | 3–5px outside | shadow-focus-ring 2–4px (Map.tsx:106) (1px) |

## Forecast day (239:2326) Content.tsx:76-84
| condition icon | color | fg-muted | text-ui-fg (Content.tsx:80) |

## Chat bubble (248:5147) Content.tsx:95-122
| Typing | bubble | height | 50×22 pill: 6px dots, 8px top/bottom, bg-sunken | outer py-2 + inner py-2 → 38 high (Content.tsx:100,105) |

## Plan pill (257:2730) Plan.tsx:139-161
| Focus | ring | offset | 3–5px outside | FOCUS_RING 2–4px (Plan.tsx:152) (1px) |

## Step item (337:2718) Nav.tsx:143-158
| Upcoming | label | text style | body/base (14) fg-muted | type-body-caption (12) fg-muted (Nav.tsx:155) |
| Done | label | style+color | body/base (14) color/fg | type-body-caption fg-muted (Nav.tsx:155) |
| Done | check icon | stroke width | 2 (Lucide default) | strokeWidth={3} (Nav.tsx:153) |

## Calendar day (362:2689) Content.tsx:146-171
| Today | ring | size | the 40 cell itself: 1px border-strong, radius-full, inset 0 | absolute inset-[4px] → 32 circle (Content.tsx:167) |
| Focus | ring | position | 2px border-focus square at inset 2px (2–4px inside) | inset shadow at the edge 0–2px (Content.tsx:161) |

No mismatches: Stat counter, Drag handle, Scrim, Combobox option, Page item, Image action, Nav item (Figma width 56 vs w-full — see rail), Provider logo.
Figma bug: Stop badge Day 8 text hard-coded "1".
