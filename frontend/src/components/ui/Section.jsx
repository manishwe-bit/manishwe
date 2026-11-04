import clsx from 'clsx';

/** Section wrapper: scroll-constructed divider on top, constrained content. */
export function Section({ id, className, children }) {
  return (
    <section id={id} data-section className={clsx('relative py-28 md:py-40', className)}>
      <span data-divider className="edge left-0 top-0 w-full" />
      <div className="shell">{children}</div>
    </section>
  );
}

/** Index label + oversized masked heading. Use "\n" in title for line breaks. */
export function SectionHeading({ index, label, title, className }) {
  return (
    <div className={clsx('mb-14 md:mb-20', className)}>
      <p data-reveal className="mb-6 flex items-center gap-4 text-[11px] font-semibold tracking-[0.35em] text-mute uppercase">
        <span className="text-brand">{index}</span>
        <span className="h-px w-10 bg-white/20" />
        {label}
      </p>
      <h2 className="font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.92] uppercase">
        {title.split('\n').map((line) => (
          <span key={line} className="block overflow-hidden pb-1">
            <span data-mask-in className="block">
              {line}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
