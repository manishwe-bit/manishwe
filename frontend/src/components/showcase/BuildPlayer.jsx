import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CircleCheck, Lock, Maximize, Minimize, Pause, Play, RotateCcw, X } from 'lucide-react';
import { ARROW_PATH } from '../../animations/constructionAnimation';
import { highlight } from '../../lib/highlight';
import { pageHref } from '../../router';
import { buildScript, frameAt } from '../../showcase/script';
import { MiniSite, SITE_WIDTH } from './MiniSite';
import { setContactPrefill } from '../ContactForm';

const SPEEDS = [1, 2, 4];
const FILES = ['terminal', 'App.jsx', 'styles.css', 'animations.js'];
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Browser frame that scales the mini site to fit and scrolls to the part being built. */
function Preview({ demo, frame }) {
  const view = useRef(null);
  const site = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [scroll, setScroll] = useState(0);
  const [cursor, setCursor] = useState({ x: SITE_WIDTH * 0.6, y: 40 });

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / SITE_WIDTH));
    ro.observe(view.current);
    return () => ro.disconnect();
  }, []);

  const target = frame.step.section;
  useLayoutEffect(() => {
    const el = site.current?.querySelector(`[data-ms="${target}"]`);
    const visible = view.current.clientHeight / scale;
    const total = site.current?.scrollHeight ?? 0;
    if (!el) return setScroll(Math.max(total - visible, 0)); // building the next section at the bottom
    setScroll(Math.min(Math.max(el.offsetTop - 30, 0), Math.max(total - visible, 0)));
    setCursor({ x: SITE_WIDTH * (0.35 + ((frame.index * 37) % 40) / 100), y: el.offsetTop + Math.min(el.offsetHeight * 0.45, 160) });
  }, [target, frame.index, scale, JSON.stringify(frame.stages)]);

  return (
    <div className="flex h-full flex-col overflow-hidden border border-white/10 bg-[#1b1d2a]">
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-[#ff5f57]" />
          <i className="size-2.5 rounded-full bg-[#febc2e]" />
          <i className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <p className={clsx('flex min-w-0 flex-1 items-center gap-2 truncate rounded-full bg-black/30 px-3 py-1 font-mono text-[11px] transition-colors duration-500', frame.deployed ? 'text-[#9ef0a4]' : 'text-white/50')}>
          {frame.deployed && <Lock className="size-3 shrink-0" />}
          {frame.deployed ? `https://${demo.domain}` : 'localhost:5173'}
        </p>
      </div>
      <div ref={view} className="bp-canvas relative flex-1 overflow-hidden">
        <div className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]" style={{ transform: `scale(${scale}) translateY(${-scroll}px)` }}>
          <MiniSite ref={site} demo={demo} stages={frame.stages} live={frame.live} />
          <svg
            viewBox="-1 -1 15 21"
            width="30"
            height="42"
            overflow="visible"
            aria-hidden="true"
            className="absolute top-0 left-0 drop-shadow-[0_3px_8px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <path d={ARROW_PATH} fill="#FF91C8" stroke="#080A12" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        {frame.deployed && (
          <p className="bp-toast absolute top-3 right-3 flex items-center gap-2 bg-[#0f2a1f] px-3 py-2 text-[11px] font-semibold text-[#9ef0a4] shadow-lg">
            <CircleCheck className="size-4" /> Deployed · site is live
          </p>
        )}
      </div>
    </div>
  );
}

function Editor({ frame }) {
  const pre = useRef(null);
  const html = useMemo(() => highlight(frame.text), [frame.text]);
  useEffect(() => {
    pre.current?.scrollTo({ top: pre.current.scrollHeight });
  }, [html]);
  return (
    <div className="flex h-full min-h-0 flex-col border border-white/10 bg-[#0a0c16]">
      <div className="flex overflow-x-auto border-b border-white/10 text-[11px]">
        {FILES.map((f) => (
          <span key={f} className={clsx('shrink-0 border-r border-white/10 px-3 py-2 font-mono', f === frame.step.file ? 'bg-white/[0.06] text-white' : 'text-white/35')}>
            {f === 'terminal' ? '>_ terminal' : f}
          </span>
        ))}
      </div>
      <pre ref={pre} className="xray-code min-h-0 flex-1 overflow-y-auto p-4 text-[11.5px]!">
        <code dangerouslySetInnerHTML={{ __html: html }} />
        {frame.typing && <span className="ai-caret" />}
      </pre>
    </div>
  );
}

/**
 * A "video" of a website being built, rendered live: code types itself on the
 * left while the site assembles on the right. Scrub, pause, change speed, or go
 * fullscreen. Demos with a `video` file play that recording instead.
 */
