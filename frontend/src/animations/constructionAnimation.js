import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';

// Triangular arrow pointing along +x; rotation = travel direction.
export const ARROW_PATH = 'M15 8 L2 2.5 L5.5 8 L2 13.5 Z';
export const COLORS = { white: '#ffffff', cyan: '#65E8FF', pink: '#FF91C8', red: '#F04444' };

// Every DOM node the engine creates, so cleanup can remove them all.
const created = new Set();
const track = (el) => (created.add(el), el);
const drop = (el) => {
  el.remove();
  created.delete(el);
};

export function disposeConstruction() {
  created.forEach((el) => el.remove());
  created.clear();
}

export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

export function createArrow(host, color = 'white', size = 12) {
  const el = document.createElement('span');
  el.className = 'c-arrow';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="0 0 16 16" width="${size}" height="${size}"><path d="${ARROW_PATH}" fill="${COLORS[color] ?? color}"/></svg>`;
  host.appendChild(track(el));
  gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  return el;
}

/**
 * Moves an arrow along a polyline (host-relative points) and reports progress 0..1.
 * The arrow rotates smoothly to face each segment. `arrow` may be null (progress only).
 */
export function followPath(arrow, pts, { duration = 1, ease = 'power2.inOut', onProgress } = {}) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (!len) continue;
    segs.push({ x1, y1, x2, y2, len, start: total, ang: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI });
    total += len;
  }
  const state = { p: 0 };
  let current = -1;

  const place = (p) => {
    if (arrow && segs.length) {
      const d = p * total;
      let i = segs.findIndex((s) => d <= s.start + s.len);
      if (i < 0) i = segs.length - 1;
      const s = segs[i];
      const t = (d - s.start) / s.len;
      gsap.set(arrow, { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t });
      if (i !== current) {
        gsap.to(arrow, { rotation: `${s.ang}_short`, duration: current < 0 ? 0 : 0.18, overwrite: 'auto' });
        current = i;
      }
    }
    onProgress?.(p);
  };

  return gsap.to(state, {
    p: 1,
    duration,
    ease,
    onStart() {
      if (arrow) gsap.set(arrow, { autoAlpha: 1 });
      place(state.p);
    },
    onUpdate() {
      place(state.p);
    },
    onReverseComplete() {
      if (arrow) gsap.set(arrow, { autoAlpha: 0 });
      place(0);
    },
  });
}

/** An arrow travels along a `.edge` line and draws it behind itself. */
export function drawEdge(edge, { color = 'white', size = 10, duration = 1.1, reverse = false, arrow = true, ease = 'power2.inOut', persist = false } = {}) {
  const tl = gsap.timeline();
  const host = edge?.offsetParent;
  if (!host) return tl;

  const vertical = edge.dataset.axis === 'y';
  const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = edge;
  const prop = vertical ? 'scaleY' : 'scaleX';
  const origin = vertical ? (reverse ? 'center bottom' : 'center top') : reverse ? 'right center' : 'left center';
  const start = vertical ? [x + w / 2, y] : [x, y + h / 2];
  const end = vertical ? [x + w / 2, y + h] : [x + w, y + h / 2];
  const a = arrow ? createArrow(host, color, size) : null;

  tl.set(edge, { autoAlpha: 1, [prop]: 0, transformOrigin: origin });
  tl.add(followPath(a, reverse ? [end, start] : [start, end], { duration, ease, onProgress: (p) => gsap.set(edge, { [prop]: p }) }));
  if (a) {
    tl.to(a, { autoAlpha: 0, duration: 0.2 });
    if (!persist) tl.add(() => drop(a));
  }
  return tl;
}

function makeFrame(el, stroke, cls = '') {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const P = 2 * (w + h);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `frame-svg ${cls}`);
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(NS, 'rect');
  const attrs = { x: 0.5, y: 0.5, width: Math.max(w - 1, 0), height: Math.max(h - 1, 0), fill: 'none', stroke: COLORS[stroke] ?? stroke, 'stroke-width': 1, 'stroke-dasharray': P, 'stroke-dashoffset': P };
  Object.entries(attrs).forEach(([k, v]) => rect.setAttribute(k, v));
  svg.appendChild(rect);
  el.appendChild(track(svg));
  return { svg, rect, w, h, P };
}

/** An arrow travels clockwise around an element, drawing its border. */
export function traceRect(el, { stroke = 'red', arrow = 'white', size = 10, duration = 1.2, keep = true } = {}) {
  const tl = gsap.timeline();
  if (!el || !el.offsetParent) return tl;
  const { rect, w, h, P } = makeFrame(el, stroke);
  const a = createArrow(el, arrow, size);
  tl.add(followPath(a, [[0, 0], [w, 0], [w, h], [0, h], [0, 0]], { duration, onProgress: (p) => rect.setAttribute('stroke-dashoffset', P * (1 - p)) }));
  tl.to(a, { autoAlpha: 0, duration: 0.2 });
  tl.add(() => {
    drop(a);
    if (keep) {
      // Finished border becomes responsive.
      rect.removeAttribute('stroke-dasharray');
      rect.removeAttribute('stroke-dashoffset');
      rect.style.width = 'calc(100% - 1px)';
      rect.style.height = 'calc(100% - 1px)';
    }
  });
  return tl;
}

export function drawButtonBorder(btn) {
  const tl = gsap.timeline();
  const content = btn.querySelectorAll('[data-frame-content]');
  if (!btn.offsetParent) {
    gsap.set(content, { autoAlpha: 1 });
    return tl;
  }
  tl.add(traceRect(btn, { stroke: 'red', arrow: 'white', size: 9, duration: 0.9 }), 0);
  tl.fromTo(content, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.4);
  if (btn.hasAttribute('data-solid')) tl.to(btn, { '--fill': 1, duration: 0.6, ease: 'power3.inOut' }, 0.75);
  return tl;
}

export function constructProjectFrame(el) {
  const tl = gsap.timeline();
  tl.add(traceRect(el, { stroke: 'red', arrow: 'cyan', size: 12, duration: 1.4 }));
  const media = el.querySelector('[data-media]');
  if (media) tl.fromTo(media, { autoAlpha: 1, clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'power3.inOut' }, '-=0.35');
  tl.fromTo(el.querySelectorAll('[data-frame-content]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, '-=0.45');
  return tl;
}

export function constructBox(el) {
  const tl = gsap.timeline();
  tl.add(traceRect(el, { stroke: 'red', arrow: 'pink', size: 10, duration: 1.1 }));
  tl.fromTo(el.querySelectorAll('[data-frame-content]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, '-=0.5');
  return tl;
}

/** An arrow orbits a circle once, drawing it, then rests at the end of its path. */
export function drawRing(ring) {
  const tl = gsap.timeline();
  const circle = ring.querySelector('[data-ring-circle]');
  if (!circle) return tl;
  const C = 2 * Math.PI * Number(circle.getAttribute('r'));
  const size = ring.offsetWidth;
  const r = (size / 2) * (Number(circle.getAttribute('r')) / 50);
  const pts = Array.from({ length: 65 }, (_, i) => {
    const ang = ((-90 + (360 * i) / 64) * Math.PI) / 180;
    return [size / 2 + r * Math.cos(ang), size / 2 + r * Math.sin(ang)];
  });
  const a = createArrow(ring, 'red', 14);
  tl.set(circle, { autoAlpha: 1, strokeDasharray: C, strokeDashoffset: C });
  tl.add(followPath(a, pts, { duration: 1.8, ease: 'power2.inOut', onProgress: (p) => gsap.set(circle, { strokeDashoffset: C * (1 - p) }) }));
  return tl;
}

/**
 * An arrow flies in pulling `el` behind it and drops it into its resting spot,
 * as if the arrow were placing that piece of the page. `from` = start offset [dx, dy] in px.
 */
export function carryIn(host, el, { from = [-160, 0], color = 'white', size = 11, duration = 0.9, ease = 'power3.out' } = {}) {
  const tl = gsap.timeline();
  if (!host || !el?.offsetParent) {
    if (el) gsap.set(el, { autoAlpha: 1 });
    return tl;
  }
  const hr = host.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const [dx, dy] = from;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dx / len;
  const uy = -dy / len;
  // The arrow rides just ahead of the element's leading edge.
  const cx = r.left - hr.left - host.clientLeft + r.width / 2;
  const cy = r.top - hr.top - host.clientTop + r.height / 2;
  const reach = (Math.abs(ux) * r.width) / 2 + (Math.abs(uy) * r.height) / 2 + size * 0.6;
  const end = [cx + ux * reach, cy + uy * reach];
  const a = createArrow(host, color, size);

  tl.add(
    followPath(a, [[end[0] + dx, end[1] + dy], end], {
      duration,
      ease,
      onProgress: (p) => gsap.set(el, { autoAlpha: 1, x: dx * (1 - p), y: dy * (1 - p) }),
    }),
  );
  // Release: the arrow lets go, nudges forward and fades.
  tl.to(a, { x: `+=${ux * 18}`, y: `+=${uy * 18}`, autoAlpha: 0, duration: 0.35, ease: 'power2.out' });
  tl.add(() => drop(a));
  return tl;
}

/**
 * The image inside `media` is cut into tiles; each tile is carried into place by
 * its own arrow from outside the frame. Once assembled, the real image takes over.
 */
export function assembleImage(frame, media, { cols = 3, rows = 3, distance = 240, stagger = 0.1 } = {}) {
  const tl = gsap.timeline();
  const img = media?.querySelector('img');
  if (!img || !frame?.offsetParent) {
    if (media) gsap.set(media, { autoAlpha: 1 });
    return tl;
  }
  const { offsetLeft: ox, offsetTop: oy, offsetWidth: W, offsetHeight: H } = media;
  const tw = W / cols;
  const th = H / rows;
  const palette = ['cyan', 'pink', 'white', 'red'];
  const tiles = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = document.createElement('div');
      t.className = 'c-tile';
      t.setAttribute('aria-hidden', 'true');
      Object.assign(t.style, {
        left: `${ox + col * tw}px`,
        top: `${oy + row * th}px`,
        width: `${tw + 0.5}px`,
        height: `${th + 0.5}px`,
        backgroundImage: `url("${img.currentSrc || img.src}")`,
        backgroundSize: `${W}px ${H}px`,
        backgroundPosition: `${-col * tw}px ${-row * th}px`,
      });
      frame.appendChild(track(t));
      tiles.push(t);

      // Each tile arrives from outside the frame, heading toward its own spot.
      let vx = (col + 0.5) / cols - 0.5;
      let vy = (row + 0.5) / rows - 0.5;
      if (!vx && !vy) vy = -1;
      const n = Math.hypot(vx, vy);
      const i = tiles.length - 1;
      tl.add(
        carryIn(frame, t, { from: [(vx / n) * distance, (vy / n) * distance], color: palette[i % palette.length], size: 10, duration: 0.85 }),
        i * stagger,
      );
    }
  }

  tl.set(media, { autoAlpha: 1, clipPath: 'none' });
  tl.add(() => tiles.forEach(drop));
  return tl;
}

/**
 * Cursor proximity: when the pointer comes near an element marked [data-trace],
 * a small arrow traces its border. On leave the trace completes, then fades out.
 * Returns a cleanup function.
 */
export function activateOnCursor(root = document) {
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};

  const targets = [...root.querySelectorAll('[data-trace]')].map((el) => ({
    el,
    radius: Number(el.dataset.traceRadius || 56),
    state: 'idle',
    tl: null,
    svg: null,
  }));
  let x = -1e4;
  let y = -1e4;
  let raf = 0;

  const enter = (t) => {
    t.state = 'active';
    const { svg, rect, w, h, P } = makeFrame(t.el, 'cyan', 'frame-svg--hover');
    const a = createArrow(t.el, 'pink', 9);
    t.svg = svg;
    t.tl = gsap
      .timeline()
      .add(followPath(a, [[0, 0], [w, 0], [w, h], [0, h], [0, 0]], { duration: 0.9, ease: 'power1.inOut', onProgress: (p) => rect.setAttribute('stroke-dashoffset', P * (1 - p)) }))
      .to(a, { autoAlpha: 0, duration: 0.15 })
      .add(() => drop(a));
  };

  const leave = (t) => {
    t.state = 'leaving';
    const fade = () =>
      gsap.to(t.svg, {
        autoAlpha: 0,
        duration: 0.4,
        onComplete: () => {
          drop(t.svg);
          t.state = 'idle';
        },
      });
    if (t.tl.isActive()) t.tl.eventCallback('onComplete', fade);
    else fade();
  };

  const check = () => {
    raf = 0;
    for (const t of targets) {
      const r = t.el.getBoundingClientRect();
      if (!r.width || r.bottom < -100 || r.top > window.innerHeight + 100) continue;
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      const near = d < t.radius;
      if (near && t.state === 'idle') enter(t);
      else if (!near && t.state === 'active') leave(t);
    }
  };

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(check);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(raf);
  };
}
