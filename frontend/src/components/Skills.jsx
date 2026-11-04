import { SKILLS } from '../config';
import { Section, SectionHeading } from './ui/Section';
import ConstructionArrow from './ConstructionArrow';

export default function Skills() {
  return (
    <Section id="skills" className="bg-ink-2">
      <SectionHeading index="04" label="Skills" title="Technologies" />

      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {SKILLS.map(({ group, items }) => (
          <div key={group} className="relative pt-6">
            <span data-line className="edge left-0 top-0 w-full" />
            <div data-reveal className="flex items-baseline justify-between">
              <h3 className="text-[11px] font-semibold tracking-[0.35em] text-brand uppercase">{group}</h3>
              <span className="text-[11px] text-mute">{String(items.length).padStart(2, '0')}</span>
            </div>
            <ul className="mt-6">
              {items.map((item, i) => (
                <li
                  key={item}
                  data-reveal
                  data-delay={i * 0.06}
                  className="group flex items-center gap-4 border-b border-white/5 py-4 font-display text-3xl uppercase transition-colors hover:text-brand md:text-4xl"
                >
                  <ConstructionArrow color="red" className="size-3 opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
