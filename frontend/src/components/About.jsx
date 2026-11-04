import { SITE } from '../config';
import { Section, SectionHeading } from './ui/Section';
import ConstructionArrow from './ConstructionArrow';
import { useT } from '../i18n';

export default function About() {
  const t = useT();
  return (
    <Section id="about">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading index="01" label={t('about.label')} title={t('about.title')} />
        </div>

        <div className="lg:col-span-7 lg:pt-16">
          <div data-box className="relative border border-white/10 p-8 md:p-12">
            <ConstructionArrow color="red" className="absolute -top-2 -left-2 size-4 rotate-45" />
            <p data-frame-content className="font-display text-4xl uppercase md:text-6xl">
              {SITE.name}
            </p>
            <p data-frame-content className="mt-3 text-sm font-semibold tracking-[0.4em] text-brand">
              {t('hero.title')}
            </p>
            <p data-frame-content className="mt-8 max-w-2xl text-xl leading-relaxed text-white/80 md:text-2xl">
              {t('about.text')}
            </p>
          </div>

          <dl className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              [t('about.discipline'), t('about.disciplineValue')],
              [t('about.stack'), 'React · Python · FastAPI'],
              [t('about.location'), t('site.location')],
            ].map(([k, v]) => (
              <div key={k} data-reveal className="bg-ink p-6">
                <dt className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">{k}</dt>
                <dd className="mt-2 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
