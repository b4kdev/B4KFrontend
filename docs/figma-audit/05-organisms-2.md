# Organisms audit part 2 (MapOrganisms, Card, Lists tree/accordion, AccountOrganisms, …)

Shared: Tabs always draws border-b border-ui-border (NavGroups.tsx:74). In Figma only Profile header tabs have the 1px baseline; Plan cart, Itinerary panel and Sign-in tabs have none → add an opt-out (e.g. `baseline={false}`) and use it there.

## Plan cart (258:3539) MapOrganisms.tsx
| All | Root | fill | color/bg-sunken in every state | Empty bg-ui-bg :134; Collapsed sunken :142; Open bg :142 → Empty ✗ (Open = KNOWN EXTRA, keep bg) |
| All | Root | radius | radius/3xl 24 top-left/top-right | none :134,:142 |
| Empty, Collapsed | Root | border | none | border-t :134,:142 |
| Empty | Title→body | gap | space-3 12 | mt-1 4 :136 |
| Open | Header | padding | inside root p16 (16 all sides) | py-3 12 :144 |
| Open | Day tabs | horizontal inset | inside root's 16 padding | not padded, pr-2 :163 |
| Open | Day tabs | baseline | none | border-b |
| Open | "+ Day" | element | a Tab labelled "+ Day" (44 high, px16, body/base, fg-muted) | IconButton Plus :182 — label needs copy: use existing key map.plan.addDay only if its text is "+ Day"/"Add day"; else keep IconButton and list |
| Open | Stops list | padding | 0 (root padding only) | px-4 py-2 :184 |
| Open | Leg | left offset | grip 20 + 8 + badge 20 + 8 = 56 | ml-[34px] :190 |
| Open | Day total | icon | clock 14 then caption fg-muted gap 4 | text only :194 |
| Open | Save plan | size | Primary md h40 | default lg 44 :196 |
| Open | Save→Discard | gap | 12 | gap-2 8 :195 |
KNOWN EXTRAS (keep): stop-row photo, × on selected day tab, scroll arrows, open bg = bg.

## Left panel (258:3662) — content slot p16 gap 8 is on a placeholder frame → skip.

## Saved hub (260:3790) MapOrganisms.tsx
| Root | fill/padding/gap | bg-raised, p16, gap 16 | no wrapper :243–271 |
| Places/Folder | List item py | 12 | 8 (Lists.tsx — fixed with List item) |
| Places | Folder icon | 20 | 16 (Lists.tsx:39 — fixed with List item) |
| Folder | Back row | structure | Ghost IconButton 40 (arrow 20) + title/card, gap 4, hugs | whole-row button min-h 44 px16 gap 8 arrow 16 :255–256 |
| Empty | Empty state | container | Bordered | plain :243 |
| Empty | Icon | bookmark | Info default (pass icon) |

## Itinerary panel (260:3996) MapOrganisms.tsx
| Root | fill/padding/gap | bg-raised, p16, gap 16 | none :299 |
| Title | text style | display/h3 | type-display-h2 :301 |
| Owner row | avatar | Avatar xs 24 before name, gap 8 | no avatar :302 (needs owner initials/avatar prop — add optional prop) |
| Owner Private | Private chip | gap | lock 14 + label gap 8 | gap-xs 4 :304 |
| Stats | container/colour | bg-sunken box p12, caption in fg | plain caption fg-muted :306 |
| Day tabs | baseline | none | border-b |
| Timeline | day heading | eyebrow/category "DAY 1" fg-muted (use the existing day label text, uppercase via style) | missing |
| Stop list | inset | 16 (root padding), py 0 | px-2 py-2 :310 |
| Leg | indent | pl space-5 20 | ml-[19px] :317 |
| Related | heading | title/card | type-display-h3 :324 |
| Related | padding/gap | none, gap 8 | px-4 py-4 gap-3 :323 |
| Footer | padding | border-t, pt16 only, gap 8 | px-4 py-3 :329 |

## Card (148:1590) Card.tsx
| Place | Panel | align-items | center | items-start :79 |
| Place, Compact | Meta | icon | map-pin 14 before meta text, gap 4 | no icon :83–86,:99 |
| Place | Trending | element | Badge Normal pill (state-selected, h20, trending icon 14, eyebrow/category) AFTER meta | inline caption span with TrendingUp BEFORE meta :84 |
| Place | Partner link | icon | external-link 14 at end of meta row | sr-only text only :53–58 |
| Place | Badge order | D-day first, then Sponsored | Sponsored first :74–75 |
| Compact | Panel | padding | pl12 pr4 py8 | px-3 py-2 :96 |
| Collection | Collage | cell gap | 2px | gap-px 1px :111 |
| Featured | Media | width/ratio | Figma conflict (layout flex-1 vs description 42% 16:9) → skip |
| Featured | Panel | justify | justify-center | not set :171 |
| Featured stacked | Panel | padding/gap | p12 gap 4 | p16 gap 8 :171 |
| Featured | Show trending / partner link | props missing (add as in Place) | :45 |

## Tree view / Tree item — see molecules (Lists.tsx)
## Accordion — header p16 (molecules)

## Now Seoul card — matches

## Cookie banner (339:5172) AccountOrganisms.tsx
| Accept | variant | Primary md 40 | secondary :45 |
| Banner Mobile | Content gap | 12 | gap-4 16 :62 |
| Preferences | Root padding | space-5 20 | p-4 16 :50 |
| Preferences | Top row gap | 12 | gap-2 8 :51 |
| Preferences | Status | Badge Normal with check icon 14 | no icon :53 |

