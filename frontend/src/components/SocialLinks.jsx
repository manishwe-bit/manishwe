import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import { SOCIALS } from '../config';
import { SOCIAL_ICONS } from './icons';
import { Section, SectionHeading } from './ui/Section';

export default function SocialLinks() {
  return (
    <Section id="social">
      <SectionHeading index="05" label="Social" title={'Find me\nonline'} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SOCIALS.map(({ id, label, handle, url }) => {
          const Icon = SOCIAL_ICONS[id];
          return (
            <a
              key={id}
              data-box
              data-trace
              href={url || undefined}
              target={url && !url.startsWith('mailto:') ? '_blank' : undefined}
              rel="noreferrer"
              aria-disabled={!url}
              className={clsx(
                'group relative flex min-h-48 flex-col justify-between border border-white/10 p-6 transition-colors duration-300',
                url ? 'hover:bg-brand/[0.06]' : 'cursor-default',
              )}
            >
              <div data-frame-content className="flex items-start justify-between">
                <Icon className="size-7 text-white transition-colors group-hover:text-brand" />
                <ArrowUpRight className="size-5 text-mute transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <div data-frame-content>
                <p className="font-display text-3xl uppercase">{label}</p>
                <p className="mt-1 truncate text-sm text-mute">{handle || (url ? '' : 'Link coming soon')}</p>
              </div>
            </a>
          );
        })}
      </div>
    </Section>
  );
}
