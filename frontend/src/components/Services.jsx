import { SERVICES } from '../config';
import { Section, SectionHeading } from './ui/Section';
import ConstructionArrow from './ConstructionArrow';
import { pageHref } from '../router';

export default function Services() {
  return (
    <Section id="services" className="bg-ink-2">
      <SectionHeading index="02" label="Services" title="What I do" />

      <ul className="relative">
        <span data-line className="edge left-0 top-0 w-full" />
        {SERVICES.map((s, i) => (
          <li key={s.title} className="group relative">
            <a
              href={pageHref('contact')}
              data-reveal
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-x-6 gap-y-3 py-8 transition-[padding] duration-500 md:grid-cols-[6rem_1.3fr_1fr_3rem] md:py-10 md:group-hover:pl-6"
            >
              <span className="font-display text-2xl text-brand md:text-3xl">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-display text-2xl uppercase transition-colors group-hover:text-white md:text-4xl">{s.title}</h3>
              <p className="col-span-3 col-start-1 text-mute md:col-span-1 md:col-start-auto">{s.desc}</p>
              <ConstructionArrow
                color="white"
                className="col-start-3 row-start-1 size-4 -rotate-45 justify-self-end transition-transform duration-500 group-hover:rotate-0 md:col-start-4"
              />
            </a>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-brand/[0.06] transition-transform duration-500 group-hover:scale-x-100" />
            <span data-line className="edge bottom-0 left-0 w-full" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
