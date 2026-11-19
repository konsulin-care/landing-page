---
title: UI Build Guide
description: Shared partials and their params, class recipes for bands, the 8/4 rail and cards, banned classes, contrast pairs and the CSS rebuild step
---

# Partials

All live in `layouts/partials/`. Call with `partial "name.html" (dict ...)`.

| Partial | Params | Notes |
| --- | --- | --- |
| `button.html` | `href`, `label`, `size` (default, sm, lg), `tone` (default, on-dark), `type` | Primary CTA pill. `type` renders a `<button>` instead of `<a>`. |
| `card.html` | `inner` (safeHTML) | `bg-card border border-border rounded-lg p-6`. |
| `page-header.html` | `title`, `description`, `kicker`, `extra`, `width` | `width` is a max-w class, default `max-w-6xl`. |
| `summary-card.html` | `page`, `variant` (blog, research) | Aside with the "Ringkasan" kicker. |
| `scroll-section.html` | `num`, `id`, `partial`, `context`, `tone` (paper, surface, charcoal) | Band wrapper. Sets `page.Store` key `sectionNum` to `num - 1`. |
| `section-kicker.html` | `label`, `num` | Renders `01 · label`, or `label` alone without `num`, or nothing without `label`. |

Home section partials (`home-*.html`) take one flat dict. Read the visible
number with `page.Store.Get "sectionNum"`.

# Recipes

Band (set by `tone` in `layouts/index.html`, never by hand in a partial):

- paper: `band-paper`
- surface: `band-surface border-y border-border`
- charcoal: `bg-foreground text-background`

Inside a band, `bg-background` resolves to the band colour and `bg-card` to the
contrasting colour: `band-paper` sets `--color-background` to paper and
`--color-card` to surface, while `band-surface` swaps the two. Charcoal is not a
band utility; it keeps `bg-foreground text-background`.

Rail (inside `max-w-6xl mx-auto px-6 py-24 md:px-8`):

```html
<div class="grid gap-10 md:grid-cols-12">
  <div class="md:col-span-4 text-left">kicker + H2</div>
  <div class="md:col-span-8">content</div>
</div>
```

Always prefix `grid-cols-12` and `col-span-*` with `md:`.

Cards always use `bg-card`, never `bg-background`:

- On any band: `bg-card border border-border rounded-lg`
- Do not hard-code the contrasting colour per band; `band-paper` and
  `band-surface` redefine `--color-card` so `bg-card` always contrasts.
- Note on a surface band: `bg-muted border border-border rounded-lg`

Kicker on charcoal: `.section-kicker` is turquoise-deep, which is too dark on
charcoal. Wrap with `[&_.section-kicker]:!text-background`.

## Hero recipe

Everything lives inline in `layouts/partials/home-hero.html`; do not add new
partials. Config comes from `params.home.hero` and `params.home.recognition`.

- Root wrapper: `data-hero` plus `x-data="jtHeroSync(<line count>)"` on the
  `relative max-w-6xl mx-auto px-6 py-24 md:px-8` div, so the chevron can read
  the shared clock state.
- Text column: `data-hero-text`. It is the only element that carries hold and
  release handlers (`hold('hover')`, `focus`, `press`, swipe) and it uses
  `touch-pan-y`. The image column never pauses the clock.
- Grid-stack fade: a wrapper `<span class="grid">` or `<p class="grid">` holds
  each variant as `col-start-1 row-start-1`, with
  `transition-[opacity,visibility] duration-700 motion-reduce:transition-none`
  and a `hiddenClass` bound through `:class`. The headline lines and the trust
  chip use the same pattern. The trust chip is `aria-hidden="true"` with an
  `sr-only` list of all items.
- Segments: three buttons with `min-h-11`, `aria-label="Pesan k dari 3"`, and a
  4px inner bar whose active width is bound to `progress()`.
- Gloss popover: render a `role="dialog"` block after the `</h1>`, never inside
  it, with `x-show`, `x-cloak`, `@click.outside="closeGloss()"` and
  `@keydown.escape.window="closeGloss()"`. The headline word is a
  `decoration-dotted underline-offset-4` button with `aria-controls` and
  `:aria-expanded`.
- Step strip: an `<ol data-hero-steps>` with `grid-cols-3` under the CTA,
  wrapped in a nested `x-data="{ ctaActive: false }"`. The numbered circles use
  `delay-0`/`delay-150`/`delay-300` plus a bound active class.
- Dot field: a `<figure data-jt-field>` containing a `bg-card` frame with
  `aspect-[2/1] md:aspect-[3/2]`, a `canvas.jt-field-canvas` (hidden under
  reduced motion) and a static SVG fallback. The caption span carries
  `data-jt-field-caption` and the `data-idle`, `data-pressed`, `data-recovering`
  and `data-settled` attributes from `params.home.hero.field`.

# Do and don't

Banned in `layouts/**/*.html` (enforced by `tests/design-tokens.test.mjs`):

- `gray-*`, `slate-*`, `zinc-*`, `neutral-*`, `primary-*`, `secondary-*`
- `shadow-*`, `rounded-3xl`, `text-justify`, `dark:`
- `text-[Npx]`, arbitrary hex such as `bg-[#13c2c2]`

Do:

- Use semantic aliases: `bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border`.
- Keep `rounded-lg` for everything except the primary CTA pill.
- Pair `turquoise-tint` with a second cue (ring, check or bold).
- Minimum text size is `text-xs`. Touch targets are at least `min-h-11`.

Don't:

- Use `turquoise-tint` or `muted` as a section background.
- Put white text on turquoise.
- Use `text-muted-foreground` on a charcoal band.

# Contrast pairs

| Pair | Ratio |
| --- | --- |
| `foreground` on `background` | 16.36 |
| `muted-foreground` on `background` or `card` | 5.05 or higher |
| `turquoise-deep` text on `background` or `card` | 4.93 or 5.16 |
| `text-foreground` on `bg-cta` (the pill) | 7.39 |
| `text-background` on `bg-foreground` (final band) | 16.36 |
| `bg-cta` pill on `bg-foreground` band | 7.39 (control needs 3.0) |

On `bg-muted` use `charcoal-700` or `charcoal-900` text, not `charcoal-600`.

# Check and build

- Test breakpoints at 375, 640 and 768px.
- `assets/css/style.css` is a committed Tailwind build. After adding classes run
  `pnpm run build:tw` and commit the regenerated file.
- Run `pnpm test` and `pnpm run build` before merging.
- `docs/ALPINE_PATTERNS.md` uses legacy colour classes (blue, gray) and emoji.
  Copy the Alpine logic only, never the classes.
