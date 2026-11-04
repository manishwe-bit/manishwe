import { useSyncExternalStore } from 'react';

// Blueprint mode: the whole site shown as a design-tool wireframe (toggle with B).
const listeners = new Set();
let on = false;

export const isBlueprint = () => on;

export function setBlueprint(value) {
  on = value;
  document.documentElement.classList.toggle('blueprint-mode', on);
  listeners.forEach((l) => l());
}

export const toggleBlueprint = () => setBlueprint(!on);

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useBlueprint() {
  return useSyncExternalStore(subscribe, isBlueprint);
}

/** True when a key press is meant for a text field, so global shortcuts should ignore it. */
export const isTyping = (e) => e.target.closest?.('input, textarea, select, [contenteditable="true"]');
