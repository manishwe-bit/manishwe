import { ArrowUpRight, Command, Frame } from 'lucide-react';
import { NAV_LINKS, PROJECTS, SERVICES, SKILLS } from '../../config';
import { pageHref } from '../../router';
import { toggleBlueprint } from '../../blueprintMode';
import { Section, SectionHeading } from '../ui/Section';
import { openPalette } from '../CommandPalette';
import Terminal from './Terminal';
import { useT } from '../../i18n';

const STACK = SKILLS.flatMap((s) => s.items);
const MOTTO = ['Coding', 'Building', 'Deploying', 'Dreaming'];

function MarqueeRow({ items, reverse, className, duration }) {
  // Content is doubled so the -50% loop is seamless; the copy is hidden from screen readers.
  const row = (hidden) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t} className="flex items-center">
          <span className={className}>{t}</span>
          <span className="mx-8 size-2 rotate-45 bg-brand" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="flex overflow-hidden">
      <div className="marquee-track flex" data-reverse={reverse || undefined} style={{ '--marquee-duration': duration }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Two counter-scrolling bands: the stack, and the motto from the desk-setup photo. */
export function Marquee() {
  return (
    <section aria-label="Tech stack" className="relative overflow-hidden border-y border-white/10 bg-ink-2 py-8">
      <MarqueeRow items={STACK} duration="45s" className="font-display text-5xl text-transparent uppercase [-webkit-text-stroke:1px_rgb(255_255_255/0.55)] md:text-7xl" />
      <div className="mt-4">
        <MarqueeRow items={MOTTO.map((m) => `${m}…`)} reverse duration="30s" className="font-display text-3xl text-brand uppercase md:text-5xl" />
      </div>
    </section>
  );
}

/** Fills {placeholders} in a translated sentence with React nodes. */
function fill(text, nodes) {
  return text.split(/(\{\w+\})/).map((part, i) => nodes[part.slice(1, -1)] ?? <span key={i}>{part}</span>);
}

export function TerminalSection() {
  const t = useT();
  const code = (s) => <code key={s} className="text-arrow-cyan">{s}</code>;
  return (
    <Section id="terminal">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading index="//" label={t('home.tryLabel')} title={t('home.tryTitle')} className="mb-8 md:mb-10" />
          <p data-reveal className="max-w-md text-lg leading-relaxed text-white/75">
            {fill(t('home.tryText'), { help: code('help'), projects: code('projects'), hire: code('sudo hire manish') })}
          </p>
          <ul data-reveal className="mt-8 flex flex-wrap gap-3">
            <li>
              <button
                type="button"
                onClick={openPalette}
                className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white/80 uppercase transition-colors hover:border-brand hover:text-white"
              >
                <Command className="size-4 text-brand" /> Ctrl + K menu
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={toggleBlueprint}
                className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white/80 uppercase transition-colors hover:border-[#3b82f6] hover:text-white"
              >
                <Frame className="size-4 text-[#60a5fa]" /> Blueprint (B)
              </button>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-7">
          <Terminal />
        </div>
      </div>
    </Section>
  );
}

const liveProjects = PROJECTS.filter((p) => !p.placeholder).length;
const COUNTS = { services: SERVICES.length, projects: liveProjects, skills: STACK.length };

/** Cards linking to every other page, so Home works as a map of the site. */
export function Explore() {
  const t = useT();
  const pages = NAV_LINKS.filter((l) => l.id !== 'home');
  return (
    <Section id="explore" className="bg-ink-2">
      <SectionHeading index="//" label={t('home.exploreLabel')} title={t('home.exploreTitle')} />
      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map(({ id, label }, i) => (
          <a
            key={id}
            href={pageHref(id)}
            data-reveal
            data-delay={i * 0.06}
            className="group relative flex min-h-56 flex-col justify-between overflow-hidden bg-ink-2 p-8 transition-colors duration-500 hover:bg-ink"
          >
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100" />
            <div className="flex items-start justify-between">
              <span className="font-display text-xl text-brand">{String(i + 1).padStart(2, '0')}</span>
              <ArrowUpRight className="size-6 text-mute transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-display text-4xl uppercase md:text-5xl">{t(`nav.${id}`)}</h3>
              <p className="mt-3 text-mute">{t(`blurb.${id}`, { n: COUNTS[id] })}</p>
            </div>
          </a>
        ))}
        <button
          type="button"
          onClick={openPalette}
          data-reveal
          data-delay={pages.length * 0.06}
          className="flex min-h-56 flex-col justify-between bg-brand p-8 text-left transition-colors hover:bg-brand-dark"
        >
          <Command className="size-6" />
          <div>
            <p className="font-display text-4xl uppercase md:text-5xl">{t('home.quick')}</p>
            <p className="mt-3 text-white/80">{t('home.quickText')}</p>
          </div>
        </button>
      </div>
    </Section>
  );
}
