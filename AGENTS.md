# Konsulin Landing Page

This is a Hugo + Alpine.js + TailwindCSS landing page for Konsulin, an open-source digital mental health platform. The primary goal is to drive user habit formation by converting visitors to WhatsApp interactions within 10 seconds.

## Project Setup

Use `npm` as the package manager.

Build and development commands:
- `npm run start` – Starts Hugo server + TailwindCSS watcher concurrently
- `npm run build` – Builds production-ready site with minification

## Landing Page Structure

The landing page follows a **modular conversion formula** with repeating sections. Before making changes, review `docs/LANDING_PAGE_FORMULA.md` to understand the section template and interactivity patterns.

## Key Strategic Decisions

**CTA Priority**: Primary CTA redirects to WhatsApp. Secondary CTA to PWA dashboard.
- WhatsApp is the entry point for habit formation (users check it 10+ times daily)
- PWA is the insight/analytics layer (accessed after initial journaling)
- See `docs/CTA_STRATEGY.md` for the dual-CTA architecture and copy guidelines

**Audience**: Indonesian general public (self-care, wellness). 
- Copy must feel conversational, not clinical
- Reference Indonesian mental health context and values
- See `docs/INDONESIAN_COPY_GUIDELINES.md` for tone and phrasing

## Interactive Elements

Use Alpine.js for interactions (expand/collapse, tabs, carousel, scroll-reveal). Avoid adding external libraries like AOS or Gsap.

Interactive patterns available:
- Expand/collapse (x-data with toggle)
- Tabs/toggle groups (x-data with state management)
- Carousel (array iteration with prev/next)
- Scroll-reveal (detect visibility with @scroll.window)

For specifics, see `docs/ALPINE_PATTERNS.md`.

## Styling

- Use only TailwindCSS core utility classes (no plugins except @tailwindcss/typography for content)
- Dark mode via Tailwind's class strategy (add `dark:` utilities as needed)
- Breakpoints: mobile-first, test at sm (640px) and md (768px) minimum

## Testing & QA

Before committing:
- Test all CTAs redirect to correct URLs (WhatsApp or PWA)
- Verify mobile responsiveness (test on phone or mobile browser DevTools)
- Confirm all Alpine.js interactions work (expand, tabs, carousels)
- Check that page loads in under 3 seconds (Hugo serves static files; monitor for CSS/JS weight)

Run `npm run build` to generate production output before merging.

## File Structure Hints

- Hugo content: `content/` (sections, posts)
- Hugo layouts: `layouts/` (base template, section templates)
- TailwindCSS: `assets/css/main.css` (gets compiled to `assets/css/style.css`)
- JavaScript/Alpine: Included directly in layouts via `<script>` tags
- Documentation: `docs/` (guides for agents, progressively disclosed)

Don't document file paths in detail—they change. Instead, explore the project structure naturally.
