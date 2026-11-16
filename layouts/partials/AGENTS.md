# Partials guidance

Site is the #JadiTangguh movement home (citizen science on psychological resilience). Package manager: pnpm (`pnpm run build`).

- Home section partials (how-it-works, claim-report, research-credibility) take one flat dict: the homepage passes site params, the study page passes front-matter-derived dicts.
- Nav labels: Home, Research, FAQ, About, Blog. Shared partials: page-header, summary-card, button, card; use them on all pages.
- Single CTA: taking part in a study. Copy is Indonesian, reader is "Anda", Konsulin speaks as "saya".
- Honesty: no unconfirmed counts, no ethics approval claims (render the ethics string verbatim), screening is not diagnosis. Missing copy stays as `TODO(maintainer)`.
- Help resources must always stay reachable.
- Alpine.js and Tailwind core utilities only; design tokens only, no `dark:` utilities; mobile-first at 375/640/768px.
