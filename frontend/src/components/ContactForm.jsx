import { useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const FIELD =
  'w-full border border-white/15 bg-ink/60 px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand';
const LABEL = 'mb-2 block text-[10px] font-semibold tracking-[0.3em] text-mute uppercase';

/** Contact form posting to the FastAPI backend (POST /api/contact). */
export default function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          res.status === 422
            ? 'Please check your details: name, a valid email, and a message of at least 10 characters.'
            : data.detail || 'Something went wrong. Please try again.',
        );
      }
      form.reset();
      setStatus('sent');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Could not reach the server. Please try again in a minute.' : err.message);
      setStatus('error');
    }
  }

  return (
    <form data-box onSubmit={onSubmit} className="relative grid gap-5 border border-white/10 p-6 md:p-10">
      <div data-frame-content className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={LABEL}>Name</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={FIELD} placeholder="Your name" />
        </label>
        <label>
          <span className={LABEL}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={FIELD} placeholder="you@example.com" />
        </label>
      </div>
      <label data-frame-content>
        <span className={LABEL}>Message</span>
        <textarea name="message" required minLength={10} maxLength={3000} rows={5} className={`${FIELD} resize-y`} placeholder="Tell me about your project…" />
      </label>
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />

      <div data-frame-content className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="group inline-flex items-center gap-3 bg-brand px-7 py-4 text-[11px] font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending' : 'Send message'}
          {status === 'sending' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </button>
        <p role="status" aria-live="polite" className={status === 'error' ? 'text-sm text-brand' : 'text-sm text-white/70'}>
          {status === 'sent' && "Thanks! Your message has been sent. I'll get back to you soon."}
          {status === 'error' && error}
        </p>
      </div>
    </form>
  );
}