## Sign-in card (339:5490) AccountOrganisms.tsx
| Root | width/gap | 420, gap 16 | max-w-[400px] gap-5 :127 |
| Top row | content | Logo wordmark (h24) + Close Ghost 40 | back IconButton + title + close :128–131 |
| Heading | structure | separate block: title display/h4 + subtitle body/base fg-muted gap 8 (subtitle only with Copy Deck text) | title in top row, no subtitle :130 |
| Providers | Google | Primary lg 44, logo 16 | secondary :137 |
| Providers | "or" separator | none | Separator with-text :138 |
| Providers | List gap | 8 | gap-3 :136 |
| Providers + Draft | Draft notice | bg-sunken p12 gap 8 route icon 16, caption fg-muted | bg-state-selected px3 py2 caption fg no icon :133 |
| All but New password | Guest | Ghost md 40 hugging, in every view except New password | w-full, Providers only :140 |
| Sign in/Sign up/Forgot/Check email | Back | bottom Ghost md 40 with arrow-left 16 ("Other sign-in options"/"Back to sign in" — Copy Deck only) | header IconButton :125 |
| Sign in | Forgot link | Inline link body/link 14 color/link underline | caption fg-muted :147 |
| Sign in/Sign up | Tabs baseline | none | border-b |
| Check email | Mail icon | mail 40 above heading | missing :156 |
| New password | Close | none | shown whenever onClose :131 |

## Consent step (339:5601) AccountOrganisms.tsx
| Root | surface | bg-elevated, 1px border, radius 2xl, p24, w420, gap 16 | no surface, max-w-[400px], gap-5 :191 |
| Back/title | layout | Back IconButton own row, heading block below | same row :192–194 |
| Subtitle | body/base fg-muted under title (Copy Deck only) | missing |
| Agree to all | plain Checkbox (body/base) then Separator | bordered box px12 title/card label :197–198 |
| Items | gap | 12 | Fieldset gap 4 (FormGroups.tsx:29) |
| Legend | visibility | none shown (visually hidden) | visible legend |
| Required/Optional tag | plain caption fg-muted | Badge :208 |
| View | Standalone link label/button color/link arrow 16 | caption fg-muted underlined :210 |
| Footnote | caption fg-muted "Under 14? …" (Copy Deck only) | missing |

## Search filters (340:5919) AccountOrganisms.tsx
| Desktop | Root padding/gap | p24 gap 24 | p-4 gap-5 :241 |
| Title | display/h3 | type-title-card :243 |
| Desktop | Clear all | Inline link body/link underline color/link | label-button no underline :244 |
| Group label | eyebrow/category | type-body-label :248 |
| Sort by | control | chip group | Select :254–258 |
| Mobile | Root | bg-elevated, top radius 24, px16 pb24 gap 24, Grabber 32×4 in py8 handle | same as desktop |
| Mobile | Header trailing | Close Ghost IconButton 40 | Clear-all link |
| Mobile | Footer | Clear all (Secondary lg) + Show N (Primary lg) flex-1 gap 8 | one full-width Show results :259 |

## Profile header (340:6246) AccountOrganisms.tsx
| Root | padding/gap | pt24, px24 desktop/16 mobile, gap 20 | none, gap-4 :279 |
| Desktop | Top row gap | 20 | 16 :280 |
| Stats | gap | row 4, column 16 | gap-2 8 :284 |
| Visitor Mobile | Action | Share IconButton inside top row | below row on mobile :288–290 |

## Legal document (340:6324) AccountOrganisms.tsx
| Desktop | breadcrumbs/header | inside the 720 document column next to contents column | span both columns :311–317 |
| Desktop | Contents heading | "ON THIS PAGE" eyebrow/category fg-muted (Copy Deck only) | none :326 |
| Desktop | Contents | gap 12; items body/base fg-muted; current body/label fg | gap-2, all body-caption :327 |
| Document | gap | 16 between every element | article 24, header 8, section 12, separator my-6 :311,313,338,339 |
| Meta | one wrapped line (gap 6): "Last updated … · Contact" + Inline link | two caption lines :315–316 |
| Separator | before section 1 too | only i > 0 :339 |

## Place detail (425:7712) MapOrganisms.tsx
| Root | padding | py16 | none :358 |
| Heading | gap | 8 | gap-1 4 :360 |
| Meta | text style | body/base | body-caption :363 |
| Add to plan | size | Primary md 40, plus 16 | lg 44 :366 |
| Description | colour | fg | fg-muted :371 |
| Details | borders | no top border, no dividers | border-t :372; ListItem divider default |
| Detail icon | size | 20 | 16 (Lists.tsx) |
| Detail row | py | 12 | 8 (Lists.tsx) |
| Website | Trailing | none | ChevronRight :376 |

## Search suggestions (531:8369) AccountOrganisms.tsx
| Desktop | Root fill | bg-raised | bg-elevated :378 |
| Root | padding/gap | p12 gap 12 | py-2 no gap :378 |
| Mobile | Root surface | same card as desktop at 343 (bg-raised, border, radius 2xl) | w-full bg-ui-bg no border/radius :378 |
| Group heading | eyebrow/category, no padding; group gap 4 | body-label px-4 pt-3 pb-1 :376 |
| Row | py | 12 | 8 :375 |
| Leading icons | 20 | 16 :382,:395,:402,:418,:433 |
| Typing | Place thumbnail | 48 | 40 :388 |
| Typing | Plan leading | 48 thumbnail | Route icon :395 |
| Typing | Explore row secondary | caption line (data-dependent — only if the data has it) | title only :403 |
| Empty | Trending chips | no icon | leadingIcon TrendingUp :427 |
| Empty | Browse | chip group | list rows with MapPin :431–435 |
