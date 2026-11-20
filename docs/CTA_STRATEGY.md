# CTA Strategy

konsulin.care is the home of #JadiTangguh, a citizen science movement on psychological resilience led by Konsulin. It is not a product landing page.

## Purpose

Invite visitors to take part in a study, and help them understand what that means before they decide.

## Site Map

Five main items: Beranda, Riset, FAQ, Tentang, Blog. Help, privacy, contact and services live in the footer.

## One Action

The single call to action is taking part in a study. Every page points to this one action. Do not add competing CTAs (no product sign-ups, no service promotions, no pricing).

- Primary CTA: "Ikut Berkontribusi", routed through the shared `params.forward` value in `hugo.yaml`.
- Secondary navigation: in-page scrolling or links to Riset, FAQ and Tentang. These are navigation, not competing actions.
- Never place a secondary link above the primary CTA.

## Voice

- All visitor-facing copy is Indonesian.
- Address the reader as "Anda".
- Konsulin speaks as "saya" where a personal voice is needed; keep it warm and conversational, not clinical.

## Tagline

Keep the #JadiTangguh tagline soft. Never promise outcomes, and never frame resilience as a duty or a cure.

## Honesty Rules

- No unconfirmed counts (participants, studies, results). Leave a visible `TODO(maintainer)` placeholder instead of inventing copy.
- Never state or imply ethics approval. Render the ethics status from front matter verbatim: "Persetujuan etik sedang dalam proses pengajuan."
- Screening is not diagnosis. Say so wherever screening appears.

## Safety Rule

Help resources must stay reachable: in the footer and wherever distress may be discussed. Never hide or bury them.

## Button Styling (TailwindCSS)

Tailwind core utilities only, with `dark:` variants on every template.

```html
<a href="{{ site.Params.forward }}"
   class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
          hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400
          transition-all duration-300 shadow-md hover:shadow-lg">
  Ikut Berkontribusi
</a>
```

On mobile, stack any grouped links vertically:

```html
<div class="flex flex-col md:flex-row gap-4">
  <a href="..." class="flex-1">Ikut Berkontribusi</a>
  <a href="..." class="flex-1">Pelajari riset</a>
</div>
```

## Testing

Before committing:

1. **Click test**: every CTA goes to the correct URL.
2. **Mobile test**: check 375px, 640px and 768px; targets are large enough with proper spacing.
3. **Hierarchy test**: the primary CTA is identifiable on every page, and no competing CTA exists.
4. **Dark mode test**: buttons stay legible.
5. Run `pnpm run build` before merging.
