import { useId, useMemo } from 'react';

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Stable 32-bit string hash (FNV-1a). */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

/* ---------- Orbit constellation (planet = the person) ---------- */

const W = 320;
const H = 240;
const CX = 160;
const CY = 120;
const TILT = (-14 * Math.PI) / 180;

/** Point on the tilted orbital ellipse, with radial offset k (1 = on ring). */
function onRing(angle: number, k: number) {
  const x = Math.cos(angle) * 128 * k;
  const y = Math.sin(angle) * 62 * k;
  return {
    x: CX + x * Math.cos(TILT) - y * Math.sin(TILT),
    y: CY + x * Math.sin(TILT) + y * Math.cos(TILT),
  };
}

export interface OrbitLove { id: string; text: string }
export interface OrbitGift { id: string; loveId: string | null; saved?: boolean }

type Pt = { id: string; x: number; y: number; a: number; r: number; gold: boolean };

function lovePoints(loves: OrbitLove[]): Pt[] {
  return loves
    .map((l, index) => {
      const h = hash(`${l.id}|${l.text}`);
      // A golden-angle sequence spreads each new love around the whole orbit.
      // Unlike random angles it cannot put most of a small constellation in
      // one corner; appending a chip leaves existing positions unchanged.
      const a = (index * 2.399963229728653 - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const k = 0.94 + (((h >>> 12) % 100) / 100) * 0.16;
      const p = onRing(a, k);
      return { id: l.id, x: p.x, y: p.y, a, r: 2.2 + ((h >>> 20) % 10) / 10, gold: (h >>> 8) % 3 === 0 };
    })
    .sort((p, q) => p.a - q.a);
}

const HERO: OrbitLove[] = Array.from({ length: 8 }, (_, i) => ({ id: `hero-${i}`, text: String(i * 7 + 3) }));

function Star({ x, y, r, gold, glow, i, cls = 'orb-star' }: { x: number; y: number; r: number; gold: boolean; glow: string; i: number; cls?: string }) {
  return (
    <g className={cls} style={{ ['--i' as string]: i, transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r={r * 3.2} fill={gold ? 'hsl(44 90% 70% / 0.16)' : 'hsl(48 60% 96% / 0.12)'} />
      <circle cx={x} cy={y} r={r} fill={gold ? 'hsl(44 92% 74%)' : 'hsl(48 60% 96%)'} filter={`url(#${glow})`} />
    </g>
  );
}

export function OrbitConstellation({
  loves,
  gifts = [],
  className = '',
  size,
}: {
  loves: OrbitLove[];
  gifts?: OrbitGift[];
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const ids = { pl: `pl${uid}`, ring: `rg${uid}`, glow: `gl${uid}`, halo: `ha${uid}` };
  const pts = useMemo(() => lovePoints(loves), [loves]);
  const byId = useMemo(() => new Map(pts.map((p) => [p.id, p])), [pts]);

  const giftPts = gifts.map((g, i) => {
    const src = g.loveId ? byId.get(g.loveId) : undefined;
    // Six separated positions stay distinguishable even when several gifts
    // come from the same love. Each line still points to its real source.
    const p = onRing(-Math.PI / 2 + (i / Math.max(1, gifts.length)) * Math.PI * 2, 1.34);
    return { ...g, x: p.x, y: p.y, src };
  });

  return (
    <svg
      viewBox={gifts.length ? '-35 -5 390 250' : `0 0 ${W} ${H}`}
      width={size}
      height={size ? (size * H) / W : undefined}
      className={className}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <radialGradient id={ids.pl} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(266 85% 86%)" />
          <stop offset="45%" stopColor="hsl(262 55% 52%)" />
          <stop offset="100%" stopColor="hsl(238 55% 16%)" />
        </radialGradient>
        <radialGradient id={ids.halo}>
          <stop offset="55%" stopColor="hsl(262 70% 60% / 0.22)" />
          <stop offset="100%" stopColor="hsl(262 70% 60% / 0)" />
        </radialGradient>
        <linearGradient id={ids.ring} x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(42 80% 70% / 0)" />
          <stop offset="50%" stopColor="hsl(42 80% 70% / 0.85)" />
          <stop offset="100%" stopColor="hsl(42 80% 70% / 0)" />
        </linearGradient>
        <filter id={ids.glow} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r="78" fill={`url(#${ids.halo})`} />
      <circle cx={CX} cy={CY} r="46" fill={`url(#${ids.pl})`} />
      <ellipse cx={CX} cy={CY} rx="128" ry="62" fill="none" stroke="hsl(262 60% 82% / 0.16)" strokeDasharray="2 6" transform={`rotate(-14 ${CX} ${CY})`} />
      <ellipse cx={CX} cy={CY + 3} rx="76" ry="13" fill="none" stroke={`url(#${ids.ring})`} strokeWidth="2.2" transform={`rotate(-14 ${CX} ${CY})`} />

      {pts.length === 1 && (
        <line x1={CX} y1={CY} x2={pts[0].x} y2={pts[0].y} stroke="hsl(44 80% 70%)" strokeOpacity="0.5" strokeWidth="1" className="orb-line" style={{ ['--len' as string]: 160, strokeDasharray: 160 }} />
      )}
      {pts.length > 1 &&
        pts.map((p, i) => {
          if (i === 0 && pts.length < 3) return null;
          const q = pts[(i + 1) % pts.length];
          if (i === pts.length - 1 && pts.length < 3) return null;
          const len = Math.hypot(q.x - p.x, q.y - p.y);
          return (
            <line key={`l-${p.id}-${q.id}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="hsl(44 80% 70%)" strokeOpacity="0.5" strokeWidth="1" className="orb-line" style={{ ['--len' as string]: len, ['--i' as string]: i, strokeDasharray: len }} />
          );
        })}
      {pts.length === 2 && (
        <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="hsl(44 80% 70%)" strokeOpacity="0.5" strokeWidth="1" className="orb-line" style={{ ['--len' as string]: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), strokeDasharray: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) }} />
      )}

      {giftPts.map((g, i) =>
        g.src ? (
          <line key={`gl-${g.id}`} x1={g.src.x} y1={g.src.y} x2={g.x} y2={g.y} stroke="hsl(44 80% 70%)" strokeOpacity="0.45" strokeWidth="1" className="orb-line gift-line" style={{ ['--len' as string]: Math.hypot(g.x - g.src.x, g.y - g.src.y), ['--i' as string]: i, strokeDasharray: Math.hypot(g.x - g.src.x, g.y - g.src.y) }} />
        ) : null,
      )}

      {pts.map((p, i) => (
        <Star key={p.id} x={p.x} y={p.y} r={p.r} gold={p.gold} glow={ids.glow} i={i} />
      ))}
      {giftPts.map((g, i) => (
        <Star key={g.id} x={g.x} y={g.y} r={g.saved ? 3.4 : 2.8} gold glow={ids.glow} i={i} cls="orb-star gift-star" />
      ))}
    </svg>
  );
}

/** Decorative planet hero: the person, with a drawn constellation on the orbit. */
export function Planet({ size = 220, className = '' }: { size?: number; className?: string }) {
  return <OrbitConstellation loves={HERO} size={size} className={className} />;
}

/** Small wrapped gift box with bow, starred and joined in gold. */
export function Mark({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const glow = `mk${uid}`;
  // box corners, lid corners, bow loops, knot
  const stars: [number, number, boolean][] = [
    [7, 13, false], [29, 13, false], [8, 23, false], [28, 23, false],
    [11, 4, true], [25, 4, false], [18, 9, true], [5.5, 9.5, false], [30.5, 9.5, false],
  ];
  return (
    <svg viewBox="0 0 36 26" className={className} aria-hidden="true" overflow="visible">
      <defs>
        <filter id={glow} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g fill="none" stroke="hsl(44 80% 70%)" strokeWidth="0.6" strokeOpacity="0.6" strokeLinejoin="round">
        <polyline points="5.5,9.5 30.5,9.5 29,13 28,23 8,23 7,13 5.5,9.5" />
        <line x1="7" y1="13" x2="29" y2="13" />
        <line x1="18" y1="9.5" x2="18" y2="23" />
        <path d="M18 9 C14 2, 9 2, 11 4 C12 6, 15 8, 18 9 C21 8, 24 6, 25 4 C27 2, 22 2, 18 9" />
      </g>
      {stars.map(([x, y, g], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={g ? 2.4 : 1.8} fill={g ? 'hsl(44 92% 72% / 0.22)' : 'hsl(48 60% 96% / 0.16)'} />
          <circle cx={x} cy={y} r={g ? 1.15 : 0.85} fill={g ? 'hsl(44 92% 74%)' : 'hsl(48 60% 96%)'} filter={`url(#${glow})`} />
        </g>
      ))}
    </svg>
  );
}
