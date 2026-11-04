import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Sparkles } from 'lucide-react';
import { DEMOS } from '../showcase/demos';
import { buildScript } from '../showcase/script';
import { pageHref } from '../router';
import { useT } from '../i18n';
import { Section, SectionHeading } from './ui/Section';
import Button from './ui/Button';
import { ScaledSite } from './showcase/MiniSite';
import BuildPlayer from './showcase/BuildPlayer';
import AIDesigner from './showcase/AIDesigner';
import { takePendingDemo } from './robot/actions';

const PROCESS = ['plan', 'wire', 'design', 'animate', 'launch'];
const CUSTOM = 'ai-custom-demo';

function DemoCard({ demo, index, onPlay, custom }) {
  const t = useT();
  const seconds = Math.round(buildScript(demo).total);
  return (
    <article
      data-reveal={custom ? undefined : ''}
      data-delay={index * 0.06}
      className={`group border p-3 transition-colors hover:border-white/25 ${custom ? 'border-arrow-cyan/40 bg-arrow-cyan/[0.04]' : 'border-white/10 bg-ink-2/40'}`}
    >
      <button type="button" onClick={onPlay} className="relative block w-full text-left" aria-label={`Play: watch ${demo.title} get built`}>
        <ScaledSite demo={demo} className="aspect-[16/10] bg-white/5" />
        <span className="absolute inset-0 bg-ink/30 transition-colors duration-500 group-hover:bg-ink/10" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="sc-play grid size-16 place-items-center rounded-full bg-brand text-white shadow-[0_10px_40px_rgb(240_68_68/0.5)] transition-transform duration-500 group-hover:scale-110">
            <Play className="ml-1 size-6" fill="currentColor" />
          </span>
        </span>
        <span className="absolute right-3 bottom-3 bg-ink/85 px-2 py-1 font-mono text-[11px] text-white">0:{String(seconds).padStart(2, '0')}</span>
        <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-ink/85 px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-arrow-cyan uppercase">
          {custom && <Sparkles className="size-3" />}
          {custom ? t('showcase.yours') : demo.video ? t('showcase.video') : t('showcase.replay')}
        </span>
      </button>
      <div className="p-3 pt-5">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-brand uppercase">{demo.kind}</p>
        <h3 className="mt-2 font-display text-3xl uppercase">{demo.title}</h3>
        <p className="mt-2 leading-relaxed text-mute">{demo.blurb}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {demo.tags.map((tag) => (
            <li key={tag} className="border border-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

const loadCustom = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CUSTOM));
  } catch {
    return null;
  }
};

/**
 * Showcase: the AI Website Generator, then ready-made example websites,
 * each with a replay of it being built from scratch.
 */
export default function Showcase() {
  const t = useT();
  const [playing, setPlaying] = useState(null);
  const [custom, setCustom] = useState(loadCustom);
  const close = useCallback(() => setPlaying(null), []);

  // MK-01 can start a demo: either before this page mounted (pending) or while it's open (event).
  useEffect(() => {
    const play = (id) => {
      const demo = DEMOS.find((d) => d.id === id);
      if (demo) setPlaying(demo);
    };
    const pending = takePendingDemo();
    if (pending) play(pending);
    const onPlay = (e) => play(e.detail);
    window.addEventListener('showcase:play', onPlay);
    return () => window.removeEventListener('showcase:play', onPlay);
  }, []);

  const designed = (demo) => {
    setCustom(demo);
    try {
      sessionStorage.setItem(CUSTOM, JSON.stringify(demo));
    } catch {
      // Storage blocked: the design just won't survive a reload.
    }
    setPlaying(demo);
  };

  return (
    <Section id="showcase">
      <SectionHeading index="//" label={t('showcase.label')} title={t('showcase.title')} />

      <AIDesigner onDesigned={designed} />

      <div className="mb-16 grid gap-10 lg:grid-cols-12">
        <p data-reveal className="max-w-xl text-lg leading-relaxed text-white/75 lg:col-span-5">
          {t('showcase.intro')}
        </p>
        <ol className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-5 lg:col-span-7">
          {PROCESS.map((key, i) => (
            <li key={key} data-reveal data-delay={i * 0.06} className="bg-ink p-4">
              <span className="font-mono text-[11px] text-brand">0{i + 1}</span>
              <p className="mt-2 font-display text-xl uppercase">{t(`process.${key}`)}</p>
              <p className="mt-1 text-xs text-mute">{t(`process.${key}Text`)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* key: a new design remounts the card so its thumbnail rebuilds */}
        {custom && <DemoCard key={custom.title} demo={custom} index={0} custom onPlay={() => setPlaying(custom)} />}
        {DEMOS.map((d, i) => (
          <DemoCard key={d.id} demo={d} index={i} onPlay={() => setPlaying(d)} />
        ))}
      </div>

      <div data-reveal className="mt-20 flex flex-col items-start justify-between gap-8 border border-white/10 p-8 md:flex-row md:items-center md:p-12">
        <div>
          <p className="font-display text-4xl uppercase md:text-5xl">{t('showcase.ctaTitle')}</p>
          <p className="mt-3 max-w-lg text-mute">{t('showcase.ctaText')}</p>
        </div>
        <Button href={pageHref('contact')}>{t('showcase.ctaButton')}</Button>
      </div>

      {/* Portal: a transformed ancestor would otherwise trap this fixed modal */}
      {playing && createPortal(<BuildPlayer demo={playing} onClose={close} />, document.body)}
    </Section>
  );
}
