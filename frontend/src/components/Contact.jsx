import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { SITE, SOCIALS } from '../config';
import { SOCIAL_ICONS } from './icons';
import Button from './ui/Button';
import ContactForm from './ContactForm';

function DirectionRing() {
  return (
    <a
      href={`mailto:${SITE.email}`}
      data-ring
      aria-label="Email me"
      className="group relative grid size-40 shrink-0 place-items-center md:size-56"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="0.5" />
        <circle data-ring-circle cx="50" cy="50" r="46" fill="none" stroke="#F04444" strokeWidth="0.6" />
      </svg>
      <ArrowUpRight data-reveal className="size-12 text-brand transition-transform duration-500 group-hover:rotate-45 md:size-16" strokeWidth={1.2} />
    </a>
  );
}

export default function Contact() {
  return (
    <section id="contact" data-section className="relative overflow-hidden py-28 md:py-40">
      <span data-divider className="edge left-0 top-0 w-full" />
      <div className="shell">
        <p data-reveal className="mb-6 flex items-center gap-4 text-[11px] font-semibold tracking-[0.35em] text-mute uppercase">
          <span className="text-brand">06</span>
          <span className="h-px w-10 bg-white/20" />
          Contact
        </p>

        <h2 className="font-display text-[clamp(3.25rem,11vw,10rem)] leading-[0.88] uppercase">
          <span className="block overflow-hidden pb-1">
            <span data-mask-in className="block">
              Let's work
            </span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span data-mask-in className="block">
              together<span className="text-brand">.</span>
            </span>
          </span>
        </h2>

        <div className="mt-16 flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-reveal className="font-display text-3xl uppercase md:text-4xl">
              {SITE.name}
            </p>
            <p data-reveal className="mt-2 text-sm font-semibold tracking-[0.4em] text-brand">
              {SITE.title}
            </p>
            <a
              data-reveal
              href={`mailto:${SITE.email}`}
              className="mt-8 block text-xl text-white/80 underline decoration-white/20 underline-offset-8 transition-colors hover:text-white hover:decoration-brand md:text-2xl"
            >
              {SITE.email}
            </a>
            <div data-reveal className="mt-6 flex flex-col gap-3 text-mute sm:flex-row sm:gap-8">
              <a href={SITE.phoneHref} className="flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="size-4 text-brand" />
                {SITE.phone}
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-brand" />
                {SITE.location}
              </span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Button href={`mailto:${SITE.email}`}>Send an email</Button>
              <ul data-reveal className="flex gap-3">
                {SOCIALS.filter((s) => s.id !== 'email').map(({ id, label, url }) => {
                  const Icon = SOCIAL_ICONS[id];
                  return (
                    <li key={id}>
                      <a
                        href={url || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        aria-disabled={!url}
                        className="grid size-11 place-items-center border border-white/10 text-mute transition-colors hover:border-brand hover:text-white"
                      >
                        <Icon className="size-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <DirectionRing />
        </div>

        <div className="mt-20 max-w-3xl">
          <p data-reveal className="mb-6 text-sm font-semibold tracking-[0.4em] text-brand uppercase">
            Or send a message here
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
