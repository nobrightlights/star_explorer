// The measurement screen — observe & interpret (no manual measuring).
//
// Everything animates on a loop over one orbital period:
//   • the spectrum: the star's spectral-line "fingerprint" shifts over time. A
//     single star slides as one block; a binary shows TWO different fingerprints
//     (one per star) that move relative to each other — splitting apart and
//     drawing back together — which is what reveals it's two stars.
//   • the result: the measured speed-vs-time curve, traced live up to a marker
//     dot that rides along in sync with the spectrum.
// The visitor then picks the physical scenario (each option has its own little
// looping animation) that matches what they saw.

import { vrad, vradSecondary } from "./data.js";

const PAD = 30;
const PX_PER_KMS = 1.2;
const CURVE_VMAX = 130;
const PERIOD_MS = 5600;

const SINGLE_COLOR = "#ffd66b";

export class MeasureSession {
  constructor(star, specCanvas, curveCanvas, miniCanvases) {
    this.star = star;
    this.spec = specCanvas;
    this.curve = curveCanvas;
    this.sctx = specCanvas.getContext("2d");
    this.cctx = curveCanvas.getContext("2d");
    this.minis = miniCanvases || {};

    if (star.type === "binary") {
      this.components = [
        { color: "#e8ecff", vfn: (t) => vrad(star, t), lines: star.lines },
        { color: "#9aa6d4", vfn: (t) => vradSecondary(star, t), lines: star.linesB },
      ];
    } else {
      this.components = [{ color: SINGLE_COLOR, vfn: (t) => vrad(star, t), lines: star.lines }];
    }

    this.t0 = performance.now();
    this.raf = null;
  }

  start() {
    const loop = (now) => {
      const turns = (now - this.t0) / PERIOD_MS;
      const phase = turns % 1;
      this.drawSpec(phase);
      this.drawCurve(phase);
      this.drawMinis(turns);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }

  // ---------- coordinates ----------
  stripW() { return this.spec.width - 2 * PAD; }
  restX(frac) { return PAD + frac * this.stripW(); }
  pxFromVel(v) { return v * PX_PER_KMS; }

  // ---------- spectrum (no reference; just the star's shifting light) ----------
  drawSpec(phase) {
    const ctx = this.sctx, W = this.spec.width, H = this.spec.height;
    ctx.clearRect(0, 0, W, H);
    const stripTop = 56, stripH = 96;

    this._rainbow(ctx, stripTop, stripH);
    // faint markers showing where each line sits at rest — the dark lines shift
    // away from these, so even a constant offset is plainly visible
    for (const c of this.components) {
      for (const f of c.lines) this._restMark(ctx, this.restX(f), stripTop, stripH);
    }
    for (const c of this.components) {
      const dx = this.pxFromVel(c.vfn(phase));
      for (const f of c.lines) this._absLine(ctx, this.restX(f) + dx, stripTop, stripH);
    }

    ctx.font = "13px system-ui";
    ctx.textAlign = "left";
    ctx.fillStyle = "#e8ecff";
    ctx.fillText("The star's light — faint marks = reference spectrum, dark lines = now", PAD, stripTop - 14);
  }

  _restMark(ctx, x, top, h) {
    if (x < PAD - 6 || x > this.spec.width - PAD + 6) return;
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x - 1, top, 2, h);
  }

  _rainbow(ctx, top, h) {
    const W = this.spec.width;
    const g = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    ["#7a3cff", "#3b5bff", "#1fd0e0", "#36d84a", "#ffe23a", "#ff8a1f", "#ff3535"]
      .forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(PAD, top, W - 2 * PAD, h);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(PAD, top, W - 2 * PAD, h);
  }

  _absLine(ctx, x, top, h) {
    if (x < PAD - 6 || x > this.spec.width - PAD + 6) return;
    const w = 4;
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, "rgba(8,8,18,0)");
    g.addColorStop(0.5, "rgba(6,6,14,1)");
    g.addColorStop(1, "rgba(8,8,18,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - w, top, w * 2, h);
  }

