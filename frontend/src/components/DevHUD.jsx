import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API_URL } from '../config';
import { isTyping } from '../blueprintMode';
import { setMode, toggleMode, useMode } from '../modes';
import { useLive } from '../live';

export const toggleHud = () => toggleMode('hud');

const SAMPLES = 90;
const kb = (bytes) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(2)} MB` : `${Math.round(bytes / 1e3)} KB`);
const ms = (v) => (v == null ? '…' : `${Math.round(v)} ms`);

// Core Web Vitals are buffered by the browser, so start observing once at load and keep the latest values.
const vitals = { lcp: null, cls: 0, longTasks: 0 };
try {
  new PerformanceObserver((l) => (vitals.lcp = l.getEntries().at(-1)?.startTime ?? vitals.lcp)).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (vitals.cls += e.value))).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => (vitals.longTasks += l.getEntries().length)).observe({ type: 'longtask', buffered: true });
} catch {
  // Not supported (Safari/Firefox for some types): those rows show "n/a".
}

function grade(value, good, poor) {
  if (value == null) return 'text-mute';
  return value <= good ? 'text-[#9ef0a4]' : value <= poor ? 'text-[#f8b26a]' : 'text-brand';
}

/** Frames-per-second sparkline, drawn straight to a canvas every frame. */
function useFps(canvas, on) {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!on) return;
    const history = [];
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let raf = 0;
    const step = (now) => {
      const dt = now - last;
      last = now;
      history.push(Math.min(1000 / dt, 120));
      if (history.length > SAMPLES) history.shift();
      acc += dt;
      frames += 1;
      if (acc > 500) {
        setFps(Math.round((frames * 1000) / acc));
        acc = frames = 0;
      }
      const c = canvas.current;
      if (c) {
        const g = c.getContext('2d');
        const { width: w, height: h } = c;
        g.clearRect(0, 0, w, h);
        g.strokeStyle = 'rgb(255 255 255 / 0.08)';
        g.beginPath();
        g.moveTo(0, h - (60 / 120) * h);
        g.lineTo(w, h - (60 / 120) * h);
        g.stroke();
        g.strokeStyle = '#65e8ff';
        g.lineWidth = 1.5;
        g.beginPath();
        history.forEach((v, i) => {
          const x = (i / (SAMPLES - 1)) * w;
          const y = h - (v / 120) * h;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.stroke();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, canvas]);
  return fps;
}

/** Round-trip time to the FastAPI backend, every 10 s. */
function usePing(on) {
  const [ping, setPing] = useState({ ms: null, db: '' });
  useEffect(() => {
    if (!on) return;
    let alive = true;
    const run = async () => {
      const t0 = performance.now();
      try {
        const r = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
        const j = await r.json();
        if (alive) setPing({ ms: performance.now() - t0, db: j.db ?? '' });
      } catch {
        if (alive) setPing({ ms: null, db: 'offline' });
      }
    };
    run();
    const id = setInterval(run, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [on]);
  return ping;
}

/**
 * Developer HUD (press D): live FPS graph, Core Web Vitals, bundle weight,
 * DOM size, memory, backend latency and how many people are on the site.
 */
export default function DevHUD({ page }) {
  const on = useMode('hud');
  const canvas = useRef(null);
  const fps = useFps(canvas, on);
  const ping = usePing(on);
  const live = useLive();
  const [, tick] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'd' || e.key === 'D') toggleHud();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Re-read the slower metrics once a second.
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [on]);

  if (!on) return null;

  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  const weight = resources.reduce((sum, r) => sum + (r.transferSize || 0), nav?.transferSize || 0);
  const heap = performance.memory?.usedJSHeapSize;

  const rows = [
    ['Frame time', fps ? `${(1000 / fps).toFixed(1)} ms` : '…', grade(fps && 1000 / fps, 17, 34)],
    ['Page load', ms(nav && nav.loadEventEnd - nav.startTime), grade(nav?.loadEventEnd, 2500, 4000)],
    ['LCP', ms(vitals.lcp), grade(vitals.lcp, 2500, 4000)],
    ['CLS', vitals.cls.toFixed(3), grade(vitals.cls, 0.1, 0.25)],
    ['Long tasks', String(vitals.longTasks), grade(vitals.longTasks, 3, 10)],
    ['Transferred', `${kb(weight)} · ${resources.length + 1} req`, 'text-white'],
    ['DOM nodes', document.getElementsByTagName('*').length.toLocaleString(), 'text-white'],
    ['JS heap', heap ? kb(heap) : 'n/a', 'text-white'],
    ['API ping', ping.ms == null ? ping.db || '…' : `${Math.round(ping.ms)} ms · ${ping.db}`, grade(ping.ms, 300, 1000)],
    ['Live now', live.status === 'live' ? `${live.count} visitor${live.count === 1 ? '' : 's'}` : live.status, 'text-arrow-pink'],
    ['Viewport', `${innerWidth}×${innerHeight} @${devicePixelRatio}x`, 'text-white'],
    ['Route', `#/${page === 'home' ? '' : page}`, 'text-white'],
  ];

  return (
    <aside
      aria-label="Developer HUD"
      className="hud fixed top-22 right-3 z-[62] w-[min(19rem,calc(100vw-1.5rem))] border border-arrow-cyan/30 bg-ink/95 p-4 font-mono text-[11px] text-white/80 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)] md:right-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <p className="tracking-[0.25em] text-arrow-cyan uppercase">
          <span className="hud-dot" /> Dev HUD
        </p>
        <button type="button" onClick={() => setMode('hud', false)} aria-label="Close HUD" className="text-mute hover:text-white">
          <X className="size-4" />
        </button>
      </header>

      <div className="flex items-end justify-between">
        <p className={`font-display text-4xl leading-none ${grade(fps && -fps, -55, -30)}`}>
          {fps || '…'}
          <span className="ml-1 font-mono text-[10px] text-mute">FPS</span>
        </p>
        <canvas ref={canvas} width="170" height="40" className="h-10 w-[170px]" />
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-white/10 pt-3">
        {rows.map(([k, v, cls]) => (
          <div key={k} className="contents">
            <dt className="text-mute">{k}</dt>
            <dd className={`truncate text-right tabular-nums ${cls}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/35">React 19 · Vite · GSAP · FastAPI · press D to hide</p>
    </aside>
  );
}
