import gsap from 'gsap';
import { drawEdge, drawButtonBorder } from './constructionAnimation';

/** Stage 1: arrows draw the nav borders, then logo, links and CTA appear. */
export function drawNavigation(nav) {
  const tl = gsap.timeline();
  if (!nav) return tl;

  tl.add(drawEdge(nav.querySelector('[data-edge="bottom"]'), { color: 'cyan', duration: 1.2 }), 0);
  tl.add(drawEdge(nav.querySelector('[data-edge="top"]'), { color: 'pink', reverse: true, duration: 1.2 }), 0.15);
  tl.fromTo(
    nav.querySelectorAll('[data-nav-item]'),
    { autoAlpha: 0, y: -8 },
    { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out' },
    0.45,
  );
  nav.querySelectorAll('[data-button]').forEach((btn) => tl.add(drawButtonBorder(btn), 0.85));
  return tl;
}
