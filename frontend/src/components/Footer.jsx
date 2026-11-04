import { ArrowUp } from 'lucide-react';
import { SITE } from '../config';

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="shell flex flex-col gap-4 py-8 text-[11px] tracking-[0.2em] text-mute uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.name} — {SITE.title}
        </p>
        <a href="#home" className="group flex items-center gap-2 hover:text-white">
          Back to top
          <ArrowUp className="size-4 transition-transform group-hover:-translate-y-1" />
        </a>
      </div>
    </footer>
  );
}
