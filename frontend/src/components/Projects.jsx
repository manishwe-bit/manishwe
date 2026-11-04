import clsx from 'clsx';
import { ArrowUpRight, ImageOff } from 'lucide-react';
import { PROJECTS } from '../config';
import { Section, SectionHeading } from './ui/Section';
import { localProjectText, useT } from '../i18n';

// Project images live in src/assets/images/<project.image>.{jpg,png,webp}
const images = import.meta.glob('../assets/images/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const findImage = (name) => name && Object.entries(images).find(([path]) => path.includes(`/${name}.`))?.[1];

function Preview({ project }) {
  const src = findImage(project.image);
  if (src) return <img src={src} alt={`${project.title} preview`} loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />;
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-ink-2 text-center">
      <ImageOff className="size-8 text-white/20" strokeWidth={1.2} />
      <p className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">{project.placeholder ? 'Placeholder' : 'Preview placeholder'}</p>
      {project.image && <code className="text-[10px] text-white/30">src/assets/images/{project.image}.jpg</code>}
    </div>
  );
}

function ProjectCard({ project, index, featured }) {
  const t = useT();
  const hasLink = Boolean(project.url);
  return (
    <article
      data-project
      data-trace
      className={clsx('group relative border border-white/10 bg-ink-2/40 p-3 md:p-4', featured && 'lg:col-span-2')}
    >
      <div className={clsx('grid gap-6', featured && 'lg:grid-cols-12 lg:gap-10')}>
        <div data-media className={clsx('relative aspect-[16/10] overflow-hidden bg-ink', featured && 'lg:col-span-7')}>
          <Preview project={project} />
        </div>

        <div className={clsx('flex flex-col p-3 md:p-4', featured && 'lg:col-span-5 lg:py-8')}>
          <p data-frame-content className="text-[11px] font-semibold tracking-[0.3em] text-brand">
            {String(index + 1).padStart(2, '0')} {project.placeholder && t('projects.comingSoon')}
          </p>
          <h3 data-frame-content className={clsx('mt-3 font-display uppercase', featured ? 'text-5xl md:text-6xl' : 'text-3xl')}>
            {project.title}
          </h3>

          {project.placeholder ? (
            <p data-frame-content className="mt-4 text-mute">{t('projects.reserved')}</p>
          ) : (
            <>
              <p data-frame-content className="mt-4 leading-relaxed text-mute">{localProjectText(project)}</p>
              <ul data-frame-content className="mt-6 flex flex-wrap gap-2">
                {project.tech.length ? (
                  project.tech.map((t) => (
                    <li key={t} className="border border-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase">
                      {t}
                    </li>
                  ))
                ) : (
                  <li className="text-[10px] tracking-[0.2em] text-white/30 uppercase">Tech stack — add in src/config.js</li>
                )}
              </ul>
              <a
                data-frame-content
                href={hasLink ? project.url : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!hasLink}
                className={clsx(
                  'mt-auto inline-flex items-center gap-2 pt-8 text-[11px] font-semibold tracking-[0.25em] uppercase',
                  hasLink ? 'text-white hover:text-brand' : 'pointer-events-none text-white/30',
                )}
              >
                {hasLink ? t('projects.view') : t('projects.soon')}
                <ArrowUpRight className="size-4" />
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const t = useT();
  return (
    <Section id="projects">
      <SectionHeading index="03" label={t('projects.label')} title={t('projects.title')} />
      <div className="grid gap-8 lg:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.title} project={p} index={i} featured={i === 0} />
        ))}
      </div>
    </Section>
  );
}