export default function BuildPlayer({ demo, onClose }) {
  const script = useMemo(() => buildScript(demo), [demo]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [full, setFull] = useState(false);
  const root = useRef(null);
  const done = t >= script.total;
  const custom = demo.id === 'custom'; // designed by the AI generator

  useEffect(() => {
    if (!playing || done || demo.video) return;
    let last = performance.now();
    let raf = 0;
    const step = (now) => {
      setT((v) => Math.min(v + ((now - last) / 1000) * speed, script.total));
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, done, script.total, demo.video]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
      // Buttons and the seek slider handle Space/arrows themselves; don't do it twice.
      if (demo.video || e.target.closest?.('button, input, a')) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggleRef.current();
      }
      if (e.key === 'ArrowRight') setT((v) => Math.min(v + 5, script.total));
      if (e.key === 'ArrowLeft') setT((v) => Math.max(v - 5, 0));
    };
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [onClose, script.total, demo.video]);

  const frame = frameAt(script, t);
  const toggle = () => {
    if (done) setT(0);
    setPlaying((p) => (done ? true : !p));
  };
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-2 md:p-6" onMouseDown={onClose}>
      <div
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={`${demo.title}: build replay`}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full max-h-[52rem] w-full max-w-7xl flex-col border border-white/15 bg-ink-2 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-brand uppercase">{demo.kind}</p>
            <h2 className="truncate font-display text-2xl uppercase md:text-3xl">{demo.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close player" className="grid size-10 shrink-0 place-items-center border border-white/10 hover:border-brand">
            <X className="size-5" />
          </button>
        </header>

        {demo.video ? (
          <video src={demo.video} controls autoPlay playsInline className="min-h-0 w-full flex-1 bg-black object-contain" />
        ) : (
          <>
            <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:p-4">
              <div className="hidden min-h-0 md:block">
                <Editor frame={frame} />
              </div>
              <div className="relative min-h-0">
                <Preview demo={demo} frame={frame} />
                {done && (
                  <div className="bp-end absolute inset-0 grid place-items-center bg-ink/90 p-6 text-center">
                    <div>
                      <CircleCheck className="mx-auto size-12 text-[#9ef0a4]" strokeWidth={1.5} />
                      <p className="mt-4 font-display text-4xl uppercase md:text-5xl">Live in {Math.round(script.total)} seconds</p>
                      <p className="mx-auto mt-3 max-w-sm text-white/70">
                        {custom ? 'Designed by AI for your business. Manish can build the real, working version.' : 'From empty folder to a deployed website. Want one like this for your business?'}
                      </p>
                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <a
                          href={pageHref('contact')}
                          onClick={() => {
                            setContactPrefill(
                              custom
                                ? {
                                    need: 'New website',
                                    message: `Hi Manish, the AI designed "${demo.title}" (${demo.kind}) for me on your site and I'd like it built for real.\n\nAbout my business: `,
                                  }
                                : {
                                    need: 'Website like a Showcase example',
                                    message: `Hi Manish, I'd like a website like "${demo.title}" (${demo.kind.toLowerCase()}) for my business.\n\nAbout my business: `,
                                  },
                            );
                            onClose();
                          }}
                          className="bg-brand px-6 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-brand-dark"
                        >
                          {custom ? 'Build this for real' : 'Get a website like this'}
                        </a>
                        <button type="button" onClick={toggle} className="flex items-center gap-2 border border-white/20 px-6 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase hover:border-white">
                          <RotateCcw className="size-4" /> Replay
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="px-4 text-xs text-mute md:px-6">
              <span className="text-arrow-cyan">
                Step {frame.index + 1}/{script.steps.length}
              </span>{' '}
              · {frame.step.label}
            </p>

            <div className="flex items-center gap-3 px-4 pt-2 pb-4 md:gap-4 md:px-6">
              <button type="button" onClick={toggle} aria-label={playing && !done ? 'Pause' : 'Play'} className="grid size-10 shrink-0 place-items-center bg-brand hover:bg-brand-dark">
                {done ? <RotateCcw className="size-4" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>

              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white/10">
                  <div className="h-full bg-brand" style={{ width: `${(t / script.total) * 100}%` }} />
                  {script.steps.map((s) => (
                    <i key={s.start} className="absolute top-0 h-full w-px bg-ink-2" style={{ left: `${(s.start / script.total) * 100}%` }} />
                  ))}
                </div>
                <input
                  type="range"
                  min="0"
                  max={script.total}
                  step="0.01"
                  value={t}
                  onChange={(e) => setT(Number(e.target.value))}
                  aria-label="Seek"
                  className="bp-range relative w-full"
                />
              </div>

              <span className="shrink-0 font-mono text-[11px] text-mute tabular-nums">
                {clock(t)} / {clock(script.total)}
              </span>
              <button
                type="button"
                onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
                className="w-10 shrink-0 border border-white/15 py-1.5 font-mono text-[11px] hover:border-white"
                aria-label="Playback speed"
              >
                {speed}×
              </button>
              <button type="button" onClick={fullscreen} aria-label="Fullscreen" className="hidden size-9 shrink-0 place-items-center border border-white/15 hover:border-white sm:grid">
                {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
