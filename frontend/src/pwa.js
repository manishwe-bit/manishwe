import { useSyncExternalStore } from 'react';

// Installable app: registers the service worker (production builds only) and keeps the
// browser's install prompt so the dock / Ctrl+K can offer "Install app".
let prompt = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function setupPWA() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini-bar
    prompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    prompt = null;
    emit();
  });
}

export async function installApp() {
  if (!prompt) return;
  prompt.prompt();
  await prompt.userChoice.catch(() => {});
  prompt = null;
  emit();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export const useInstallable = () => useSyncExternalStore(subscribe, () => Boolean(prompt));
