import { useMemo } from 'react';

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Starfield({ count = 80 }: { count?: number }) {
  const stars = useMemo(() => {
    const r = rand(42);
    return Array.from({ length: count }, (_, i) => {
      const size = r() < 0.12 ? 3 : r() < 0.5 ? 2 : 1.2;
      return {
        i,
        left: r() * 100,
        top: r() * 100,
        size,
        d: 3 + r() * 5,
        delay: -r() * 6,
        tone: r() < 0.14 ? 'gold' : r() < 0.25 ? 'violet' : '',
      };
    });
  }, [count]);
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.i}
          className={`star ${s.tone}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            ['--d' as string]: `${s.d}s`,
            ['--delay' as string]: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Decorative planet with a faint constellation halo. */
export function Planet({ size = 220, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="pl" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(262 80% 86%)" />
          <stop offset="45%" stopColor="hsl(258 50% 52%)" />
          <stop offset="100%" stopColor="hsl(236 55% 16%)" />
        </radialGradient>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(42 80% 70% / 0)" />
          <stop offset="50%" stopColor="hsl(42 80% 70% / 0.9)" />
          <stop offset="100%" stopColor="hsl(42 80% 70% / 0)" />
        </linearGradient>
      </defs>
      <g className="orbit-ring" style={{ transformOrigin: '110px 110px' }}>
        <circle cx="110" cy="110" r="100" fill="none" stroke="hsl(262 60% 80% / 0.18)" strokeDasharray="2 7" />
        <circle cx="110" cy="10" r="3" fill="hsl(42 80% 70%)" />
        <circle cx="200" cy="140" r="2" fill="hsl(262 80% 86%)" />
        <circle cx="30" cy="160" r="2.4" fill="hsl(48 90% 90%)" />
      </g>
      <circle cx="110" cy="110" r="52" fill="url(#pl)" />
      <ellipse cx="110" cy="114" rx="86" ry="16" fill="none" stroke="url(#ring)" strokeWidth="2.5" transform="rotate(-14 110 110)" />
    </svg>
  );
}

/** Small constellation mark used in the shell. */
export function Mark({ className = '' }: { className?: string }) {
  const pts = [[2, 20], [14, 6], [24, 16], [36, 4], [46, 18]];
  return (
    <svg viewBox="0 0 48 24" className={className} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 3 ? 2.6 : 1.8} fill="currentColor" />
      ))}
    </svg>
  );
}
