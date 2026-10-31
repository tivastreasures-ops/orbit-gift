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

export const W = 320;
export const H = 240;
export const CX = 160;
export const CY = 120;
const TILT = (-14 * Math.PI) / 180;

/** Point on the tilted orbital ellipse, with radial offset k (1 = on ring). */
export function onRing(angle: number, k: number) {
  const x = Math.cos(angle) * 128 * k;
  const y = Math.sin(angle) * 62 * k;
  return {
    x: CX + x * Math.cos(TILT) - y * Math.sin(TILT),
    y: CY + x * Math.sin(TILT) + y * Math.cos(TILT),
  };
}

export interface OrbitLove { id: string; text: string }
export interface OrbitGift { id: string; loveId: string | null; saved?: boolean }

export type Pt = { id: string; x: number; y: number; a: number; k: number; r: number; gold: boolean };

export function lovePoints(loves: OrbitLove[]): Pt[] {
  return loves
    .map((l, index) => {
      const h = hash(`${l.id}|${l.text}`);
      // A golden-angle sequence spreads each new love around the whole orbit.
      // Unlike random angles it cannot put most of a small constellation in
      // one corner; appending a chip leaves existing positions unchanged.
      const a = (index * 2.399963229728653 - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const k = 0.94 + (((h >>> 12) % 100) / 100) * 0.16;
      const p = onRing(a, k);
      return { id: l.id, x: p.x, y: p.y, a, k, r: 2.2 + ((h >>> 20) % 10) / 10, gold: (h >>> 8) % 3 === 0 };
    })
    .sort((p, q) => p.a - q.a);
}

/** Gift stars sit on this outer ring (radius well above the planet). */
export const GIFT_K = 1.34;

/**
 * Path that follows the tilted ellipse from (a1,k1) to (a2,k2). Ring radii
 * stay >= 0.94 (min ~58 units from centre vs. planet radius 46), so a path
 * never crosses the central planet.
 */
export function ringPath(a1: number, k1: number, a2: number, k2: number, start = true) {
  const steps = Math.max(4, Math.ceil(Math.abs(a2 - a1) / 0.1));
  let d = '';
  let len = 0;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = onRing(a1 + (a2 - a1) * t, k1 + (k2 - k1) * t);
    d += `${i === 0 ? (start ? 'M' : 'L') : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    if (prev) len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return { d, len };
}

/** Consecutive (angle-sorted) loves joined along the ring: no chords, no crossings. */
export function loveArcs(pts: Pt[]) {
  if (pts.length < 2) return [];
  const out: { key: string; d: string; len: number; from: string; to: string }[] = [];
  const n = pts.length === 2 ? 1 : pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const a2 = q.a <= p.a ? q.a + Math.PI * 2 : q.a;
    const { d, len } = ringPath(p.a, p.k, a2, q.k);
    out.push({ key: `${p.id}-${q.id}`, d, len, from: p.id, to: q.id });
  }
  return out;
}

/** Source star -> radially out to the gift ring -> along the outer ring to the gift. */
export function giftRoute(src: Pt, giftAngle: number) {
  const a = onRing(src.a, src.k);
  const b = onRing(src.a, GIFT_K);
  let delta = giftAngle - src.a;
  delta = ((delta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const arc = ringPath(src.a, GIFT_K, src.a + delta, GIFT_K, false);
  return { d: `M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)} ${arc.d}`, len: Math.hypot(b.x - a.x, b.y - a.y) + arc.len };
}

export const giftAngle = (i: number, n: number) => -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;

const HERO: OrbitLove[] = Array.from({ length: 8 }, (_, i) => ({ id: `hero-${i}`, text: String(i * 7 + 3) }));

export function Star({ x, y, r, gold, glow, i, cls = 'orb-star' }: { x: number; y: number; r: number; gold: boolean; glow: string; i: number; cls?: string }) {
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
    const a = giftAngle(i, gifts.length);
    const p = onRing(a, GIFT_K);
    return { ...g, a, x: p.x, y: p.y, src };
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

      {loveArcs(pts).map((l, i) => (
        <path key={`l-${l.key}`} d={l.d} fill="none" stroke="hsl(44 80% 70%)" strokeOpacity="0.5" strokeWidth="1" className="orb-line" style={{ ['--len' as string]: l.len, ['--i' as string]: i, strokeDasharray: l.len }} />
      ))}
      {giftPts.map((g, i) => {
        if (!g.src) return null;
        const r = giftRoute(g.src, g.a);
        return <path key={`gl-${g.id}`} d={r.d} fill="none" stroke="hsl(44 80% 70%)" strokeOpacity="0.45" strokeWidth="1" className="orb-line gift-line" style={{ ['--len' as string]: r.len, ['--i' as string]: i, strokeDasharray: r.len }} />;
      })}

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
