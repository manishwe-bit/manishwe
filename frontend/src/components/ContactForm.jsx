import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, Mail } from 'lucide-react';
import { API_URL, SERVICES, SITE } from '../config';
import { useT } from '../i18n';

const FIELD =
  'w-full border border-white/15 bg-ink/60 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand';
const LABEL = 'mb-2 block text-[10px] font-semibold tracking-[0.3em] text-mute uppercase';

const NEEDS = ['New website', 'Online store', 'Website like a Showcase example', ...SERVICES.map((s) => s.title), 'Something else'];
const BUDGETS = ['₹2,000 – ₹5,000 (basic)', '₹10,000 (complete website)', '₹10,000 – ₹25,000 (more features)', '₹25,000 – ₹50,000 (advanced)', 'Not sure yet'];
const TIMELINES = ['As soon as possible', 'Within 2 weeks', 'Within a month', 'Flexible'];

// Other pages (the Showcase player) can pre-fill the form: setContactPrefill({ need, message }).
const PREFILL = 'contact-prefill';
export function setContactPrefill(values) {
  try {
    sessionStorage.setItem(PREFILL, JSON.stringify(values));
  } catch {
    // Storage blocked: the form just starts empty.
  }
}
function readPrefill() {
  try {
    return JSON.parse(sessionStorage.getItem(PREFILL)) ?? {};
  } catch {
    return {};
  }
}

function Select({ name, label, options, defaultValue }) {
  const t = useT();
  return (
    <label>
      <span className={LABEL}>{label}</span>
      <select name={name} defaultValue={defaultValue ?? ''} className={`${FIELD} appearance-none`}>
        <option value="">{t('form.choose')}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Contact / project requirement form. POST /api/contact saves it and emails it to Manish. */
export default function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');
  const [prefill] = useState(readPrefill);
  const [waking, setWaking] = useState(false);
  const [draft, setDraft] = useState(null);
  const t = useT();

  // Use the pre-fill once; a later visit to Contact starts empty.
  useEffect(() => {
    try {
      sessionStorage.removeItem(PREFILL);
    } catch {
      // Storage blocked: nothing to clear.
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setDraft(values);
    setStatus('sending');
    setWaking(false);
    setError('');
    // A free server that was asleep needs up to a minute to wake: say so, and try twice before giving up.
    const wakingTimer = setTimeout(() => setWaking(true), 6000);
    try {
      let res;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch(`${API_URL}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
            signal: AbortSignal.timeout(75000),
          });
          if (![502, 503, 504].includes(res.status)) break;
        } catch (err) {
          if (attempt === 1) throw err;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(res.status === 422 ? t('form.invalid') : data.detail || t('form.error'));
      }
      form.reset();
      setDraft(null);
      setStatus('sent');
    } catch (err) {
      const network = err.name === 'TimeoutError' || err.name === 'AbortError' || err.message === 'Failed to fetch';
      setError(network ? t('form.offline') : err.message);
      setStatus('error');
    } finally {
      clearTimeout(wakingTimer);
      setWaking(false);
    }
  }

  // Last resort when the server can't be reached: the visitor's own email app, pre-filled for Manish.
  const mailtoHref = draft
    ? `mailto:${SITE.email}?subject=${encodeURIComponent(`Website enquiry from ${draft.name}`)}&body=${encodeURIComponent(
        `${[`Name: ${draft.name}`, `Email: ${draft.email}`, draft.phone && `Phone: ${draft.phone}`, draft.need && `Need: ${draft.need}`, draft.budget && `Budget: ${draft.budget}`, draft.timeline && `Timeline: ${draft.timeline}`]
          .filter(Boolean)
          .join('\n')}\n\n${draft.message}`,
      )}`
    : null;

  return (
    <form data-box data-swarm-avoid onSubmit={onSubmit} className="relative grid gap-5 border border-white/10 p-6 md:p-10">
      <div data-frame-content className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={LABEL}>{t('form.name')}</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={FIELD} placeholder={t('form.namePh')} />
        </label>
        <label>
          <span className={LABEL}>{t('form.email')}</span>
          <input name="email" type="email" required autoComplete="email" className={FIELD} placeholder="you@example.com" />
        </label>
        <label>
          <span className={LABEL}>{t('form.phone')}</span>
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={FIELD} placeholder="+91 …" />
        </label>
        <Select name="need" label={t('form.need')} options={NEEDS} defaultValue={prefill.need} />
        <Select name="budget" label={t('form.budget')} options={BUDGETS} />
        <Select name="timeline" label={t('form.timeline')} options={TIMELINES} />
      </div>
      <label data-frame-content>
        <span className={LABEL}>{t('form.req')}</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          defaultValue={prefill.message}
          className={`${FIELD} resize-y`}
          placeholder={t('form.reqPh')}
        />
      </label>
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />

      <div data-frame-content className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="group inline-flex items-center gap-3 bg-brand px-7 py-4 text-[11px] font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {status === 'sending' ? t('form.sending') : t('form.send')}
          {status === 'sending' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </button>
        <p role="status" aria-live="polite" className={status === 'error' ? 'text-sm text-brand' : 'text-sm text-white/70'}>
          {status === 'sending' && waking && t('form.waking')}
          {status === 'sent' && t('form.sent')}
          {status === 'error' && error}
        </p>
        {status === 'error' && mailtoHref && (
          <a href={mailtoHref} className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-white uppercase hover:border-brand">
            <Mail className="size-4" /> {t('form.mailto')}
          </a>
        )}
      </div>
    </form>
  );
}
