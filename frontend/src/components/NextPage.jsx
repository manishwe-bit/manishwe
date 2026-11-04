import { ArrowRight } from 'lucide-react';
import { NAV_LINKS } from '../config';
import { pageHref } from '../router';
import { useT } from '../i18n';

/** Big "next page" link at the bottom of every inner page; the last one loops back home. */
export default function NextPage({ page }) {
  const t = useT();
  const i = NAV_LINKS.findIndex((l) => l.id === page);
  const next = NAV_LINKS[(i + 1) % NAV_LINKS.length];
  return (
    <section data-section className="relative">
      <span data-divider className="edge left-0 top-0 w-full" />
      <a href={pageHref(next.id)} className="group shell flex items-end justify-between gap-6 py-16 md:py-24">
        <div data-reveal>
          <p className="text-[11px] font-semibold tracking-[0.35em] text-mute uppercase">{next.id === 'home' ? t('next.back') : t('next.next')}</p>
          <p className="mt-3 font-display text-[clamp(3rem,10vw,8rem)] leading-[0.9] uppercase transition-colors duration-500 group-hover:text-brand">
            {t(`nav.${next.id}`)}
          </p>
        </div>
        <span data-reveal className="mb-3 grid size-16 shrink-0 place-items-center rounded-full border border-white/15 transition-all duration-500 group-hover:border-brand group-hover:bg-brand md:size-24">
          <ArrowRight className="size-6 transition-transform duration-500 group-hover:translate-x-1 md:size-8" />
        </span>
      </a>
    </section>
  );
}
