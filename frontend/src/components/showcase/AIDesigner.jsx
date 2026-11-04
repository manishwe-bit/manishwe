import { useEffect, useRef, useState } from 'react';
import { Wand } from 'lucide-react';
import { API_URL } from '../../config';
import RobotAvatar from '../robot/RobotAvatar';
import { takePendingDesign } from '../robot/actions';
import { useT } from '../../i18n';

const EXAMPLES = [
  'Sweet Crumbs, a home bakery in Raipur selling custom cakes',
  'Mera Bilaspur mein ek unisex salon hai, naam Glow Studio',
  'A JEE/NEET coaching institute with online classes',
  'Paws & Claws, a pet clinic with grooming and vaccinations',
];
const STEPS = ['Analysing your business…', 'Choosing a colour palette…', 'Writing the copy…', 'Planning the sections…', 'Picking icons and layout…', 'Almost there…'];

/**
 * AI Website Generator: the visitor describes their business, Claude designs a site
 * (POST /api/generate), and the build player constructs it live.
 */
export default function AIDesigner({ onDesigned }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const box = useRef(null);
  const t = useT();

  async function design(description) {
    const d = description.trim();
    if (d.length < 8 || busy) return;
    setBusy(true);
    setError('');
    setStep(0);
    try {
      const r = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: d }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : 'Please describe your business in a few more words.');
      onDesigned(j.demo);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Could not reach the AI designer (the server may be waking up). Try again in a minute.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  // Cycle the progress lines while Claude designs.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600);
    return () => clearInterval(id);
  }, [busy]);

  // MK-01 can ask for a design: pending from before this page mounted, or live via an event.
  useEffect(() => {
    const run = (description) => {
      setText(description);
      box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      design(description);
    };
    const pending = takePendingDesign();
    if (pending) run(pending);
    const onDesign = (e) => run(e.detail);
    window.addEventListener('showcase:design', onDesign);
    return () => window.removeEventListener('showcase:design', onDesign);
  }, []);

  return (
    <div ref={box} data-reveal className="ai-designer relative mb-16 overflow-hidden border border-arrow-cyan/30 bg-ink-2 p-6 md:p-10">
      <span className="robot-scan" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
        <RobotAvatar state={busy ? 'thinking' : 'idle'} size={88} className="hidden lg:block" />
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-arrow-cyan uppercase">{t('gen.kicker')}</p>
          <h3 className="mt-3 font-display text-4xl uppercase md:text-5xl">{t('gen.title')}</h3>
          <p className="mt-3 max-w-2xl text-white/70">{t('gen.text')}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              design(text);
            }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={600}
              disabled={busy}
              placeholder={t('gen.placeholder')}
              aria-label="Describe your business"
              className="h-13 min-w-0 flex-1 border border-white/15 bg-ink px-4 text-base text-white outline-none placeholder:text-white/30 focus:border-arrow-cyan disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || text.trim().length < 8}
              className="flex h-13 items-center justify-center gap-2 bg-brand px-6 text-[11px] font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              <Wand className="size-4" /> {busy ? t('gen.busy') : t('gen.button')}
            </button>
          </form>

          {busy ? (
            <p role="status" className="mt-4 flex items-center gap-2 font-mono text-xs text-arrow-cyan">
              <span className="robot-led robot-led--busy" /> {STEPS[step]}
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => {
                      setText(ex);
                      design(ex);
                    }}
                    className="border border-white/15 px-3 py-1.5 text-left text-xs text-white/70 transition-colors hover:border-arrow-cyan hover:text-white"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-brand">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
