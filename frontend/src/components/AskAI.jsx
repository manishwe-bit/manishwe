import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUp, Cpu, Mic, Square, Volume2, VolumeX, X } from 'lucide-react';
import { API_URL, SITE } from '../config';
import RobotAvatar from './robot/RobotAvatar';
import { runAction } from './robot/actions';
import { canListen, canSpeak, speak, stopSpeaking, useListen } from './robot/voice';

export const openChat = () => window.dispatchEvent(new Event('chat:open'));

const STORE = 'mk01-chat';
const VOICE_PREF = 'mk01-voice';
const SUGGESTIONS = [
  'Show me a café website being built',
  'Mujhe apne business ke liye website chahiye',
  'Turn on X-ray mode',
  "What's Manish's tech stack?",
];
const GREETING = {
  role: 'assistant',
  content: "Systems online. I'm MK-01, Manish's robot assistant. Ask me anything, or tell me what to do: I can open pages, play website builds, and pass your project straight to Manish.",
};
const BOOT = ['MK-01 v2.0 · boot sequence', 'linking neural core: Claude', 'loading Manish profile', 'all systems online'];
const STATUS = { idle: 'Online', thinking: 'Thinking…', speaking: 'Speaking', listening: 'Listening…' };

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE)) ?? [GREETING];
  } catch {
    return [GREETING];
  }
};
const loadVoice = () => {
  try {
    return localStorage.getItem(VOICE_PREF) === 'on';
  } catch {
    return false;
  }
};

/** Reveal a reply a few characters at a time, like it is being typed. */
function useTypewriter(text, onDone) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (!text) return setShown('');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text);
      onDone();
      return undefined;
    }
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 120));
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone();
      }
    }, 16);
    return () => clearInterval(id);
  }, [text]);
  return shown;
}

/**
 * MK-01: the site's AI robot. Talks (text or voice) with Claude via /api/chat and can
 * operate the site: open pages, play Showcase builds, toggle views, and send enquiries
 * straight to Manish's inbox.
 */
