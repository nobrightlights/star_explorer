# Fonts

- **Titles / headers → Impact**, falling back to bundled **Anton** — a free
  (SIL OFL) Impact look-alike. Impact ships with Windows and macOS but NOT
  Android, so without Anton the titles collapse to a thin system sans on phones
  (e.g. Samsung). Anton keeps them heavy and condensed on every device, offline.
- **Body text → Saira Semi Condensed** (files in this folder), used as a free,
  open-licensed (SIL OFL) look-alike for Futura Condensed. It's bundled locally
  so the app renders the same on every machine, including an offline kiosk.

## Files

- `anton-400.woff2` — display face for titles/headers (Impact look-alike)
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
