# ✦ Star Explorer

A 2-minute mobile mini-game for an exhibition. Visitors scan a QR code, become
astronomers, and **map a night sky** by pointing a telescope at stars and reading
their light with a spectrograph — discovering motion, planets and double stars
using the real **Doppler / radial-velocity** method.

## How it plays

Tap a star → its spectrum opens. The top strip is the **reference** (where the
lines sit when the star isn't moving); the bottom strip is the star's actual,
Doppler-shifted light. You **slide the lower spectrum** until its dark lines line
up with the reference — how far you slid it is the star's speed. Repeat over a few
"nights" and a **speed-vs-time curve** builds itself; its shape names the star:

| Discovery | Real signature | In the game |
|---|---|---|
| Approaching / receding star | Constant Doppler shift | One set of lines, **flat** curve → arrow on sky |
| Hidden planet | Small periodic wobble (RV method) | One set, **small wave** → orbit + planet |
| Double (binary) star | Two line-sets in anti-phase | **Two** colour-tagged sets (🔵 A / 🟠 B) that split apart; **two mirror-image curves** → companion star |

A binary shows two sets of lines emerging from the shared rest positions and
sliding opposite ways (one star toward us, one away). You measure each star in
turn; the two curves come out as reflections of each other.

Honest simplifications: velocities and Doppler shifts are exaggerated for a phone
screen; we ignore inclination and noise, the two binary line-sets are colour-tagged
as a teaching aid, and we only see line-of-sight motion (surfaced as a teaching
point, not hidden).

## Run locally

ES modules need to be served over http (not opened as a `file://`):

```bash
/home/cmosig/miniconda3/envs/agent/bin/python -m http.server 8000
# then open http://localhost:8000  (use device emulation / a phone on the same wifi)
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Your URL becomes `https://<user>.github.io/<repo>/`. Generate a QR code for it.

No build step — it's plain HTML/CSS/JS, so Pages serves it as-is.

## Tuning the exhibit

- Edit the star catalog in `js/data.js` (positions, types, velocities, discovery copy).
- Progress is saved in `localStorage`; the **↺ New survey** button resets it for the next visitor.
- For a kiosk you may want to auto-reset on load — clear `localStorage` in `js/app.js` boot.
