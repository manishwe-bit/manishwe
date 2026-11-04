import { useSyncExternalStore } from 'react';
import { LIVE_URL } from './config';

/**
 * Live presence: one WebSocket to the API that shares every visitor's cursor.
 * Positions travel as (section index, fraction across, fraction down) so they land
 * on the same content for everyone, whatever their screen size.
 */
const listeners = new Set();
let snapshot = { status: 'off', me: null, peers: {}, count: 0 };
let ws = null;
let retry = 0;
let page = 'home';
let lastSend = 0;

const emit = (patch) => {
  snapshot = { ...snapshot, ...patch };
  snapshot.count = snapshot.me ? Object.keys(snapshot.peers).length + 1 : 0;
  listeners.forEach((l) => l());
};

// Per-event hooks for the cursor layer (moves and clicks are too frequent for React state).
export const peerEvents = new EventTarget();

const send = (msg) => ws?.readyState === 1 && ws.send(JSON.stringify(msg));

/** "Asia/Kolkata" -> "Kolkata": a rough, privacy-friendly place label. */
function place() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' ');
  } catch {
    return '';
  }
}

function connect() {
  if (ws || document.hidden) return;
  emit({ status: 'connecting' });
  try {
    ws = new WebSocket(LIVE_URL);
  } catch {
    return scheduleRetry();
  }
  ws.onopen = () => {
    retry = 0;
    send({ t: 'hi', page, place: place() });
  };
  ws.onmessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    if (m.t === 'welcome') emit({ status: 'live', me: m.you, peers: Object.fromEntries(m.peers.map((p) => [p.id, p])) });
    else if (m.t === 'join' || m.t === 'pg') emit({ peers: { ...snapshot.peers, [m.peer.id]: m.peer } });
    else if (m.t === 'leave') {
      const { [m.id]: _gone, ...rest } = snapshot.peers;
      emit({ peers: rest });
      peerEvents.dispatchEvent(new CustomEvent('leave', { detail: m }));
    } else if (m.t === 'mv' || m.t === 'ck') peerEvents.dispatchEvent(new CustomEvent(m.t, { detail: m }));
  };
  ws.onclose = () => {
    ws = null;
    emit({ status: 'offline', me: null, peers: {} });
    scheduleRetry();
  };
  ws.onerror = () => ws?.close();
}

function scheduleRetry() {
  // The free Render server sleeps when idle; back off while it wakes up.
  retry = Math.min(retry + 1, 6);
  setTimeout(connect, 1500 * 2 ** retry * (0.75 + Math.random() * 0.5));
}

/** Where a viewport point sits, relative to the main section under it. */
export function locate(x, y) {
  const sections = [...document.querySelectorAll('main > section')];
  for (let i = 0; i < sections.length; i++) {
    const r = sections[i].getBoundingClientRect();
    if (y >= r.top && y <= r.bottom) return { s: i, fx: (x - r.left) / r.width, fy: (y - r.top) / r.height };
  }
  return null;
}

/** The viewport point for a located position, or null if that section isn't on this page. */
export function resolve({ s, fx, fy }) {
  const el = document.querySelectorAll('main > section')[s];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + fx * r.width, y: r.top + fy * r.height };
}

let started = false;
export function startLive() {
  if (started || !LIVE_URL) return;
  started = true;
  connect();
  document.addEventListener('visibilitychange', () => (document.hidden ? ws?.close() : connect()));

  const onPointer = (e) => {
    if (ws?.readyState !== 1 || snapshot.count < 2) return; // nobody to share with
    const now = performance.now();
    if (now - lastSend < 50) return; // ~20 updates a second
    lastSend = now;
    const at = locate(e.clientX, e.clientY);
    if (at) send({ t: 'mv', ...at });
  };
  window.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && onPointer(e), { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (ws?.readyState !== 1 || snapshot.count < 2) return;
    const at = locate(e.clientX, e.clientY);
    if (at) send({ t: 'ck', ...at });
  });
}

export function setLivePage(p) {
  page = p;
  send({ t: 'pg', page: p });
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLive() {
  return useSyncExternalStore(subscribe, () => snapshot);
}
