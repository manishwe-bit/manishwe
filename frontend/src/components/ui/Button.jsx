import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';

/**
 * Framed button. The construction engine traces its border ([data-button])
 * and, for solid buttons, sweeps in the red fill.
 */
export default function Button({ href, variant = 'solid', size = 'md', icon = true, className, children, ...rest }) {
  const solid = variant === 'solid';
  return (
    <a
      href={href}
      data-button
      data-trace
      data-trace-radius="48"
      {...(solid ? { 'data-solid': '' } : {})}
      className={clsx(
        'btn group relative inline-flex items-center border border-white/10 font-semibold uppercase tracking-[0.22em] text-white outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        solid && 'btn-solid',
        size === 'sm' ? 'px-5 py-3 text-[10px]' : 'px-7 py-4 text-[11px]',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="btn-fill absolute inset-0 bg-brand" />
      <span data-frame-content className="relative z-10 flex items-center gap-3">
        {children}
        {icon && <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
      </span>
    </a>
  );
}
