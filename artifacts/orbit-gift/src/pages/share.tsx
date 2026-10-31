import { useEffect, useMemo, useState } from 'react';
import { Share2, Download, FileImage, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PreviewImage, SizePicker } from '@/components/card-preview';
import { WorldPicker } from '@/components/sky-map';
import { CARD_TEXT, COPY, NEED, TEMPLATE_NAMES } from '@/lib/copy';
import {
  ART_SLOTS,
  PURPOSE_TEMPLATES,
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
  type Version,
} from '@/lib/cards';
import { PUBLIC_CARD_URL, QR_AVAILABLE } from '@/lib/public-url';
import { chooseWorld, type WorldId } from '@/lib/sky';
import { SHARE_PURPOSE_KEY, actions, readKey, useData, useDraft, writeKey } from '@/lib/store';

const pad = (a: string[], n: number) => [...a, ...Array(Math.max(0, n - a.length)).fill('')].slice(0, n);
const ALL_TEMPLATES: TemplateId[] = ['santa', 'wish', 'stumped', 'tot'];
const HOME_PURPOSE: Record<TemplateId, Purpose> = { santa: 'list', wish: 'list', tot: 'list', stumped: 'ask' };

function TextField({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} maxLength={120} data-testid={testid} />
    </label>
  );
}

