# Landing Page Formula

konsulin.care is the home of #JadiTangguh, a citizen science movement on psychological resilience led by Konsulin. This document explains the repeating section pattern used on the pages. It is not a product funnel.

## Purpose

Each section answers one question for the visitor and moves them toward one action: taking part in a study.

## Site Map

Five main items: Beranda, Riset, FAQ, Tentang, Blog. Help, privacy, contact and services live in the footer.

## One Action

Taking part in a study. Every page points to this one action; do not add competing CTAs.

## Voice

- All visitor-facing copy is Indonesian, addressing the reader as "Anda".
- Konsulin speaks as "saya" where a personal voice is needed: warm, conversational, not clinical.

## Tagline

Soften the #JadiTangguh tagline: never promise outcomes or frame resilience as a duty or a cure.

## Honesty Rules

- No unconfirmed counts (participants, studies, results). Use a visible `TODO(maintainer)` placeholder.
- Never state or imply ethics approval. Render the ethics status from front matter verbatim: "Persetujuan etik sedang dalam proses pengajuan."
- Screening is not diagnosis. Say so wherever screening appears.

## Safety Rule

Help resources stay reachable in the footer and wherever distress may be discussed. Never hide or bury them.

## The Section Formula: Question → Explanation → Evidence → Action

1. **Question**: name what the visitor may wonder or care about, in one sentence.
2. **Explanation**: say plainly what the movement or study does, without promising outcomes.
3. **Evidence** (optional): a visual, an honest data point or a link to the study. Only confirmed facts.
4. **Action**: a link to take part, or navigation deeper into the site.

## Interaction Patterns

Use Alpine.js only, one primary pattern per section. Never force interaction to understand the main message. See `docs/ALPINE_PATTERNS.md`.

- **Expand/Collapse**: FAQs, proof points, details.
- **Tabs**: related options side by side.
- **Carousel**: participation stories and steps.
- **Scroll-reveal**: section transitions.
- **Hover-hint**: citations and extra context.

## Content Rules

- Problem or question first, then explanation.
- Question: one sentence. Explanation: one or two sentences. Button text: 2-3 words.
- Consistent icon style, spacing and 2-3 accent colors.
- Mobile-first: check 375px, 640px and 768px; dark mode via `dark:` utilities.

## Testing the Formula

1. Read the question alone: does it feel real?
2. Read the explanation alone: is it honest and specific?
3. Test the interaction: does it reveal something useful?
4. Click the action: does it go to the right URL?
5. Check mobile, dark mode and `pnpm run build`.

## Examples in the Codebase

Look in `/layouts/partials/` for the `home-*.html` partials and compare each against the formula.
