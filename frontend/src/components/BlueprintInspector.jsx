import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { isTyping, setBlueprint, toggleBlueprint, useBlueprint } from '../blueprintMode';

function describe(el) {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  return `${tag}${id}`;
}

/**
 * Blueprint mode overlay: dashed wireframe on every element (CSS) plus a
 * design-tool style selection box with tag and size on whatever is hovered.
 * Press B (or the nav button) to toggle.
 */
export default function BlueprintInspector() {
  const on = useBlueprint();
  const [box, setBox] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e)) return;
      if (e.key === 'b' || e.key === 'B') toggleBlueprint();
      if (e.key === 'Escape') setBlueprint(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!on) return undefined;
    const onMove = (e) => {
      const el = e.target.closest?.('main *, header *');
      if (!el || el.closest('[data-inspector]')) return setBox(null);
      const r = el.getBoundingClientRect();
      setBox({ x: r.left, y: r.top, w: r.width, h: r.height, name: describe(el) });
    };
    const clear = () => setBox(null);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', clear, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', clear);
      setBox(null);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div data-inspector className="pointer-events-none fixed inset-0 z-[60]">
      {box && (
        <div
          aria-hidden="true"
          className="absolute border border-[#3b82f6] bg-[#3b82f6]/10"
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        >
          {[['0', '0'], ['100%', '0'], ['100%', '100%'], ['0', '100%']].map(([l, t]) => (
            <i key={l + t} className="c-bp-handle" style={{ left: l, top: t }} />
          ))}
          <span className="absolute -top-6 left-0 rounded-sm bg-[#3b82f6] px-1.5 py-1 font-sans text-[10px] leading-none font-semibold whitespace-nowrap text-white">
            {box.name} · {Math.round(box.w)} × {Math.round(box.h)}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => setBlueprint(false)}
        className="pointer-events-auto fixed bottom-20 left-1/2 md:bottom-5 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#3b82f6]/60 bg-ink/95 px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-[#93c5fd] uppercase"
      >
        Blueprint mode
        <span className="text-white/40">·</span>
        <span className="text-white/70">B to exit</span>
        <X className="size-3.5" />
      </button>
    </div>
  );
}
