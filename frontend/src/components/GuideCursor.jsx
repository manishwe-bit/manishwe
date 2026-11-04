import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ARROW_PATH } from '../animations/constructionAnimation';
import { openPalette } from './CommandPalette';

// Per page: where the guide flies to, what it says, and when (after the page has built itself).
const TIPS = {
  home: { target: '[data-hero] h1', text: 'Hi! I built this page live. Press X to see its code, or B for its blueprint.', delay: 5600 },
  about: { target: '#about [data-box]', text: 'That’s me. Press Ctrl + K to jump anywhere.', delay: 2200 },
  services: { target: '#services ul', text: 'Pick a service and click it to start a project.', delay: 2200 },
  projects: { target: '#projects article', text: 'Live work. Click “View project” to open it.', delay: 2400 },
  skills: { target: '#skills h3', text: 'My current stack, and always learning more.', delay: 2200 },
  contact: { target: '#contact form', text: 'Write to me here. I read every message.', delay: 2600 },
};
const SHOW_MS = 5200;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A Figma-style "multiplayer" cursor labelled with the owner's name. On each page it
 * flies to a key element, leaves a short tip, then parks in the corner (click = command menu).
 */
export default function GuideCursor({ page, name = 'Manish' }) {
  const [pos, setPos] = useState(null);
  const [tip, setTip] = useState('');
  const timers = useRef([]);

  useEffect(() => {
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    const park = () => setPos({ x: window.innerWidth - 120, y: window.innerHeight - 130 }); // above the MK-01 button
    const cfg = TIPS[page];
    let pointing = false;
    // The guide is fixed to the viewport, so once the page scrolls it would point at the
    // wrong thing: drop the tip and park.
    const onScroll = () => {
      if (!pointing) return;
      pointing = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setTip('');
      park();
    };

    setTip('');
    if (!pos) setPos({ x: window.innerWidth + 60, y: window.innerHeight * 0.55 }); // first entrance from off-screen

    if (cfg) {
      later(() => {
        const el = document.querySelector(cfg.target);
        const r = el?.getBoundingClientRect();
        if (!r || r.top > window.innerHeight || r.bottom < 0) return park();
        setPos({ x: Math.min(r.left + Math.min(r.width * 0.55, 320), window.innerWidth - 40), y: Math.min(r.bottom - 8, window.innerHeight - 120) });
        pointing = true;
        later(() => setTip(cfg.text), reducedMotion() ? 0 : 1100);
        later(() => {
          pointing = false;
          setTip('');
          park();
        }, SHOW_MS + 1100);
      }, reducedMotion() ? 300 : cfg.delay);
    }

    window.addEventListener('resize', park);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      window.removeEventListener('resize', park);
      window.removeEventListener('scroll', onScroll);
    };
  }, [page]);

  if (!pos) return null;
  const flip = pos.x > window.innerWidth - 300; // keep the tip bubble on screen

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label={`${name}'s cursor: open command menu`}
      className="fixed top-0 left-0 z-55 hidden text-left md:block motion-safe:transition-transform motion-safe:duration-1100 motion-safe:ease-[cubic-bezier(0.65,0,0.35,1)]"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <svg viewBox="-1 -1 15 21" width="16" height="22" overflow="visible" aria-hidden="true" className="drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
        <path d={ARROW_PATH} fill="#FF91C8" stroke="#080A12" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className="absolute top-5 left-3 rounded-sm bg-arrow-pink px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-ink">
        {name}
      </span>
      <span
        role="status"
        className={clsx(
          'absolute top-12 w-64 border border-arrow-pink/40 bg-ink-2/95 px-4 py-3 text-sm leading-snug text-white/85 shadow-xl transition-[opacity,transform] duration-300',
          flip ? 'right-0' : 'left-3',
          tip ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        {tip}
      </span>
    </button>
  );
}
