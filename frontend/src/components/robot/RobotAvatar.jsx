import { useEffect, useRef } from 'react';
import clsx from 'clsx';

/**
 * MK-01's head. Eyes follow the pointer and blink; the state changes the face:
 * idle · thinking (eyes scan, antenna flashes) · speaking (mouth equaliser) · listening (ears glow).
 */
export default function RobotAvatar({ state = 'idle', size = 44, className }) {
  const svg = useRef(null);

  useEffect(() => {
    const el = svg.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let p = null;
    const look = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const dx = p.x - (r.left + r.width / 2);
      const dy = p.y - (r.top + r.height / 2);
      const k = Math.min(1, Math.hypot(dx, dy) / 300);
      const a = Math.atan2(dy, dx);
      el.style.setProperty('--ex', `${(Math.cos(a) * 4 * k).toFixed(2)}px`);
      el.style.setProperty('--ey', `${(Math.sin(a) * 3 * k).toFixed(2)}px`);
    };
    const onMove = (e) => {
      p = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(look);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <svg ref={svg} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={clsx('robot', `robot--${state}`, className)}>
      <line x1="50" y1="19" x2="50" y2="9" stroke="#3a4280" strokeWidth="3" strokeLinecap="round" />
      <circle className="robot-antenna" cx="50" cy="8" r="5" />
      <rect className="robot-ear" x="8" y="38" width="10" height="20" rx="4" />
      <rect className="robot-ear" x="82" y="38" width="10" height="20" rx="4" />
      <rect x="16" y="18" width="68" height="60" rx="18" fill="#161a38" stroke="#353c78" strokeWidth="2" />
      <rect x="25" y="28" width="50" height="38" rx="11" fill="#05070d" />
      <g className="robot-eyes">
        <rect className="robot-eye" x="35" y="37" width="10" height="12" rx="5" />
        <rect className="robot-eye" x="55" y="37" width="10" height="12" rx="5" />
      </g>
      <g className="robot-mouth">
        {[40, 45, 50, 55, 60].map((x, i) => (
          <rect key={x} x={x - 1.5} y="55" width="3" height="5" rx="1.5" style={{ animationDelay: `${i * -0.13}s` }} />
        ))}
      </g>
      <circle cx="26" cy="72" r="1.8" fill="#f04444" opacity="0.8" />
      <circle cx="32" cy="72" r="1.8" fill="#65e8ff" opacity="0.6" />
    </svg>
  );
}
