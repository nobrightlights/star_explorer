// Renders the night sky as SVG: background stars, the clickable catalog stars,
// and the discovery annotations that accumulate as the visitor maps the sky.

import { STARS } from "./data.js";
import { isMapped, getType, mappedCount } from "./state.js";

const SVGNS = "http://www.w3.org/2000/svg";
const VIEW_W = 100, VIEW_H = 150;

function el(name, attrs = {}) {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// Deterministic background starfield so it doesn't reshuffle on every render.
function backgroundStars(n) {
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = [];
  for (let i = 0; i < n; i++) {
    stars.push({ x: rnd() * VIEW_W, y: rnd() * VIEW_H, r: 0.12 + rnd() * 0.35, d: rnd() * 3 });
  }
  return stars;
}
const BG = backgroundStars(160);

function defs() {
  const d = el("defs");
  const m = el("marker", {
    id: "arrowhead", markerWidth: 5, markerHeight: 5,
    refX: 4, refY: 2.5, orient: "auto",
  });
  m.appendChild(el("path", { d: "M0,0 L5,2.5 L0,5 Z", fill: "currentColor" }));
  d.appendChild(m);
  return d;
}

// --- annotation glyphs per discovery type ---
function annotation(star) {
  const g = el("g", { class: "anno" });
  const t = getType(star.id);
  const { x, y } = star;

  if (t === "rv") {
    // Arrow: blue toward us is drawn as a short inbound chevron, red away as outbound.
    const approaching = star.v0 < 0;
    const len = 6;
    const arrow = el("line", {
      x1: x, y1: approaching ? y + len : y - 1,
      x2: x, y2: approaching ? y + 1 : y - len,
      class: "anno-arrow",
      stroke: approaching ? "#5aa6ff" : "#ff6b6b",
    });
    arrow.style.color = approaching ? "#5aa6ff" : "#ff6b6b";
    g.appendChild(arrow);
  } else if (t === "planet") {
    const rx = 5, ry = 2.2;
    g.appendChild(el("ellipse", { cx: x, cy: y, rx, ry, class: "anno-orbit" }));
    g.appendChild(el("circle", { cx: x + rx, cy: y, r: 0.7, class: "anno-planet" }));
  } else if (t === "binary") {
    g.appendChild(el("circle", { cx: x + 2.6, cy: y, r: 1.0, fill: "#ffd66b" }));
    g.appendChild(el("circle", { cx: x - 2.6, cy: y, r: 1.4, fill: "#dfe8ff" }));
    g.appendChild(el("ellipse", { cx: x, cy: y, rx: 3.4, ry: 1.4, class: "anno-orbit" }));
  }
  return g;
}

// Radial gradient that turns a flat disc into one soft glowing ball: a small
// bright core, the star's colour through the body, fading to transparent.
function glowGradient(star) {
  const g = el("radialGradient", { id: `glow-${star.id}`, cx: "50%", cy: "50%", r: "50%" });
  g.appendChild(el("stop", { offset: "0%",  "stop-color": "#ffffff",   "stop-opacity": "0.6" }));
  g.appendChild(el("stop", { offset: "18%", "stop-color": star.color,  "stop-opacity": "1" }));
  g.appendChild(el("stop", { offset: "50%", "stop-color": star.color,  "stop-opacity": "0.98" }));
  g.appendChild(el("stop", { offset: "100%", "stop-color": star.color, "stop-opacity": "0" }));
  return g;
}

export function renderSky(svg, onPick) {
  svg.innerHTML = "";
  const defsNode = defs();
  svg.appendChild(defsNode);

  // background field
  const bg = el("g");
  for (const s of BG) {
    // static (non-twinkling) field; brighter stars are a touch more opaque
    const op = Math.min(0.8, 0.32 + s.r).toFixed(2);
    const c = el("circle", { cx: s.x.toFixed(2), cy: s.y.toFixed(2), r: s.r.toFixed(2), fill: "#aeb8ee", opacity: op });
    bg.appendChild(c);
  }
  svg.appendChild(bg);

  // catalog stars
  for (const star of STARS) {
    const g = el("g", { class: "star-dot" });
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `Observe ${star.name}`);

    // one soft glowing ball
    defsNode.appendChild(glowGradient(star));
    g.appendChild(el("circle", {
      cx: star.x, cy: star.y, r: star.size * 2.4,
      fill: `url(#glow-${star.id})`, class: "star-ball",
    }));

    if (isMapped(star.id)) {
      g.appendChild(el("circle", { cx: star.x, cy: star.y, r: star.size * 2.8, class: "mapped-ring" }));
      g.appendChild(annotation(star));
    }

    const label = el("text", { x: star.x, y: star.y + star.size + 3.4, class: "star-label" });
    label.textContent = star.name;
    g.appendChild(label);

    const handler = (e) => { e.preventDefault(); onPick(star); };
    g.addEventListener("click", handler);
    svg.appendChild(g);
  }
}

export function progressText() {
  return `${mappedCount()} / ${STARS.length} mapped`;
}
