import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Command, Frame, Menu, X } from 'lucide-react';
import { NAV_LINKS, SITE } from '../config';
import Button from './ui/Button';
import { pageHref } from '../router';
import { toggleBlueprint, useBlueprint } from '../blueprintMode';
import { openPalette } from './CommandPalette';
import { toggleLang, useT } from '../i18n';

export default function Navbar({ page }) {
  const [open, setOpen] = useState(false);
  const active = page;
  const blueprint = useBlueprint();
  const t = useT();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <>
    <header data-nav className="fixed inset-x-0 top-0 z-50 bg-ink/95 md:bg-ink/80 md:backdrop-blur-md">
      <span data-edge="top" className="edge left-0 top-0 w-full" />
      <span data-edge="bottom" className="edge bottom-0 left-0 w-full" />

      <nav className="shell flex h-18 items-center justify-between" aria-label="Main">
        <a data-nav-item href={pageHref('home')} className="font-display text-base tracking-[0.12em] whitespace-nowrap sm:text-lg">
          {SITE.firstName} <span className="text-brand">{SITE.lastName}</span>
        </a>

        <ul data-trace data-trace-radius="24" className="relative hidden items-center gap-6 px-4 py-2 xl:flex 2xl:gap-8">
          {NAV_LINKS.map(({ id, label }) => (
            <li key={id} data-nav-item>
              <a
                href={pageHref(id)}
                aria-current={active === id ? 'page' : undefined}
                className={clsx(
                  'relative py-1 text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-300 hover:text-white',
                  active === id ? 'text-white' : 'text-mute',
                )}
              >
                {t(`nav.${id}`)}
                <span
                  className={clsx(
                    'absolute -bottom-0.5 left-0 h-px w-full origin-left bg-brand transition-transform duration-500',
                    active === id ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-nav-item
            onClick={toggleBlueprint}
            aria-pressed={blueprint}
            title="Blueprint mode (B)"
            aria-label="Blueprint mode"
            className={clsx(
              'hidden size-11 place-items-center border transition-colors md:grid',
              blueprint ? 'border-[#3b82f6] bg-[#3b82f6]/15 text-[#93c5fd]' : 'border-white/10 text-mute hover:border-[#3b82f6] hover:text-white',
            )}
          >
            <Frame className="size-4" />
          </button>
          <button
            type="button"
            data-nav-item
            onClick={openPalette}
            title="Quick menu (Ctrl + K)"
            className="hidden h-11 items-center gap-2 border border-white/10 px-3 text-[10px] font-semibold tracking-[0.15em] text-mute transition-colors hover:border-brand hover:text-white md:flex"
          >
            <Command className="size-4" /> Ctrl K
          </button>
          <div className="hidden sm:block">
            <Button href={pageHref('contact')} variant="outline" size="sm">
              {t('nav.talk')}
            </Button>
          </div>
          <button
            type="button"
            data-nav-item
            onClick={toggleLang}
            aria-label={t('nav.langLabel')}
            title={t('nav.langLabel')}
            className="grid h-11 min-w-11 place-items-center border border-white/10 px-2 text-xs font-semibold text-mute transition-colors hover:border-brand hover:text-white"
          >
            {t('nav.lang')}
          </button>
          <button
            type="button"
            data-nav-item
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-11 place-items-center border border-white/10 text-white transition-colors hover:border-brand xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
    </header>

      {/* Mobile menu — kept outside <header>: its backdrop-blur (md+) would make it the
          containing block for this fixed panel and clip it to the header's height.
          Shown below xl: seven links don't fit beside the brand on narrower screens. */}
      <div
        className={clsx(
          'fixed inset-x-0 top-18 bottom-0 z-40 overflow-y-auto bg-ink transition-[opacity,visibility] duration-300 xl:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <ul className="shell flex flex-col pt-6">
          {NAV_LINKS.map(({ id, label }, i) => (
            <li key={id} className="border-b border-white/10">
              <a
                href={pageHref(id)}
                aria-current={active === id ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 py-5 font-display text-4xl uppercase transition-colors hover:text-brand"
              >
                <span className="font-sans text-xs text-brand">0{i + 1}</span>
                {t(`nav.${id}`)}
              </a>
            </li>
          ))}
        </ul>
        <div className="shell pt-8">
          <a href={`mailto:${SITE.email}`} className="text-sm tracking-[0.2em] text-mute hover:text-white">
            {SITE.email}
          </a>
        </div>
      </div>
    </>
  );
}
