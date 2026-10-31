import { useState } from 'react';
import { SkyLegend, SkyMap, SourceChip, isChildControl, type SkySelection } from '@/components/sky-map';
import { resolveSources } from '@/lib/sources';
import { Link } from 'wouter';
import { Copy, Trash2, Plus, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Planet, Mark } from '@/components/starfield';
import { COPY, CARD_TEXT, NEED } from '@/lib/copy';
import { actions, splitList, useData, type Recipient } from '@/lib/store';

function Intro() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-20 pb-10 grid md:grid-cols-[1.25fr_1fr] gap-10 items-center">
      <div>
        <p className="eyebrow enter" style={{ ['--i' as string]: 0 }}>{COPY.home.tagline}</p>
        <p className="wordmark text-2xl text-gold mt-2 enter" style={{ ['--i' as string]: 1 }} data-testid="text-home-name">{COPY.home.name}</p>
        <h1 className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl font-semibold tracking-tight enter" style={{ ['--i' as string]: 2 }} data-testid="text-home-headline">
          {COPY.home.headline}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg enter" style={{ ['--i' as string]: 3 }}>{COPY.home.subhead}</p>
        <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 enter" style={{ ['--i' as string]: 4 }}>
          <Link href="/recipient/new" className="btn btn-gold text-base px-7 min-h-[54px]" data-testid="link-start">
            <Sparkles className="w-4 h-4" />
            <span>{COPY.home.button}</span>
          </Link>
          <p className="text-sm text-muted-foreground">{COPY.home.small}</p>
        </div>
      </div>
      <div className="relative grid place-items-center enter" style={{ ['--i' as string]: 3 }}>
        <div className="float"><Planet className="w-[20rem] sm:w-[26rem] h-auto" /></div>
      </div>
    </section>
  );
}

