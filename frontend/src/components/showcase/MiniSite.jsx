import { forwardRef, memo, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Activity, Aperture, Baby, Bath, BedDouble, Bike, BookOpen, Briefcase, Cake, Camera, Car, Coffee, Croissant,
  Dumbbell, Flame, Flower2, Footprints, Gem, GraduationCap, Hammer, Heart, HeartPulse, House, KeyRound,
  Laptop, Leaf, Lock, MapPin, Mountain, Music, Palette, PawPrint, Pill, Pizza, Plane, Scissors, ShieldCheck,
  Shirt, Smartphone, Sofa, Sparkles, Star, Stethoscope, Sun, Timer, Truck, Users, Utensils, Wrench, Zap,
} from 'lucide-react';

// Keep in sync with ICONS in backend/app/generator.py (the AI designer may pick any of these).
const ICONS = {
  Activity, Aperture, Baby, Bath, BedDouble, Bike, BookOpen, Briefcase, Cake, Camera, Car, Coffee, Croissant,
  Dumbbell, Flame, Flower2, Footprints, Gem, GraduationCap, Hammer, Heart, HeartPulse, House, KeyRound,
  Laptop, Leaf, Lock, MapPin, Mountain, Music, Palette, PawPrint, Pill, Pizza, Plane, Scissors, ShieldCheck,
  Shirt, Smartphone, Sofa, Sparkles, Star, Stethoscope, Sun, Timer, Truck, Users, Utensils, Wrench, Zap,
};

export const SITE_WIDTH = 1100;
export const SECTIONS = ['nav', 'hero', 'features', 'grid', 'quote', 'footer'];

const FONTS = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  display: 'Anton, Impact, sans-serif',
};

