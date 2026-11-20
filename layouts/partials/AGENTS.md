# Partials guidance

Site is the #JadiTangguh movement home. Package manager: `pnpm` (`pnpm run build`; `pnpm run build:tw` after adding classes).

- Partial catalogue and params (button, card, page-header, summary-card, scroll-section, section-kicker): `docs/UI.md`
- Band tones, 8/4 rail, pill CTA rule: `docs/DESIGN.md`
- Copy, honesty and safety rules: `docs/UX.md`

Reminders: home section partials take one flat dict and read the visible section number with `page.Store.Get "sectionNum"`. Use the shared partials on all pages. Single CTA, Indonesian copy ("Anda"), no unconfirmed counts, help resources reachable, design tokens only, no `dark:` utilities.
