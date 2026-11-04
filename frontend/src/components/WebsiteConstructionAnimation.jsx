import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { activateOnCursor, disposeConstruction, isMobile } from '../animations/constructionAnimation';
import { drawNavigation } from '../animations/navigationAnimation';
import { constructHero, completeConstruction } from '../animations/heroAnimation';
import { constructSection } from '../animations/scrollAnimation';
import { startSwarm } from '../animations/swarmAnimation';

const building = () => document.documentElement.classList.contains('js-build');
// The font stylesheet loads without blocking paint (index.html), so first wait for it to arrive
// (max 3 s), then for the fonts themselves: the build measures text and must see final metrics.
const fontCss = new Promise((resolve) => {
  if (window.__fontsCss) return resolve();
  window.addEventListener('fontscss', resolve, { once: true });
  setTimeout(resolve, 3000);
});
const fontsLoaded = fontCss.then(() =>
  document.fonts
    ? Promise.all(
        [
          ['1em Anton'],
          ['1em Inter'],
          ['600 1em Caveat'],
          // Hindi: pass Devanagari text, or only the font's Latin subset would load.
          ...(document.documentElement.lang === 'hi' ? [['800 1em "Noto Sans Devanagari"', 'नमस्ते']] : []),
        ].map(([font, text]) => document.fonts.load(font, text).catch(() => {})),
      ).then(() => document.fonts.ready)
    : undefined,
);
const whenFontsReady = (fn) => fontsLoaded.then(fn);

function failSafe(fn) {
  try {
    fn();
  } catch (err) {
    console.error('Construction animation failed; showing static site.', err);
    document.documentElement.classList.remove('js-build');
  }
}

/**
 * Runs the website construction sequence:
 * the nav is drawn once on first load; every page (re)builds itself when it opens —
 * hero intro on Home, scroll construction per section elsewhere — followed by
 * cursor-proximity tracing and, on Contact, the cursor swarm.
 */
export default function WebsiteConstructionAnimation({ page }) {
  const firstPage = useRef(true);

  // Nav: drawn once; it stays mounted across pages.
  useEffect(() => {
    if (!building()) return undefined; // reduced motion: static site
    let cancelled = false;
    const ctx = gsap.context(() => {});
    whenFontsReady(() => !cancelled && failSafe(() => ctx.add(() => drawNavigation(document.querySelector('[data-nav]')))));
    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  // Page: rebuilt every time a page opens.
  useEffect(() => {
    if (!building()) return undefined;
    const delay = firstPage.current ? 0.5 : 0.1; // let the nav start first on initial load
    firstPage.current = false;

    let cancelled = false;
    let stopCursor = () => {};
    let stopSwarm = () => {};
    const ctx = gsap.context(() => {});

    whenFontsReady(() => {
      if (cancelled) return;
      failSafe(() =>
        ctx.add(() => {
          const mobile = isMobile();
          const hero = document.querySelector('[data-hero]');
          const tl = gsap.timeline({ delay, onComplete: () => (stopCursor = activateOnCursor(document)) });
          if (hero) tl.add(constructHero(hero)).add(completeConstruction(hero), '>-0.2');

          document.querySelectorAll('main [data-section]').forEach((s) => constructSection(s, { mobile }));
          const swarm = document.querySelector('[data-swarm]');
          if (swarm) stopSwarm = startSwarm(swarm, { count: mobile ? 14 : 32 });
          ScrollTrigger.refresh();
        }),
      );
    });

    return () => {
      cancelled = true;
      stopCursor();
      stopSwarm();
      ctx.revert();
      disposeConstruction('[data-nav]');
    };
  }, [page]);

  return null;
}
