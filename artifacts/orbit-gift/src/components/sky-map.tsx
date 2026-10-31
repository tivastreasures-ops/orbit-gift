import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { CX, CY, GIFT_K, giftAngle, giftRoute, loveArcs, lovePoints, onRing, type OrbitLove } from '@/components/starfield';
import { COPY } from '@/lib/copy';

export interface SkyGift { id: string; sourceIds: string[]; saved?: boolean }
export interface SkySelection { giftId: string; loveIds: string[] }

const BELT_K = 1.66;
const HINT_KEY = 'ow.skyHintSeen';
const LAV = 'hsl(262 72% 84%)';
const GOLD = 'hsl(44 92% 74%)';

function asteroidPath(x: number, y: number, seed: number) {
  const n = 7;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 2.2 + (((seed >>> (i * 3)) & 7) / 7) * 1.4;
    d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * r).toFixed(2)} ${(y + Math.sin(a) * r * 0.8).toFixed(2)} `;
  }
  return d + 'Z';
}

const press = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

export function SkyMap({
  loves,
  refusals,
  gifts,
  goldIds,
  counts,
  selected,
  label,
  className = '',
}: {
  loves: OrbitLove[];
  refusals: OrbitLove[];
  gifts: SkyGift[];
  goldIds: Set<string>;
  counts: Map<string, number>;
  selected: SkySelection | null;
  label: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const ids = { pl: `spl${uid}`, ring: `srg${uid}`, glow: `sgl${uid}`, halo: `sha${uid}` };
  const pts = useMemo(() => lovePoints(loves), [loves]);
  const byId = useMemo(() => new Map(pts.map((p) => [p.id, p])), [pts]);
  const text = useMemo(() => new Map(loves.map((l) => [l.id, l.text])), [loves]);
  const arcs = useMemo(() => loveArcs(pts), [pts]);
  const [detail, setDetail] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(HINT_KEY)) {
        setHint(true);
        window.sessionStorage.setItem(HINT_KEY, '1');
      }
    } catch {
      /* hint simply stays hidden */
    }
  }, []);

  const show = (s: string) => {
    setHint(false);
    setPreview(null);
    setDetail((d) => (d === s ? null : s));
  };
  const peek = (s: string) => {
    setHint(false);
    setPreview(s);
  };

  const hotLoves = new Set(selected?.loveIds ?? []);
  const anySel = !!selected;

  const giftPts = gifts.map((g, i) => {
    const a = giftAngle(i, gifts.length);
    const p = onRing(a, GIFT_K);
    return { ...g, a, x: p.x, y: p.y };
  });

  const belt = refusals.map((r, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) / Math.max(1, refusals.length)) * Math.PI * 2;
    const p = onRing(a, BELT_K + (i % 2 ? 0.05 : -0.03));
    let h = 2166136261;
    for (let j = 0; j < r.id.length; j++) h = Math.imul(h ^ r.id.charCodeAt(j), 16777619);
    return { ...r, x: p.x, y: p.y, d: asteroidPath(p.x, p.y, h >>> 0) };
  });

  return (
    <figure className={className} aria-label={label}>
      <svg viewBox="-62 -12 444 264" className="w-full h-auto" overflow="visible" role="group" aria-label={label}>
        <g aria-hidden="true">
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
          <ellipse cx={CX} cy={CY} rx={128 * BELT_K} ry={62 * BELT_K} fill="none" stroke="hsl(245 20% 60% / 0.08)" strokeWidth="9" transform={`rotate(-14 ${CX} ${CY})`} />
          <ellipse cx={CX} cy={CY + 3} rx="76" ry="13" fill="none" stroke={`url(#${ids.ring})`} strokeWidth="2.2" transform={`rotate(-14 ${CX} ${CY})`} />
          {arcs.map((l, i) => {
            const hot = hotLoves.has(l.from) && hotLoves.has(l.to);
            return (
              <path key={l.key} d={l.d} fill="none" stroke={hot ? GOLD : LAV} strokeOpacity={hot ? 0.95 : anySel ? 0.18 : 0.38} strokeWidth={hot ? 1.8 : 1} className="orb-line sky-path" style={{ ['--len' as string]: l.len, ['--i' as string]: i, strokeDasharray: l.len }} />
            );
          })}
          {giftPts.flatMap((g, i) =>
            g.sourceIds.map((sid) => {
              const src = byId.get(sid);
              if (!src) return null;
              const r = giftRoute(src, g.a);
              const hot = selected?.giftId === g.id;
              return (
                <path key={`${g.id}-${sid}`} d={r.d} fill="none" stroke={GOLD} strokeOpacity={hot ? 1 : anySel ? 0.14 : 0.42} strokeWidth={hot ? 2 : 1} className="orb-line gift-line sky-path" style={{ ['--len' as string]: r.len, ['--i' as string]: i, strokeDasharray: r.len }} />
              );
            }),
          )}
          {giftPts.map((g, i) => {
            const hot = selected?.giftId === g.id;
            return (
              <g key={g.id} className="orb-star gift-star" style={{ ['--i' as string]: i, transformOrigin: `${g.x}px ${g.y}px` }}>
                <circle cx={g.x} cy={g.y} r={hot ? 9 : 7} fill="hsl(44 90% 70% / 0.16)" />
                <circle cx={g.x} cy={g.y} r={g.saved ? 3.4 : 2.6} fill={GOLD} opacity={anySel && !hot ? 0.45 : 1} filter={`url(#${ids.glow})`} />
              </g>
            );
          })}
        </g>

        <g role="group" aria-label={COPY.sky.belt(refusals.map((r) => r.text))}>
          {belt.map((b) => (
            <g key={b.id} role="button" tabIndex={0} aria-label={b.text} aria-pressed={detail === b.text} className="sky-hit" onClick={() => show(b.text)} onMouseEnter={() => peek(b.text)} onMouseLeave={() => setPreview(null)} onFocus={() => peek(b.text)} onBlur={() => setPreview(null)} onKeyDown={press(() => show(b.text))} data-testid={`button-refusal-${b.id}`}>
              <circle cx={b.x} cy={b.y} r="26" fill="transparent" />
              <path d={b.d} fill="hsl(245 14% 58% / 0.55)" stroke="hsl(245 20% 72% / 0.4)" strokeWidth="0.5" className="sky-asteroid" />
            </g>
          ))}
        </g>

        {pts.map((p, i) => {
          const name = text.get(p.id) ?? '';
          const lbl = COPY.sky.detail(name, counts.get(p.id) ?? 0);
          const gold = goldIds.has(p.id);
          const hot = hotLoves.has(p.id);
          const out = onRing(p.a, p.k + 0.13);
          const short = name.length > 16 ? `${name.slice(0, 15)}…` : name;
          return (
            <g key={p.id} role="button" tabIndex={0} aria-label={lbl} aria-pressed={detail === lbl} className="sky-hit" onClick={() => show(lbl)} onMouseEnter={() => peek(lbl)} onMouseLeave={() => setPreview(null)} onFocus={() => peek(lbl)} onBlur={() => setPreview(null)} onKeyDown={press(() => show(lbl))} data-testid={`button-love-star-${p.id}`}>
              <circle cx={p.x} cy={p.y} r="30" fill="transparent" />
              <g className="orb-star" style={{ ['--i' as string]: i, transformOrigin: `${p.x}px ${p.y}px` }}>
                {hot && <circle cx={p.x} cy={p.y} r={p.r * 4.6} fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="0.8" />}
                <circle cx={p.x} cy={p.y} r={p.r * 3.2} fill={gold ? 'hsl(44 90% 70% / 0.2)' : 'hsl(262 70% 80% / 0.14)'} />
                <circle cx={p.x} cy={p.y} r={hot ? p.r * 1.35 : p.r} fill={hot || gold ? GOLD : LAV} opacity={anySel && !hot ? 0.5 : 1} filter={`url(#${ids.glow})`} />
              </g>
              <text x={out.x} y={out.y + 2} textAnchor={out.x < CX - 20 ? 'end' : out.x > CX + 20 ? 'start' : 'middle'} className="sky-label" fill={gold ? GOLD : LAV} aria-hidden="true">
                {short}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="min-h-[1.5rem] mt-1 text-center text-sm" aria-live="polite" data-testid="text-sky-detail">
        {preview ?? detail ?? (hint && loves.length ? <span className="text-muted-foreground">{COPY.sky.hint}</span> : null)}
      </figcaption>
    </figure>
  );
}

export function SkyLegend({ showNo }: { showNo: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" data-testid="list-sky-legend">
      <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_hsl(42_90%_60%)]" aria-hidden="true" />{COPY.sky.legendKeeper}</li>
      <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(262_72%_84%)]" aria-hidden="true" />{COPY.sky.legendExploring}</li>
      {showNo && <li className="flex items-center gap-1.5"><span className="w-2.5 h-2 rounded-[40%_60%_55%_45%] bg-[hsl(245_14%_58%)]" aria-hidden="true" />{COPY.sky.legendNo}</li>}
    </ul>
  );
}

export function SourceChip({ names, pressed, onToggle, testId }: { names: string[] | null; pressed: boolean; onToggle: () => void; testId: string }) {
  if (!names) {
    return <span className="source-chip" data-testid={testId}>{COPY.sky.from([])}</span>;
  }
  return (
    <button type="button" className="source-chip source-chip-btn" aria-pressed={pressed} onClick={(e) => { e.stopPropagation(); onToggle(); }} data-testid={testId}>
      {COPY.sky.from(names)}
    </button>
  );
}

/** Card click selects; clicks on interactive children are left alone. */
export function isChildControl(target: EventTarget | null, card: HTMLElement) {
  const el = (target as HTMLElement | null)?.closest('button, a, input, textarea, select, summary, label, [role="button"]');
  return !!el && el !== card && card.contains(el);
}
