// Star catalog + physics model.
//
// All speeds are radial velocity in km/s (motion toward/away along our line of
// sight) — the Doppler effect shifts the star's spectral lines. vrad(phase)
// returns the velocity of the star at orbital phase t (0..1). Each type makes a
// different shape on the speed-vs-time curve:
//   rv     : constant         -> star drifting toward/away from us (flat line)
//   planet : small sinusoid   -> unseen planet tugs the star (small wave)
//   binary : large sinusoid   -> two stars orbiting (big wave + a doubling
//                                fingerprint that splits and re-merges)
//
// `lines` is the star's unique spectral fingerprint: line positions as
// fractions of the strip (count + spacing differ per star). For a binary the
// SAME fingerprint appears twice, shifted by each star's velocity.

export const STARS = [
  {
    id: "vega-prime",
    name: "Lyra-7",
    x: 22, y: 28, size: 1.9, color: "#cfe0ff",
    type: "rv",
    systemic: 0,
    v0: 38,          // receding
    lines: [0.30, 0.40, 0.44, 0.62],
  },
  {
    id: "kepler-ish",
    name: "Aquila-3",
    x: 68, y: 22, size: 1.6, color: "#fff0d0",
    type: "planet",
    systemic: -12,
    K: 28,           // gentle wobble (exaggerated for the screen)
    planetPeriodLabel: "≈ 90 days",
    lines: [0.25, 0.46, 0.66, 0.72],
  },
  {
    id: "algol-ish",
    name: "Perseus-9",
    x: 44, y: 52, size: 2.1, color: "#dfe8ff",
    type: "binary",
    systemic: 5,
    K: 60,           // big swing
    K2: 78,          // companion swings harder (lower mass)
    lines: [0.34, 0.50, 0.56],          // Star A fingerprint
    linesB: [0.26, 0.44, 0.64, 0.70],   // Star B has its own (different) fingerprint
  },
  {
    id: "cyg-binary",
    name: "Cygnus-2",
    x: 76, y: 64, size: 1.7, color: "#cfe9ff",
    type: "binary",
    systemic: -18,
    K: 46,
    K2: 52,
    lines: [0.30, 0.36, 0.52, 0.68],    // Star A fingerprint
    linesB: [0.42, 0.60],               // Star B fingerprint (different)
  },
  {
    id: "drifter",
    name: "Draco-5",
    x: 20, y: 74, size: 1.5, color: "#ffd8c0",
    type: "rv",
    systemic: 0,
    v0: -54,         // approaching, fast
    lines: [0.40, 0.58, 0.64],
  },
  {
    id: "second-planet",
    name: "Orion-8",
    x: 58, y: 92, size: 1.8, color: "#e6ecff",
    type: "planet",
    systemic: 20,
    K: 16,           // subtler wobble — a harder catch
    planetPeriodLabel: "≈ 220 days",
    lines: [0.28, 0.42, 0.50, 0.62, 0.74],
  },
];

// Primary line velocity at phase t (0..1).
export function vrad(star, t) {
  switch (star.type) {
    case "rv":     return star.v0;
    case "planet": return star.systemic + star.K * Math.sin(2 * Math.PI * t);
    case "binary": return star.systemic + star.K * Math.sin(2 * Math.PI * t);
  }
  return 0;
}

// Secondary (companion) line velocity — only meaningful for binaries.
export function vradSecondary(star, t) {
  if (star.type !== "binary") return null;
  return star.systemic - star.K2 * Math.sin(2 * Math.PI * t);
}

// Discovery copy shown after a correct classification.
export const DISCOVERY = {
  rv: {
    title: (s) => s.v0 > 0 ? "A star moving away" : "A star rushing toward us",
    blurb: (s) =>
      `Your measurements stayed flat at about ${Math.abs(s.v0)} km/s ${
        s.v0 > 0 ? "away from us" : "toward us"
      }. One steady speed, never changing — a single star drifting straight along our line of sight.`,
    sci: "The Doppler shift of the lines gives its speed toward or away from us. We can't see its sideways motion, though — that's the method's blind spot.",
  },
  planet: {
    title: () => "A hidden planet!",
    blurb: (s) =>
      `Your curve traced a small, repeating wave (±${s.K} km/s, period ${s.planetPeriodLabel}). The star itself isn't going anywhere — an unseen planet's gravity gently rocks it back and forth.`,
    sci: "This is the radial-velocity 'wobble' method — how many real exoplanets are found. The planet stays invisible; we infer it from the tug it gives its star.",
  },
  binary: {
    title: () => "Two stars!",
    blurb: (s) =>
      `A huge wave (±${s.K} km/s) and two sets of lines that drifted apart — that's two stars whipping around each other. When one races toward us, its partner swings away.`,
    sci: "A double star. The bigger a star's swing, the lighter it is — so this single measurement lets us weigh both stars without ever seeing them as two points of light.",
  },
};

export const TOTAL = STARS.length;
