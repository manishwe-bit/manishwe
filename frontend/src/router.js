import { useSyncExternalStore } from 'react';
import { NAV_LINKS } from './config';

// Hash routing (#/about) so pages work on Live Server, from dist/ and on Netlify without server rewrites.
const IDS = NAV_LINKS.map((l) => l.id);

export const pageHref = (id) => (id === 'home' ? '#/' : `#/${id}`);

// Accepts "#/about" and the old in-page anchors ("#about").
function currentPage() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return IDS.includes(id) ? id : 'home';
}

function subscribe(onChange) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function usePage() {
  return useSyncExternalStore(subscribe, currentPage);
}
