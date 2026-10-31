import { useEffect, useMemo, useState } from 'react';
import { Share2, Download, FileImage, Link2, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PreviewImage, SizePicker } from '@/components/card-preview';
import { CARD_TEXT, COPY, NEED, TEMPLATE_NAMES } from '@/lib/copy';
import {
  PURPOSE_TEMPLATES,
  appUrl,
  canvasToFile,
  completionUrl,
  downloadFile,
  emptyFields,
  entryList,
  renderCard,
  shareOrDownload,
  type CardFields,
  type Mode,
  type Purpose,
  type RenderOpts,
  type Size,
  type TemplateId,
} from '@/lib/cards';
import { SHARE_PURPOSE_KEY, readKey, useData, writeKey } from '@/lib/store';

const pad = (a: string[], n: number) => [...a, ...Array(Math.max(0, n - a.length)).fill('')].slice(0, n);

function TextField({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} maxLength={120} data-testid={testid} />
    </label>
  );
}

export default function SharePage() {
  const { recipients, chips, gifts, settings } = useData();
  const { toast } = useToast();
  const [purpose, setPurpose] = useState<Purpose | null>(() => readKey<Purpose | null>(SHARE_PURPOSE_KEY, null));
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [source, setSource] = useState('');
  const [fields, setFields] = useState<CardFields>(emptyFields);
  const [name, setName] = useState('');
  const [showBudget, setShowBudget] = useState(false);
  const [size, setSize] = useState<Size>('portrait');
  const [omit, setOmit] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{ url: string; neutral: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const recommended = purpose ? PURPOSE_TEMPLATES[purpose] : [];
  const t: TemplateId | null = template && recommended.includes(template) ? template : recommended[0] ?? null;
  const mode: Mode = purpose === 'ask' ? 'request' : 'filled';

  const choosePurpose = (p: Purpose) => {
    setPurpose(p);
    writeKey(SHARE_PURPOSE_KEY, p);
    setTemplate(null);
    setOmit(new Set());
    if (p === 'hint') setShowBudget(false);
  };

  const prefill = (rid: string) => {
    setSource(rid);
    setOmit(new Set());
    if (!rid) return setFields(emptyFields());
    const r = recipients.find((x) => x.id === rid);
    if (!r) return;
    const loves = chips.filter((c) => c.recipientId === rid && c.type === 'love').map((c) => c.text);
    const nos = chips.filter((c) => c.recipientId === rid && c.type === 'refuse').map((c) => c.text);
    const saved = gifts.filter((g) => g.recipientId === rid && g.status === 'saved');
    const hasBudget = r.budgetMax > 0 && r.budgetMax < 100000;
    setFields({
      santa: { loves: pad(loves, 3), nos: pad(nos, 3), budget: hasBudget ? `${r.budgetMin}–${r.budgetMax}` : '' },
      wish: { wishes: [0, 1, 2, 3].map((i) => ({ wish: saved[i]?.title ?? '', because: saved[i]?.because ?? '' })) },
      stumped: emptyFields().stumped,
      tot: { yes: pad(loves, 6), no: pad(nos, 6) },
    });
  };

  const refusals = useMemo(() => {
    const out: string[] = [];
    if (source) out.push(...chips.filter((c) => c.recipientId === source && c.type === 'refuse').map((c) => c.text));
    if (t === 'santa') out.push(...fields.santa.nos);
    if (t === 'tot') out.push(...fields.tot.no);
    return out.filter((x) => x.trim());
  }, [source, chips, t, fields]);

  const opts: RenderOpts | null = useMemo(
    () =>
      t
        ? {
            template: t,
            purpose,
            mode,
            size,
            fields,
            omit,
            name,
            showBudget: purpose === 'list' && showBudget,
            refusals,
            appName: settings.appName,
            appUrl: appUrl(),
            completionUrl: completionUrl(),
          }
        : null,
    [t, purpose, mode, size, fields, omit, name, showBudget, refusals, settings.appName],
  );

  useEffect(() => {
    if (!opts) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        const r = await renderCard(opts);
        if (alive) setPreview({ url: r.canvas.toDataURL('image/png'), neutral: r.neutral });
      } catch {
        /* preview is best effort */
      }
    }, 140);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [opts]);

  const exportCard = async (m: Mode, how: 'share' | 'download') => {
    if (!opts || !t) return;
    setBusy(true);
    try {
      const { canvas } = await renderCard({ ...opts, mode: m });
      const file = await canvasToFile(canvas, `orbit-wonder-${t}-${m}-${size}.png`);
      if (how === 'share') {
        const res = await shareOrDownload(file);
        if (res === 'downloaded') toast({ title: COPY.share.saved });
      } else {
        downloadFile(file);
        toast({ title: COPY.share.saved });
      }
    } catch {
      toast({ title: COPY.errors.broke });
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async () => {
    const url = completionUrl();
    const nav = navigator as Navigator;
    if (nav.share) {
      try {
        await nav.share({ url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: NEED('toast: fillable link copied') });
    } catch {
      toast({ title: url });
    }
  };

  const entries = t ? entryList(t, fields, purpose === 'list' && showBudget) : [];
  const toggleOmit = (k: string) =>
    setOmit((o) => {
      const n = new Set(o);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const setSanta = (patch: Partial<CardFields['santa']>) => setFields((f) => ({ ...f, santa: { ...f.santa, ...patch } }));
  const setTot = (patch: Partial<CardFields['tot']>) => setFields((f) => ({ ...f, tot: { ...f.tot, ...patch } }));
  const setArr = (arr: string[], i: number, v: string) => arr.map((x, j) => (j === i ? v : x));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight enter" data-testid="text-share-question">{COPY.share.question}</h1>
      <div className="mt-6 grid sm:grid-cols-3 gap-3" role="radiogroup">
        {COPY.share.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={purpose === o.id}
            onClick={() => choosePurpose(o.id)}
            className={`enter text-left glass rounded-3xl p-5 transition-all border ${purpose === o.id ? '!border-gold shadow-[0_0_0_1px_hsl(var(--gold)),0_18px_40px_-20px_hsl(42_80%_50%/0.5)]' : 'hover:!border-violet/60'}`}
            style={{ ['--i' as string]: i + 1 }}
            data-testid={`option-purpose-${o.id}`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${purpose === o.id ? 'bg-gold shadow-[0_0_10px_hsl(42_90%_60%)]' : 'bg-violet/50'}`} aria-hidden="true" />
              <span className="font-display text-xl font-semibold">{o.title}</span>
            </span>
            <span className="block mt-2 text-sm text-muted-foreground">{o.desc}</span>
          </button>
        ))}
      </div>

      {purpose && t && (
        <div className="mt-10 grid lg:grid-cols-[1fr_440px] gap-8 items-start">
          <div className="space-y-7 min-w-0">
            {recommended.length > 1 && (
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {recommended.map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={t === id} className="pill" onClick={() => { setTemplate(id); setOmit(new Set()); }} data-testid={`option-template-${id}`}>
                    {TEMPLATE_NAMES[id]}
                  </button>
                ))}
              </div>
            )}
            {recommended.length === 1 && <p className="font-display text-xl text-gold" data-testid="text-template-name">{TEMPLATE_NAMES[t]}</p>}

            {mode === 'filled' && (
              <label className="block">
                <span className="block text-sm mb-1.5 copy-needed">{NEED('label: fill from a saved profile or start blank')}</span>
                <select className="field" value={source} onChange={(e) => prefill(e.target.value)} data-testid="select-source">
                  <option value="">{NEED('option: start blank')}</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
            )}

            <div>
              <label className="label" htmlFor="card-name">{COPY.share.nameLabel}</label>
              {purpose === 'hint' && <p className="text-sm text-muted-foreground -mt-1 mb-2">{COPY.share.nameHelper}</p>}
              <input id="card-name" className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} data-testid="input-card-name" />
            </div>

            {mode === 'filled' && t === 'santa' && (
              <div className="glass rounded-3xl p-5 space-y-4">
                <p className="font-display text-lg">{CARD_TEXT.santa.loves}</p>
                <div className="grid gap-2">{fields.santa.loves.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setSanta({ loves: setArr(fields.santa.loves, i, x) })} testid={`input-santa-love-${i}`} />)}</div>
                <p className="font-display text-lg pt-2">{CARD_TEXT.santa.nos}</p>
                <div className="grid gap-2">{fields.santa.nos.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setSanta({ nos: setArr(fields.santa.nos, i, x) })} testid={`input-santa-no-${i}`} />)}</div>
                <TextField label={CARD_TEXT.santa.budget} value={fields.santa.budget} onChange={(x) => setSanta({ budget: x })} testid="input-santa-budget" />
              </div>
            )}
            {mode === 'filled' && t === 'wish' && (
              <div className="glass rounded-3xl p-5 space-y-4">
                {fields.wish.wishes.map((w, i) => (
                  <div key={i} className="grid gap-2">
                    <TextField label={`${i + 1}`} value={w.wish} onChange={(x) => setFields((f) => ({ ...f, wish: { wishes: f.wish.wishes.map((y, j) => (j === i ? { ...y, wish: x } : y)) } }))} testid={`input-wish-${i}`} />
                    <TextField label={CARD_TEXT.wish.because} value={w.because} onChange={(x) => setFields((f) => ({ ...f, wish: { wishes: f.wish.wishes.map((y, j) => (j === i ? { ...y, because: x } : y)) } }))} testid={`input-wish-because-${i}`} />
                  </div>
                ))}
              </div>
            )}
            {mode === 'filled' && t === 'tot' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass rounded-3xl p-5 space-y-2">
                  <p className="font-display text-lg">{CARD_TEXT.tot.yes}</p>
                  {fields.tot.yes.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setTot({ yes: setArr(fields.tot.yes, i, x) })} testid={`input-tot-yes-${i}`} />)}
                </div>
                <div className="glass rounded-3xl p-5 space-y-2">
                  <p className="font-display text-lg">{CARD_TEXT.tot.no}</p>
                  {fields.tot.no.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setTot({ no: setArr(fields.tot.no, i, x) })} testid={`input-tot-no-${i}`} />)}
                </div>
              </div>
            )}

            {purpose === 'hint' && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-budget-locked">
                <Lock className="w-4 h-4 text-gold" />
                {COPY.share.budgetLocked}
              </p>
            )}
            {purpose === 'list' && t === 'santa' && (
              <label className="flex items-center justify-between gap-4 glass rounded-2xl px-5 py-3 cursor-pointer">
                <span className="font-medium">{COPY.share.budgetToggle}</span>
                <Switch checked={showBudget} onCheckedChange={setShowBudget} data-testid="switch-show-budget" />
              </label>
            )}

            {mode === 'filled' && entries.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">{COPY.share.previewHelper}</p>
                <div className="flex flex-wrap gap-2">
                  {entries.map((e) => (
                    <button key={e.key} type="button" aria-pressed={!omit.has(e.key)} className={`pill ${omit.has(e.key) ? 'strike' : ''}`} onClick={() => toggleOmit(e.key)} data-testid={`toggle-omit-${e.key}`}>
                      {e.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="flex justify-center"><SizePicker size={size} onChange={setSize} /></div>
            <PreviewImage url={preview?.url ?? null} size={size} alt={TEMPLATE_NAMES[t]} />
            {preview?.neutral && (
              <p className="text-sm text-center text-violet" role="status" data-testid="text-neutral-note">{COPY.share.neutral}</p>
            )}
            {mode === 'request' && (
              <p className="text-xs text-center text-muted-foreground break-all" data-testid="text-completion-url">{completionUrl()}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void exportCard(mode, 'share')} data-testid="button-share-card">
                <Share2 className="w-4 h-4" />
                <span>{COPY.share.share}</span>
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void exportCard(mode, 'download')} data-testid="button-download-card">
                <Download className="w-4 h-4" />
                <span>{COPY.share.download}</span>
              </button>
              <button type="button" className="btn btn-ghost col-span-2" disabled={busy} onClick={() => void exportCard('blank', 'download')} data-testid="button-download-blank">
                <FileImage className="w-4 h-4" />
                <span>{COPY.share.blank}</span>
              </button>
              {mode === 'request' && (
                <button type="button" className="btn btn-ghost col-span-2" onClick={() => void sendLink()} data-testid="button-send-link">
                  <Link2 className="w-4 h-4" />
                  <span className="copy-needed !text-current">{NEED('button: send fillable completion link')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
