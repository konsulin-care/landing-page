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
| `scroll-indicator.html` | none | Site-wide scroll indicator rail, included once from `baseof.html`. See below. |

## Scroll indicator

The native page scrollbar is hidden on every page and browser
(`scrollbar-width: none` plus `html::-webkit-scrollbar` in `assets/css/main.css`),
because OS scrollbars look different everywhere and a full grey bar breaks the
layout on Linux. In its place, `layouts/partials/scroll-indicator.html` draws a
thin `bg-charcoal-400` pill on a fixed rail at the right edge
(`fixed top-0 right-0.5 z-50 h-screen w-1.5`).

The indicator is display only: `pointer-events-none` and `aria-hidden="true"`,
no dragging and no click handling, so it never competes with content or the CTA.
State comes from `assets/js/scroll-indicator.js` (`window.jtScrollIndicator`,
loaded from `footer.html` before Alpine): it listens to the window `scroll`
event, which covers mouse wheel, keyboard (arrows, Space, PgUp/PgDn, Home/End),
trackpad and in-page anchor jumps. It appears on the first scroll and hides
800ms after the last one; thumb height is the viewport-to-document ratio with a
32px minimum, and offset is applied with `transform: translateY(...)`.

Visibility is gated on Tailwind's `pointer-fine:` variant, so it only shows for
mouse and trackpad input and stays hidden on touch and mobile. Keep it token
only (`bg-charcoal-400`, `rounded-full`, `motion-reduce:transition-none`).

Home section partials (`home-*.html`) take one flat dict. Read the visible
number with `page.Store.Get "sectionNum"`.

## Splash intro

A paper veil covers the first homepage view of a tab session while the real nav
lockup appears centred and enlarged, then glides into its slot. The lockup is
the existing `<a href="/">` in `layouts/partials/nav.html`, marked with
`data-splash-logo`; never add a second logo. Behaviour and skip rules:
`docs/UX.md`.

Files:

- `assets/js/splash-state.js`: shared constants with no side effects
  (`SPLASH_KEY`, `SPLASH_CLASS`, `SPLASH_RUN_CLASS`, `SPLASH_DONE_EVENT`,
  `SPLASH_FALLBACK_MS`, `VEIL_ANIMATION`). `splash.js` and `hero-rotation.js`
  both import from it; `hero-rotation.js` must not import `splash.js`.
- `assets/js/splash.js`: the gate (`shouldPlay`), the dock offset (`dockOffset`)
  and the lifecycle (`start`, `dock`, `cleanup`), loaded only on the home page.
- `layouts/partials/splash.html`: home-only script include, called from
  `layouts/_default/baseof.html` in the head; the body also calls
  `window.jtSplashDock()` after the nav renders.
- `assets/css/main.css`: the veil and lockup animation rules, mirrored in the
  committed `assets/css/style.css` build.

Classes and custom properties:

- `jt-splash` on `html`: mounts the veil via `html.jt-splash body::before`.
- `jt-splash-run` on `html`: starts the lockup timeline.
- `--jt-splash-x`, `--jt-splash-y`, `--jt-splash-scale` on `html`: the measured
  translation and scale set by `dockOffset`, consumed by the keyframes.

Layering:

- The veil uses `z-index: 60`, above the `z-50` scroll indicator, and is
  `pointer-events: none` so it never blocks input.
- The lockup uses `z-index: 61` so it sits above the veil.

The timeline is about 1.2s. Keyframe percentages map to the 1100ms lockup
animation: 0 to 15% is the fade-in at centre (scale
`min(2, 0.6 * viewportWidth / lockupWidth)`, floored at 1), 15 to 45% is the
hold, and 45 to 100% is the glide into the nav slot with
`cubic-bezier(0.65, 0, 0.35, 1)`. The veil fades out over 400ms with an 800ms
delay (`ease-out`) and then becomes `visibility: hidden`. Only `transform` and
`opacity` are animated.

To change timings, edit `assets/css/main.css`: shift the keyframe percentages
against the 1100ms duration, and adjust the veil `animation` delay and duration.
`SPLASH_FALLBACK_MS` in `assets/js/splash-state.js` (default 2500) is the safety
timeout that tears the splash down if the veil never finishes. After changing
scanned CSS or markup run `pnpm run build:tw` and commit the regenerated
`assets/css/style.css`.

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

- Root wrapper: `data-hero` plus `x-data="jtHeroSync(<line count>, <options>)"`
  on the `relative max-w-6xl mx-auto px-6 py-24 md:px-8` div, so the chevron can
  read the shared clock state. `<options>` is a `dict` (rotation `ms`, the demo
  ID stage/count/prefix/size) rendered with `jsonify`; Hugo escapes the quotes
  to `&#34;` and the browser decodes them, so Alpine receives a valid object.
- Text column: `data-hero-text`. It carries no hold handlers at all (swipe and
  `touch-pan-y` only), so reading or tapping the headline never freezes the
  clock.
- Pause handlers live on the demo figure instead: `@pointerenter` holding
  `'hover'` only when `$event.pointerType === 'mouse'` (touch fires a synthetic
  hover that never leaves), `@pointerleave` releasing `'hover'` and `'press'`,
  and `@pointerdown`/`@pointerup`/`@pointercancel` holding and releasing
  `'press'`. No focus handlers.
- Grid-stack fade: a wrapper `<span class="grid">` or `<p class="grid">` holds
  each variant as `col-start-1 row-start-1`, with
  `transition-[opacity,visibility] duration-700 motion-reduce:transition-none`
  and a `hiddenClass` bound through `:class`. The headline lines use this
  pattern.
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
  mobile) holds a `relative rounded-lg border border-border bg-card p-4` frame.
  Inside, a `grid` stack of three `data-hero-demo-stage` blocks (question, ID,
  report) use `col-start-1 row-start-1` and the same opacity/visibility fade
  bound to `i`. Option buttons use `min-h-11 rounded-lg`; indicator dots use
  `rounded-md`. No `rounded-full` (the CTA is the only anchor). No canvas, no
  second CTA.
- Example badge: a `span` (`absolute -top-3 left-4 rounded-lg border
  border-border bg-card px-2 text-xs`) is the frame's first child, so the demo
  stays labelled as an example without repeating the note on screen.
- Trust chip in the figcaption: the `aria-hidden="true"` `<p
  data-hero-trust>` (grid stack, one span per line, same `:class` binding as the
  headline line) plus its `sr-only` `<ul>` and an `sr-only` span holding
  `demo.label` + `demo.note` live inside `<figcaption class="mt-3">`. The caption
  text is not visible; the badge carries the visible label.
- ID card stack: one `rounded-lg border px-4 py-2` card per
  `demo.id.count`, `border-border` for earlier cards and `border-turquoise` for
  the newest. Both states of the fade belong in `:class`
  (`progress() >= <threshold> ? 'opacity-100 translate-y-0' : 'opacity-0
  translate-y-2'`, `opacity-70` for the earlier cards): Alpine's `:class` adds to
  static classes, so a static `opacity-*`/`translate-*` would win and pin the
  element. Thresholds come from `printf "%.2f" (mul $k 0.12)`. The ID renders in
  a `font-mono` `<p>` bound with `x-text="ids[k]"` and a masked fallback.
- Save indicator: an `aria-hidden` `span` (never a button or link, never
  `rounded-full`) with `inline-flex items-center gap-2 rounded-lg border px-4
  py-2`, switching to `bg-turquoise-tint border-turquoise font-semibold` and a
  check icon at `progress() >= 0.70`.

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
