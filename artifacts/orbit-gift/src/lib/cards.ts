import { CARD_TEXT, COPY, NEED } from './copy';

export type TemplateId = 'santa' | 'wish' | 'stumped' | 'tot';
export type Purpose = 'hint' | 'list' | 'ask';
export type Size = 'portrait' | 'square';
export type Mode = 'filled' | 'blank' | 'request';

export const PURPOSE_TEMPLATES: Record<Purpose, TemplateId[]> = {
  hint: ['wish', 'tot'],
  list: ['santa', 'wish', 'tot'],
  ask: ['stumped'],
};

export interface CardFields {
  santa: { loves: string[]; nos: string[]; budget: string };
  wish: { wishes: { wish: string; because: string }[] };
  stumped: { love: string; no: string; own: string; hint: string };
  tot: { yes: string[]; no: string[] };
}

export const emptyFields = (): CardFields => ({
  santa: { loves: ['', '', ''], nos: ['', '', ''], budget: '' },
  wish: { wishes: [0, 1, 2, 3].map(() => ({ wish: '', because: '' })) },
  stumped: { love: '', no: '', own: '', hint: '' },
  tot: { yes: Array(6).fill(''), no: Array(6).fill('') },
});

/**
 * TEMPORARY BLANK ART SLOTS — 8 pending (4 main + 4 neutral).
 * Waiting on the Director's uploaded backgrounds. Leave null until approved art arrives;
 * then set to an imported asset URL. Nothing is baked in: all words are drawn live.
 */
export const ART_SLOTS: Record<TemplateId, { main: string | null; neutral: string | null }> = {
  santa: { main: null, neutral: null },
  wish: { main: null, neutral: null },
  stumped: { main: null, neutral: null },
  tot: { main: null, neutral: null },
};

interface Palette {
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  accent2: string;
  muted: string;
  footer: string;
  footerInk: string;
  mark: string;
  families: string[];
}

// Main palettes per spec art direction. "pink" is included as a conservative family for every
// warm palette so any pink refusal flips the whole card to neutral (Hinterwelle test).
const PALETTES: Record<TemplateId, Palette> = {
  santa: {
    bg: '#F3EAD9', panel: '#EBDFC7', ink: '#25331F', accent: '#9E2C27', accent2: '#2F5A38', muted: '#7B6F58',
    footer: '#E3D5BA', footerInk: '#25331F', mark: '#A8843A',
    families: ['red', 'holly', 'scarlet', 'crimson', 'green', 'evergreen', 'cream', 'gold', 'golden', 'pink', 'ivory', 'beige'],
  },
  wish: {
    bg: '#F7F0E3', panel: '#EFE3CB', ink: '#3A1820', accent: '#6D1D2C', accent2: '#9C7F45', muted: '#86705A',
    footer: '#EADCC1', footerInk: '#3A1820', mark: '#A88A4E',
    families: ['burgundy', 'red', 'maroon', 'wine', 'champagne', 'ivory', 'gold', 'golden', 'pink', 'cream'],
  },
  stumped: {
    bg: '#FBF3E2', panel: '#FCEAB0', ink: '#16302F', accent: '#0E6C68', accent2: '#D9682A', muted: '#6E6A55',
    footer: '#F2E2BF', footerInk: '#16302F', mark: '#B08A3A',
    families: ['teal', 'turquoise', 'tangerine', 'orange', 'yellow', 'butter', 'ivory', 'cream', 'gold', 'golden', 'pink', 'blue', 'green'],
  },
  tot: {
    bg: '#F2EBDC', panel: '#E7DECB', ink: '#2A2926', accent: '#55704F', accent2: '#B0553A', muted: '#77705F',
    footer: '#E3D8C2', footerInk: '#2A2926', mark: '#A68A4F',
    families: ['sage', 'green', 'terracotta', 'orange', 'rust', 'pink', 'cream', 'charcoal', 'gold', 'golden'],
  },
};

