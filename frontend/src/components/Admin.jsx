import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { LogOut, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

// Admin dashboard at #/admin (not linked anywhere). The key is the backend's ADMIN_KEY (Render > Environment).
const KEY_STORE = 'admin-key';
const BAR = '#0ea5c6'; // single-series bar colour, validated for the dark surface
const STATUSES = ['new', 'replied', 'done'];
const STATUS_STYLE = {
  new: 'border-brand text-brand',
  replied: 'border-[#f8b26a] text-[#f8b26a]',
  done: 'border-[#9ef0a4] text-[#9ef0a4]',
};

const readKey = () => {
  try {
    return sessionStorage.getItem(KEY_STORE) ?? '';
  } catch {
    return '';
  }
};

async function api(path, key, options = {}) {
  const r = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key, ...options.headers } });
  if (r.status === 401) throw new Error('unauthorized');
  if (!r.ok) throw new Error(`Request failed (${r.status})`);
  return r.json();
}

const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function Login({ onKey, error }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onKey(value.trim());
      }}
      className="mx-auto mt-10 max-w-md border border-white/10 bg-ink-2 p-8"
    >
      <h1 className="font-display text-4xl uppercase">Admin</h1>
      <p className="mt-2 text-sm text-mute">Enter the ADMIN_KEY from your Render service's Environment settings.</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        aria-label="Admin key"
        className="mt-6 h-12 w-full border border-white/15 bg-ink px-4 text-base outline-none focus:border-brand"
      />
      {error && <p className="mt-3 text-sm text-brand">{error}</p>}
      <button type="submit" disabled={!value.trim()} className="mt-5 h-12 w-full bg-brand text-[11px] font-semibold tracking-[0.22em] uppercase disabled:opacity-50">
        Unlock dashboard
      </button>
    </form>
  );
}

function Tile({ label, value, accent }) {
  return (
    <div className="bg-ink-2 p-5">
      <p className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">{label}</p>
      <p className={clsx('mt-2 font-display text-5xl', accent)}>{value}</p>
    </div>
  );
}

/** 14-day page views: one series, bars anchored to the baseline, hover/focus tooltip, table for screen readers. */
function ViewsChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...days.map((d) => d.views));
  const label = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return (
    <figure className="bg-ink-2 p-5">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">Page views · last 14 days</span>
        <span className="text-xs text-mute">peak {max}</span>
      </figcaption>
      <div className="relative mt-6 flex h-44 items-end gap-0.5 border-b border-white/15" aria-hidden="true">
        {[0.5, 1].map((f) => (
          <span key={f} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${f * 100}%` }} />
        ))}
        {days.map((d, i) => (
          <button
            key={d.day}
            type="button"
            tabIndex={-1}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="group relative flex h-full flex-1 items-end"
          >
            <span
              className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0, background: BAR }}
            />
            {hover === i && (
              <span className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 border border-white/15 bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
                {label(d.day)} · <b>{d.views}</b> views
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-mute" aria-hidden="true">
        <span>{label(days[0].day)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>Page views per day</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function TopPages({ pages }) {
  const max = Math.max(1, ...pages.map((p) => p.views));
  return (
    <div className="bg-ink-2 p-5">
      <p className="text-[10px] font-semibold tracking-[0.3em] text-mute uppercase">Top pages · 14 days</p>
      {pages.length === 0 && <p className="mt-4 text-sm text-mute">No views recorded yet.</p>}
      <ul className="mt-4 space-y-3">
        {pages.map((p) => (
          <li key={p.page}>
            <div className="flex justify-between text-sm">
              <span className="capitalize">{p.page}</span>
              <span className="text-mute tabular-nums">{p.views}</span>
            </div>
            <div className="mt-1 h-1.5 bg-white/[0.06]">
              <div className="h-full rounded-r-[4px]" style={{ width: `${(p.views / max) * 100}%`, background: BAR }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Enquiry({ m, onStatus }) {
  const digits = (m.phone || '').replace(/\D/g, '');
  const wa = digits.length >= 10 ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : null;
  return (
    <article className="border border-white/10 bg-ink-2 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{m.name}</p>
          <p className="text-sm text-mute">
            {m.email}
            {m.phone && ` · ${m.phone}`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-mute">
          <span className="border border-white/15 px-2 py-0.5">{m.source || 'Contact form'}</span>
          {ago(m.created_at)}
        </div>
      </header>
      {(m.need || m.budget || m.timeline) && (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {[m.need, m.budget, m.timeline].filter(Boolean).map((x) => (
            <li key={x} className="bg-white/[0.06] px-2 py-1">
              {x}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 whitespace-pre-wrap text-white/85">{m.message}</p>
      <footer className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your website enquiry')}`}
          className="flex items-center gap-2 bg-brand px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase hover:bg-brand-dark"
        >
          <Mail className="size-3.5" /> Reply
        </a>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase hover:border-white">
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
        )}
        <div className="ml-auto flex" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={m.status === s}
              onClick={() => onStatus(m.id, s)}
              className={clsx('border px-3 py-1.5 text-[11px] capitalize', m.status === s ? STATUS_STYLE[s] : 'border-white/10 text-mute hover:text-white')}
            >
              {s}
            </button>
          ))}
        </div>
      </footer>
    </article>
  );
}

