---
title: Design Language
description: Visual language of konsulin.care - Swiss Modernism 2.0 softened, three colours, radius policy, grid, 8/4 rail and tone bands
---

# Source

This site follows the app redesign in <https://github.com/konsulin-care/konsulin-app>.
Token values and the source of truth for colour live in `docs/DESIGN_TOKENS.md`
and `assets/css/main.css` (`@theme`). Build recipes live in `docs/UI.md`.
Journey, voice and safety rules live in `docs/UX.md`.

# Language

Swiss Modernism 2.0, softened. In practice:

- 12-column grid, left-aligned ragged-right text, no justify.
- Hairlines (`border-border`) instead of shadows. No shadows anywhere.
- One accent. Warm, plain Indonesian copy.
- Plus Jakarta Sans only (self-hosted in `main.css`).
- No dark mode, no `dark:` utilities.

# Three-colour rule

- Charcoal is the foreground: text, headings, the final band.
- Paper (pale white) is the canvas. Surface (white) is for cards and alternate bands.
- Turquoise is the single accent. `turquoise-deep` is for links, kickers and rings.
- `turquoise-tint` marks selected or active states, never a section background.
- `muted` is for notes, tracks and disabled fills, never a section background.
- Red (`danger`) and amber (`warning`) are status only. There is no green.

# Radius policy

| Shape | Radius |
| --- | --- |
| Cards, inputs, images, notes | `rounded-lg` (8px) |
| Primary CTA button (`button.html`) | `rounded-full` (pill) |
| Step number badges | `rounded-full` |
| Bands | none (full-bleed) |

One shape means one action: only the primary CTA is a pill. Do not round other
buttons, links or inputs into pills.

# Deliberate divergences from konsulin-app

1. The primary CTA is solid turquoise (`bg-cta`). konsulin-app reserves solid
   turquoise for its FAB. Here the single call to action plays that role.
2. The primary CTA is a pill. konsulin-app uses `rounded-lg` for buttons.
   The pill reads warmer and makes the one action stand out without extra colour.

Everything else (palette, hairlines, 8px radius, type) follows konsulin-app.
Dark text on turquoise only; never white (contrast fails).

# Grid and rail

The page content width is `max-w-6xl` with `px-6 md:px-8`.

- The hero is a two-column split (`md:grid-cols-2`) and a full-viewport slide.
- Content sections use the 8/4 rail at `md`: `md:grid-cols-12`, a
  `md:col-span-4` heading column (kicker, H2, optional subtitle) and a
  `md:col-span-8` content column.
- Below `md` the rail is one column with kicker and H2 first.
- The final CTA has no rail. It is a left-aligned `max-w-4xl` block.

# Band rhythm

`scroll-section.html` owns a full-bleed tone per section. The band utilities
`band-paper` and `band-surface` set the band background and swap the colour
tokens inside it: `band-paper` maps `--color-background` to paper and
`--color-card` to surface, while `band-surface` maps `--color-background` to
surface and `--color-card` to paper. So inside a band `bg-background` is the
band colour and `bg-card` is the contrasting colour, and cards always use
`bg-card` (never `bg-background`) to stay legible on any band. Charcoal is not a
band utility; it stays `bg-foreground text-background`. Hairlines separate paper
from surface because their contrast is only 1.05, hence `border-y border-border`
on surface bands.

The homepage band order is surface, paper, surface, paper, surface, paper,
charcoal.

| # | Section id | Tone | Kicker | Classes |
| --- | --- | --- | --- | --- |
| 1 | `hero` | surface | none | `band-surface border-y border-border` |
| 2 | `makna-tangguh` | paper | 01 | `band-paper` |
| 3 | `kenali-tandanya` | surface | 02 | `band-surface border-y border-border` |
| 4 | `kenapa-dicatat` | paper | 03 | `band-paper` |
| 5 | `kalau-ikut` | surface | 04 | `band-surface border-y border-border` |
| 6 | `siapa-di-baliknya` | paper | 05 | `band-paper` |
| 7 | `final-cta` | charcoal | none | `bg-foreground text-background` |

Kickers number the sections 01 to 05 (hero excluded). The final CTA kicker has
no number. Labels live in `hugo.yaml` under `params.home.<section>.kicker`.

## Compact bands and breakpoints

Two bands break the usual `py-24` rhythm. The 01 `makna-tangguh` paper section
and the 05 `siapa-di-baliknya` trust strip are compact: `py-12 md:py-16`. The
trust strip also has no rail; it is a full-width single block, not an 8/4 grid.

The 03 `kenapa-dicatat` three-step row and the 04 `kalau-ikut` give/get two-card
grid switch from stacked to side-by-side at `lg` (not `md`), while the rest of
the page is mobile-first at 375, 640 and 768px.
