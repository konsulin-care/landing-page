# Design Tokens

Values mirror the app redesign in https://github.com/konsulin-care/konsulin-app. Source of truth in this repo: the `@theme` block in `assets/css/main.css`. Language and layout: `docs/DESIGN.md`. Build recipes: `docs/UI.md`.

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

Semantic aliases: background, foreground, card, muted, muted-foreground, accent, accent-foreground, cta, border, input, ring.

### CTA token

- `cta` = `var(--color-turquoise)` (#0ABDC3). Reserved for the primary CTA (taking part in a study).
- `accent` stays `var(--color-turquoise-tint)` and is only the accent background; do not use it for buttons.

## Primary button

- Shape: pill (`rounded-full`), `px-7` default and `px-9` for `lg`.
- Background `bg-cta`, text `text-foreground` (dark text — white on turquoise fails contrast).
- Hover: `hover:bg-turquoise-deep hover:text-background`.
- Focus: keep the `focus-visible` outline-ring.
- `tone` param `on-dark` is for charcoal bands: same turquoise fill, hover `hover:bg-background hover:text-foreground`, focus `outline-background`.
- Deliberate exception: konsulin-app fills solid turquoise on the FAB only. Here the turquoise `bg-cta` primary button is intended, because it is the single call to action.
- Optional `size` param (`default`, `sm`, `lg`) and `type` param (when `type` is set, render a `<button>` instead of an `<a>`).

## Rules

- No dark mode and no `dark:` utilities.
- Swiss Modernism, softened: hairline borders (1px), `rounded-lg`, left-aligned ragged-right text (no justify), one accent color.
- Radius: `rounded-lg` for cards, inputs, images and notes. Pill (`rounded-full`) for the primary CTA only.
- Bands: section backgrounds are paper (`bg-background`), surface (`bg-card border-y border-border`) or charcoal (`bg-foreground text-background`). Never `turquoise-tint` or `muted` as a section background.
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
