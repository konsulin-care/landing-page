# Design Tokens

This mirrors the Konsulin frontend design tokens. Values are pending confirmation against the frontend repo's `globals.css`; re-verify once it is available. Source of truth in this repo: `assets/css/main.css`.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| charcoal-900 | #161C26 | Foreground, headings, primary button |
| charcoal-700 | #484D54 | Body text, button hover |
| charcoal-600 | #686C72 | Muted text |
| charcoal-400 | #8D8F93 | Input borders, bullets |
| charcoal-200 | #DADBDB | Hairline borders |
| charcoal-100 | #ECEDEB | Muted surfaces |
| paper | #FAFAF8 | Page background |
| surface | #FFFFFF | Cards |
| turquoise | #0ABDC3 | The single accent (quote borders) |
| turquoise-tint | #D8F1F1 | Accent background |
| turquoise-deep | #0F7981 | Links, kickers, focus ring |
| danger / warning (+tint, deep) | see main.css | Status only |

Semantic aliases: background, foreground, card, muted, muted-foreground, accent, accent-foreground, border, input, ring.

## Rules

- No dark mode and no `dark:` utilities.
- Swiss Modernism, softened: hairline borders (1px), `rounded-lg`, left-aligned ragged-right text (no justify), one accent color.
- Use only palette classes; the guard test blocks off-palette classes (blue, gray, slate, zinc, etc.).
- Tailwind core utilities and Alpine.js only.

## Legacy mapping

| Legacy | Replacement |
| --- | --- |
| gray-900, black | foreground |
| gray-700 | charcoal-700 |
| gray-500/600 | muted-foreground |
| gray-200/300 | border |
| gray-50, slate-50 | background / muted |
| white | card |
| blue-600 | turquoise-deep |
| blue-50 | accent |
