import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { activateOnCursor, disposeConstruction, isMobile } from '../animations/constructionAnimation';
import { drawNavigation } from '../animations/navigationAnimation';
import { constructHero, completeConstruction } from '../animations/heroAnimation';
import { constructSection } from '../animations/scrollAnimation';
import { startSwarm } from '../animations/swarmAnimation';

/**
 * Runs the website construction sequence:
 * intro (nav → hero) on load, scroll construction per section,
 * and cursor-proximity tracing once the intro has finished.
 */
export default function WebsiteConstructionAnimation() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains('js-build')) return undefined; // reduced motion: static site

    let cancelled = false;
    let stopCursor = () => {};
    let stopSwarm = () => {};
    const ctx = gsap.context(() => {});

    const run = () => {
      if (cancelled) return;
      try {
        ctx.add(() => {
          const mobile = isMobile();
          const hero = document.querySelector('[data-hero]');
          gsap
            .timeline({ onComplete: () => (stopCursor = activateOnCursor(document)) })
            .add(drawNavigation(document.querySelector('[data-nav]')), 0)
            .add(constructHero(hero), 0.5)
            .add(completeConstruction(hero), '>-0.2');

          document.querySelectorAll('[data-section]').forEach((s) => constructSection(s, { mobile }));
          const swarm = document.querySelector('[data-swarm]');
          if (swarm) stopSwarm = startSwarm(swarm, { count: mobile ? 14 : 32 });
          ScrollTrigger.refresh();
        });
      } catch (err) {
        console.error('Construction animation failed; showing static site.', err);
        html.classList.remove('js-build');
      }
    };

    if (document.fonts?.ready) document.fonts.ready.then(run);
    else run();

    return () => {
      cancelled = true;
      stopCursor();
      stopSwarm();
      ctx.revert();
      disposeConstruction();
    };
  }, []);

  return null;
}
