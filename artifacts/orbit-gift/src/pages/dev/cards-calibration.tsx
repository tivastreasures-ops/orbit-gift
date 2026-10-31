import { useEffect, useState } from 'react';
import { TEMPLATE_NAMES } from '@/lib/copy';
import { renderReviewCard, type CardFields, type Mode, type RenderResult, type TemplateId, type Version } from '@/lib/cards';

/** DEV ONLY (route registered behind import.meta.env.DEV): slot overlays on the real art with short and very long answers. */
const LONG = 'An extraordinarily specific and absurdly long answer that keeps going well past any sensible slot width just to prove the fit';
const SHORT = 'Tea';

function sample(kind: 'short' | 'long'): CardFields {
  const x = kind === 'short' ? SHORT : LONG;

  return {
    santa: { loves: [x, x, ''], nos: [x, '', x] },
    wish: { wishes: [x, x, x, x] },
    stumped: { love: `${x}\n${x}\n${x}`, no: x, own: '', hint: x },
    tot: { yes: Array(7).fill(x), no: [...Array(6).fill(x), ''] },

  };
}

function Cell({ t, v, kind, mode }: { t: TemplateId; v: Version; kind: 'short' | 'long'; mode: Mode }) {
  const [res, setRes] = useState<{ url: string; r: RenderResult } | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    renderReviewCard({
      template: t, purpose: t === 'stumped' ? 'ask' : 'list', mode, size: 'portrait', fields: sample(kind), omit: new Set(), name: '', refusals: [], appName: 'Orbit & Wonder', debug: true,
      sky: { name: 'Calibration', loves: kind === 'short' ? ['tea', 'jazz', 'hiking'] : Array.from({ length: 14 }, (_, i) => `love ${i}`), refusals: ['pink'] },
    }, v).then((r) => alive && setRes({ url: r.canvas.toDataURL('image/png'), r })).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [t, v, kind, mode]);
  const bad = res?.r.diagnostics.filter((d) => !d.inside) ?? [];
  return (
    <figure className="glass rounded-2xl p-2">
      {res ? <img src={res.url} alt="" className="w-full rounded-lg" /> : <div className="shimmer aspect-[1080/1350] rounded-lg" />}
      <figcaption className="text-xs mt-1">
        {TEMPLATE_NAMES[t]} · {v} · {kind} · {mode} · {err ? 'art failed' : bad.length ? `OUTSIDE: ${bad.map((d) => d.slotId).join(', ')}` : `${res?.r.diagnostics.length ?? 0} slots inside`}
        {res && ` · ellipsis: ${res.r.diagnostics.filter((d) => d.ellipsis).map((d) => d.slotId).join(', ') || 'none'}`}
      </figcaption>
    </figure>
  );
}

export default function CardsCalibration() {
  const [mode, setMode] = useState<Mode>('filled');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl">Card calibration (dev)</h1>
      <div className="mt-3 flex gap-2">
        {(['filled', 'blank', 'request'] as const).map((m) => (
          <button key={m} type="button" className="pill" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['santa', 'wish', 'stumped', 'tot'] as const).flatMap((t) =>
          (['main', 'neutral'] as const).flatMap((v) => (['short', 'long'] as const).map((k) => <Cell key={`${t}${v}${k}`} t={t} v={v} kind={k} mode={mode} />)),
        )}
      </div>
    </div>
  );
}
