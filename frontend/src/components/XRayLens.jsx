import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ScanLine } from 'lucide-react';
import { isTyping } from '../blueprintMode';

// Toggle from anywhere: press X, or dispatch this event (command menu, hint chip).
export const toggleXray = () => window.dispatchEvent(new Event('xray:toggle'));

// The real source of every component, bundled as text.
const SOURCES = import.meta.glob(['./*.jsx', './home/*.jsx'], { query: '?raw', import: 'default', eager: true });
const src = (name) => SOURCES[`./${name}`] ?? '';

// Which files actually render each page.
const PAGE_FILES = {
  home: ['Hero.jsx', 'home/HomeSections.jsx', 'home/Terminal.jsx'],
  about: ['About.jsx', 'NextPage.jsx'],
  services: ['Services.jsx', 'NextPage.jsx'],
  projects: ['Projects.jsx', 'NextPage.jsx'],
  skills: ['Skills.jsx', 'NextPage.jsx'],
  contact: ['Contact.jsx', 'ContactForm.jsx', 'SocialLinks.jsx'],
};

const LENS = 130;
const KEYWORDS = /^(import|from|export|default|function|return|const|let|if|else|for|of|new|await|async|null|undefined|true|false)$/;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Tiny syntax highlighter: comments, strings, JSX tags, keywords, numbers. */
function highlight(code) {
  return code.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*)|\b([A-Za-z_$][\w$]*)\b|\b(\d+(?:\.\d+)?)\b|([&<>])/g,
    (m, comment, str, tag, word, num, ch) => {
      if (comment) return `<i class="x-c">${esc(comment)}</i>`;
      if (str) return `<i class="x-s">${esc(str)}</i>`;
      if (tag) return `<i class="x-t">${esc(tag)}</i>`;
      if (word) return KEYWORDS.test(word) ? `<i class="x-k">${word}</i>` : word;
      if (num) return `<i class="x-n">${num}</i>`;
      return esc(ch);
    },
  );
}

/**
 * X-ray mode: the pointer becomes a scanner lens that shows the React source
 * behind the page, scrolling with it, with a HUD ring and live readout.
 */
export default function XRayLens({ page }) {
  const [on, setOn] = useState(false);
  const layer = useRef(null);
  const code = useRef(null);
  const ring = useRef(null);
  const readout = useRef(null);

  const files = PAGE_FILES[page] ?? PAGE_FILES.home;
  const html = useMemo(
    () => files.map((f) => `<i class="x-c">// ── src/components/${f} ─────────────</i>\n${highlight(src(f))}`).join('\n\n'),
    [files],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'x' || e.key === 'X') setOn((o) => !o);
      if (e.key === 'Escape') setOn(false);
    };
    const onToggle = () => setOn((o) => !o);
    window.addEventListener('keydown', onKey);
    window.addEventListener('xray:toggle', onToggle);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('xray:toggle', onToggle);
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let r = still ? LENS : 0;
    let raf = 0;
    let t = 0;

    const onMove = (e) => {
      const p = e.touches?.[0] ?? e;
      target.x = p.clientX;
      target.y = p.clientY;
    };

    const step = () => {
      t += 1;
      // Ease toward the pointer for a weighty, physical feel; grow open on start.
      const k = still ? 1 : 0.18;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      r += (LENS - r) * 0.12;
      const pulse = still ? 0 : Math.sin(t / 14) * 3;
      const rr = r + pulse;

      layer.current.style.clipPath = `circle(${rr}px at ${pos.x}px ${pos.y}px)`;
      // The code scrolls with the page, a little slower, like a layer underneath it.
      const max = Math.max(code.current.scrollHeight - window.innerHeight, 0);
      const docMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      code.current.style.transform = `translateY(${-(window.scrollY / docMax) * max}px)`;
      ring.current.style.transform = `translate(${pos.x - rr}px, ${pos.y - rr}px)`;
      ring.current.style.width = ring.current.style.height = `${rr * 2}px`;

      if (t % 6 === 0) {
        const el = document.elementsFromPoint(pos.x, pos.y).find((n) => !n.closest('[data-xray]'));
        const tag = el ? `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}>` : '—';
        readout.current.textContent = `${tag}  x:${Math.round(pos.x)} y:${Math.round(pos.y + window.scrollY)}`;
      }
      raf = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, [on]);

  return (
    <>
      {on && (
        <div data-xray aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
          <div ref={layer} className="xray-layer absolute inset-0 overflow-hidden" style={{ clipPath: 'circle(0 at 50% 50%)' }}>
            <pre
              ref={code}
              className="xray-code px-5 pt-24 md:px-12"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          <div ref={ring} className="xray-ring absolute top-0 left-0 rounded-full">
            <span ref={readout} className="xray-readout" />
          </div>
          <p className="absolute top-22 left-1/2 -translate-x-1/2 border border-arrow-cyan/40 bg-ink/80 px-3 py-1.5 text-[10px] font-semibold tracking-[0.3em] text-arrow-cyan uppercase backdrop-blur">
            X-ray · the code behind this page · <kbd>X</kbd> / Esc to exit
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={toggleXray}
        aria-pressed={on}
        title="X-ray mode (X)"
        className={clsx(
          'fixed bottom-5 left-5 z-[61] flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold tracking-[0.25em] uppercase backdrop-blur transition-colors',
          on ? 'border-arrow-cyan bg-arrow-cyan/15 text-arrow-cyan' : 'border-white/15 bg-ink/70 text-mute hover:border-arrow-cyan hover:text-white',
        )}
      >
        <ScanLine className={clsx('size-4', !on && 'xray-blink')} />
        X-ray <kbd className="hidden border border-current/40 px-1 md:inline">X</kbd>
      </button>
    </>
  );
}
