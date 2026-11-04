import { ArrowUp } from 'lucide-react';
import { SITE } from '../config';
import { useT } from '../i18n';

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-white/10">
      <div className="shell flex flex-col gap-4 py-8 text-[11px] tracking-[0.2em] text-mute uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.name} — {t('hero.title')}
        </p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2 uppercase hover:text-white"
        >
          {t('footer.top')}
          <ArrowUp className="size-4 transition-transform group-hover:-translate-y-1" />
        </button>
      </div>
    </footer>
  );
}