export default function AskAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState('');
  const [voice, setVoice] = useState(loadVoice);
  const [talking, setTalking] = useState(false);
  const list = useRef(null);
  const field = useRef(null);

  const shown = useTypewriter(typing, () => {
    setMessages((m) => [...m, { role: 'assistant', content: typing }]);
    setTyping('');
  });

  const mic = useListen({ onText: setInput, onFinal: (text) => ask(text) });
  const state = mic.listening ? 'listening' : busy ? 'thinking' : talking || typing ? 'speaking' : 'idle';

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-30)));
    } catch {
      // Private mode: the chat just won't survive a reload.
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_PREF, voice ? 'on' : 'off');
    } catch {
      // Storage blocked: the setting lasts for this visit only.
    }
    if (!voice) stopSpeaking();
  }, [voice]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('chat:open', onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('chat:open', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => field.current?.focus({ preventScroll: true }));
    else stopSpeaking();
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, shown, busy, open]);

  async function ask(text) {
    const q = text.trim();
    if (!q || busy || typing) return;
    stopSpeaking();
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    let reply;
    let actions = [];
    try {
      const r = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only the real conversation goes to the API: no greeting, no action log lines.
        body: JSON.stringify({
          messages: next.filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content !== GREETING.content).slice(-14),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        reply = j.reply;
        actions = j.actions ?? [];
      } else if (r.status === 429) reply = 'Cooling down my circuits. Please wait a minute and try again.';
      else reply = typeof j.detail === 'string' ? j.detail : null;
    } catch {
      reply = null;
    }
    setBusy(false);

    const log = actions.map(runAction).filter(Boolean);
    if (log.length) setMessages((m) => [...m, ...log.map((content) => ({ role: 'action', content }))]);
    // On phones the panel covers the page: get out of the way when the robot changes what's on screen.
    if (actions.some((a) => a.type !== 'enquiry_sent') && window.matchMedia('(max-width: 767px)').matches) setOpen(false);

    const say = reply || `Connection to my core failed (the server may be waking up). Try again in a minute, or email Manish at ${SITE.email}.`;
    setTyping(say);
    if (voice) speak(say, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
  }

  const fresh = messages.length === 1 && !typing;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close MK-01 chat' : 'Open MK-01, the AI robot'}
        className={clsx(
          'robot-launcher fixed right-3 bottom-5 z-[63] flex items-center gap-2 border py-1 pr-4 pl-1 text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors md:right-5',
          open ? 'border-white/20 bg-ink text-white' : 'border-arrow-cyan/50 bg-ink-2 text-white hover:border-arrow-cyan',
        )}
      >
        {open ? <X className="m-2 size-5" /> : <RobotAvatar state={state} size={36} />}
        {open ? 'Close' : 'Ask MK-01'}
      </button>

      <section
        role="dialog"
        aria-label="MK-01, AI robot assistant"
        inert={!open}
        className={clsx(
          'robot-panel fixed right-3 bottom-18 z-[63] flex h-[min(38rem,calc(100svh-7rem))] w-[min(25rem,calc(100vw-1.5rem))] origin-bottom-right flex-col border border-arrow-cyan/25 bg-ink-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] transition-[opacity,transform] duration-300 md:right-5',
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        )}
      >
        <header className="relative flex items-center gap-3 overflow-hidden border-b border-white/10 px-4 py-3">
          <span className="robot-scan" aria-hidden="true" />
          <RobotAvatar state={state} size={56} />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold tracking-[0.15em]">MK-01</p>
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-arrow-cyan uppercase">
              <span className={clsx('robot-led', state !== 'idle' && 'robot-led--busy')} />
              {STATUS[state]}
            </p>
          </div>
          {canSpeak && (
            <button
              type="button"
              onClick={() => setVoice((v) => !v)}
              aria-pressed={voice}
              title={voice ? 'Voice replies on' : 'Voice replies off'}
              className={clsx('grid size-9 place-items-center border transition-colors', voice ? 'border-arrow-cyan text-arrow-cyan' : 'border-white/15 text-mute hover:text-white')}
            >
              {voice ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          )}
        </header>

        <ol ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-relaxed">
          {fresh && (
            <li className="space-y-1 font-mono text-[11px] text-arrow-cyan/70" aria-hidden="true">
              {BOOT.map((line, i) => (
                <p key={line} className="robot-boot" style={{ animationDelay: `${i * 0.25}s` }}>
                  &gt; {line}
                  {i === BOOT.length - 1 && ' ✓'}
                </p>
              ))}
            </li>
          )}
          {messages.map((m, i) =>
            m.role === 'action' ? (
              <li key={i} className="flex items-center gap-2 font-mono text-[11px] text-arrow-cyan">
                <Cpu className="size-3.5 shrink-0" /> {m.content}
              </li>
            ) : (
              <li
                key={i}
                className={clsx(
                  'max-w-[88%] px-3.5 py-2.5 whitespace-pre-wrap',
                  m.role === 'user' ? 'ml-auto bg-brand text-white' : 'border-l-2 border-arrow-cyan bg-ink text-white/85',
                )}
              >
                {m.content}
              </li>
            ),
          )}
          {typing && (
            <li className="max-w-[88%] border-l-2 border-arrow-cyan bg-ink px-3.5 py-2.5 whitespace-pre-wrap text-white/85">
              {shown}
              <span className="ai-caret" />
            </li>
          )}
          {busy && (
            <li className="flex w-fit items-center gap-2 border-l-2 border-arrow-cyan bg-ink px-3.5 py-2.5 font-mono text-[11px] text-arrow-cyan" aria-label="Thinking">
              processing
              <span className="ai-dot" />
              <span className="ai-dot [animation-delay:150ms]" />
              <span className="ai-dot [animation-delay:300ms]" />
            </li>
          )}
          {fresh && (
            <li className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} className="border border-white/15 px-3 py-1.5 text-left text-xs text-white/75 transition-colors hover:border-arrow-cyan hover:text-white">
                  {s}
                </button>
              ))}
            </li>
          )}
        </ol>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-white/10 p-3"
        >
          {canListen && (
            <button
              type="button"
              onClick={mic.listening ? mic.stop : mic.start}
              disabled={busy}
              aria-label={mic.listening ? 'Stop listening' : 'Speak your question'}
              className={clsx(
                'grid size-10 shrink-0 place-items-center border transition-colors disabled:opacity-40',
                mic.listening ? 'robot-mic-on border-arrow-cyan bg-arrow-cyan/15 text-arrow-cyan' : 'border-white/15 text-mute hover:text-white',
              )}
            >
              {mic.listening ? <Square className="size-3.5" fill="currentColor" /> : <Mic className="size-4" />}
            </button>
          )}
          <input
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder={mic.listening ? 'Listening…' : 'Ask or give a command…'}
            aria-label="Your message"
            className="h-10 min-w-0 flex-1 border border-white/10 bg-ink px-3 text-base text-white outline-none placeholder:text-white/30 focus:border-arrow-cyan md:text-sm"
          />
          <button type="submit" disabled={!input.trim() || busy || Boolean(typing)} aria-label="Send" className="grid size-10 shrink-0 place-items-center bg-brand text-white transition-opacity disabled:opacity-40">
            <ArrowUp className="size-4" />
          </button>
        </form>
      </section>
    </>
  );
}
