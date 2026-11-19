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
- Gloss marker: the headline word is a button with a low turquoise-tint marker:
  `bg-linear-to-t from-turquoise-tint from-50% to-transparent to-50%
  bg-no-repeat bg-left-bottom box-decoration-clone` plus
  `transition-[background-size] duration-700`. `bg-size-[100%_100%]` when its
  line is active, `bg-size-[0%_100%]` otherwise (bound through `:class`). It
  has `aria-controls` and `:aria-expanded`; the tint stays in open and closed
  state, never turquoise.
- Gloss popover overlay: wrap the h1, trust chip and dialogs in a `relative`
  div. Each `role="dialog"` sits after the `</h1>`, never inside it, as
  `absolute inset-x-0 top-full z-10 mt-2` so it overlays and does not push the
  layout. It has `x-show`, `x-cloak`, `@click.outside="closeGloss()"` and
  `@keydown.escape.window="closeGloss()"`.
- CTA width group: a `w-full sm:w-fit` div with nested
  `x-data="{ ctaActive: false }"` holds the CTA and the step strip so both
  share one width. Pass `"full" true` to `button.html` so the pill fills the
  group.
- Stepper: an `<ol data-hero-steps>` with `relative grid-cols-3` under the CTA.
  A connector (`absolute left-[16.67%] right-[16.67%] top-3 h-px bg-border`)
  runs behind the circles, with a `bg-turquoise origin-left` fill that toggles
  `scale-x-0`/`scale-x-100` on `ctaActive`. The circles are `relative bg-card`
  with `delay-0`/`delay-150`/`delay-300` and a bound active class; the current
  step (`i`) is also active and bold.
- Demo figure: `<figure data-hero-demo>` in the image column (below the CTA on
  mobile) holds a `rounded-lg border border-border bg-card p-4` frame. Inside,
  a `grid` stack of three `data-hero-demo-stage` blocks (question, ID, report)
  use `col-start-1 row-start-1` and the same opacity/visibility fade bound to
  `i`. Option buttons use `min-h-11 rounded-lg`; indicator dots use
  `rounded-md`. No `rounded-full` (the CTA is the only anchor). A `figcaption`
  labels it as an example. No canvas, no second CTA.

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
  `pnpm run build:tw` and commit the regenerated file. Whichever task changes
  scanned markup or scripts rebuilds and commits it; docs changes are not
  scanned.
- Run `pnpm test` and `pnpm run build` before merging.
- `docs/ALPINE_PATTERNS.md` uses legacy colour classes (blue, gray) and emoji.
  Copy the Alpine logic only, never the classes.
