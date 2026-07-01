// Glue: screen switching, sky <-> measurement flow, classification + scoring.

import { STARS, DISCOVERY } from "./data.js";
import { isMapped, getType, markMapped, reset } from "./state.js";
import { renderSky, progressText } from "./sky.js";
import { MeasureSession } from "./measure.js";

const $ = (id) => document.getElementById(id);

const skyScreen = $("sky-screen");
const measureScreen = $("measure-screen");
const svg = $("sky");

let session = null;

// ---------- screen switching ----------
function show(screen) {
  for (const s of [skyScreen, measureScreen]) s.classList.remove("active");
  screen.classList.add("active");
  window.scrollTo(0, 0);
}

// ---------- step progression ----------
function showSection(sectionName) {
  const section = $(`${sectionName}-section`);
  if (section) {
    section.classList.add("visible");
  }
  window.scrollTo(0, section ? section.offsetTop - 100 : 0);
}

function refreshSky() {
  renderSky(svg, pickStar);
  $("progress").textContent = progressText();
  const allDone = STARS.every((s) => isMapped(s.id));
  $("sky-hint").textContent = allDone
    ? "Survey complete — you mapped the whole sky! ↺ to let the next astronomer try."
    : "Tap a glowing star to point your telescope at it.";
  startPointing();          // aim the telescope at the stars still to be mapped
  if (allDone) showCompletion();
}

const TYPE_NAMES = {
  rv: ["a lone drifter", "lone drifters"],
  planet: ["a star with a hidden planet", "stars with hidden planets"],
  binary: ["a double star", "double stars"],
};

function showCompletion() {
  const counts = {};
  for (const s of STARS) {
    const t = getType(s.id);
    if (t) counts[t] = (counts[t] || 0) + 1;
  }
  const parts = Object.entries(counts).map(([t, n]) =>
    `${n} ${TYPE_NAMES[t][n === 1 ? 0 : 1]}`);
  const last = parts.pop();
  const list = parts.length ? `${parts.join(", ")} and ${last}` : last;
  $("done-summary").textContent = `You charted all ${STARS.length} stars: ${list}.`;
  $("done").classList.remove("hidden");
}

// ---------- measurement flow ----------
const miniCanvases = {};
document.querySelectorAll(".mini").forEach((c) => { miniCanvases[c.dataset.mini] = c; });

// The tube points straight up (-90°) at rest; rotating it toward a star up in
// the sky makes it lean left/right while staying mostly upright — the
// foreshortened perspective view.
const TUBE_BASE = -90;

// Rotate the telescope tube so it points at a star (pivoting at the mount).
function pointTelescopeAt(star) {
  const tele = $("telescope");
  const ball = svg.querySelector(`[aria-label="Observe ${star.name}"] .star-ball`);
  if (!tele || !ball) return;
  const scope = tele.ownerSVGElement;             // stable frame; the tube itself rotates
  const r = scope.getBoundingClientRect();
  const px = r.left + r.width * 0.5;               // mount pivot in screen coords
  const py = r.top + r.height * (88 / 132);        // viewBox y=88 → the mount
  const s = ball.getBoundingClientRect();
  const ang = Math.atan2(
    (s.top + s.height / 2) - py,
    (s.left + s.width / 2) - px,
  ) * 180 / Math.PI;
  tele.style.transform = `rotate(${ang - TUBE_BASE}deg)`;
}

// While idling on the sky, sweep the telescope across the stars still left to
// map, so it keeps pointing out the next targets. Stops once all are mapped.
let pointTimer = null;
function startPointing() {
  stopPointing();
  const targets = STARS.filter((s) => !isMapped(s.id));
  const tele = $("telescope");
  if (!targets.length) { if (tele) tele.style.transform = ""; return; }
  let i = 0;
  pointTelescopeAt(targets[0]);
  if (targets.length > 1) {
    pointTimer = setInterval(() => {
      i = (i + 1) % targets.length;
      pointTelescopeAt(targets[i]);
    }, 4200);
  }
}
function stopPointing() {
  if (pointTimer) { clearInterval(pointTimer); pointTimer = null; }
}

// Tapping a star: stop the idle sweep, aim at it, then open the measurement.
function pickStar(star) {
  stopPointing();
  pointTelescopeAt(star);
  setTimeout(() => openMeasure(star), 1000);
}

function openMeasure(star) {
  if (session) session.stop();
  session = new MeasureSession(star, $("specview"), $("curve"), miniCanvases);
  $("star-name").textContent = star.name + (isMapped(star.id) ? " ✓" : "");
  $("result").classList.add("hidden");
  
  // Reset sections to initial state
  const sections = ["reference", "curve", "classify"];
  for (const sec of sections) {
    const el = $(`${sec}-section`);
    if (el) el.classList.remove("visible");
  }
  
  show(measureScreen);
}

function leaveMeasure() {
  if (session) session.stop();
  refreshSky();
  show(skyScreen);
}

function classify(guess) {
  const star = session.star;
  const correct = guess === star.type;
  const info = DISCOVERY[star.type];
  const box = $("result");
  box.classList.remove("hidden", "wrong");

  if (correct) {
    markMapped(star.id, star.type);
    box.innerHTML = `
      <h3>✦ ${info.title(star)}</h3>
      <div>${info.blurb(star)}</div>
      <div class="sci">${info.sci}</div>
      <button class="primary-btn" id="continue-btn">Add to sky map ›</button>`;
    $("continue-btn").addEventListener("click", leaveMeasure);
  } else {
    session.start();
    box.classList.add("wrong");
    box.innerHTML = `
      <h3>Not quite — look again</h3>
      <div>Does the fingerprint <em>hold still</em> after shifting, drift <em>gently</em> back and forth, or <em>split in two</em>? Watch the speed curve too: flat, a small wave, or a big one?</div>
      <button class="primary-btn" id="retry-btn">Try again</button>`;
    $("retry-btn").addEventListener("click", () => {
      box.classList.add("hidden");
      // Scroll back to top to see the spectrum again
      window.scrollTo(0, 0);
    });
  }
}

// ---------- events ----------
$("back-btn").addEventListener("click", leaveMeasure);

// Step progression buttons
$("btn-start-measure").addEventListener("click", () => {
  session.start();
  showSection("reference");
});

$("btn-next-curve").addEventListener("click", () => {
  showSection("curve");
});

$("btn-next-classify").addEventListener("click", () => {
  showSection("classify");
});

document.querySelectorAll(".class-btn").forEach((btn) =>
  btn.addEventListener("click", () => classify(btn.dataset.guess)));

$("reset-btn").addEventListener("click", () => {
  if (confirm("Start a fresh survey? This clears the mapped sky.")) {
    reset();
    refreshSky();
  }
});

$("intro-btn").addEventListener("click", () => $("intro").classList.add("hidden"));

$("done-btn").addEventListener("click", () => {
  reset();
  $("done").classList.add("hidden");
  refreshSky();
});

// ---------- boot ----------
refreshSky();

// Deep link: #star=<id> opens a star directly (handy for kiosks and screenshots).
(function deepLink() {
  const p = new URLSearchParams(location.hash.slice(1));
  const star = STARS.find((s) => s.id === p.get("star"));
  if (star) { $("intro").classList.add("hidden"); openMeasure(star); }
})();
