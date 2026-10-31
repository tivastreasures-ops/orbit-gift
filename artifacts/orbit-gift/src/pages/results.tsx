import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearch } from 'wouter';
import { Heart, X, Sparkles, RotateCcw } from 'lucide-react';
import { useGenerateGifts, type GiftIdea, type GiftInput } from '@workspace/api-client-react';
import { SkyLegend, SkyMap, SourceChip, WorldPicker, isChildControl, type SkySelection } from '@/components/sky-map';
import { sendGifts } from '@/lib/gen-request';
import { chooseWorld } from '@/lib/sky';
import { resolveSources, type ResolvedSources } from '@/lib/sources';
import { MissingRecipient } from '@/components/flow-header';
import { COPY, NEED } from '@/lib/copy';
import { actions, uid, useData } from '@/lib/store';

function LoadingSky({ more }: { more: boolean }) {
  return (
    <div className="mt-8" role="status" aria-live="polite" data-testid="status-loading">
      <div className="flex gap-3 items-center">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="pulse-star block w-2 h-2 rounded-full bg-gold" style={{ ['--i' as string]: i }} aria-hidden="true" />
        ))}
      </div>
      {more ? (
        <p className="mt-4 font-display text-2xl">{COPY.results.moreLoading}</p>
      ) : (
        <>
          <p className="mt-4 font-display text-2xl">{COPY.loading.l1}</p>
          <p className="mt-1 text-muted-foreground">{COPY.loading.l2}</p>
        </>
      )}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass rounded-3xl p-5 space-y-3">
            <div className="shimmer h-6 w-3/4 rounded-lg" />
            <div className="shimmer h-4 w-1/3 rounded" />
            <div className="shimmer h-4 w-2/3 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
            <div className="shimmer h-10 w-full rounded-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftCard({ idea, onMore, busy, src, selected, onSelect }: { idea: GiftIdea; onMore: (t: string) => void; busy: boolean; src: ResolvedSources | null; selected: boolean; onSelect: () => void }) {
  const [asking, setAsking] = useState(false);
  const saved = idea.status === 'saved';
  return (
    <article
      className={`glass rounded-3xl p-5 sm:p-6 flex flex-col relative ${src ? 'cursor-pointer' : ''} ${selected ? 'card-selected' : ''}`}
      onClick={(e) => { if (src && !isChildControl(e.target, e.currentTarget)) onSelect(); }}
      data-testid={`card-gift-${idea.id}`}
    >
      <span className={`absolute -top-1.5 left-7 w-3 h-3 rounded-full ${saved ? 'bg-gold shadow-[0_0_16px_hsl(42_90%_60%)]' : 'bg-[hsl(48_90%_90%)] shadow-[0_0_10px_hsl(48_90%_80%/0.8)]'}`} aria-hidden="true" />
      <h3 className="gift-title text-xl sm:text-[1.4rem] leading-snug" data-testid={`text-gift-title-${idea.id}`}>{idea.title}</h3>
      <SourceChip names={src?.names ?? null} pressed={selected} onToggle={onSelect} testId={`button-source-${idea.id}`} />
      <dl className="mt-3 space-y-1.5 text-[0.95rem]">
        <dd className="text-gold font-medium" data-testid={`text-price-${idea.id}`}>{COPY.results.price(idea.priceRange)}</dd>
        <dd className="text-muted-foreground" data-testid={`text-where-${idea.id}`}>{COPY.results.where(idea.whereToLook)}</dd>
        <dd data-testid={`text-because-${idea.id}`}>{idea.because ? COPY.results.because(idea.because) : null}</dd>
        <dd className="text-sm text-violet/90 pt-1 border-t border-[hsl(252_30%_34%/0.5)]" data-testid={`text-checked-${idea.id}`}>
          {COPY.results.checked(idea.passedRules.join(', '))}
        </dd>
      </dl>
      <div className="mt-auto pt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={saved} onClick={() => actions.setGiftStatus(idea.id, saved ? 'shown' : 'saved')} data-testid={`button-keep-${idea.id}`}>
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          <span>{COPY.results.keep}</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" aria-expanded={asking} onClick={() => setAsking((a) => !a)} data-testid={`button-notthis-${idea.id}`}>
          <X className="w-4 h-4" />
          <span>{COPY.results.notThis}</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onMore(idea.title)} data-testid={`button-more-${idea.id}`}>
          <Sparkles className="w-4 h-4" />
          <span>{COPY.results.more}</span>
        </button>
      </div>
      {asking && (
        <div className="enter mt-4 rounded-2xl bg-[hsl(238_46%_9%/0.6)] p-4" role="group" aria-label={COPY.results.prompt}>
          <p className="text-lg">{COPY.results.prompt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COPY.results.reasons.map((r) => (
              <button key={r} type="button" className="pill" onClick={() => actions.setGiftStatus(idea.id, 'rejected', r)} data-testid={`button-reason-${idea.id}-${r.toLowerCase().replace(/\W+/g, '-')}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function Satellite({ title }: { title: string }) {
  return (
    <div className="satellite pointer-events-none" role="img" aria-label={COPY.results.satellite} title={COPY.results.satellite}>
      <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true">
        <rect x="24" y="12" width="16" height="16" rx="3" fill="hsl(245 20% 60%)" />
        <rect x="2" y="16" width="20" height="8" fill="hsl(262 40% 50%)" />
        <rect x="42" y="16" width="20" height="8" fill="hsl(262 40% 50%)" transform="rotate(14 52 20)" />
        <line x1="32" y1="12" x2="36" y2="2" stroke="hsl(245 20% 70%)" />
      </svg>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { recipients, chips, gifts, rounds, settings, seeds, pending, worlds } = useData();
  const r = recipients.find((x) => x.id === id);
  const keyRef = useRef('');
  // Real generated hook; request carries the 130s timeout, Idempotency-Key and one transient retry.
  const gen = useGenerateGifts({ mutation: { mutationFn: ({ data }) => sendGifts(data, keyRef.current) } });
  const [phase, setPhase] = useState<'idle' | 'loading' | 'more'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<SkySelection | null>(null);
  const [departing, setDeparting] = useState<string[]>([]);
  const started = useRef(false);
  const prevStatus = useRef<Record<string, string>>({});

  const buildBody = (moreLike?: string): GiftInput | null => {
    const rec = recipients.find((x) => x.id === id);
    if (!rec) return null;
    const mine = chips.filter((c) => c.recipientId === rec.id);
    const all = gifts.filter((g) => g.recipientId === rec.id);
    const moreLikeSeeds = moreLike ? actions.addSeed(rec.id, moreLike) : (seeds[rec.id] ?? []);
    return {
      recipientId: rec.id,
      loves: mine.filter((c) => c.type === 'love').map((c) => c.text).slice(0, 30),
      refusals: mine.filter((c) => c.type === 'refuse').map((c) => c.text).slice(0, 30),
      entityIds: mine.filter((c) => c.type === 'love' && c.matchedEntityId).map((c) => c.matchedEntityId as string).slice(0, 30),
      matchedLoves: mine.filter((c) => c.type === 'love' && c.status === 'confirmed' && c.matchedEntityId).map((c) => ({ love: c.text, entityId: c.matchedEntityId! })).slice(0, 30),
      owned: rec.owned ? rec.owned.slice(0, 2000) : undefined,
      occasion: rec.occasion || undefined,
      relationship: rec.relationship || undefined,
      budgetMin: rec.budgetMin,
      budgetMax: rec.budgetMax,
      moreLike: moreLike?.slice(0, 300),
      moreLikeSeeds,
      rejected: all.filter((g) => g.status === 'rejected').map((g) => ({ title: g.title.slice(0, 300), reason: (g.rejectReason ?? '').slice(0, 100) })).slice(-200),
      previousTitles: all.map((g) => g.title.slice(0, 300)).slice(-200),
    };
  };

  /** Sends a saved request. Inputs, gifts and rounds are untouched until a successful response. */
  const send = async (rid: string, body: GiftInput, key: string, moreLike?: string) => {
    // Persist BEFORE the request so a failure or reload never loses it.
    actions.savePending(rid, { body, key, moreLike, at: Date.now() });
    keyRef.current = key;
    setError(null);
    setPhase(moreLike ? 'more' : 'loading');
    try {
      const res = await gen.mutateAsync({ data: body });
      if (res.fallback) actions.flagBackup();
      setSel(null);
      actions.addRound(rid, res.ideas);
      actions.clearPending(rid);
      setDeparting([]);
    } catch {
      actions.markPendingFailed(rid);
      setError(COPY.errors.stars);
    } finally {
      setPhase('idle');
    }
  };

  const run = (moreLike?: string) => {
    const body = buildBody(moreLike);
    if (!body || !r) return;
    void send(r.id, body, uid(), moreLike);
  };

  /** Reattach the same job; the server evicts genuine failures for safe retries. */
  const retry = () => {
    if (!r) return;
    const p = pending[r.id];
    if (p) void send(r.id, p.body, p.key, p.moreLike);
    else run();
  };

  useEffect(() => {
    if (started.current || !r) return;
    started.current = true;
    const fresh = new URLSearchParams(search).get('fresh') === '1';
    if (fresh) setLocation(`/recipient/${r.id}/results`, { replace: true });
    const p = pending[r.id];
    if (!fresh && p) {
      // Interrupted mid-flight: resume with the same key (server shares the in-flight job).
      if (!p.failed) void send(r.id, p.body, p.key, p.moreLike);
      else setError(COPY.errors.stars);
      return;
    }
    if (fresh || !rounds[r.id]?.length) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  const roundIds = r ? rounds[r.id] ?? [] : [];
  const roundIdeas = roundIds.map((gid) => gifts.find((g) => g.id === gid)).filter((g): g is GiftIdea => !!g);

  // Detect newly rejected ideas -> satellite drift.
  useEffect(() => {
    const newly: string[] = [];
    roundIdeas.forEach((g) => {
      if (g.status === 'rejected' && prevStatus.current[g.id] && prevStatus.current[g.id] !== 'rejected') newly.push(g.id);
      prevStatus.current[g.id] = g.status;
    });
    if (newly.length) {
      setDeparting((d) => [...d, ...newly]);
      const ms = settings.reduceMotion ? 900 : 1400;
      window.setTimeout(() => setDeparting((d) => d.filter((x) => !newly.includes(x))), ms);
    }
  });

  if (!r) return <MissingRecipient />;

  const busy = phase !== 'idle';
  const loveList = chips.filter((c) => c.recipientId === r.id && c.type === 'love').map((c) => ({ id: c.id, text: c.text }));
  const visible = roundIdeas.filter((g) => g.status !== 'rejected');
  const refusalList = chips.filter((c) => c.recipientId === r.id && c.type === 'refuse').map((c) => ({ id: c.id, text: c.text }));
  const srcOf = new Map(roundIdeas.map((g) => [g.id, resolveSources(g, loveList)]));
  const counts = new Map<string, number>();
  roundIdeas.forEach((g) => srcOf.get(g.id)?.ids.forEach((lid) => counts.set(lid, (counts.get(lid) ?? 0) + 1)));
  const goldIds = new Set<string>();
  gifts.filter((g) => g.recipientId === r.id && g.status === 'saved').forEach((g) => resolveSources(g, loveList)?.ids.forEach((lid) => goldIds.add(lid)));
  const mineAll = gifts.filter((g) => g.recipientId === r.id);
  const seedSet = new Set((seeds[r.id] ?? []).map((t) => t.toLowerCase()));
  const brightIds = new Set<string>();
  const knockedIds = new Set<string>();
  mineAll.forEach((g) => {
    const ids = resolveSources(g, loveList)?.ids ?? [];
    if (g.status === 'rejected') ids.forEach((x) => knockedIds.add(x));
    else if (seedSet.has(g.title.slice(0, 300).toLowerCase())) ids.forEach((x) => brightIds.add(x));
  });
  const autoWorld = chooseWorld(loveList.map((l) => l.text), r.name);
  const toggle = (g: GiftIdea) => {
    const s = srcOf.get(g.id);
    if (!s) return;
    setSel((cur) => (cur?.giftId === g.id ? null : { giftId: g.id, loveIds: s.ids }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <div className="flex items-center gap-3">
        <Link href={`/recipient/${r.id}/refusals`} className="text-sm text-muted-foreground hover:text-gold" data-testid="link-back-refusals">
          <span className="copy-needed">{NEED('back to edit loves and no\'s link')}</span>
        </Link>
        <span className="ml-auto min-w-0 max-w-[50%] truncate wordmark text-gold">{r.name}</span>
      </div>

      {phase === 'loading' ? (
        <LoadingSky more={false} />
      ) : error ? (
        <div className="glass rounded-3xl mt-8 p-8 text-center" role="alert" data-testid="status-error">
          <p className="font-display text-2xl" data-testid="text-error">{error}</p>
          <button type="button" className="btn btn-gold mt-6" onClick={retry} data-testid="button-retry">
            <RotateCcw className="w-4 h-4" />
            <span className="copy-needed !text-current">{NEED('retry button label')}</span>
          </button>
        </div>
      ) : roundIdeas.length === 0 ? (
        <div className="glass rounded-3xl mt-8 p-8 text-center" data-testid="status-no-results">
          <p className="font-display text-2xl max-w-xl mx-auto">{COPY.errors.none}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/recipient/${r.id}/love`} className="btn btn-ghost" data-testid="link-add-love">
              <span>{COPY.love.title}</span>
            </Link>
            <Link href={`/recipient/${r.id}/refusals`} className="btn btn-ghost" data-testid="link-loosen-rule">
              <span>{COPY.refuse.title}</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <header className="mt-6">
            <div className="paper-plate w-full max-w-3xl" data-testid="panel-sky">
              <div className="flex items-center justify-between px-3 pt-1 pb-2 gap-3 flex-wrap">
                <p className="paper-tab">{COPY.sky.constellation(r.name)}</p>
                <WorldPicker value={worlds[r.id] ?? null} auto={autoWorld} onChange={(w) => actions.setWorld(r.id, w)} />
              </div>
              <div className="sky-well">
                <SkyMap
                  key={roundIds.join('|')}
                  name={r.name}
                  world={worlds[r.id] ?? null}
                  loves={loveList}
                  refusals={refusalList}
                  gifts={roundIdeas.map((g) => ({ id: g.id, sourceIds: srcOf.get(g.id)?.ids ?? [], saved: g.status === 'saved' }))}
                  goldIds={goldIds}
                  counts={counts}
                  selected={sel}
                  brightIds={brightIds}
                  knockedIds={knockedIds}
                  label={COPY.sky.constellation(r.name)}
                  className="w-full"
                />
                <div className="px-2 pb-1"><SkyLegend showNo={refusalList.length > 0} showBright={brightIds.size > 0} showKnocked={knockedIds.size > 0} /></div>
              </div>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl tracking-tight leading-[1.05]" data-testid="text-results-heading">{roundIdeas.length === 6 && new Set(roundIdeas.map(g => g.kind)).size === 6 ? COPY.results.heading : COPY.results.partial(roundIdeas.length)}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{COPY.results.subhead}</p>
          </header>
          {phase === 'more' && <LoadingSky more />}
          {phase !== 'more' && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 relative">
              {visible.map((g) => (
                <GiftCard key={g.id} idea={g} onMore={(t) => void run(t)} busy={busy} src={srcOf.get(g.id) ?? null} selected={sel?.giftId === g.id} onSelect={() => toggle(g)} />
              ))}
              {departing.length > 0 && (
                <div className="absolute right-4 top-0 flex gap-4" aria-live="polite">
                  {departing.map((d) => (
                    <Satellite key={d} title={roundIdeas.find((g) => g.id === d)?.title ?? ''} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
