import clsx from 'clsx';
import { Download, Gauge, ScanLine } from 'lucide-react';
import { useMode } from '../modes';
import { useLive } from '../live';
import { toggleXray } from './XRayLens';
import { toggleHud } from './DevHUD';
import { installApp, useInstallable } from '../pwa';

const chip = 'flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors';
const idle = 'border-white/15 bg-ink/90 text-mute hover:border-arrow-cyan hover:text-white';
const active = 'border-arrow-cyan bg-[#0d2a33] text-arrow-cyan';

/** Bottom-left toolbar: X-ray lens, dev HUD and the live visitor count. */
export default function Dock() {
  const xray = useMode('xray');
  const hud = useMode('hud');
  const live = useLive();
  const installable = useInstallable();

  return (
    <div className="fixed bottom-5 left-3 z-[61] flex gap-2 md:left-5">
      <button type="button" onClick={toggleXray} aria-pressed={xray} title="X-ray: see the code (X)" className={clsx(chip, xray ? active : idle)}>
        <ScanLine className={clsx('size-4', !xray && 'xray-blink')} />
        X-ray <kbd className="hidden border border-current/40 px-1 md:inline">X</kbd>
      </button>
      <button type="button" onClick={toggleHud} aria-pressed={hud} title="Developer HUD (D)" className={clsx(chip, 'hidden sm:flex', hud ? active : idle)}>
        <Gauge className="size-4" />
        HUD <kbd className="hidden border border-current/40 px-1 md:inline">D</kbd>
      </button>
      {installable && (
        <button type="button" onClick={installApp} title="Install this site as an app" className={clsx(chip, idle)}>
          <Download className="size-4" /> App
        </button>
      )}
      {live.status === 'live' && (
        <p className={clsx(chip, 'border-arrow-pink/40 bg-ink/90 text-arrow-pink')} title="People on the site right now">
          <span className="live-dot" />
          {live.count} live
        </p>
      )}
    </div>
  );
}
