import gsap from 'gsap';
import { createArrow, followPath, drawEdge, traceRect, drawButtonBorder, carryIn, assembleImage, blueprintBox, clearBlueprint, isMobile } from './constructionAnimation';

const CARRY_COLORS = ['white', 'cyan', 'pink', 'red'];

/** Offset a [data-carry] piece starts from, based on the side it arrives from. */
function carryFrom(side, d) {
  if (side === 'right') return [d, 0];
  if (side === 'top') return [0, -d * 0.6];
  if (side === 'bottom') return [0, d * 0.6];
  return [-d, 0];
}

/**
 * Arrows fly in one after another, each pulling a piece of hero content
 * (greeting, name, title, details, stack) and dropping it into place.
 */
export function carryContent(hero) {
  const tl = gsap.timeline();
  const d = isMobile() ? 110 : 220;
  let at = 0;
  hero.querySelectorAll('[data-carry]').forEach((el, i) => {
    const small = el.tagName === 'LI';
    tl.add(
      carryIn(hero, el, {
        from: carryFrom(el.dataset.carry, small ? d * 0.6 : d),
        color: CARRY_COLORS[i % CARRY_COLORS.length],
        size: small ? 9 : 12,
        duration: small ? 0.6 : 0.85,
      }),
      at,
    );
    at += small ? 0.08 : 0.22;
  });
  return tl;
}

/** Stages 2 and 3: background typography, construction lines, then hero content. */
export function constructHero(hero) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (!hero) return tl;
  const q = (s) => hero.querySelector(s);
  const qa = (s) => hero.querySelectorAll(s);

  // Stage 2 — an arrow sweeps across and reveals the oversized background word.
  const bg = q('[data-hero-bg]');
  if (bg) {
    const hr = hero.getBoundingClientRect();
    const br = bg.getBoundingClientRect();
    const y = br.top - hr.top + br.height * 0.5;
    const x0 = Math.max(br.left - hr.left, 0);
    const x1 = Math.min(br.right - hr.left, hr.width);
    const a = createArrow(hero, 'cyan', 16);
    tl.set(bg, { autoAlpha: 1, clipPath: `inset(0 ${br.width}px 0 0)` }, 0);
    tl.add(
      followPath(a, [[x0, y], [x1, y]], {
        duration: 1.6,
        onProgress: (p) => {
          const revealed = x0 + (x1 - x0) * p - (br.left - hr.left);
          bg.style.clipPath = p >= 1 ? 'none' : `inset(0 ${Math.max(br.width - revealed, 0)}px 0 0)`;
        },
      }),
      0,
    );
    tl.to(a, { autoAlpha: 0, duration: 0.2 }, 1.6);
  }

  const edgeColors = ['pink', 'white', 'cyan'];
  qa('[data-hero-edge]').forEach((edge, i) =>
    tl.add(drawEdge(edge, { color: edgeColors[i % 3], reverse: i % 2 === 1, size: 9, duration: 1.1 }), 0.25 + i * 0.2),
  );

  // Blueprint — cursors drag out wireframe boxes where each block of the hero will go.
  const boxes = [];
  qa('[data-blueprint]').forEach((el, i) => {
    const { tl: bt, box } = blueprintBox(hero, el, { color: edgeColors[i % 3] });
    if (box) boxes.push(box);
    tl.add(bt, 0.3 + i * 0.14);
  });

  // Stage 3 — arrows carry the content into the boxes, the name rule is drawn, the photo is assembled tile by tile.
  tl.add(carryContent(hero), 1.7);
  tl.add(drawEdge(q('[data-name-rule]'), { color: 'white', size: 11, duration: 1.1 }), 2.4);
  tl.fromTo(qa('[data-hero-sub]'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.6 }, 3.4);

  const portrait = q('[data-portrait]');
  if (portrait) {
    const mobile = isMobile();
    tl.add(traceRect(portrait, { stroke: 'red', arrow: 'cyan', size: 12, duration: 1.3 }), 1.9);
    tl.add(assembleImage(portrait, portrait.querySelector('[data-media]'), { cols: 3, rows: mobile ? 3 : 4, distance: mobile ? 140 : 260 }), 2.3);
  }
  qa('[data-button]').forEach((btn, i) => tl.add(drawButtonBorder(btn), 3.3 + i * 0.2));
  tl.add(clearBlueprint(boxes), 4.3);
  return tl;
}

/** Stage 4: a few arrows fly to resting positions on the portrait corners. */
export function completeConstruction(hero) {
  const tl = gsap.timeline();
  const portrait = hero?.querySelector('[data-portrait]');
  if (!portrait || isMobile()) return tl;

  const rests = [
    { color: 'cyan', left: '100%', top: '0%', dx: 1, dy: -1, rot: 135 },
    { color: 'pink', left: '0%', top: '100%', dx: -1, dy: 1, rot: -45 },
    { color: 'white', left: '100%', top: '100%', dx: 1, dy: 1, rot: -135 },
  ];
  rests.forEach(({ color, left, top, dx, dy, rot }, i) => {
    const a = createArrow(portrait, color, 14);
    Object.assign(a.style, { left, top });
    tl.fromTo(
      a,
      { x: dx * 90, y: dy * 90, rotation: rot, autoAlpha: 0 },
      { x: dx * 14, y: dy * 14, autoAlpha: 1, duration: 0.9, ease: 'power3.out' },
      i * 0.15,
    );
  });
  return tl;
}
