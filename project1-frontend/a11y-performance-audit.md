## Performance & Accessibility Audit (Project 1)

### Performance (LCP / CLS)

LCP considerations:
- No large images or videos are used, so the largest layout element is primarily text/cards.
- Fonts are loaded from Google Fonts. If you want to minimize impact further later, you can preconnect, but this is acceptable for the internship project.

CLS considerations:
- The layout uses predictable containers (`.page-grid` and grid cards), reducing layout jumps.
- Expenses render into the list after JS loads. This will change content height, but it should not cause major reflow "jumps" because the card areas already have stable padding.

Quick manual check:
- Open DevTools > Performance and reload. Confirm there are no repeated layout shift spikes.

### Accessibility (A11y)

Form semantics:
- All inputs (`amount`, `category`, `date`, `note`) have associated `<label>` elements via `for`/`id`.
- The error message uses `role="alert"` and `aria-live="polite"` so screen readers announce validation feedback.

Keyboard navigation:
- All interactive controls are keyboard focusable (`<a>`, `<button>`, form inputs).
- The delete action is a real `<button type="button">` (not a div), so it works with keyboard.

Focus styling:
- `:focus-visible` is styled for inputs/selects/textareas/buttons and nav links.
- Focus is distinguishable without relying on color alone (uses outline + outline offset).

Contrast and readability:
- Text and surfaces use a neutral background with sufficient contrast for readability.
- Cards have borders, improving separation in grayscale.

ARIA / structure:
- Uses semantic landmarks: `<header>`, `<nav>`, `<main>`, and `<footer>`.
- Summary and expenses areas are grouped using headings (`<h2>`) and `aria-labelledby`.

### Analytics Dashboard (added)

- Month selector has a visible label (sr-only) and `aria-label`.
- Trend canvas uses `role="img"` and a dynamic `aria-label` summarizing the chart data.
- Insights are plain text list items (screen-reader friendly).
- Export CSV button is keyboard accessible.
- Chart area reserves fixed height (`min-height: 220px`) to avoid layout shift (CLS).
- Month comparison delta badges use color + arrow text (not color alone).

- Use Lighthouse (Chrome DevTools) for an “Accessibility” run.
- Use keyboard only (Tab / Shift+Tab) to add an expense and delete one.

