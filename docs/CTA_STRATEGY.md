# CTA Strategy

konsulin.care is the home of #JadiTangguh, a citizen science movement on psychological resilience led by Konsulin. It is not a product landing page.

## Purpose

Invite visitors to take part in a study, and help them understand what that means before they decide.

## Site Map

Five main items: Beranda, Riset, FAQ, Tentang, Blog. Help, privacy, contact and services live in the footer.

## One Action

The single call to action is taking part in a study. Every page points to this one action. Do not add competing CTAs (no product sign-ups, no service promotions, no pricing).

- Primary CTA: "Mulai Survei (10 Menit)", rendered through `layouts/partials/button.html` and routed through the shared `params.forward` value in `hugo.yaml`.
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

The shared `button.html` partial owns the primary CTA: a pill with `bg-cta`, `text-foreground`, `hover:bg-turquoise-deep` and `hover:text-background`. Use design tokens and Tailwind core utilities only; see `docs/DESIGN.md` for the visual language and `docs/UI.md` for the partial and class recipes. Do not invent a one-off button style.

```html
{{ partial "button.html" (dict
  "href" .Site.Params.forward
  "label" "Mulai Survei (10 Menit)"
  "location" "home-hero"
) }}
```

Pass `location` so the CTA carries a `data-cta-location` attribute for tracking. The label always names the action; do not shorten it to "Ikut" or replace it with a generic "Selengkapnya".

On mobile, stack any grouped links vertically and keep the primary CTA first:

```html
<div class="flex flex-col gap-4 md:flex-row">
  {{ partial "button.html" (dict "href" .Site.Params.forward "label" "Mulai Survei (10 Menit)" "location" "home-final") }}
  <a href="/riset/" class="flex-1">Pelajari riset ini</a>
</div>
```

Never place a secondary link above the primary CTA in the visual order.

## Testing

Before committing:

1. **Click test**: every CTA goes to the correct URL.
2. **Mobile test**: check 375px, 640px and 768px; targets are large enough with proper spacing.
3. **Hierarchy test**: the primary CTA is identifiable on every page, and no competing CTA exists.
4. Run `pnpm run build` before merging.