function PaperShelf({ current, version, purpose, onPick }: { current: TemplateId; version: Version; purpose: Purpose; onPick: (t: TemplateId, v: Version) => void }) {
  return (
    <div>
      <p className="eyebrow mb-1">{COPY.share.shelf}</p>
      <div className="shelf" role="radiogroup" aria-label={COPY.share.shelf} data-testid="shelf-paper">
        {ALL_TEMPLATES.flatMap((t) =>
          (['main', 'neutral'] as const).map((v) => {
            const off = !PURPOSE_TEMPLATES[purpose].includes(t);
            const checked = current === t && version === v;
            const tag = v === 'main' ? COPY.share.pop : COPY.share.neutralName;
            return (
              <button
                key={`${t}-${v}`}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${TEMPLATE_NAMES[t]}, ${tag}${off ? `. ${COPY.share.otherPurpose}` : ''}`}
                className="shelf-item"
                data-off={off}
                onClick={() => onPick(t, v)}
                data-testid={`shelf-${t}-${v}`}
              >
                <img src={ART_SLOTS[t][v]} alt="" loading="lazy" />
                <span className="block mt-1.5 px-0.5 font-display text-[0.78rem] leading-tight line-clamp-2">{TEMPLATE_NAMES[t]}</span>
                <span className="block px-0.5 text-[0.65rem] tracking-[0.2em] uppercase opacity-70">{tag}</span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export default function SharePage() {
  const { recipients, chips, gifts, settings, worlds } = useData();
  const { toast } = useToast();
  const [purpose, setPurpose] = useState<Purpose | null>(() => readKey<Purpose | null>(SHARE_PURPOSE_KEY, null));
  const [template, setTemplate] = useDraft<TemplateId | null>('share-template', null);
  const [prefer, setPrefer] = useDraft<Version>('share-paper', 'main');
  const [source, setSource] = useDraft('share-source', '');
  const [fields, setFields] = useDraft<CardFields>('share-fields', emptyFields());
  const [dropped, setDropped] = useState(0);
  const [size, setSize] = useDraft<Size>('share-size', 'portrait');
  const [omit, setOmit] = useState<Set<string>>(new Set());
  const [localWorld, setLocalWorld] = useDraft<WorldId | null>('share-world', null);
  const [preview, setPreview] = useState<{ url: string; neutral: boolean } | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const recommended = purpose ? PURPOSE_TEMPLATES[purpose] : [];
  const t: TemplateId | null = template && recommended.includes(template) ? template : recommended[0] ?? null;
  const mode: Mode = purpose === 'ask' ? 'request' : 'filled';
  const person = recipients.find((x) => x.id === source);

  const choosePurpose = (p: Purpose) => {
    setPurpose(p);
    writeKey(SHARE_PURPOSE_KEY, p);
    setTemplate(null);
    setOmit(new Set());
  };

  const pickPaper = (nt: TemplateId, v: Version) => {
    if (!purpose || !PURPOSE_TEMPLATES[purpose].includes(nt)) {
      const p = HOME_PURPOSE[nt];
      setPurpose(p);
      writeKey(SHARE_PURPOSE_KEY, p);
    }
    setTemplate(nt);
    setPrefer(v);
    setOmit(new Set());
  };

  const prefill = (rid: string) => {
    setSource(rid);
    setOmit(new Set());
    setDropped(0);
    if (!rid) return setFields(emptyFields());
    const r = recipients.find((x) => x.id === rid);
    if (!r) return;
    const loves = chips.filter((c) => c.recipientId === rid && c.type === 'love').map((c) => c.text);
    const nos = chips.filter((c) => c.recipientId === rid && c.type === 'refuse').map((c) => c.text);
    const saved = gifts.filter((g) => g.recipientId === rid && g.status === 'saved');
    setDropped(Math.max(0, saved.length - 4));
    setFields({
      santa: { loves: pad(loves, 3), nos: pad(nos, 3) },
      wish: { wishes: pad(saved.slice(0, 4).map((g) => g.title), 4) },
      stumped: emptyFields().stumped,
      tot: { yes: pad(loves, 7), no: pad(nos, 7) },
    });
  };

  const refusals = useMemo(() => {
    const out: string[] = [];
    if (source) out.push(...chips.filter((c) => c.recipientId === source && c.type === 'refuse').map((c) => c.text));
    if (t === 'santa') out.push(...fields.santa.nos);
    if (t === 'tot') out.push(...fields.tot.no);
    return out.filter((x) => x.trim());
  }, [source, chips, t, fields]);

  // Typed card answers drive the mini sky, so it matches what is on the card.
  const skyLoves = useMemo(() => {
    if (source) return chips.filter((c) => c.recipientId === source && c.type === 'love').map((c) => c.text);
    if (t === 'santa') return fields.santa.loves;
    if (t === 'tot') return fields.tot.yes;
    if (t === 'wish') return source ? chips.filter((c) => c.recipientId === source && c.type === 'love').map((c) => c.text) : fields.wish.wishes;
    return [...fields.stumped.love.split(/[\n,;]+/), ...fields.stumped.hint.split(/[\n,;]+/)].filter((s) => s.trim());
  }, [t, fields, source, chips]);
  const skyName = person?.name ?? '';
  const autoWorld = chooseWorld(skyLoves.filter((x) => x.trim()), skyName);
  const chosenWorld = source ? worlds[source] ?? null : localWorld;
  const setWorld = (w: WorldId | null) => (source ? actions.setWorld(source, w) : setLocalWorld(w));

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
            name: '',
            refusals,
            appName: settings.appName,
            prefer,
            showQr,
            sky: { name: skyName, loves: skyLoves, refusals, world: chosenWorld },
          }
        : null,
    [t, purpose, mode, size, fields, omit, refusals, settings.appName, prefer, skyName, skyLoves, chosenWorld, showQr],
  );

  useEffect(() => {
    if (!opts) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        const r = await renderCard(opts);
        if (alive) setPreviewError(false);
        if (alive) setPreview({ url: r.canvas.toDataURL('image/png'), neutral: r.neutral });
      } catch {
        if (alive) {
          setPreview(null);
          setPreviewError(true);
        }
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
    // Prefer the verified public URL; the in-app link is only for this device's share sheet, never printed on a card.
    const url = PUBLIC_CARD_URL ? `${PUBLIC_CARD_URL}/complete?template=stumped` : completionUrl();
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

  const entries = t ? entryList(t, fields) : [];
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
      <p className="mt-3 text-lg text-gold/90 font-display enter" style={{ ['--i' as string]: 1 }} data-testid="text-share-constellation">{COPY.share.constellationLine}</p>
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
            <PaperShelf current={t} version={prefer} purpose={purpose} onPick={pickPaper} />
            <p className="font-display text-xl text-gold" data-testid="text-template-name">{TEMPLATE_NAMES[t]}</p>

            {mode === 'filled' && (
              <label className="block">
                <span className="block text-sm mb-1.5">{NEED('label: fill from a saved profile or start blank')}</span>
                <select className="field" value={source} onChange={(e) => prefill(e.target.value)} data-testid="select-source">
                  <option value="">{NEED('option: start blank')}</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>{COPY.share.profile(r.name)}</option>
                  ))}
                </select>
              </label>
            )}

            {mode === 'filled' && t === 'santa' && (
              <div className="glass rounded-3xl p-5 space-y-4">
                <p className="font-display text-lg">{CARD_TEXT.santa.loves}</p>
                <div className="grid gap-2">{fields.santa.loves.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setSanta({ loves: setArr(fields.santa.loves, i, x) })} testid={`input-santa-love-${i}`} />)}</div>
                <p className="font-display text-lg pt-2">{CARD_TEXT.santa.nos}</p>
                <div className="grid gap-2">{fields.santa.nos.map((v, i) => <TextField key={i} label={`${i + 1}`} value={v} onChange={(x) => setSanta({ nos: setArr(fields.santa.nos, i, x) })} testid={`input-santa-no-${i}`} />)}</div>
              </div>
            )}
            {mode === 'filled' && t === 'wish' && (
              <div className="glass rounded-3xl p-5 space-y-3">
                {fields.wish.wishes.map((w, i) => (
                  <TextField key={i} label={`${i + 1}`} value={w} onChange={(x) => setFields((f) => ({ ...f, wish: { wishes: setArr(f.wish.wishes, i, x) } }))} testid={`input-wish-${i}`} />
                ))}
                {dropped > 0 && <p className="text-xs text-muted-foreground" role="status" data-testid="text-wishes-dropped">{COPY.share.wishesDropped(dropped)}</p>}
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

          <div className="lg:sticky lg:top-6">
            <div className="paper-plate space-y-4 !p-4" data-testid="panel-share-paper">
              <div className="flex justify-center"><SizePicker size={size} onChange={setSize} /></div>
              <PreviewImage url={preview?.url ?? null} size={size} alt={TEMPLATE_NAMES[t]} />
              {mode === 'filled' && <WorldPicker value={chosenWorld} auto={autoWorld} onChange={setWorld} />}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showQr} onChange={e => setShowQr(e.target.checked)}
                  disabled={!QR_AVAILABLE} data-testid="toggle-qr" />
                QR code
              </label>
              {previewError && <p className="text-sm text-center paper-ink" role="alert" data-testid="text-preview-error">{COPY.errors.broke}</p>}
              {preview?.neutral && (
                <p className="text-sm text-center paper-ink" role="status" data-testid="text-neutral-note">{COPY.share.neutral}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void exportCard(mode, 'share')} data-testid="button-share-card">
                  <Share2 className="w-4 h-4" />
                  <span>{COPY.share.share}</span>
                </button>
                <button type="button" className="btn btn-ghost !bg-[hsl(234_40%_14%)] !text-[hsl(40_50%_92%)]" disabled={busy} onClick={() => void exportCard(mode, 'download')} data-testid="button-download-card">
                  <Download className="w-4 h-4" />
                  <span>{COPY.share.download}</span>
                </button>
                <button type="button" className="btn btn-ghost col-span-2 !bg-[hsl(234_40%_14%)] !text-[hsl(40_50%_92%)]" disabled={busy} onClick={() => void exportCard('blank', 'download')} data-testid="button-download-blank">
                  <FileImage className="w-4 h-4" />
                  <span>{COPY.share.blank}</span>
                </button>
                {mode === 'request' && (
                  <button type="button" className="btn btn-ghost col-span-2 !bg-[hsl(234_40%_14%)] !text-[hsl(40_50%_92%)]" onClick={() => void sendLink()} data-testid="button-send-link">
                    <Link2 className="w-4 h-4" />
                    <span>{NEED('button: send fillable completion link')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
