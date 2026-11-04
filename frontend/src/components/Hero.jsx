import { useEffect, useRef } from 'react';
import { ArrowRight, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { SITE, SKILLS } from '../config';
import Button from './ui/Button';
import { pageHref } from '../router';

// Drop your photo at src/assets/images/portrait.jpg (or .png/.webp) and it is used automatically.
const portrait = Object.values(
  import.meta.glob('../assets/images/portrait.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }),
)[0];

const DETAILS = [
  { icon: MapPin, label: SITE.location },
  { icon: Mail, label: SITE.email, href: `mailto:${SITE.email}` },
  { icon: Phone, label: SITE.phone, href: SITE.phoneHref },
];

const STACK = SKILLS.flatMap((s) => s.items);

function PortraitPlaceholder() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:32px_32px] text-center">
      <UserRound className="size-16 text-white/20" strokeWidth={1} />
      <p className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">Portrait placeholder</p>
      <code className="text-[10px] text-white/30">src/assets/images/portrait.jpg</code>
    </div>
  );
}

const BG_WORD = 'DEVELOPER';

/** Letters of the giant background word rise and glow as the pointer passes over them. */
function useMagneticLetters(ref) {
  useEffect(() => {
    const word = ref.current;
    if (!word || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = [...word.children];
    const level = letters.map(() => 0);
    let pointer = null;
    let raf = 0;

    const step = () => {
      let moving = false;
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = pointer ? Math.hypot(pointer.x - (r.left + r.width / 2), (pointer.y - (r.top + r.height / 2)) * 0.6) : Infinity;
        const goal = Math.max(0, 1 - d / 420);
        level[i] += (goal - level[i]) * 0.12;
        if (Math.abs(goal - level[i]) > 0.002) moving = true;
        el.style.setProperty('--m', level[i].toFixed(3));
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const kick = () => raf || (raf = requestAnimationFrame(step));
    const onMove = (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      kick();
    };
    const onLeave = () => {
      pointer = null;
      kick();
    };

    const hero = word.closest('[data-hero]');
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
}

export default function Hero() {
  const word = useRef(null);
  useMagneticLetters(word);

  return (
    <section id="home" data-hero className="relative isolate flex min-h-svh items-center overflow-hidden pt-28 pb-20">
      {/* Oversized background typography */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[3vh] -z-10 overflow-hidden select-none">
        <span ref={word} data-hero-bg className="-ml-[1vw] block font-display text-[22vw] leading-[0.8] whitespace-nowrap text-brand-dark/50">
          {[...BG_WORD].map((ch, i) => (
            <span key={i} className="magnet-letter">
              {ch}
            </span>
          ))}
        </span>
      </div>

      {/* Construction hairlines */}
      <span data-hero-edge className="edge left-0 top-[18%] -z-10 w-full" />
      <span data-hero-edge className="edge bottom-[6%] left-0 -z-10 w-full" />

      {/* [data-blueprint] blocks get a wireframe box first; each [data-carry] piece is then flown in by an arrow from the given side. */}
      <div className="shell grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative pl-6 md:pl-10">
          <span data-hero-edge data-axis="y" className="edge edge-y top-2 bottom-2 left-0 bg-brand" />

          <p data-blueprint data-carry="top" className="font-script text-4xl text-white md:text-5xl">
            Hello, I'm
          </p>

          <h1
            data-blueprint
            data-trace
            data-trace-radius="40"
            aria-label={SITE.name}
            className="relative mt-2 font-display text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-tight uppercase"
          >
            <span data-carry="left" className="block pb-1">
              {SITE.firstName}
            </span>
            <span data-carry="right" className="block pb-1">
              {SITE.lastName}
            </span>
          </h1>

          <div className="relative mt-6 h-px w-full max-w-md">
            <span data-name-rule className="edge inset-x-0 top-0 bg-white/40" />
          </div>

          <p data-blueprint data-carry="left" className="mt-6 flex items-center gap-3 text-sm font-semibold tracking-[0.4em] text-brand">
            <span className="h-px w-8 bg-brand" />
            {SITE.title}
          </p>
          <p data-blueprint data-carry="right" className="mt-5 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
            {SITE.tagline}
          </p>

          <ul data-blueprint className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            {DETAILS.map(({ icon: Icon, label, href }) => (
              <li key={label} data-carry="bottom">
                {href ? (
                  <a href={href} className="flex items-center gap-2 transition-colors hover:text-brand">
                    <Icon className="size-4 text-brand" />
                    {label}
                  </a>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-brand" />
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <ul data-blueprint aria-label="Tech stack" className="mt-5 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <li
                key={s}
                data-carry="top"
                className="border border-white/15 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase"
              >
                {s}
              </li>
            ))}
          </ul>

          <div data-blueprint className="mt-10 flex flex-wrap items-center gap-6">
            <Button href={pageHref('projects')}>View projects</Button>
            <a data-hero-sub href={pageHref('about')} className="group flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-mute uppercase hover:text-white">
              About me
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <figure
          data-portrait
          data-blueprint
          data-trace
          className="relative mx-auto aspect-[1178/1335] w-full max-w-[22rem] border border-white/10 bg-ink-2/60 sm:max-w-md lg:mr-0 lg:ml-auto lg:max-w-[30rem]"
        >
          <div data-media className="absolute inset-3 overflow-hidden bg-ink">
            {portrait ? (
              <img src={portrait} alt={`${SITE.name} coding at a neon-lit desk setup`} className="size-full object-cover" />
            ) : (
              <PortraitPlaceholder />
            )}
          </div>
        </figure>
      </div>
    </section>
  );
}
