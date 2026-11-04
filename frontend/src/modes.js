import { useSyncExternalStore } from 'react';

// On/off switches shared across components (X-ray lens, dev HUD), toggled by keys, the dock or Ctrl+K.
const state = {};
const listeners = new Set();

export function setMode(name, value) {
  state[name] = value;
  listeners.forEach((l) => l());
}

export const toggleMode = (name) => setMode(name, !state[name]);

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useMode(name) {
  return useSyncExternalStore(subscribe, () => Boolean(state[name]));
}
