import { useEffect, useRef, useState } from 'react';
import { NAV_LINKS, PROJECTS, SITE, SKILLS, SOCIALS } from '../../config';
import { pageHref } from '../../router';
import { toggleBlueprint } from '../../blueprintMode';

const PROMPT = 'manish@portfolio:~$';
const PAGES = NAV_LINKS.map((l) => l.id);

const HELP = [
  ['help', 'show this list'],
  ['whoami', 'who I am'],
  ['skills', 'my tech stack'],
  ['projects', 'things I have built'],
  ['contact', 'how to reach me'],
  ['socials', 'where to find me'],
  ['open <page>', `go to a page (${PAGES.join(', ')})`],
  ['blueprint', 'see the site as a wireframe'],
  ['clear', 'clear the screen'],
];
const COMMANDS = ['help', 'whoami', 'skills', 'projects', 'contact', 'socials', 'open', 'blueprint', 'clear', 'date', 'sudo'];

/** Returns the lines a command prints. Lines are strings or { text, href, tone }. */
function execute(raw) {
  const [cmd = '', ...args] = raw.trim().split(/\s+/);
  const arg = args.join(' ').toLowerCase();
  switch (cmd.toLowerCase()) {
    case '':
      return [];
    case 'help':
      return HELP.map(([c, d]) => ({ text: `${c.padEnd(14)}${d}`, tone: 'mute' }));
    case 'whoami':
    case 'about':
      return [{ text: SITE.name, tone: 'bright' }, `${SITE.title} · ${SITE.location}`, SITE.about];
    case 'skills':
    case 'stack':
      return SKILLS.map((g) => `${g.group.padEnd(10)}${g.items.join(' · ')}`);
    case 'projects':
    case 'ls':
      return PROJECTS.map((p, i) =>
        p.placeholder
          ? { text: `${String(i + 1).padStart(2, '0')}  ${p.title}  (coming soon)`, tone: 'mute' }
          : { text: `${String(i + 1).padStart(2, '0')}  ${p.title}  →  ${p.url}`, href: p.url },
      );
    case 'contact':
      return [
        { text: `email   ${SITE.email}`, href: `mailto:${SITE.email}` },
        { text: `phone   ${SITE.phone}`, href: SITE.phoneHref },
        { text: "or type 'open contact' to send a message", tone: 'mute' },
      ];
    case 'socials':
      return SOCIALS.filter((s) => s.url).map((s) => ({ text: `${s.label.padEnd(10)}${s.handle}`, href: s.url }));
    case 'open':
    case 'cd': {
      const target = arg.replace(/^\.?\//, '') || 'home';
      if (!PAGES.includes(target)) return [{ text: `no such page: ${target}`, tone: 'error' }];
      setTimeout(() => (window.location.hash = pageHref(target)), 450);
      return [{ text: `opening ${target}…`, tone: 'ok' }];
    }
    case 'blueprint':
      toggleBlueprint();
      return [{ text: 'blueprint mode toggled (press B any time)', tone: 'ok' }];
    case 'date':
      return [new Date().toString()];
    case 'sudo':
      if (arg === 'hire manish') {
        setTimeout(() => (window.location.hash = pageHref('contact')), 1400);
        return [{ text: '[sudo] permission granted ✓', tone: 'ok' }, 'Great choice. Taking you to the contact page…'];
      }
      return [{ text: "nice try. (hint: 'sudo hire manish')", tone: 'error' }];
    default:
      return [{ text: `command not found: ${cmd}. Type 'help'.`, tone: 'error' }];
  }
}

const TONES = { mute: 'text-white/45', bright: 'text-white font-semibold', error: 'text-brand', ok: 'text-arrow-cyan' };

function Line({ line }) {
  const l = typeof line === 'string' ? { text: line } : line;
  const cls = `whitespace-pre-wrap ${TONES[l.tone] ?? 'text-white/80'}`;
  if (l.prompt) {
    return (
      <p className="whitespace-pre-wrap text-white">
        <span className="text-arrow-pink">{PROMPT}</span> {l.text}
      </p>
    );
  }
  return l.href ? (
    <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`block ${cls} underline-offset-4 hover:text-arrow-cyan hover:underline`}>
      {l.text}
    </a>
  ) : (
    <p className={cls}>{l.text}</p>
  );
}

/** Interactive terminal: visitors explore the portfolio with commands. */
export default function Terminal() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const [ready, setReady] = useState(false);
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  // Intro: types "whoami" once the terminal scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    let timers = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const word = 'whoami';
      [...word].forEach((_, i) => timers.push(setTimeout(() => setInput(word.slice(0, i + 1)), 400 + i * 110)));
      timers.push(
        setTimeout(() => {
          setInput('');
          setLines([{ prompt: true, text: word }, ...execute(word), { text: "Type 'help' to see what else I can do.", tone: 'mute' }]);
          setReady(true);
        }, 400 + word.length * 110 + 350),
      );
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    const raw = input;
    setInput('');
    setCursor(-1);
    if (raw.trim()) setHistory((h) => [raw, ...h].slice(0, 30));
    if (raw.trim().toLowerCase() === 'clear') return setLines([]);
    setLines((ls) => [...ls, { prompt: true, text: raw }, ...execute(raw)]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(-1, Math.min(history.length - 1, cursor + (e.key === 'ArrowUp' ? 1 : -1)));
      setCursor(next);
      setInput(next < 0 ? '' : history[next]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const [first, ...rest] = input.split(' ');
      if (rest.length) {
        const match = PAGES.find((p) => p.startsWith(rest.join(' ')));
        if (match) setInput(`${first} ${match}`);
      } else {
        const match = COMMANDS.find((c) => c.startsWith(first));
        if (match) setInput(match);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      data-box
      onClick={() => ready && inputRef.current?.focus({ preventScroll: true })}
      className="relative border border-white/10 bg-[#05060c] font-mono text-[13px] leading-relaxed md:text-sm"
    >
      <div data-frame-content className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-3 rounded-full bg-brand" />
        <span className="size-3 rounded-full bg-arrow-pink" />
        <span className="size-3 rounded-full bg-arrow-cyan" />
        <span className="ml-3 text-xs text-mute">{PROMPT.replace('$', '')} — zsh</span>
      </div>
      <div data-frame-content ref={bodyRef} className="h-80 overflow-y-auto px-5 py-4" aria-live="polite">
        {lines.map((l, i) => (
          <Line key={i} line={l} />
        ))}
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor="term-input" className="shrink-0 text-arrow-pink">
            {PROMPT}
          </label>
          <input
            id="term-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={!ready}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Terminal command"
            className="min-w-0 flex-1 bg-transparent text-white caret-arrow-cyan outline-none"
          />
        </form>
      </div>
    </div>
  );
}