const NEUTRAL: Palette = {
  bg: '#F4EDE0', panel: '#EAE1D0', ink: '#2C2A27', accent: '#2C2A27', accent2: '#5E5850', muted: '#7A746A',
  footer: '#E5DBC8', footerInk: '#2C2A27', mark: '#A68A4F',
  families: ['cream', 'charcoal', 'gold', 'golden', 'ivory', 'beige', 'grey', 'gray', 'black'],
};

function hits(families: string[], refusals: string[]) {
  const text = refusals.join(' \n ').toLowerCase();
  return families.filter((f) => new RegExp(`\\b${f}\\b`).test(text));
}

export function choosePalette(t: TemplateId, refusals: string[]): { pal: Palette; neutral: boolean } {
  const main = PALETTES[t];
  if (hits(main.families, refusals).length === 0) return { pal: main, neutral: false };
  const h = hits(NEUTRAL.families, refusals);
  // Use a permitted colour for the constellation mark if gold is refused.
  const goldOut = h.includes('gold') || h.includes('golden');
  if (h.some(f => !['gold', 'golden'].includes(f))) {
    // A neutral version is not exempt from hard no's. Blank art can use a
    // permitted high-contrast pair; approved artwork will need its own check.
    const pairs = [
      { bg: '#FFFFFF', ink: '#111111', families: ['white', 'black', 'charcoal', 'grey', 'gray'] },
      { bg: '#101C3A', ink: '#FFFFFF', families: ['blue', 'navy', 'white'] },
      { bg: '#FFFFFF', ink: '#17482B', families: ['white', 'green'] },
      { bg: '#FFF6DB', ink: '#16233F', families: ['cream', 'ivory', 'yellow', 'blue', 'navy'] },
    ];
    const pair = pairs.find(p => hits(p.families, refusals).length === 0);
    if (!pair) throw new Error('No permitted high-contrast card palette');
    return { pal: {
      bg: pair.bg, panel: pair.bg, ink: pair.ink, accent: pair.ink,
      accent2: pair.ink, muted: pair.ink, footer: pair.bg,
      footerInk: pair.ink, mark: pair.ink, families: pair.families,
    }, neutral: true };
  }
  return { pal: { ...NEUTRAL, mark: goldOut ? NEUTRAL.ink : NEUTRAL.mark }, neutral: true };
}

export interface Entry {
  key: string;
  text: string;
  sub?: string;
  subLabel?: string;
}
interface Section {
  label?: string;
  tone: 'a' | 'b';
  entries: Entry[];
}

export interface RenderOpts {
  template: TemplateId;
  purpose: Purpose | null;
  mode: Mode;
  size: Size;
  fields: CardFields;
  omit: Set<string>;
  name: string;
  showBudget: boolean;
  refusals: string[];
  appName: string;
  appUrl: string;
  completionUrl?: string;
}

const pad = (a: string[], n: number) => [...a, ...Array(Math.max(0, n - a.length)).fill('')].slice(0, n);

/** Every filled entry of a template, keyed the same way the renderer omits them. */
export function entryList(t: TemplateId, f: CardFields, budgetAllowed: boolean): Entry[] {
  const out: Entry[] = [];
  if (t === 'santa') {
    f.santa.loves.forEach((x, i) => x.trim() && out.push({ key: `santa.loves.${i}`, text: x.trim() }));
    f.santa.nos.forEach((x, i) => x.trim() && out.push({ key: `santa.nos.${i}`, text: x.trim() }));
    if (budgetAllowed && f.santa.budget.trim()) out.push({ key: 'santa.budget', text: f.santa.budget.trim() });
  } else if (t === 'wish') {
    f.wish.wishes.forEach((w, i) => {
      if (w.wish.trim()) out.push({ key: `wish.${i}`, text: w.wish.trim() });
      if (w.because.trim()) out.push({ key: `wish.because.${i}`, text: w.because.trim() });
    });
  } else if (t === 'tot') {
    f.tot.yes.forEach((x, i) => x.trim() && out.push({ key: `tot.yes.${i}`, text: x.trim() }));
    f.tot.no.forEach((x, i) => x.trim() && out.push({ key: `tot.no.${i}`, text: x.trim() }));
  } else {
    (['love', 'no', 'own', 'hint'] as const).forEach((k) => {
      f.stumped[k].split(/\n+/).forEach((x, i) => x.trim() && out.push({ key: `stumped.${k}.${i}`, text: x.trim() }));
    });
  }
  return out;
}

