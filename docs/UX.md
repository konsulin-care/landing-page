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
  `100svh`). Sections 2 to 7 flow naturally. On screens shorter than 700px the
  snap is disabled and the chevron is hidden.
- The hero chevron links to `#makna-tangguh` and its label comes from
  `params.home.meaning.kicker`. Keyboard users move with the browser's normal
  keys; there is no custom key handler.
- Interaction uses Alpine.js (carousel, expand and collapse, tabs, reveal).
  No other animation or UI library. Patterns: `docs/ALPINE_PATTERNS.md`.
- Mobile-first. Check 375, 640 and 768px. The 8/4 rail stacks below `md`.
- Touch targets are at least 44px (`min-h-11`).

## Section behaviour

- The 02 `kenali-tandanya` signs are tappable tiles. Tapping one only toggles
  Alpine state in the browser: nothing is stored, sent or counted, and the
  selection is gone on reload. The copy must state that screening is not a
  diagnosis.
- The 04 `kalau-ikut` give/get blocks are a one-open accordion: opening one
  panel closes any other open panel, so only one answer is expanded at a time.

## Splash intro

On the first homepage view of a tab session, a paper veil covers the page and
the real nav lockup appears centred and enlarged, then glides into its nav slot
while the veil fades. It plays once per tab session, on the homepage only, and
never creates a second logo.

Timeline, about 1.2s:

- 0 to 165ms: the lockup fades in at the centre, scaled up.
- 165 to 495ms: hold.
- 495 to 1100ms: the lockup moves into its slot, easing
  `cubic-bezier(0.65, 0, 0.35, 1)`.
- 800 to 1200ms: the veil fades out, then is hidden.

The splash is skipped when any of these is true: `prefers-reduced-motion` is
`reduce`; `location.hash` is non-empty; `document.referrer` is same-origin;
`sessionStorage` is unavailable or throws; the `jt-splash-seen` key is already
set. Without JavaScript nothing changes. The hero clock holds under the
`splash` reason until the `jt-splash-done` event, so the rotating headline does
not start under the veil. Build details: `docs/UI.md`.

## Hero clock

- One shared clock (`heroSync`, `window.jtHeroSync`, `assets/js/hero-rotation.js`)
  drives the rotating headline line, the trust chip, the demo stage and the
  current step together: the same index moves all, 3000ms per pair by default,
  starting at index 0. If one moves, all move.
- The interval is `params.home.hero.rotation_ms` (default 3000). The hero root
  renders `x-data="jtHeroSync(<line count>, <options object>)"`, so timing and
  the demo ID settings are config, not code.
- `x-data` lives on the hero root (`data-hero`) so the chevron can read state.
  Pause handlers live only on the demo figure (`data-hero-demo`); the text
  column carries none, so reading or tapping the headline never freezes it.
- The clock pauses only while a mouse hovers the preview, a pointer is pressed
  on it, a gloss popover is open, or `document.hidden` is true. Keyboard focus
  does not pause. Releasing the last reason resumes it.

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
  layout. They open via `openGloss(k)` and close on Escape or a click outside,
  and they hold the clock until dismissed; the clock resumes on close. Tapping a
  segment or swiping also closes an open gloss. The `rapuh` gloss links to help.
- The stepper connects the three steps with a line; the current step follows
  the clock index and the CTA width group is shared with the strip.

## Hero demo

- An animated demo of the questionnaire-to-report flow sits in the image column
  (below the CTA on mobile). The clock maps rapuh -> question (i=0), sendiri ->
  ID (i=1), beradaptasi -> report (i=2), matching the steps.
- The question is a mild GAD-7 item, labelled as an example. Answers are never
  saved and no counts are shown. The report states that screening is not a
  diagnosis.
- The ID stage stacks `params.home.hero.demo.id.count` entry cards that fade in
  top to bottom; the earlier cards stay at 70% opacity and the newest card is
  full opacity with a turquoise border, reading as the new entry. Each card
  shows an anonymous ID (`JT-` plus ten characters) generated by
  `assets/js/nanoid.js` and refreshed every time the clock enters the stage, so
  the IDs stay unique and cost nothing per tick.
- The report stage shows example scores per aspect (`bars`), a "Cek ulang
  berkala" timeline (baseline plus later check-ins), the retake line asking the
  visitor to save results and come back at the next check-in, and an aria-hidden
  save indicator that switches to "Tersimpan". None of it is a control: only the
  question options are clickable.
- `answer()` does not hold the clock; the picked option simply clears on the
  next rotation. Answering nudges the existing CTA (step strip lights up). There
  is no second CTA.
- The rotating trust chip and its sr-only list live in the demo `figcaption`, so
  the assurance lines follow the preview. The caption copy is sr-only and a
  visible "Contoh" badge (`demo.badge`) sits on the frame's top edge, keeping the
  demo labelled without repeating the note on screen.
- Copy comes from `params.home.hero.demo`.

## Reduced motion

Respect `prefers-reduced-motion`. Entrance animations and the shared hero clock
run only under `no-preference`: no interval starts, the pair at index 0 stays,
`progress()` returns 1 so every stage shows its final state (all ID cards, all
bars filled, "Tersimpan"), the segments still work, and `cycled` is already
true. Nothing is drawn on a canvas. The citizen-science canvas falls back to a
static image. The splash never plays.

# Before merging

Check mobile layout, Alpine interactions and that every CTA goes to
`.Site.Params.forward`. Run `pnpm test` and `pnpm run build`.
