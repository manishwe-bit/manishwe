import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Copy, CornerDownLeft, Download, ExternalLink, Frame, Gauge, Languages, ScanLine, Search, Sparkles } from 'lucide-react';
import { NAV_LINKS, SITE, SOCIALS } from '../config';
import { pageHref } from '../router';
import { toggleBlueprint } from '../blueprintMode';
import { toggleXray } from './XRayLens';
import { toggleHud } from './DevHUD';
import { openChat } from './AskAI';
import { toggleLang } from '../i18n';
import { installApp } from '../pwa';

// Open from anywhere: Ctrl/Cmd + K, or dispatch this event (nav button, guide cursor).
export const openPalette = () => window.dispatchEvent(new Event('palette:open'));

function useCommands() {
  return useMemo(
    () => [
      ...NAV_LINKS.map(({ id, label }, i) => ({
        group: 'Pages',
        label: `Go to ${label}`,
        hint: `0${i + 1}`,
        icon: ArrowRight,
        run: () => (window.location.hash = pageHref(id)),
      })),
      { group: 'Actions', label: 'Toggle blueprint mode', hint: 'B', icon: Frame, run: toggleBlueprint },
      { group: 'Actions', label: 'X-ray: see the code behind the page', hint: 'X', icon: ScanLine, run: toggleXray },
      { group: 'Actions', label: 'Developer HUD: FPS, vitals, live stats', hint: 'D', icon: Gauge, run: toggleHud },
      { group: 'Actions', label: 'Talk to MK-01, the AI robot', hint: 'Chat', icon: Sparkles, run: openChat },
      { group: 'Actions', label: 'Switch language: English / हिन्दी', hint: 'EN/हिं', icon: Languages, run: toggleLang },
      { group: 'Actions', label: 'Install this site as an app', hint: 'PWA', icon: Download, run: installApp },
      {
        group: 'Actions',
        label: 'Copy email address',
        hint: SITE.email,
        icon: Copy,
        run: () => navigator.clipboard?.writeText(SITE.email),
      },
      ...SOCIALS.filter((s) => s.url && s.id !== 'email').map((s) => ({
        group: 'Social',
        label: `Open ${s.label}`,
        hint: s.handle,
        icon: ExternalLink,
        run: () => window.open(s.url, '_blank', 'noopener'),
      })),
    ],
    [],
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const close = () => setOpen(false);
  const commands = useCommands();

  const results = commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const run = (cmd) => {
    close();
    cmd?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') run(results[index]);
  };

  if (!open) return null;
  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/70 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl border border-white/15 bg-ink-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5">
          <Search className="size-4 text-mute" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            aria-label="Search commands"
            className="h-14 flex-1 bg-transparent text-white outline-none placeholder:text-white/30"
          />
          <kbd className="border border-white/15 px-1.5 py-0.5 text-[10px] text-mute">ESC</kbd>
        </div>

        <ul role="listbox" className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && <li className="px-5 py-6 text-sm text-mute">No results for “{query}”.</li>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup;
            lastGroup = c.group;
            const Icon = c.icon;
            return (
              <li key={c.label} role="option" aria-selected={i === index}>
                {header && <p className="px-5 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">{c.group}</p>}
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(c)}
                  className={clsx(
                    'flex w-full items-center gap-4 border-l-2 px-5 py-3 text-left text-sm transition-colors',
                    i === index ? 'border-brand bg-white/[0.04] text-white' : 'border-transparent text-white/75',
                  )}
                >
                  <Icon className={clsx('size-4', i === index ? 'text-brand' : 'text-mute')} />
                  <span className="flex-1">{c.label}</span>
                  <span className="truncate text-xs text-mute">{c.hint}</span>
                  {i === index && <CornerDownLeft className="size-3.5 text-mute" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