function buildSections(o: RenderOpts): Section[] {
  const blank = o.mode !== 'filled';
  const f = o.fields;
  const keep = (key: string, text: string) => !o.omit.has(key) && text.trim().length > 0;
  const list = (prefix: string, arr: string[], n: number): Entry[] =>
    blank
      ? pad([], n).map((_, i) => ({ key: `${prefix}.${i}`, text: '' }))
      : arr.map((t, i) => ({ key: `${prefix}.${i}`, text: t.trim() })).filter((e) => keep(e.key, e.text));

  if (o.template === 'santa') {
    const secs: Section[] = [
      { label: CARD_TEXT.santa.loves, tone: 'a', entries: list('santa.loves', f.santa.loves, 3) },
      { label: CARD_TEXT.santa.nos, tone: 'b', entries: list('santa.nos', f.santa.nos, 3) },
    ];
    const budgetOk = o.purpose !== 'hint' && o.showBudget && keep('santa.budget', f.santa.budget);
    if (blank) secs.push({ label: CARD_TEXT.santa.budget, tone: 'a', entries: [{ key: 'santa.budget', text: '' }] });
    else if (budgetOk) secs.push({ label: CARD_TEXT.santa.budget, tone: 'a', entries: [{ key: 'santa.budget', text: f.santa.budget.trim() }] });
    return secs;
  }
  if (o.template === 'wish') {
    const entries: Entry[] = blank
      ? [0, 1, 2, 3].map((i) => ({ key: `wish.${i}`, text: '', sub: '', subLabel: CARD_TEXT.wish.because }))
      : f.wish.wishes
          .map((w, i) => ({
            key: `wish.${i}`,
            text: w.wish.trim(),
            sub: keep(`wish.because.${i}`, w.because) ? w.because.trim() : undefined,
            subLabel: keep(`wish.because.${i}`, w.because) ? CARD_TEXT.wish.because : undefined,
          }))
          .filter((e) => keep(e.key, e.text));
    if (o.size === 'square') {
      const half = Math.ceil(entries.length / 2);
      return [
        { tone: 'a', entries: entries.slice(0, half) },
        { tone: 'a', entries: entries.slice(half) },
      ];
    }
    return [{ tone: 'a', entries }];
  }
  if (o.template === 'tot') {
    return [
      { label: CARD_TEXT.tot.yes, tone: 'a', entries: list('tot.yes', f.tot.yes, 6) },
      { label: CARD_TEXT.tot.no, tone: 'b', entries: list('tot.no', f.tot.no, 6) },
    ];
  }
  const st = (k: 'love' | 'no' | 'own' | 'hint', label: string, tone: 'a' | 'b', n: number): Section => ({
    label,
    tone,
    entries: blank ? list(`stumped.${k}`, [], n) : list(`stumped.${k}`, f.stumped[k].split(/\n+/), 0),
  });
  return [
    st('love', CARD_TEXT.stumped.love, 'a', 3),
    st('no', CARD_TEXT.stumped.no, 'b', 3),
    st('own', CARD_TEXT.stumped.own, 'a', 2),
    st('hint', CARD_TEXT.stumped.hint, 'b', 1),
  ];
}

