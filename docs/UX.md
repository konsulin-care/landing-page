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
- Reduced motion: respect `prefers-reduced-motion`. Entrance animations run
  only under `no-preference`. The citizen-science canvas falls back to a static image.
- Mobile-first. Check 375, 640 and 768px. The 8/4 rail stacks below `md`.
- Touch targets are at least 44px (`min-h-11`).

# Before merging

Check mobile layout, Alpine interactions and that every CTA goes to
`.Site.Params.forward`. Run `pnpm test` and `pnpm run build`.