function ReturnedAnswers({ r }: { r: Recipient }) {
  const [vals, setVals] = useState({ love: '', no: '', own: '', hint: '' });
  const submit = () => {
    const loves = [...splitList(vals.love), ...splitList(vals.hint)];
    loves.forEach((text) => actions.addChip({ recipientId: r.id, text: text.slice(0, 200), type: 'love', kind: '', status: 'plain' }));
    splitList(vals.no).forEach((text) => actions.addChip({ recipientId: r.id, text: text.slice(0, 200), type: 'refuse', kind: '', status: 'plain' }));
    if (vals.own.trim()) actions.updateRecipient(r.id, { owned: [r.owned, vals.own.trim()].filter(Boolean).join('\n').slice(0, 2000) });
    setVals({ love: '', no: '', own: '', hint: '' });
  };
  const fields = [
    ['love', COPY.giver.loves],
    ['no', COPY.giver.nos],
    ['own', COPY.giver.owned],
    ['hint', CARD_TEXT.stumped.hint],
  ] as const;
  return (
    <details className="glass rounded-2xl mt-6 group">
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 min-h-[52px]" data-testid="button-toggle-returned">
        <Mark className="w-7 h-5" />
        <span className="copy-needed">{NEED("toggle for typing returned I'm Stumped answers into this profile")}</span>
      </summary>
      <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
        {fields.map(([k, label]) => (
          <div key={k}>
            <label className="block text-sm font-semibold mb-1.5" htmlFor={`ret-${k}`}>{label}</label>
            <textarea id={`ret-${k}`} rows={3} className="field resize-y" value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} data-testid={`input-returned-${k}`} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <button type="button" className="btn btn-gold" disabled={!Object.values(vals).some((v) => v.trim())} onClick={submit} data-testid="button-apply-returned">
            <span className="copy-needed !text-current">{NEED('button: add returned answers to profile')}</span>
          </button>
        </div>
      </div>
    </details>
  );
}

export default function Keepers() {
  const { recipients, gifts, chips } = useData();
  const [sel, setSel] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pick, setPick] = useState<SkySelection | null>(null);
  const { toast } = useToast();

  if (!recipients.length) return <Intro />;

  const current = recipients.find((r) => r.id === sel) ?? recipients[recipients.length - 1];
  const saved = gifts.filter((g) => g.recipientId === current.id && g.status === 'saved');
  const loves = chips.filter((c) => c.recipientId === current.id && c.type === 'love');
  const nos = chips.filter((c) => c.recipientId === current.id && c.type === 'refuse');
  const loveList = loves.map((c) => ({ id: c.id, text: c.text }));
  const srcOf = new Map(saved.map((g) => [g.id, resolveSources(g, loveList)]));
  const counts = new Map<string, number>();
  const goldIds = new Set<string>();
  saved.forEach((g) => srcOf.get(g.id)?.ids.forEach((lid) => { counts.set(lid, (counts.get(lid) ?? 0) + 1); goldIds.add(lid); }));
  const chosen = pick && srcOf.get(pick.giftId) ? pick : null;
  const toggle = (gid: string) => {
    const s = srcOf.get(gid);
    if (!s) return;
    setPick((cur) => (cur?.giftId === gid ? null : { giftId: gid, loveIds: s.ids }));
  };

  const copyList = async () => {
    const text = [current.name, '', ...saved.map((g) => `- ${g.title} (${g.priceRange}) · ${g.whereToLook}`)].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    toast({ title: COPY.saved.copied });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 enter">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight" data-testid="text-keepers-title">{COPY.saved.title}</h1>
        <Link href="/recipient/new" className="btn btn-ghost" data-testid="link-new-recipient">
          <Plus className="w-4 h-4" />
          <span>{COPY.saved.another}</span>
        </Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 enter" role="tablist" style={{ ['--i' as string]: 1 }}>
        {recipients.map((r) => {
          const count = gifts.filter((g) => g.recipientId === r.id && g.status === 'saved').length;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === current.id}
              aria-pressed={r.id === current.id}
              onClick={() => setSel(r.id)}
              className="pill shrink-0"
              data-testid={`tab-recipient-${r.id}`}
            >
              <span className={`w-2 h-2 rounded-full ${r.id === current.id ? 'bg-gold' : 'bg-violet/60'}`} aria-hidden="true" />
              {r.name}
              <span className="text-xs opacity-70 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      <section className="glass rounded-3xl mt-6 p-5 sm:p-6 enter" style={{ ['--i' as string]: 2 }} data-testid="section-universe">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl" data-testid="text-universe-title">{COPY.sky.universe(current.name)}</h2>
          <p className="text-sm text-muted-foreground tabular-nums" data-testid="text-universe-stats">{COPY.sky.stats(loves.length, nos.length, saved.length)}</p>
        </div>
        {loves.length === 0 && (
          <p className="mt-6 mb-2 text-center font-display text-xl" data-testid="status-no-stars">{COPY.sky.empty}</p>
        )}
          <>
            <SkyMap
              key={current.id}
              loves={loveList}
              refusals={nos.map((c) => ({ id: c.id, text: c.text }))}
              gifts={saved.map((g) => ({ id: g.id, sourceIds: srcOf.get(g.id)?.ids ?? [], saved: true }))}
              goldIds={goldIds}
              counts={counts}
              selected={chosen}
              label={COPY.sky.universe(current.name)}
              className="mx-auto w-full max-w-2xl mt-2"
            />
            <SkyLegend showNo={nos.length > 0} />
          </>
      </section>

      <section className="mt-6 grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <div className="flex flex-wrap gap-2 enter" style={{ ['--i' as string]: 2 }}>
            <button type="button" className="btn btn-gold" onClick={copyList} disabled={!saved.length} data-testid="button-copy-list">
              <Copy className="w-4 h-4" />
              <span>{COPY.saved.copy}</span>
            </button>
            <Link href={`/recipient/${current.id}/love`} className="btn btn-ghost" data-testid="link-refine">
              <span className="copy-needed !text-current">{NEED("link to edit this person's loves/no's and find more gifts")}</span>
            </Link>
          </div>

          {saved.length === 0 ? (
            <div className="glass rounded-3xl mt-6 px-6 py-14 text-center enter" style={{ ['--i' as string]: 3 }} data-testid="status-empty-keepers">
              <div className="mx-auto w-fit float"><Planet size={140} /></div>
              <p className="mt-4 font-display text-xl">{COPY.saved.empty}</p>
            </div>
          ) : (
            <ul className="mt-6 grid sm:grid-cols-2 gap-4">
              {saved.map((g, i) => (
                <li
                  key={g.id}
                  className={`glass rounded-3xl p-5 enter relative ${srcOf.get(g.id) ? 'cursor-pointer' : ''} ${chosen?.giftId === g.id ? 'card-selected' : ''}`}
                  onClick={(e) => { if (!isChildControl(e.target, e.currentTarget)) toggle(g.id); }}
                  style={{ ['--i' as string]: i + 2 }} data-testid={`card-saved-${g.id}`}>
                  <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-gold shadow-[0_0_12px_hsl(42_80%_60%)]" aria-hidden="true" />
                  <h3 className="gift-title text-xl pr-6 leading-snug" data-testid={`text-saved-title-${g.id}`}>{g.title}</h3>
                  <SourceChip names={srcOf.get(g.id)?.names ?? null} pressed={chosen?.giftId === g.id} onToggle={() => toggle(g.id)} testId={`button-source-${g.id}`} />
                  <p className="mt-2 text-gold text-sm font-medium">{COPY.results.price(g.priceRange)}</p>
                  <p className="text-sm text-muted-foreground">{COPY.results.where(g.whereToLook)}</p>
                  <p className="mt-2 text-sm">{COPY.results.because(g.because)}</p>
                  <div className="mt-4 flex justify-end">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingDelete(g.id)} aria-label={COPY.saved.remove} data-testid={`button-delete-${g.id}`}>
                      <Trash2 className="w-4 h-4" />
                      <span>{COPY.saved.remove}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ReturnedAnswers r={current} />
        </div>

        <aside className="glass rounded-3xl p-5 h-fit enter" style={{ ['--i' as string]: 3 }}>
          <p className="font-display text-2xl font-semibold" data-testid="text-current-name">{current.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{[current.relationship, current.occasion].filter(Boolean).join(' · ')}</p>
          {loves.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2 text-gold">{COPY.giver.loves}</p>
              <div className="flex flex-wrap gap-1.5">
                {loves.map((c) => <span key={c.id} className="text-xs rounded-full px-2.5 py-1 bg-[hsl(42_60%_46%/0.14)] border border-[hsl(42_60%_60%/0.3)]">{c.text}</span>)}
              </div>
            </div>
          )}
          {nos.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2 text-[hsl(8_70%_72%)]">{COPY.giver.nos}</p>
              <div className="flex flex-wrap gap-1.5">
                {nos.map((c) => <span key={c.id} className="text-xs rounded-full px-2.5 py-1 bg-[hsl(8_50%_40%/0.16)] border border-[hsl(8_60%_60%/0.3)]">{c.text}</span>)}
              </div>
            </div>
          )}
          {current.owned.trim() && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2 text-violet">{COPY.giver.owned}</p>
              <p className="text-sm whitespace-pre-line text-muted-foreground" data-testid="text-current-owned">{current.owned}</p>
            </div>
          )}
        </aside>
      </section>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="glass rounded-3xl border-[hsl(252_40%_40%/0.4)] max-w-sm">
          <AlertDialogTitle className="font-display text-2xl">{COPY.saved.delPrompt}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">{COPY.saved.delPrompt}</AlertDialogDescription>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="btn btn-ghost !rounded-full" data-testid="button-cancel-delete">{COPY.saved.keep}</AlertDialogCancel>
            <AlertDialogAction
              className="btn btn-gold !rounded-full"
              onClick={() => {
                if (pendingDelete) actions.deleteGift(pendingDelete);
                setPendingDelete(null);
              }}
              data-testid="button-confirm-delete"
            >
              {COPY.saved.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
