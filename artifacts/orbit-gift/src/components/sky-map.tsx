import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { CX, CY, GIFT_K, giftAngle, giftRoute, loveArcs, lovePoints, onRing, type OrbitLove } from '@/components/starfield';
import { COPY } from '@/lib/copy';
import { WORLDS, WORLD_ORDER, chooseWorld, skySeed, skySpecks, type WorldId } from '@/lib/sky';

export interface SkyGift { id: string; sourceIds: string[]; saved?: boolean }
export interface SkySelection { giftId: string; loveIds: string[] }

const BELT_K = 1.66;
const HINT_KEY = 'ow.skyHintSeen';
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

const EMPTY = new Set<string>();

export function SkyMap({
  loves,
  refusals,
  gifts,
  goldIds,
  counts,
  selected,
  label,
  className = '',
  name = '',
  world,
  brightIds = EMPTY,
  knockedIds = EMPTY,
}: {
  loves: OrbitLove[];
  refusals: OrbitLove[];
  gifts: SkyGift[];
  goldIds: Set<string>;
  counts: Map<string, number>;
  selected: SkySelection | null;
  label: string;
  className?: string;
  name?: string;
  world?: WorldId | null;
  /** Sources behind "More like this" requests: drawn brighter. */
  brightIds?: Set<string>;
  /** Sources behind rejected ideas: dimmed, knocked out with a cross. */
  knockedIds?: Set<string>;
}) {
  const uid = useId().replace(/:/g, '');
  const ids = { pl: `spl${uid}`, ring: `srg${uid}`, glow: `sgl${uid}`, halo: `sha${uid}`, clip: `scl${uid}` };
  const texts = loves.map((l) => l.text);
  const seedKey = `${name}|${texts.join('|')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seed = useMemo(() => skySeed(name, texts), [seedKey]);
  const w = WORLDS[world ?? chooseWorld(texts, name)];
  const pts = useMemo(() => lovePoints(loves, seed), [loves, seed]);
  const byId = useMemo(() => new Map(pts.map((p) => [p.id, p])), [pts]);
  const text = useMemo(() => new Map(loves.map((l) => [l.id, l.text])), [loves]);
  const arcs = useMemo(() => loveArcs(pts), [pts]);
  const specks = useMemo(() => skySpecks(seed), [seed]);
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

  const rot = (seed % 100) / 160;
  const belt = refusals.map((r, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) / Math.max(1, refusals.length)) * Math.PI * 2 + rot;
    const p = onRing(a, BELT_K + (i % 2 ? 0.05 : -0.03));
    let h = 2166136261;
    for (let j = 0; j < r.id.length; j++) h = Math.imul(h ^ r.id.charCodeAt(j), 16777619);
    return { ...r, x: p.x, y: p.y, d: asteroidPath(p.x, p.y, h >>> 0) };
  });

  return (
    <figure className={className} aria-label={label} data-world={w.id}>
      <svg viewBox="-74 -54 468 348" className="w-full h-auto" role="group" aria-label={label}>
        <g aria-hidden="true">
          <defs>
            <radialGradient id={ids.pl} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={w.core[0]} />
              <stop offset="48%" stopColor={w.core[1]} />
              <stop offset="100%" stopColor={w.core[2]} />
            </radialGradient>
            <radialGradient id={ids.halo}>
              <stop offset="50%" stopColor={w.halo} stopOpacity="0.26" />
              <stop offset="100%" stopColor={w.halo} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ids.ring} x1="0" x2="1">
              <stop offset="0%" stopColor={w.ring ?? GOLD} stopOpacity="0" />
              <stop offset="50%" stopColor={w.ring ?? GOLD} stopOpacity="0.9" />
              <stop offset="100%" stopColor={w.ring ?? GOLD} stopOpacity="0" />
            </linearGradient>
            <clipPath id={ids.clip}><circle cx={CX} cy={CY} r="46" /></clipPath>
            <filter id={ids.glow} x="-300%" y="-300%" width="700%" height="700%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {specks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="hsl(40 60% 94%)" opacity={s.o} />)}
          {!w.art && <>
          <circle cx={CX} cy={CY} r="82" fill={`url(#${ids.halo})`} className="sky-glow" />
          <circle cx={CX} cy={CY} r="46" fill={`url(#${ids.pl})`} />
          {w.band && (
            <g clipPath={`url(#${ids.clip})`} opacity="0.4">
              {[-16, 2, 18].map((dy) => <ellipse key={dy} cx={CX} cy={CY + dy} rx="62" ry="7" fill="none" stroke={w.band!} strokeWidth="4" transform={`rotate(-14 ${CX} ${CY})`} />)}
            </g>
          )}
          {w.id === 'ice' && <path d={`M${CX - 22} ${CY - 30} l10 14 l-6 10 l12 6`} stroke="hsl(200 80% 98% / 0.6)" strokeWidth="1" fill="none" />}
          {w.id === 'nebula' && <ellipse cx={CX + 70} cy={CY - 60} rx="60" ry="22" fill={w.halo} opacity="0.12" transform={`rotate(-24 ${CX + 70} ${CY - 60})`} />}
          </>}
          {w.art && <image href={w.art} x={CX - 84} y={CY - 84} width="168" height="168" preserveAspectRatio="xMidYMid meet" />}
          <ellipse cx={CX} cy={CY} rx="128" ry="62" fill="none" stroke={w.line} strokeOpacity="0.16" strokeDasharray="2 6" transform={`rotate(-14 ${CX} ${CY})`} />
          <ellipse cx={CX} cy={CY} rx={128 * BELT_K} ry={62 * BELT_K} fill="none" stroke="hsl(245 20% 60% / 0.08)" strokeWidth="9" transform={`rotate(-14 ${CX} ${CY})`} />
          {!w.art && w.ring && <ellipse cx={CX} cy={CY + 3} rx="80" ry="15" fill="none" stroke={`url(#${ids.ring})`} strokeWidth="2.6" transform={`rotate(-14 ${CX} ${CY})`} />}
          {arcs.map((l, i) => {
            const hot = hotLoves.has(l.from) && hotLoves.has(l.to);
            const dim = knockedIds.has(l.from) || knockedIds.has(l.to);
            return (
              <path key={l.key} d={l.d} fill="none" stroke={hot ? GOLD : w.line} strokeOpacity={hot ? 0.95 : dim ? 0.12 : anySel ? 0.18 : 0.42} strokeWidth={hot ? 1.8 : 1} strokeDasharray={dim ? '1 4' : undefined} className="orb-line sky-path" style={{ ['--len' as string]: l.len, ['--i' as string]: i, ...(dim ? {} : { strokeDasharray: l.len }) }} />
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
          {belt.map((b) => {
            const lbl = COPY.sky.refusalDetail(b.text);
            return (
              <g key={b.id} role="button" tabIndex={0} aria-label={lbl} aria-pressed={detail === lbl} className="sky-hit" onClick={() => show(lbl)} onMouseEnter={() => peek(lbl)} onMouseLeave={() => setPreview(null)} onFocus={() => peek(lbl)} onBlur={() => setPreview(null)} onKeyDown={press(() => show(lbl))} data-testid={`button-refusal-${b.id}`}>
                <circle cx={b.x} cy={b.y} r="22" fill="transparent" />
                <circle cx={b.x} cy={b.y} r="7" fill="hsl(234 52% 5% / 0.85)" />
                <path d={b.d} fill="hsl(245 14% 58% / 0.55)" stroke="hsl(245 20% 72% / 0.4)" strokeWidth="0.5" className="sky-asteroid" />
                <path d={`M${b.x - 4} ${b.y - 4} L${b.x + 4} ${b.y + 4} M${b.x + 4} ${b.y - 4} L${b.x - 4} ${b.y + 4}`} stroke="hsl(8 70% 70% / 0.7)" strokeWidth="0.8" />
              </g>
            );
          })}
        </g>

        {pts.map((p, i) => {
          const nm = text.get(p.id) ?? '';
          const knocked = knockedIds.has(p.id);
          const bright = brightIds.has(p.id) && !knocked;
          const lbl = knocked ? COPY.sky.rejectedDetail(nm) : COPY.sky.detail(nm, counts.get(p.id) ?? 0);
          const gold = goldIds.has(p.id) || bright;
          const hot = hotLoves.has(p.id);
          const out = onRing(p.a, p.k + 0.13);
          const short = nm.length > 16 ? `${nm.slice(0, 15)}…` : nm;
          const r = bright ? p.r * 1.45 : p.r;
          return (
            <g key={p.id} role="button" tabIndex={0} aria-label={lbl} aria-pressed={detail === lbl} className="sky-hit" onClick={() => show(lbl)} onMouseEnter={() => peek(lbl)} onMouseLeave={() => setPreview(null)} onFocus={() => peek(lbl)} onBlur={() => setPreview(null)} onKeyDown={press(() => show(lbl))} data-testid={`button-love-star-${p.id}`} data-state={knocked ? 'knocked' : bright ? 'bright' : 'normal'}>
              <circle cx={p.x} cy={p.y} r="22" fill="transparent" />
              <g className="orb-star" style={{ ['--i' as string]: i, transformOrigin: `${p.x}px ${p.y}px` }}>
                {hot && <circle cx={p.x} cy={p.y} r={p.r * 4.6} fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="0.8" />}
                {knocked ? (
                  <>
                    <circle cx={p.x} cy={p.y} r={p.r * 2.6} fill="hsl(234 52% 4% / 0.9)" />
                    <circle cx={p.x} cy={p.y} r={p.r * 0.8} fill={w.star} opacity="0.3" />
                    <path d={`M${p.x - 4} ${p.y - 4} L${p.x + 4} ${p.y + 4} M${p.x + 4} ${p.y - 4} L${p.x - 4} ${p.y + 4}`} stroke="hsl(8 70% 70% / 0.75)" strokeWidth="0.9" />
                  </>
                ) : (
                  <>
                    <circle cx={p.x} cy={p.y} r={r * (bright ? 4.4 : 3.2)} fill={gold ? GOLD : w.star} opacity={bright ? 0.3 : 0.16} />
                    <circle cx={p.x} cy={p.y} r={hot ? r * 1.35 : r} fill={hot || gold ? GOLD : w.star} opacity={anySel && !hot ? 0.5 : 1} filter={`url(#${ids.glow})`} />
                  </>
                )}
              </g>
              <text x={out.x} y={out.y + 2} textAnchor={out.x < CX - 20 ? 'end' : out.x > CX + 20 ? 'start' : 'middle'} className="sky-label" fill={gold ? GOLD : w.line} opacity={knocked ? 0.45 : 1} textDecoration={knocked ? 'line-through' : undefined} aria-hidden="true">
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

export function SkyLegend({ showNo, showBright = false, showKnocked = false }: { showNo: boolean; showBright?: boolean; showKnocked?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" data-testid="list-sky-legend">
      <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_hsl(42_90%_60%)]" aria-hidden="true" />{COPY.sky.legendKeeper}</li>
      <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(262_72%_84%)]" aria-hidden="true" />{COPY.sky.legendExploring}</li>
      {showBright && <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_12px_hsl(42_90%_60%)]" aria-hidden="true" />{COPY.sky.brighter}</li>}
      {showKnocked && <li className="flex items-center gap-1.5"><span className="text-[hsl(8_70%_70%)] leading-none" aria-hidden="true">×</span>{COPY.sky.knocked}</li>}
      {showNo && <li className="flex items-center gap-1.5"><span className="w-2.5 h-2 rounded-[40%_60%_55%_45%] bg-[hsl(245_14%_58%)]" aria-hidden="true" />{COPY.sky.legendNo}</li>}
    </ul>
  );
}

/** Six code-drawn worlds; override persists per recipient via the caller. */
export function WorldPicker({ value, auto, onChange, tone = 'paper' }: { value: WorldId | null; auto: WorldId; onChange: (w: WorldId | null) => void; tone?: 'paper' | 'night' }) {
  const current = value ?? auto;
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={COPY.sky.worldPick} data-testid="group-world">
      <span className={`paper-tab mr-1 ${tone === 'night' ? '!text-violet' : ''}`}>{COPY.sky.worldPick}</span>
      {WORLD_ORDER.map((id) => {
        const w = WORLDS[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={current === id}
            aria-label={w.name}
            title={w.name}
            className="world-pill rounded-full"
            onClick={() => onChange(id === auto ? null : id)}
            data-testid={`option-world-${id}`}
          >
            <span className="world-swatch block" style={{ background: `radial-gradient(circle at 35% 30%, ${w.core[0]}, ${w.core[1]} 50%, ${w.core[2]})` }} />
          </button>
        );
      })}
      <span className={`text-xs ml-1 ${tone === 'night' ? 'text-muted-foreground' : 'paper-ink opacity-80'}`} aria-live="polite">
        {WORLDS[current].name}{value ? '' : ` · ${COPY.sky.worldAuto}`}
      </span>
    </div>
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
