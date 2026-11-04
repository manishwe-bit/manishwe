import { useEffect, useRef } from 'react';
import { ARROW_PATH } from '../animations/constructionAnimation';
import { peerEvents, resolve, setLivePage, startLive, useLive } from '../live';

const IDLE_MS = 8000;

/**
 * Other visitors' cursors, live: Figma-style arrows with a name tag that glide
 * to where each person is pointing (on the same content, whatever their screen),
 * plus a ripple wherever someone clicks.
 */
export default function LiveCursors({ page }) {
  const { peers } = useLive();
  const nodes = useRef({}); // id -> element
  const state = useRef({}); // id -> { at, x, y, seen }
  const layer = useRef(null);

  useEffect(startLive, []);
  useEffect(() => setLivePage(page), [page]);

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    // The loop only runs while someone's cursor is moving or settling; a move wakes it up.
    const wake = () => raf || (raf = requestAnimationFrame(step));
    const onMove = ({ detail: m }) => {
      const s = (state.current[m.id] ??= { x: null, y: null });
      s.at = m;
      s.seen = performance.now();
      wake();
    };
    const onClick = ({ detail: m }) => {
      const p = resolve(m);
      const color = nodes.current[m.id]?.style.getPropertyValue('--c');
      if (!p || !color || !layer.current) return;
      const ring = document.createElement('span');
      ring.className = 'live-ripple';
      ring.style.cssText = `left:${p.x}px;top:${p.y}px;--c:${color}`;
      layer.current.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    };
    const onLeave = ({ detail: m }) => delete state.current[m.id];

    const step = () => {
      const now = performance.now();
      let active = false;
      for (const [id, el] of Object.entries(nodes.current)) {
        const s = state.current[id];
        const target = s?.at && resolve(s.at);
        if (!el || !target || now - s.seen > IDLE_MS) {
          if (el) el.style.opacity = '0';
          continue;
        }
        active = true; // keep tracking: the page may scroll under a still cursor
        if (s.x === null || still) Object.assign(s, target);
        s.x += (target.x - s.x) * 0.25;
        s.y += (target.y - s.y) * 0.25;
        el.style.opacity = '1';
        el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
      raf = active ? requestAnimationFrame(step) : 0;
    };

    peerEvents.addEventListener('mv', onMove);
    peerEvents.addEventListener('ck', onClick);
    peerEvents.addEventListener('leave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      peerEvents.removeEventListener('mv', onMove);
      peerEvents.removeEventListener('ck', onClick);
      peerEvents.removeEventListener('leave', onLeave);
    };
  }, []);

  // A peer who moved to another page keeps a stale position: forget it.
  useEffect(() => {
    for (const p of Object.values(peers)) if (p.page !== page) delete state.current[p.id];
  }, [peers, page]);

  const here = Object.values(peers).filter((p) => p.page === page);

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[54] overflow-hidden">
      {here.map((p) => (
        <div
          key={p.id}
          ref={(el) => (el ? (nodes.current[p.id] = el) : delete nodes.current[p.id])}
          className="live-cursor"
          style={{ '--c': p.color }}
        >
          <svg viewBox="-1 -1 15 21" width="14" height="19" overflow="visible">
            <path d={ARROW_PATH} fill={p.color} stroke="#080A12" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span>
            {p.name}
            {p.place && <em> · {p.place}</em>}
          </span>
        </div>
      ))}
    </div>
  );
}
