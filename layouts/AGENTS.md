# Layouts guidance

Site is the #JadiTangguh movement home (citizen science on psychological resilience), not a product landing page. Package manager: pnpm (`pnpm run start`, `pnpm run build`).

- Nav: Beranda, Riset, FAQ, Tentang, Blog. Footer: help, privacy, contact, services.
- Single CTA: taking part in a study.
- Copy is Indonesian, reader is "Anda", Konsulin speaks as "saya". Soften the tagline; no outcome promises.
- Honesty: no unconfirmed counts, no ethics approval claims (render the front matter ethics string verbatim), screening is not diagnosis. Missing copy stays as `TODO(maintainer)`.
- Help resources must always stay reachable.
- Alpine.js and Tailwind core utilities only; `dark:` utilities on every template; mobile-first at 375/640/768px.