/** Gradient tile with an icon, standing in for a photo. */
function Art({ art, className, size = 72 }) {
  const Icon = ICONS[art.icon] ?? Sparkles;
  return (
    <div className={clsx('ms-art grid place-items-center overflow-hidden', className)} style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})`, borderRadius: 'var(--ms-radius-box)' }}>
      <Icon size={size} strokeWidth={1.2} color="rgb(255 255 255 / 0.85)" />
    </div>
  );
}

const Btn = ({ children, ghost }) => (
  <span
    className={clsx('ms-btn inline-block px-6 py-3 text-sm font-semibold', ghost ? 'border' : '')}
    style={ghost ? { borderColor: 'var(--ms-muted)', borderRadius: 'var(--ms-radius)' } : { background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', borderRadius: 'var(--ms-radius)' }}
  >
    {children}
  </span>
);

const H2 = ({ children }) => <h2 className="ms-h2 mb-10 text-4xl leading-tight font-bold">{children}</h2>;

function Nav({ d }) {
  return (
    <div className="flex items-center justify-between px-12 py-6">
      <span className="text-2xl font-bold tracking-tight">{d.nav.brand}</span>
      <ul className="flex gap-10 text-[15px]" style={{ color: 'var(--ms-muted)' }}>
        {d.nav.links.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <Btn>{d.nav.cta}</Btn>
    </div>
  );
}

function Hero({ d }) {
  const { hero } = d;
  const copy = (
    <>
      <p className="text-sm font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--ms-accent)' }}>
        {hero.eyebrow}
      </p>
      <h1 className="ms-h1 mt-5 text-[64px] leading-[1.02] font-bold">{hero.title}</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--ms-muted)' }}>
        {hero.text}
      </p>
      <div className={clsx('mt-9 flex gap-4', hero.layout === 'center' && 'justify-center')}>
        <Btn>{hero.cta}</Btn>
        <Btn ghost>Learn more</Btn>
      </div>
    </>
  );
  if (hero.layout === 'center') {
    return (
      <div className="px-12 pt-20 pb-16 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center">{copy}</div>
        <Art art={hero.art} className="mt-14 h-56 w-full" size={96} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 items-center gap-14 px-12 py-20">
      <div>{copy}</div>
      <Art art={hero.art} className="h-[380px]" size={120} />
    </div>
  );
}

function Features({ d }) {
  return (
    <div className="px-12 py-20" style={{ background: 'var(--ms-surface)' }}>
      <H2>{d.features.title}</H2>
      <div className="grid grid-cols-3 gap-8">
        {d.features.items.map((f) => {
          const Icon = ICONS[f.icon] ?? Sparkles;
          return (
            <div key={f.title} className="ms-card p-7" style={{ background: 'var(--ms-bg)', borderRadius: 'var(--ms-radius-box)' }}>
              <span className="grid size-12 place-items-center" style={{ background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', borderRadius: 'var(--ms-radius-box)' }}>
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
              <p className="mt-2 leading-relaxed" style={{ color: 'var(--ms-muted)' }}>
                {f.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Grid({ d }) {
  const { grid } = d;
  const box = { borderRadius: 'var(--ms-radius-box)' };
  let body;
  if (grid.layout === 'menu') {
    body = (
      <div className="grid grid-cols-2 gap-x-16 gap-y-7">
        {grid.items.map((it) => (
          <div key={it.name}>
            <div className="flex items-baseline gap-3 text-xl font-bold">
              {it.name}
              <span className="flex-1 border-b border-dotted" style={{ borderColor: 'var(--ms-muted)' }} />
              <span style={{ color: 'var(--ms-accent)' }}>{it.price}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--ms-muted)' }}>
              {it.meta}
            </p>
          </div>
        ))}
      </div>
    );
  } else if (grid.layout === 'schedule') {
    body = (
      <div className="divide-y" style={{ borderColor: 'var(--ms-surface)' }}>
        {grid.items.map((it) => (
          <div key={it.name} className="grid grid-cols-[120px_1fr_200px_auto] items-center gap-6 py-5" style={{ borderColor: 'var(--ms-surface)' }}>
            <span className="text-3xl font-bold" style={{ color: 'var(--ms-accent)' }}>
              {it.price}
            </span>
            <span className="text-2xl font-bold">{it.name}</span>
            <span style={{ color: 'var(--ms-muted)' }}>{it.meta}</span>
            <Btn ghost>Book</Btn>
          </div>
        ))}
      </div>
    );
  } else if (grid.layout === 'products') {
    body = (
      <div className="grid grid-cols-4 gap-6">
        {grid.items.map((it) => (
          <div key={it.name} className="ms-card p-3" style={{ background: 'var(--ms-surface)', ...box }}>
            <Art art={it} className="aspect-square" size={56} />
            <div className="flex items-center justify-between px-2 pt-4 pb-2">
              <div>
                <p className="font-bold">{it.name}</p>
                <p className="text-sm" style={{ color: 'var(--ms-muted)' }}>
                  {it.meta}
                </p>
              </div>
              <span className="font-bold" style={{ color: 'var(--ms-accent)' }}>
                {it.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (grid.layout === 'pricing') {
    body = (
      <div className="grid grid-cols-3 items-center gap-6">
        {grid.items.map((it) => (
          <div
            key={it.name}
            className={clsx('ms-card p-8', it.highlight && 'py-12')}
            style={it.highlight ? { background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', ...box } : { background: 'var(--ms-surface)', ...box }}
          >
            <p className="text-sm font-semibold tracking-[0.2em] uppercase">{it.name}</p>
            <p className="mt-4 text-5xl font-bold">
              {it.price}
              <span className="text-base font-normal opacity-70">/mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm opacity-80">
              {it.meta.split(' · ').map((m) => (
                <li key={m}>✓ {m}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  } else if (grid.layout === 'listings') {
    body = (
      <div className="grid grid-cols-3 gap-7">
        {grid.items.map((it) => (
          <div key={it.name} className="ms-card overflow-hidden" style={{ background: 'var(--ms-surface)', ...box }}>
            <Art art={it} className="h-44" size={60} />
            <div className="p-5">
              <p className="text-2xl font-bold" style={{ color: 'var(--ms-accent)' }}>
                {it.price}
              </p>
              <p className="mt-1 text-lg font-bold">{it.name}</p>
              <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--ms-muted)' }}>
                <BedDouble size={15} /> <Bath size={15} /> {it.meta}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="grid grid-cols-3 gap-4">
        {grid.items.map((it, i) => (
          <figure key={it.name} className={clsx('ms-card relative', i % 3 === 1 ? 'row-span-2' : '')}>
            <Art art={it} className={i % 3 === 1 ? 'h-full min-h-[420px]' : 'h-[200px]'} size={48} />
            <figcaption className="absolute bottom-3 left-4 text-sm font-semibold text-white/90">{it.name}</figcaption>
          </figure>
        ))}
      </div>
    );
  }
  return (
    <div className="px-12 py-20">
      <H2>{grid.title}</H2>
      {body}
    </div>
  );
}

function Quote({ d }) {
  return (
    <div className="px-12 py-20 text-center" style={{ background: 'var(--ms-surface)' }}>
      <p className="mx-auto max-w-3xl text-4xl leading-snug font-bold">“{d.quote.text}”</p>
      <p className="mt-6 text-sm tracking-[0.2em] uppercase" style={{ color: 'var(--ms-accent)' }}>
        {d.quote.author}
      </p>
    </div>
  );
}

function Footer({ d }) {
  return (
    <div className="flex items-center justify-between px-12 py-10 text-sm" style={{ color: 'var(--ms-muted)' }}>
      <span className="text-lg font-bold" style={{ color: 'var(--ms-text)' }}>
        {d.nav.brand}
      </span>
      <span>{d.footer.text}</span>
      <span>Instagram · WhatsApp</span>
    </div>
  );
}

const RENDER = { nav: Nav, hero: Hero, features: Features, grid: Grid, quote: Quote, footer: Footer };

/**
 * One demo website, rendered at a fixed desktop width.
 * stages: { [section]: 'wire' | 'styled' } — sections not listed aren't built yet.
 * live: final polish (hover lifts, floating art, shimmering buttons).
 */
const sameStages = (a, b) => SECTIONS.every((s) => a[s] === b[s]);

// Memoised: the build player re-renders every frame, but the site only changes when a stage does.
export const MiniSite = memo(
  forwardRef(function MiniSite({ demo, stages, live }, ref) {
    const t = demo.theme;
    return (
      <div
        ref={ref}
        className={clsx('ms-root', live && 'ms-live')}
        style={{
          width: SITE_WIDTH,
          '--ms-bg': t.bg,
          '--ms-surface': t.surface,
          '--ms-text': t.text,
          '--ms-muted': t.muted,
          '--ms-accent': t.accent,
          '--ms-on-accent': t.onAccent,
          '--ms-radius': t.radius,
          '--ms-radius-box': t.radius === '999px' ? '22px' : t.radius,
          fontFamily: FONTS[t.font],
          textTransform: t.font === 'display' ? 'uppercase' : undefined,
        }}
      >
        {SECTIONS.map((s) => {
          const stage = stages[s];
          if (!stage) return null;
          const Part = RENDER[s];
          return (
            <section key={s} data-ms={s} className={clsx('ms-section', stage === 'wire' && 'ms-wire')}>
              <Part d={demo} />
            </section>
          );
        })}
      </div>
    );
  }),
  (a, b) => a.demo === b.demo && a.live === b.live && sameStages(a.stages, b.stages),
);

export const ALL_STYLED = Object.fromEntries(SECTIONS.map((s) => [s, 'styled']));

/** Scales a MiniSite to fit its container's width (used for card thumbnails). */
export function ScaledSite({ demo, className }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.3);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / SITE_WIDTH));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={clsx('relative overflow-hidden', className)} aria-hidden="true">
      <div className="pointer-events-none absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <MiniSite demo={demo} stages={ALL_STYLED} />
      </div>
    </div>
  );
}
