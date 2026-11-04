import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { drawEdge, drawButtonBorder, constructProjectFrame, constructBox, drawRing } from './constructionAnimation';

const LINE_COLORS = ['cyan', 'pink', 'white'];

/** Scroll-driven construction for one [data-section]. */
export function constructSection(section, { mobile = false } = {}) {
  // Top divider is scrubbed to scroll position: the arrow moves as you scroll.
  const divider = section.querySelector('[data-divider]');
  if (divider) {
    const tl = drawEdge(divider, { color: 'cyan', duration: 1, ease: 'none', persist: true, arrow: !mobile }).pause();
    ScrollTrigger.create({ trigger: section, start: 'top 92%', end: 'top 40%', scrub: 0.6, animation: tl });
  }

  const headingLines = section.querySelectorAll('[data-mask-in]');
  if (headingLines.length) {
    gsap.fromTo(
      headingLines,
      { yPercent: 110, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.12, ease: 'power4.out', scrollTrigger: { trigger: section, start: 'top 70%', once: true } },
    );
  }

  section.querySelectorAll('[data-reveal]').forEach((el) =>
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: Number(el.dataset.delay || 0), scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
    ),
  );

  const once = (el, start, fn) => ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => fn(el) });

  section.querySelectorAll('[data-line]').forEach((el, i) =>
    once(el, 'top 92%', () => drawEdge(el, { color: LINE_COLORS[i % 3], size: 8, duration: 1, arrow: !mobile })),
  );
  section.querySelectorAll('[data-project]').forEach((el) => once(el, 'top 78%', constructProjectFrame));
  section.querySelectorAll('[data-box]').forEach((el) => once(el, 'top 88%', constructBox));
  section.querySelectorAll('[data-button]').forEach((el) => once(el, 'top 94%', drawButtonBorder));
  section.querySelectorAll('[data-ring]').forEach((el) => once(el, 'top 85%', drawRing));
}
