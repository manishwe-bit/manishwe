import { arrowSvg } from './constructionAnimation';

const SWARM_COLORS = ['cyan', 'pink', 'white', 'red', 'cyan', 'pink'];

/**
 * A flock of small cursors flying around a section. They swirl around the
 * pointer while it is in the section (but give way over [data-swarm-avoid]
 * areas such as the form), and drift on their own otherwise.
 * Runs only while the section is on screen. Returns a cleanup function.
 */
export function startSwarm(section, { count = 32 } = {}) {
  const layer = document.createElement('div');
  layer.className = 'c-swarm';
  layer.setAttribute('aria-hidden', 'true');
  section.prepend(layer);

  let W = section.clientWidth;
  let H = section.clientHeight;
  const boids = Array.from({ length: count }, (_, i) => {
    const el = document.createElement('span');
    const size = 8 + Math.random() * 6;
    el.innerHTML = arrowSvg(SWARM_COLORS[i % SWARM_COLORS.length], size);
    el.style.opacity = String(0.55 + Math.random() * 0.45);
    layer.appendChild(el);
    return {
      el,
      // Enter from beyond the right edge.
      x: W + 40 + Math.random() * 200,
      y: H * (0.2 + Math.random() * 0.6),
      vx: -4 - Math.random() * 3,
      vy: (Math.random() - 0.5) * 3,
      orbit: 30 + Math.random() * 90,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.8),
    };
  });

  let pointer = null; // section-relative, or null when outside / over an avoid area
  let raf = 0;
  let visible = false;
  let t = 0;

  const onMove = (e) => {
    const r = section.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    pointer = inside && !e.target.closest?.('[data-swarm-avoid]') ? { x: e.clientX - r.left, y: e.clientY - r.top } : null;
  };
  const onLeave = () => (pointer = null);
  const onResize = () => {
    W = section.clientWidth;
    H = section.clientHeight;
  };

  const step = () => {
    t += 1 / 60;
    // Free-flight centre: a slow figure-eight over the right half of the section.
    const home = { x: W * (0.72 + 0.18 * Math.sin(t * 0.5)), y: H * (0.45 + 0.25 * Math.sin(t * 0.9)) };
    const centre = pointer ?? home;

    for (const b of boids) {
      const ang = b.phase + t * b.spin;
      const tx = centre.x + Math.cos(ang) * b.orbit;
      const ty = centre.y + Math.sin(ang) * b.orbit * 0.7;
      let ax = (tx - b.x) * 0.012;
      let ay = (ty - b.y) * 0.012;
      // Separation: keep a little space from neighbours.
      for (const o of boids) {
        if (o === b) continue;
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < 400) {
          ax += (dx / d2) * 6;
          ay += (dy / d2) * 6;
        }
      }
      b.vx = (b.vx + ax) * 0.94;
      b.vy = (b.vy + ay) * 0.94;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 7) {
        b.vx *= 7 / sp;
        b.vy *= 7 / sp;
      }
      b.x += b.vx;
      b.y += b.vy;
      // Tip on (x, y), pointing along the velocity.
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) translate(-94%, -50%) rotate(${Math.atan2(b.vy, b.vx)}rad)`;
    }
    raf = visible ? requestAnimationFrame(step) : 0;
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(step);
  });
  io.observe(section);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onResize);
    layer.remove();
  };
}
