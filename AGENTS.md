# Konsulin.care – Home of #JadiTangguh

Hugo + Alpine.js + TailwindCSS site. Home of #JadiTangguh, a citizen science movement on psychological resilience led by Konsulin. Not a product landing page.

## Setup

Package manager is `pnpm`.

- `pnpm run start` – Hugo server + TailwindCSS watcher
- `pnpm run build` – production build with minification
- `pnpm test` – test suite; run it and the build before merging

## Read first

- `docs/DESIGN.md` – visual language, radius policy, 8/4 rail, bands. Follows the redesign in https://github.com/konsulin-care/konsulin-app
- `docs/UI.md` – partials, params, class recipes, banned classes, CSS rebuild
- `docs/UX.md` – journey, voice, honesty, safety, behaviour
- `docs/DESIGN_TOKENS.md` – token values and roles

## Non-negotiables

- One CTA: taking part in a study. No competing CTAs.
- Site map: Home, Research, FAQ, About, Blog. Help, privacy, contact and services in the footer.
- Copy is Indonesian. Reader is "Anda"; Konsulin speaks as "saya". Soften the tagline; no outcome promises.
- No unconfirmed counts; use a visible `TODO(maintainer)`. Never state or imply ethics approval; render the front matter ethics string verbatim. Screening is not diagnosis.
- Help resources stay reachable.
- Tailwind core utilities, design tokens and Alpine.js only. No dark mode. Mobile-first at 375, 640 and 768px.
- `assets/css/style.css` is a committed build; run `pnpm run build:tw` after adding classes.

Explore the project structure instead of documenting file paths here.
