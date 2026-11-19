---
title: UX Guide
description: Journey, voice, honesty and safety rules, and interaction behaviour for konsulin.care, the home of #JadiTangguh
---

# What this site is

konsulin.care is the home of #JadiTangguh, a citizen science movement on
psychological resilience led by Konsulin. It is not a product landing page.
Visual rules live in `docs/DESIGN.md`. Build recipes live in `docs/UI.md`.

# One action

The single call to action is taking part in a study. Every page points to it.
Do not add competing CTAs (no product sign-ups, service promotions or pricing).
The primary CTA is the turquoise pill from `button.html`. Details and wording:
`docs/CTA_STRATEGY.md`.

# Site map

- Main nav (five items): Home, Research, FAQ, About, Blog.
- Footer: help, privacy, contact and services.

# Voice

- All visitor-facing copy is Indonesian.
- Address the reader as "Anda".
- Konsulin speaks as "saya" where a personal voice is needed. Warm and
  conversational, not clinical.
- Soften the tagline. Never promise outcomes or frame resilience as a duty or a cure.
- Section kicker labels are short nouns, not claims.

Phrasing and tone: `docs/INDONESIAN_COPY_GUIDELINES.md`.

# Honesty

- No unconfirmed counts (participants, studies, results). Leave a visible
  `TODO(maintainer)` placeholder instead of inventing copy.
- Never state or imply ethics approval. Render the ethics status from front
  matter verbatim: "Persetujuan etik sedang dalam proses pengajuan."
- Screening is not diagnosis. Say so wherever screening appears.

# Safety

Help resources must stay reachable in the footer and wherever distress may be
discussed. Never hide or bury them. A new band, rail or CTA must not push the
footer help link out of reach.

# Behaviour

- Scroll-snap: only the hero is an exact-fit slide (`scroll-snap-section--slide`,
  `100svh`). Sections 2 to 6 flow naturally. On screens shorter than 700px the
  snap is disabled and the chevron is hidden.
- The hero chevron and the ArrowDown key scroll to the next section.
- Interaction uses Alpine.js (carousel, expand and collapse, tabs, reveal).
  No other animation or UI library. Patterns: `docs/ALPINE_PATTERNS.md`.
- Mobile-first. Check 375, 640 and 768px. The 8/4 rail stacks below `md`.
- Touch targets are at least 44px (`min-h-11`).

## Hero clock

- One shared clock (`heroSync`, `window.jtHeroSync`, `assets/js/hero-rotation.js`)
  drives the rotating headline line and the trust chip together: the same index
  moves both, 5500ms per pair, starting at index 1. If one moves, both move; if
  one stops, both stop.
- `x-data` lives on the hero root (`data-hero`) so the chevron can read state.
  Pause handlers live only on the text column (`data-hero-text`), never on the
  image column.
- The clock pauses while any reason is held (hover, focus, touch press, an open
  gloss) or while `document.hidden` is true. Releasing the last reason resumes it.

## Hero controls

- Story-style progress segments sit above the h1: three buttons labelled
  "Pesan k dari 3", each with a 44px tap area and a 4px visible bar. The active
  bar fills with the clock's `progress()`; tapping a segment selects that pair.
- The text column accepts a horizontal swipe of 40px or more to go to the next
  or previous pair. It is `touch-pan-y` so vertical scrolling still works.
- After every pair has been shown once (`cycled`), the chevron shows a label
  taken from `params.home.recognition.kicker` ("Kenali tandanya").
- A step strip (`<ol>`, `params.home.hero.steps`) sits under the CTA on every
  breakpoint: "Isi survei", "Dapat ID Anonim", "Lihat laporan". Hovering,
  focusing or touching the CTA lights the steps 1 to 3 in sequence through CSS
  transition delays (0/150/300ms).
- Glossed headline words are dotted-underline buttons that leave the line text
  unchanged. Their popovers render after the h1, never inside it. They open via
  `openGloss(k)`, close on Escape or a click outside, and hold the clock while
  open. The `rapuh` gloss links to help.

## Hero dot field

- "Lentur lalu pulih" replaces the hero photo with a canvas dot field in the
  image column. It is the one canvas exception to the Alpine-only rule, like
  the citizen-science canvas, and uses vanilla JS
  (`assets/js/resilience-field.js`, physics in `resilience-physics.js`).
- Dots rest in charcoal-200 and lerp towards turquoise by displacement, never
  turquoise-deep. Pointer repulsion widens with hold time up to a cap; release
  springs back with damping. The touch/ghost ring is drawn in turquoise-tint.
- Captions come from `params.home.hero.field` (idle, pressed, recovering,
  settled) plus one fixed line about resilience. A ghost pointer sweeps the
  middle row once on first view, only when motion is allowed, and never after
  the visitor interacts.
- The loop runs only while unsettled, pointer or ghost is active, pauses when
  off-screen, and caps DPR at 2.

## Reduced motion

Respect `prefers-reduced-motion`. Entrance animations and the shared hero clock
run only under `no-preference`: no interval starts, the pair at index 1 stays,
the segments still work, and `cycled` is already true. The hero dot field hides
its canvas and shows a static SVG dot grid instead. The citizen-science canvas
falls back to a static image.

# Before merging

Check mobile layout, Alpine interactions and that every CTA goes to
`.Site.Params.forward`. Run `pnpm test` and `pnpm run build`.
