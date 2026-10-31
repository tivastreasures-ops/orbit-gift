import { useEffect, useState } from 'react';
import { Share2, Download } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Starfield, Mark } from '@/components/starfield';
import { PreviewImage, SizePicker } from '@/components/card-preview';
import { CARD_TEXT, COPY } from '@/lib/copy';
import { appUrl, canvasToFile, downloadFile, emptyFields, renderCard, shareOrDownload, type CardFields, type Size } from '@/lib/cards';

/**
 * Public, blank, no-sign-in I'm Stumped completion form.
 * Never reads or writes localStorage and never touches giver data; everything is in memory.
 */
export default function CompletePage() {
  const [vals, setVals] = useState<CardFields['stumped']>(emptyFields().stumped);
  const [name, setName] = useState('');
  const [size, setSize] = useState<Size>('portrait');
  const [made, setMade] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [calm, setCalm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const appName = COPY.home.name;
  const opts = () => ({
    template: 'stumped' as const,
    purpose: null,
    mode: 'filled' as const,
    size,
    fields: { ...emptyFields(), stumped: vals },
    omit: new Set<string>(),
    name,
    showBudget: false,
    refusals: [vals.no],
    appName,
    appUrl: appUrl(),
  });

  useEffect(() => {
    document.title = `${COPY.home.name} · ${COPY.home.tagline}`;
  }, []);

  useEffect(() => {
    if (!made) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      const r = await renderCard(opts());
      if (alive) setPreview(r.canvas.toDataURL('image/png'));
    }, 120);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [made, vals, name, size]);

  const exportPng = async (how: 'share' | 'download' | 'blank') => {
    setBusy(true);
    try {
      const { canvas } = await renderCard({
        ...opts(),
        ...(how === 'blank' ? { mode: 'blank' as const, name: '', fields: emptyFields() } : {}),
      });
      const file = await canvasToFile(canvas, `orbit-wonder-stumped-${size}.png`);
      if (how === 'share') {
        const res = await shareOrDownload(file);
        if (res === 'downloaded') setNote(COPY.share.saved);
      } else {
        downloadFile(file);
        setNote(COPY.share.saved);
      }
    } catch {
      setNote(COPY.errors.broke);
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ['love', CARD_TEXT.stumped.love],
    ['no', CARD_TEXT.stumped.no],
    ['own', CARD_TEXT.stumped.own],
    ['hint', CARD_TEXT.stumped.hint],
  ] as const;

  return (
    <div className={`relative min-h-[100dvh] ${calm ? 'reduce-motion' : ''}`}>
      <Starfield count={60} />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <p className="flex items-center gap-2 text-sm">
          <Mark className="w-8 h-4 text-gold" />
          <span className="font-display text-base">{COPY.home.name}</span>
          <span className="text-violet/80 text-xs tracking-[0.2em] uppercase">{COPY.home.tagline}</span>
        </p>
        <h1 className="mt-8 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] enter" data-testid="text-complete-title">{COPY.complete.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl enter" style={{ ['--i' as string]: 1 }}>{COPY.complete.intro}</p>

        <div className="mt-10 grid lg:grid-cols-[1fr_420px] gap-8 items-start">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setMade(true);
            }}
          >
            <p className="font-display text-2xl text-gold">{CARD_TEXT.stumped.title}</p>
            <p className="text-muted-foreground -mt-3">{CARD_TEXT.stumped.subtitle}</p>
            {fields.map(([k, label], i) => (
              <div key={k} className="enter" style={{ ['--i' as string]: i + 2 }}>
                <label className="label" htmlFor={`c-${k}`}>{label}</label>
                <textarea id={`c-${k}`} rows={k === 'hint' ? 2 : 3} className="field resize-y" value={vals[k]} maxLength={400} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} data-testid={`input-complete-${k}`} />
              </div>
            ))}
            <div>
              <label className="label" htmlFor="c-name">{COPY.share.nameLabel}</label>
              <input id="c-name" className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} data-testid="input-complete-name" />
            </div>
            <button type="submit" className="btn btn-gold px-8 min-h-[54px]" data-testid="button-make-card">{COPY.complete.make}</button>
             <button type="button" className="btn btn-ghost ml-2" disabled={busy} onClick={() => void exportPng('blank')} data-testid="button-complete-blank">
               <Download className="w-4 h-4" />{COPY.share.blank}
             </button>
            <label className="flex items-center gap-3 text-sm text-muted-foreground pt-4 cursor-pointer">
              <Switch checked={calm} onCheckedChange={setCalm} data-testid="switch-complete-motion" />
              {COPY.settings.motion}
            </label>
          </form>

          {made && (
            <div className="space-y-4 lg:sticky lg:top-6">
              <p className="font-display text-xl text-center" role="status" data-testid="text-complete-done">{COPY.complete.done}</p>
              <div className="flex justify-center"><SizePicker size={size} onChange={setSize} /></div>
              <PreviewImage url={preview} size={size} alt={CARD_TEXT.stumped.title} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void exportPng('share')} data-testid="button-share-back">
                  <Share2 className="w-4 h-4" />
                  <span>{COPY.complete.shareBack}</span>
                </button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void exportPng('download')} data-testid="button-complete-download">
                  <Download className="w-4 h-4" />
                  <span>{COPY.complete.download}</span>
                </button>
              </div>
              {note && <p className="text-sm text-center text-violet" role="status">{note}</p>}
            </div>
          )}
        </div>
        <footer className="mt-16 pt-6 border-t border-[hsl(252_30%_30%/0.4)] text-xs text-muted-foreground space-y-1">
          <p>{COPY.settings.privacy}</p>
          <p>{COPY.settings.fine}</p>
        </footer>
      </div>
    </div>
  );
}