export default function Admin() {
  const [key, setKey] = useState(readKey);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([api('/api/stats', key), api('/api/messages?limit=200', key)]);
      setStats(s);
      setMessages(m);
      setError('');
      try {
        sessionStorage.setItem(KEY_STORE, key);
      } catch {
        // Storage blocked: you'll be asked for the key again next visit.
      }
    } catch (e) {
      if (e.message === 'unauthorized') {
        setKey('');
        setError('That key was not accepted.');
      } else setError(e.message === 'Failed to fetch' ? 'Could not reach the server (it may be waking up).' : e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
    if (!key) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load, key]);

  const counts = useMemo(() => Object.fromEntries(['all', ...STATUSES].map((s) => [s, s === 'all' ? messages.length : messages.filter((m) => m.status === s).length])), [messages]);
  const shown = filter === 'all' ? messages : messages.filter((m) => m.status === filter);

  const setStatus = async (id, status) => {
    const before = messages;
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    try {
      await api(`/api/messages/${id}`, key, { method: 'PATCH', body: JSON.stringify({ status }) });
    } catch {
      setMessages(before);
      setError('Could not update the status. Try again.');
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(KEY_STORE);
    } catch {
      // nothing stored
    }
    setKey('');
    setStats(null);
    setMessages([]);
  };

  return (
    <section className="shell min-h-svh pt-28 pb-24">
      {!key || !stats ? (
        key && !error ? (
          <p className="mt-10 text-center text-mute">Loading dashboard…</p>
        ) : (
          <Login onKey={setKey} error={error} />
        )
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.35em] text-brand uppercase">Admin</p>
              <h1 className="mt-2 font-display text-5xl uppercase md:text-6xl">Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={load} className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[11px] tracking-[0.15em] uppercase hover:border-white">
                <RefreshCw className={clsx('size-3.5', loading && 'animate-spin')} /> Refresh
              </button>
              <button type="button" onClick={logout} className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[11px] tracking-[0.15em] uppercase hover:border-white">
                <LogOut className="size-3.5" /> Lock
              </button>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-brand">{error}</p>}

          <div className="mt-8 grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
            <Tile label="Views today" value={stats.days.at(-1).views} />
            <Tile label="Views · 14 days" value={stats.days.reduce((s, d) => s + d.views, 0)} />
            <Tile label="New enquiries" value={counts.new} accent={counts.new ? 'text-brand' : ''} />
            <Tile label="Live right now" value={stats.live} />
          </div>

          <div className="mt-px grid gap-px bg-white/10 lg:grid-cols-[2fr_1fr]">
            <ViewsChart days={stats.days} />
            <TopPages pages={stats.pages} />
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl uppercase">Enquiries</h2>
            <div className="flex" role="tablist" aria-label="Filter enquiries">
              {['new', 'replied', 'done', 'all'].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={filter === s}
                  onClick={() => setFilter(s)}
                  className={clsx('border px-3 py-2 text-[11px] capitalize', filter === s ? 'border-white bg-white text-ink' : 'border-white/10 text-mute hover:text-white')}
                >
                  {s} ({counts[s]})
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {shown.length === 0 && <p className="border border-white/10 p-8 text-center text-mute">Nothing here.</p>}
            {shown.map((m) => (
              <Enquiry key={m.id} m={m} onStatus={setStatus} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
