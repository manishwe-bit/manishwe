import { useEffect, useRef } from 'react';

const GAP = 5; // pixels between particle centres
const DOT = 4; // particle size (the 1px gap gives an LED-matrix look)
const RADIUS = 95; // pointer repel radius
const SETTLED = 0.4;

/**
 * Overlays the portrait with a canvas of ~10k particles sampled from the photo.
 * Hovering dissolves the photo into an LED matrix that parts around the pointer;
 * a click sends a shockwave. When the pointer leaves, the particles spring home
 * and the canvas fades back to the original image.
 */
export default function ParticlePortrait({ src }) {
  const canvas = useRef(null);

  useEffect(() => {
    const c = canvas.current;
    const figure = c?.closest('[data-portrait]');
    if (!c || !figure || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let parts = null; // Float32Array: x, y, vx, vy, hx, hy per particle
    let colors = null; // Uint32Array (ABGR) per particle
    let W = 0;
    let H = 0;
    let img = null;
    let frame = null;
    let pointer = null;
    let shock = null;
    let raf = 0;
    let active = false;

    const image = new Image();
    image.src = src;

    // Sample the photo exactly as object-cover lays it out in the box.
    const build = () => {
      W = c.width = c.clientWidth;
      H = c.height = c.clientHeight;
      if (!W || !H || !image.naturalWidth) return false;
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const g = off.getContext('2d', { willReadFrequently: true });
      const s = Math.max(W / image.naturalWidth, H / image.naturalHeight);
      const dw = image.naturalWidth * s;
      const dh = image.naturalHeight * s;
      g.drawImage(image, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const data = g.getImageData(0, 0, W, H).data;

      const cols = Math.floor(W / GAP);
      const rows = Math.floor(H / GAP);
      parts = new Float32Array(cols * rows * 6);
      colors = new Uint32Array(cols * rows);
      let n = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * GAP;
          const py = y * GAP;
          const k = ((py + 1) * W + px + 1) * 4;
          colors[n] = (255 << 24) | (data[k + 2] << 16) | (data[k + 1] << 8) | data[k];
          parts.set([px, py, 0, 0, px, py], n * 6);
          n++;
        }
      }
      img = g.createImageData(W, H);
      frame = new Uint32Array(img.data.buffer);
      return true;
    };

    const step = () => {
      frame.fill(0xff120a08); // ink background (ABGR)
      let moving = 0;
      const count = colors.length;
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        let x = parts[o];
        let y = parts[o + 1];
        let vx = parts[o + 2];
        let vy = parts[o + 3];

        if (pointer) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / RADIUS) * 6;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }
        if (shock) {
          const dx = x - shock.x;
          const dy = y - shock.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(d - shock.r);
          if (band < 30) {
            const f = (1 - band / 30) * 9;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }

        vx += (parts[o + 4] - x) * 0.06;
        vy += (parts[o + 5] - y) * 0.06;
        vx *= 0.82;
        vy *= 0.82;
        x += vx;
        y += vy;
        parts[o] = x;
        parts[o + 1] = y;
        parts[o + 2] = vx;
        parts[o + 3] = vy;
        if (Math.abs(x - parts[o + 4]) + Math.abs(y - parts[o + 5]) > SETTLED) moving++;

        const ix = x | 0;
        const iy = y | 0;
        if (ix < 0 || iy < 0 || ix > W - DOT || iy > H - DOT) continue;
        const col = colors[i];
        for (let r = 0; r < DOT; r++) frame.fill(col, (iy + r) * W + ix, (iy + r) * W + ix + DOT);
      }
      c.getContext('2d').putImageData(img, 0, 0);

      if (shock) {
        shock.r += 14;
        if (shock.r > Math.hypot(W, H)) shock = null;
      }
      // Fade back to the real photo once everything is home and the pointer has left.
      if (!active && !moving && !shock) {
        c.style.opacity = '0';
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (!parts && !build()) return;
      c.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(step);
    };
    const local = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onEnter = () => {
      active = true;
      start();
    };
    const onMove = (e) => {
      pointer = local(e);
      onEnter(); // also retries if the image wasn't decoded yet on enter
    };
    const onLeave = () => {
      active = false;
      pointer = null;
    };
    const onDown = (e) => {
      shock = { ...local(e), r: 0 };
      start();
    };
    const onResize = () => (parts = null);

    figure.addEventListener('pointerenter', onEnter);
    figure.addEventListener('pointermove', onMove);
    figure.addEventListener('pointerleave', onLeave);
    figure.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      figure.removeEventListener('pointerenter', onEnter);
      figure.removeEventListener('pointermove', onMove);
      figure.removeEventListener('pointerleave', onLeave);
      figure.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [src]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-300"
    />
  );
}
