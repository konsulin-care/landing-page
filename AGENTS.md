# Konsulin.care – Home of #JadiTangguh

This is a Hugo + Alpine.js + TailwindCSS site. It is the home of #JadiTangguh, a citizen science movement on psychological resilience led by Konsulin. It is not a product landing page.

## Project Setup

Use `pnpm` as the package manager (the repo has migrated from npm).

- `pnpm run start` – Starts Hugo server + TailwindCSS watcher concurrently
- `pnpm run build` – Builds production-ready site with minification

## Site Map

Five main items: Beranda, Riset, FAQ, Tentang, Blog. Help, privacy, contact and services live in the footer.

## Single Call to Action

Taking part in a study. Every page points to this one action; do not add competing CTAs.

## Voice Rules

- All visitor-facing copy is Indonesian.
- Address the reader as "Anda".
- Konsulin speaks as "saya" where a personal voice is needed; keep it warm, conversational, not clinical.
- Soften the tagline: never promise outcomes or frame resilience as a duty or a cure.

## Honesty Rules

- No unconfirmed counts (participants, studies, results). Leave a visible `TODO(maintainer)` placeholder instead of inventing copy.
- Never state or imply ethics approval. Render the ethics status from front matter verbatim: "Persetujuan etik sedang dalam proses pengajuan."
- Screening is not diagnosis. Say so wherever screening appears.

## Safety Rule

Help resources must stay reachable (footer and wherever distress may be discussed). Never hide or bury them.

## Interactive Elements

Use Alpine.js (expand/collapse, tabs, carousel, scroll-reveal). No external libraries like AOS or Gsap. See `docs/ALPINE_PATTERNS.md`.

## Styling

- TailwindCSS core utilities only (plus @tailwindcss/typography for content)
- Dark mode via `dark:` utilities on every template
- Mobile-first; check 375px, 640px and 768px

## Testing & QA

Before committing: verify mobile responsiveness, Alpine.js interactions and that CTAs go to the right URLs. Run `pnpm run build` before merging.

## File Structure Hints

- Content: `content/`; layouts: `layouts/`; Tailwind: `assets/css/main.css`; docs: `docs/`

Don't document file paths in detail; explore the project structure.
