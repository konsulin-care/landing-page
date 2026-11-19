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
  drives the rotating headline line, the trust chip, the demo stage and the
  current step together: the same index moves all, 7000ms per pair, starting at
  index 0. If one moves, all move; if one stops, all stop.
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
- Glossed headline words carry a turquoise-tint marker that sweeps in when
  their line becomes active and stays tinted when open. Their popovers overlay
  the content (relative wrapper, absolute dialogs after the h1), never pushing
  layout. They open via `openGloss(k)`, close on Escape or a click outside, and
  hold the clock while open. The `rapuh` gloss links to help.
- The stepper connects the three steps with a line; the current step follows
  the clock index and the CTA width group is shared with the strip.

## Hero demo

- An animated demo of the questionnaire-to-report flow sits in the image column
  (below the CTA on mobile). The clock maps rapuh -> question (i=0), sendiri ->
  ID (i=1), beradaptasi -> report (i=2), matching the steps.
- The question is a mild GAD-7 item, labelled as an example. Answers are never
  saved and no counts are shown. The report states that screening is not a
  diagnosis.
- `answer()` holds the clock; this is the only hold from the image column.
  Answering also nudges the existing CTA (step strip lights up). There is no
  second CTA.
- Copy comes from `params.home.hero.demo`.

## Reduced motion

Respect `prefers-reduced-motion`. Entrance animations and the shared hero clock
run only under `no-preference`: no interval starts, the pair at index 0 stays,
the segments still work, and `cycled` is already true. The hero demo shows its
final states and nothing is drawn on a canvas. The citizen-science canvas
falls back to a static image.

# Before merging

Check mobile layout, Alpine interactions and that every CTA goes to
`.Site.Params.forward`. Run `pnpm test` and `pnpm run build`.