function header(o: RenderOpts) {
  const T = CARD_TEXT[o.template] as { title: string; subtitle?: string };
  let opening: string | undefined;
  if (o.mode === 'request') opening = COPY.opening.stumped;
  else if (o.mode === 'filled' && o.purpose) opening = COPY.opening[`${o.template}_${o.purpose}`];
  return { title: T.title, subtitle: T.subtitle, opening };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (ctx.measureText(w).width > maxW) {
      if (cur) { lines.push(cur); cur = ''; }
      for (const char of w) {
        if (cur && ctx.measureText(cur + char).width > maxW) {
          lines.push(cur);
          cur = char;
        } else cur += char;
      }
      continue;
    }
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function txt(
  ctx: CanvasRenderingContext2D, t: string, font: string, color: string, lh: number,
  x: number, y: number, maxW: number, draw: boolean, align: CanvasTextAlign = 'left',
): number {
  ctx.font = font;
  const ls = wrap(ctx, t, maxW);
  if (draw) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ls.forEach((l, i) => ctx.fillText(l, align === 'center' ? x + maxW / 2 : x, y + lh * (i + 1) - lh * 0.28));
  }
  return y + ls.length * lh;
}

function rule(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function section(ctx: CanvasRenderingContext2D, sec: Section, x: number, y: number, w: number, s: number, pal: Palette, draw: boolean) {
  const ip = 24 * s;
  let cy = y + ip;
  const iw = w - ip * 2;
  if (sec.label) {
    cy = txt(ctx, sec.label, `700 ${25 * s}px Outfit`, sec.tone === 'b' ? pal.accent2 : pal.accent, 34 * s, x + ip, cy, iw, draw);
    cy += 8 * s;
  }
  for (const e of sec.entries) {
    if (e.text) {
      if (draw) {
        ctx.fillStyle = sec.tone === 'b' ? pal.accent2 : pal.accent;
        ctx.beginPath();
        ctx.arc(x + ip + 6 * s, cy + 22 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      cy = txt(ctx, e.text, `500 ${31 * s}px Outfit`, pal.ink, 42 * s, x + ip + 22 * s, cy, iw - 22 * s, draw);
    } else {
      cy += 50 * s;
      if (draw) rule(ctx, x + ip, x + w - ip, cy - 8 * s, pal.muted);
    }
    if (e.subLabel !== undefined) {
      if (e.sub) {
        cy = txt(ctx, `${e.subLabel} ${e.sub}`, `italic 400 ${25 * s}px Fraunces`, pal.muted, 34 * s, x + ip + 22 * s, cy, iw - 22 * s, draw);
      } else {
        cy = txt(ctx, e.subLabel, `italic 400 ${25 * s}px Fraunces`, pal.muted, 34 * s, x + ip + 22 * s, cy, iw - 22 * s, draw);
        cy += 34 * s;
        if (draw) rule(ctx, x + ip + 22 * s, x + w - ip, cy - 8 * s, pal.muted);
      }
    }
    cy += 6 * s;
  }
  return cy + ip - 6 * s;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paint(ctx: CanvasRenderingContext2D, W: number, o: RenderOpts, pal: Palette, s: number, draw: boolean, secs: Section[]) {
  const padX = 72;
  const cw = W - padX * 2;
  const h = header(o);
  let y = 64 * s + 8;
  y = txt(ctx, h.title, `700 ${70 * s}px Fraunces`, pal.ink, 80 * s, padX, y, cw, draw, 'center');
  if (h.subtitle) y = txt(ctx, h.subtitle, `italic 400 ${34 * s}px Fraunces`, pal.accent, 44 * s, padX, y + 4 * s, cw, draw, 'center');
  if (h.opening) y = txt(ctx, h.opening, `400 ${29 * s}px Outfit`, pal.ink, 40 * s, padX + 20, y + 14 * s, cw - 40, draw, 'center');
  if (o.name.trim()) y = txt(ctx, o.name.trim(), `600 ${30 * s}px Outfit`, pal.accent2, 40 * s, padX, y + 10 * s, cw, draw, 'center');
  y += 26 * s;
  const cols = o.template === 'tot' || o.size === 'square' ? 2 : 1;
  const gap = 22 * s;
  const colW = (cw - gap * (cols - 1)) / cols;
  for (let i = 0; i < secs.length; i += cols) {
    const row = secs.slice(i, i + cols);
    const hs = row.map((sec, j) => section(ctx, sec, padX + j * (colW + gap), y, colW, s, pal, false) - y);
    const rowH = Math.max(...hs);
    if (draw) {
      row.forEach((sec, j) => {
        const x = padX + j * (colW + gap);
        ctx.save();
        ctx.fillStyle = pal.panel;
        ctx.globalAlpha = 0.75;
        roundRect(ctx, x, y, colW, rowH, 22 * s);
        ctx.fill();
        ctx.restore();
        section(ctx, sec, x, y, colW, s, pal, true);
      });
    }
    y += rowH + gap;
  }
  return y;
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const pts = [[0, 0.7], [0.28, 0.15], [0.52, 0.55], [0.78, 0.1], [1, 0.62]].map(([a, b]) => [x + a * 76, y + b * 34]);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  pts.forEach(([px, py], i) => {
    ctx.beginPath();
    ctx.arc(px, py, i === 3 ? 4.2 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load('700 40px Fraunces'),
      document.fonts.load('italic 400 40px Fraunces'),
      document.fonts.load('500 40px Outfit'),
      document.fonts.load('700 40px Outfit'),
      document.fonts.load('400 40px Outfit'),
    ]).catch(() => undefined);
  }
  return fontsReady;
}

export async function renderCard(o: RenderOpts): Promise<{ canvas: HTMLCanvasElement; neutral: boolean }> {
  await ensureFonts();
  const W = 1080;
  const H = o.size === 'portrait' ? 1350 : 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const { pal, neutral } = choosePalette(o.template, o.refusals);

  // Background: temporary blank slot (flat palette fill) until approved art is uploaded.
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  const paletteAdjusted = neutral && pal.bg !== NEUTRAL.bg;
  const slot = paletteAdjusted ? null : ART_SLOTS[o.template][neutral ? 'neutral' : 'main'];
  if (slot) {
    const img = await loadImage(slot);
    if (img) {
      const sc = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
    }
  }

  const FOOT = 92;
  const linkLine = o.template === 'stumped' && o.mode !== 'filled' ? o.completionUrl : undefined;
  const blankLabel = o.mode === 'blank' ? NEED('label on blank PNG saying it is for print/manual completion') : undefined;
  const limit = H - FOOT - (linkLine ? 70 : 0) - (blankLabel ? 48 : 0) - 20;
  const secs = buildSections(o);

  let s = 1;
  for (; s > 0.42; s -= 0.03) {
    if (paint(ctx, W, o, pal, s, false, secs) <= limit) break;
  }
  paint(ctx, W, o, pal, s, true, secs);

  let by = H - FOOT;
  if (linkLine) {
    by -= 62;
    txt(ctx, linkLine, `700 ${28}px Outfit`, pal.accent, 40, 60, by + 8, W - 120, true, 'center');
  }
  if (blankLabel) {
    by -= 46;
    txt(ctx, blankLabel, `500 ${22}px Outfit`, pal.muted, 32, 60, by + 6, W - 120, true, 'center');
  }

  ctx.fillStyle = pal.footer;
  ctx.fillRect(0, H - FOOT, W, FOOT);
  txt(ctx, COPY.footer(o.appName, o.appUrl), `500 ${20}px Outfit`, pal.footerInk, 25, 56, H - FOOT + 16, W - 240, true);
  drawMark(ctx, W - 56 - 76, H - FOOT + 30, pal.mark);

  return { canvas, neutral };
}

export function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(new File([b], filename, { type: 'image/png' })) : reject(new Error('png'))), 'image/png');
  });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Native share sheet with the PNG file only (avoids Android text+file drops); download fallback. */
export async function shareOrDownload(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  downloadFile(file);
  return 'downloaded';
}

export function appUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return (window.location.origin + base).replace(/\/$/, '');
}
export function completionUrl() {
  return `${appUrl()}/complete?template=stumped`;
}
