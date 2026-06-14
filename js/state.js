// Tiny persistence layer. Each visitor's survey lives in localStorage so the
// mapped sky survives an accidental reload, but "New survey" wipes it for the
// next person at the booth.

const KEY = "star-explorer/v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

let mapped = load(); // { [starId]: type }

export function isMapped(id) {
  return Boolean(mapped[id]);
}

export function getType(id) {
  return mapped[id] || null;
}

export function markMapped(id, type) {
  mapped[id] = type;
  localStorage.setItem(KEY, JSON.stringify(mapped));
}

export function mappedCount() {
  return Object.keys(mapped).length;
}

export function reset() {
  mapped = {};
  localStorage.removeItem(KEY);
}
