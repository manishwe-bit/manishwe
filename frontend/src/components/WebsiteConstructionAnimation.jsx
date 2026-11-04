import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { activateOnCursor, disposeConstruction, isMobile } from '../animations/constructionAnimation';
import { drawNavigation } from '../animations/navigationAnimation';
import { constructHero, completeConstruction } from '../animations/heroAnimation';
import { constructSection } from '../animations/scrollAnimation';
import { startSwarm } from '../animations/swarmAnimation';

const building = () => document.documentElement.classList.contains('js-build');
const whenFontsReady = (fn) => (document.fonts?.ready ? document.fonts.ready.then(fn) : fn());

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
