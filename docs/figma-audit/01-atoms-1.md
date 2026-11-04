# Atoms audit part 1 (Button … Image) — Figma "B4K UI Components" vs components/library

Focus rings: Figma "Focus ring" layers (2px border-focus, 2–4px outside) = code shadow-focus-ring / outline 2 + offset 2 → counted as match.

Cross-cutting (NOT to fix without user decision): Figma icon exports use 2px absolute stroke at every size; Lucide default strokeWidth=2 on 24 grid renders 1.17px@14, 1.33px@16, 1.67px@20. Only Checkbox matches. Affected: TextInput.tsx:77, Field.tsx:43, Select.tsx:67, Chip.tsx:68–69, Link.tsx:48, Avatar.tsx:59, Image.tsx:46.

## Button (60:302) — no mismatches (Loading spinner track issue → Spinner)
## Icon button (60:363) — no mismatches

## Text input (66:452)
| Variant/state | Element | Property | Figma | Code |
|---|---|---|---|---|
| Hover | Field | border color | color/border-focus, 1px | hover:border-ui-fg-muted (styles.ts:19 FIELD_FRAME) |
| Disabled | Field | fill | color/bg-disabled | none (TextInput.tsx:51) |
| Disabled | Placeholder | color | color/fg-disabled | placeholder:text-ui-fg-placeholder always (TextInput.tsx:67) |
| Disabled + help | Help text | color | color/fg-disabled | text-ui-fg-muted always (Field.tsx:48) |

## Select (97:1435)
| Hover | Field | border | border-focus 1px | hover:border-ui-fg-muted (styles.ts:19) |
| Disabled | Field | fill | bg-disabled | none (Select.tsx:42) |
| Disabled | Placeholder | color | fg-disabled | invalid:text-ui-fg-placeholder overrides wrapper (Select.tsx:57) |
| Disabled + help | Help | color | fg-disabled | fg-muted (Field.tsx:48) |

## Textarea (97:1625)
| all | Field | padding-y | space/2-5 (10) | py-[var(--space-3)] 12 (Textarea.tsx:55) |
| all | Field | min-height | 88 total (textarea/min-height) | 64 inner + 24 + 2 = 90 (Textarea.tsx:70, :55) |
| Show help | Help row | gap | space/2 8 | gap-[var(--space-3)] 12 (Textarea.tsx:74) |
| Error + counter | Layout | order | counter row (left-aligned) above the error message, separate rows | same row, counter ml-auto (Textarea.tsx:74–80) |
| Hover | Field | border | border-focus | fg-muted (styles.ts:19) |
| Disabled | Field | fill | bg-disabled | none (Textarea.tsx:57) |
| Disabled | Placeholder | color | fg-disabled | fg-placeholder (Textarea.tsx:70) |
| Disabled | Help + counter | color | fg-disabled | fg-muted (Field.tsx:48, Textarea.tsx:77) |

## Label (97:1434) — no mismatches

## Checkbox (70:771)
| Unchecked Hover | Box | border | border-focus 1.5 | stays border-strong (Choice.tsx:54) |
| Hover (all values) | State layer | size/fill | 32×32 square (6px outside the 20 box), state-hover | group-hover:bg-ui-state-hover on the 20px box (Choice.tsx:55); hidden when checked |
| Unchecked Disabled | Box | fill | bg-disabled + border-disabled 1.5 | peer-disabled:bg-transparent (Choice.tsx:58) |
| Indeterminate Disabled | Box | fill | bg-disabled + border-disabled | bg-inverse overridden by peer-disabled:bg-transparent (Choice.tsx:56,58) |

## Radio (70:772)
| Unselected Hover | Circle | border | border-focus 1.5 | border-strong (Choice.tsx:85) |
| Hover | State layer | size | 32 circle (6px outside), state-hover | on the 20px circle (Choice.tsx:86); hidden when selected |
| Unselected Disabled | Circle | fill | bg-disabled + border-disabled | peer-disabled:bg-transparent (Choice.tsx:87) |
| Selected Disabled | Dot | fill | fg-disabled | bg-ui-fg-inverse always (Choice.tsx:92) |

## Toggle (70:773)
| Off | Track | border width | border-width/1-5 1.5 | border 1px (Choice.tsx:130) |
| Off | Knob | left offset | 3.5px (1.5 border + space-0-5) | 2px (Choice.tsx:127,139) |
| Off Hover | Track | border | border-focus | border-strong (Choice.tsx:130) |
| Hover (Off and On) | State layer | size | 52×32 pill (4px outside track), state-hover | hover:bg inside track, Off only (Choice.tsx:130) |
| Off Disabled | Track | fill | bg-disabled + border-disabled | border only (Choice.tsx:131) |

## Chip (73:1050)
| Selected=true Disabled (Selectable, Dismissible, Dropdown, Icon only) | Chip | fill | bg-disabled | disabled:bg-transparent (Chip.tsx:51) |
| Map Selected=false Pressed | Chip | fill | bg + state-pressed overlay | no active state (Chip.tsx:47) |
| Map Selected=true Hover/Pressed | Chip | fill | bg-inverse + overlay button/overlay-filled-hover/pressed | none (Chip.tsx:46) |

## Badge, Count badge, Tooltip, Skeleton, Label, Separator, Skip link — no mismatches

## Progress bar (88:1341)
| Indeterminate | Segment | width | 35% (inset 0 45% 0 20%) | w-2/5 40% (Progress.tsx:31) |

## Spinner (88:1351)
| all | Arc | line cap | round-cap quarter arc (SVG) | CSS border-top (Spinner.tsx:27,30) |
| tone inverse (in Primary/Danger button) | Track | color | fg-inverse at 25% | border-ui-state-selected (Spinner.tsx:27) |
| default size | — | — | sm | md (Spinner.tsx:22) |

## Link (104:1865)
| Inline | Underline | offset | text-underline-position from-font, decoration from-font | underline-offset-2 (Link.tsx:37) (minor) |

## Avatar (106:1947)
| Icon, xl | Icon | size | 32 (icon-size-xl) | icon-size-2xl 40 (Avatar.tsx:16) |
| Icon, all | Icon | color | fg-muted | inherits text-ui-fg (Avatar.tsx:46) |

## Image (106:1980)
| Missing | Icon | size | 32 (icon-size-xl) | icon-size-lg 24 (Image.tsx:46) |
| Loading | Fill | opacity | one state-selected layer | container bg-state-selected + Skeleton state-selected stacked (Image.tsx:30,43) |
| default ratio | — | — | 1:1 | 4:3 (Image.tsx:27) |

Figma states code leaves out: Chip Map Pressed, Chip Map selected Hover/Pressed.
Code-only props: Tooltip side, Spinner tone/label, Separator decorative, Link external/newTabLabel, Text input onClear (clear only appears with a value; Figma shows Show clear button in empty Default too).
