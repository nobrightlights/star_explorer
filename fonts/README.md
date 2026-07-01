# Fonts

- **Titles / headers → Impact.** A system font on Windows and macOS, so nothing
  is bundled for it.
- **Body text → Saira Semi Condensed** (files in this folder), used as a free,
  open-licensed (SIL OFL) look-alike for Futura Condensed. It's bundled locally
  so the app renders the same on every machine, including an offline kiosk.

## Files

- `saira-semi-condensed-500.woff2` — medium weight (default body text)
- `saira-semi-condensed-700.woff2` — bold weight (emphasis / strong text)

Downloaded from the Fontsource CDN (jsDelivr). Licensed under the SIL Open Font
License, so it's safe to redistribute with the app.

## Notes

- `styles.css` registers these under the `@font-face` family `AppCondensed`.
- If a machine has a licensed **Futura Condensed Medium** installed, `styles.css`
  prefers it via `local(...)` before falling back to the bundled Saira files —
  so you can swap in real Futura on the exhibit machine just by installing it.
- To use a different look-alike, replace the `.woff2` files here (keep the names)
  or update the `@font-face` block in `styles.css`.
