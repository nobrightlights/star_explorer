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

function refreshSky() {
  renderSky(svg, openMeasure);
  $("progress").textContent = progressText();
  const allDone = STARS.every((s) => isMapped(s.id));
  $("sky-hint").textContent = allDone
    ? "Survey complete — you mapped the whole sky! ↺ to let the next astronomer try."
    : "Tap a glowing star to point your telescope at it.";
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

function openMeasure(star) {
  if (session) session.stop();
  session = new MeasureSession(star, $("specview"), $("curve"), miniCanvases);
  $("star-name").textContent = star.name + (isMapped(star.id) ? " ✓" : "");
  $("classify").classList.remove("hidden");
  $("result").classList.add("hidden");
  session.start();
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
    $("classify").classList.add("hidden");
    $("continue-btn").addEventListener("click", leaveMeasure);
  } else {
    box.classList.add("wrong");
    box.innerHTML = `
      <h3>Not quite — look again</h3>
      <div>Does the fingerprint <em>hold still</em> after shifting, drift <em>gently</em> back and forth, or <em>split in two</em>? Watch the speed curve too: flat, a small wave, or a big one?</div>
      <button class="primary-btn" id="retry-btn">Try again</button>`;
    $("retry-btn").addEventListener("click", () => box.classList.add("hidden"));
  }
}

// ---------- events ----------
$("back-btn").addEventListener("click", leaveMeasure);

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