  // ---------- result curve (traced only up to the marker dot) ----------
  drawCurve(phase) {
    const ctx = this.cctx, W = this.curve.width, H = this.curve.height;
    ctx.clearRect(0, 0, W, H);
    const top = 16, bot = H - 26, left = PAD + 12;
    const vy = (v) => bot - ((clamp(v) + CURVE_VMAX) / (2 * CURVE_VMAX)) * (bot - top);
    const tx = (t) => left + t * (W - 14 - left);

    ctx.strokeStyle = "rgba(194,203,240,0.4)";
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.lineTo(W - 10, bot); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(left, vy(0)); ctx.lineTo(W - 10, vy(0)); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#c2cbf0";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("away", left - 6, vy(CURVE_VMAX) + 10);
    ctx.fillText("0", left - 6, vy(0) + 4);
    ctx.fillText("toward", left - 6, vy(-CURVE_VMAX));
    ctx.textAlign = "left";
    ctx.fillText("measured speed over time →", left + 4, top + 2);

    for (const c of this.components) {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx(0), vy(c.vfn(0)));
      for (let i = 1; i <= 120; i++) {
        const t = i / 120;
        if (t > phase) break;
        ctx.lineTo(tx(t), vy(c.vfn(t)));
      }
      ctx.lineTo(tx(phase), vy(c.vfn(phase)));
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(tx(phase), vy(c.vfn(phase)), 5, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // ---------- option mini-animations ----------
  drawMinis(turns) {
    const a = turns * 2 * Math.PI;
    if (this.minis.rv) miniSteady(this.minis.rv, a);
    if (this.minis.planet) miniPlanet(this.minis.planet, a);
    if (this.minis.binary) miniBinary(this.minis.binary, a * 0.5); // slower orbit
  }
}

function clamp(v) { return Math.max(-CURVE_VMAX, Math.min(CURVE_VMAX, v)); }

// ---------- mini scenario drawings (monochrome — no colour) ----------
const STAR_INK = "#e8ecff";
const SUB_INK = "#9aa6d4";
function miniBG(cv) {
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0b1230";
  ctx.fillRect(0, 0, W, H);
  return { ctx, W, H, cx: W / 2, cy: H / 2 };
}
function dot(ctx, x, y, r, color) {
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
  ctx.restore();
}

// one star drifting steadily in a straight line
function miniSteady(cv, a) {
  const { ctx, W, cy } = miniBG(cv);
  const p = (a / (2 * Math.PI)) % 1;
  const x = 14 + p * (W - 28);
  ctx.strokeStyle = "rgba(207,224,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 22, cy); ctx.lineTo(x - 6, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 12, cy - 5); ctx.lineTo(x - 6, cy); ctx.lineTo(x - 12, cy + 5); ctx.stroke();
  dot(ctx, x, cy, 9, STAR_INK);
}

// a star with an unseen planet orbiting it (the star makes a small wobble)
function miniPlanet(cv, a) {
  const { ctx, W, H, cx, cy } = miniBG(cv);
  const R = Math.min(W, H) * 0.30;
  const px = cx + R * Math.cos(a), py = cy + R * 0.5 * Math.sin(a);
  const sx = cx - 5 * Math.cos(a), sy = cy - 2.5 * Math.sin(a);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.5, 0, 0, 2 * Math.PI); ctx.stroke();
  dot(ctx, sx, sy, 11, STAR_INK);
  dot(ctx, px, py, 4, SUB_INK);
}

// two stars orbiting their common centre
function miniBinary(cv, a) {
  const { ctx, W, H, cx, cy } = miniBG(cv);
  const R = Math.min(W, H) * 0.26;
  ctx.strokeStyle = "rgba(159,220,255,0.25)";
  ctx.beginPath(); ctx.ellipse(cx, cy, R + 6, (R + 6) * 0.5, 0, 0, 2 * Math.PI); ctx.stroke();
  const x1 = cx + R * Math.cos(a), y1 = cy + R * 0.5 * Math.sin(a);
  const x2 = cx - R * Math.cos(a), y2 = cy - R * 0.5 * Math.sin(a);
  dot(ctx, x2, y2, 7, SUB_INK);
  dot(ctx, x1, y1, 10, STAR_INK);
}
