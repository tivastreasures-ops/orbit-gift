import { CARD_TEXT, COPY, NEED } from './copy';
import SLOTS from './card-slots.json';
import { PUBLIC_CARD_URL, shortLink, validatePublicUrl } from './public-url';
import { drawMiniSky, chooseWorld, WORLDS, type MiniSkyInput } from './sky';
import QRCode from 'qrcode';

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
  santa: { loves: string[]; nos: string[] };
  wish: { wishes: string[] };
  stumped: { love: string; no: string; own: string; hint: string };
  tot: { yes: string[]; no: string[] };
}

export const emptyFields = (): CardFields => ({
  santa: { loves: ['', '', ''], nos: ['', '', ''] },
  wish: { wishes: ['', '', '', ''] },
  stumped: { love: '', no: '', own: '', hint: '' },
  tot: { yes: Array(7).fill(''), no: Array(7).fill('') },
});


export type Version = 'main' | 'neutral';
export const SLUG: Record<TemplateId, string> = {
  santa: 'secret-santa', wish: 'all-i-want', stumped: 'im-stumped', tot: 'this-or-that',
};
const apiBase = () => (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
/** Director-approved backgrounds, served same-origin by the API (App Storage, read-only). */
export const ART_SLOTS: Record<TemplateId, Record<Version, string>> = Object.fromEntries(
  (Object.keys(SLUG) as TemplateId[]).map((t) => [t, {
    main: `${apiBase()}/api/card-art/${SLUG[t]}-main.png`,
    neutral: `${apiBase()}/api/card-art/${SLUG[t]}-neutral.png`,
  }]),
) as Record<TemplateId, Record<Version, string>>;

interface Palette { ink: string; families: string[] }
const INK = '#2C2A27'; // dark charcoal on the cream art
const APP_NAVY = '#0A0C1F'; // hsl(234 52% 8%) — app --background

// Colour words per approved image. NEUTRAL_BASE colours appear in ALL images (main too), so a
// hard-no on them fails closed. Any hard-no on a main-only colour (incl. conservative pink) flips to neutral.
const NEUTRAL_BASE = ['charcoal', 'cream', 'ivory', 'off-white', 'beige', 'gold', 'golden', 'black', 'grey', 'gray', 'white'];
const YELLOWS = ['yellow', 'mustard', 'ochre'];
const PALETTES: Record<TemplateId, Palette> = {
  santa: { ink: INK, families: ['red', 'holly', 'scarlet', 'crimson', 'cherry', 'green', 'evergreen', 'forest green', 'pink', 'rose', 'blush', ...NEUTRAL_BASE] },
  wish: { ink: INK, families: ['burgundy', 'red', 'maroon', 'wine', 'oxblood', 'claret', 'pink', 'rose', 'blush', 'champagne', ...NEUTRAL_BASE] },
  stumped: { ink: INK, families: ['teal', 'turquoise', 'aqua', 'tangerine', 'orange', 'coral', 'pink', 'blue', 'green', ...YELLOWS, 'butter', ...NEUTRAL_BASE] },
  tot: { ink: INK, families: ['sage', 'green', 'olive', 'terracotta', 'orange', 'rust', 'brick', 'red', 'pink', 'peach', 'coral', ...NEUTRAL_BASE] },
};
const NEUTRALS: Record<TemplateId, Palette> = {
  santa: { ink: INK, families: [...NEUTRAL_BASE, 'brown', 'tan'] },
  wish: { ink: INK, families: [...NEUTRAL_BASE, 'blue', 'pale blue', 'light blue', 'baby blue', 'silver'] },
  stumped: { ink: INK, families: [...NEUTRAL_BASE, ...YELLOWS] },
  tot: { ink: INK, families: [...NEUTRAL_BASE, ...YELLOWS] },
};
const SQUARE_BG = ['navy', 'blue', 'midnight', 'indigo'];

function hits(families: string[], refusals: string[]) {
  const text = refusals.join(' \n ').toLowerCase();
  return families.filter((f) => new RegExp(`(^|[^a-z])${f.replace(/[-\s]/g, '[-\\s]?')}(e?s)?([^a-z]|$)`).test(text));
}

export function choosePalette(t: TemplateId, refusals: string[]): { pal: Palette; neutral: boolean } {
  // Base colours are in every image: refusing them fails closed even before choosing a version.
  if (hits(NEUTRAL_BASE, refusals).length) throw new Error('No permitted card palette');
  if (hits(PALETTES[t].families, refusals).length === 0) return { pal: PALETTES[t], neutral: false };
  if (hits(NEUTRALS[t].families, refusals).length) throw new Error('No permitted card palette');
  return { pal: NEUTRALS[t], neutral: true };
}

export interface Entry {
  key: string;
  text: string;
  sub?: string;
  subLabel?: string;
}

export interface RenderOpts {
  template: TemplateId;
  purpose: Purpose | null;
  mode: Mode;
  size: Size;
  fields: CardFields;
  omit: Set<string>;
  name: string;
  refusals: string[];
  appName: string;
  /** Verified public URL only (PUBLIC_CARD_URL). Never a dev host. Empty = brand-only footer. */
  publicUrl?: string;
  showQr?: boolean;
  /** Person's world + pattern for the reserved bottom-right corner (filled cards only). */
  sky?: MiniSkyInput | null;
  /** Paper shelf choice; the no-list palette check can still force neutral. */
  prefer?: Version;
  /** Dev calibration: outline slots and reserved areas. */
  debug?: boolean;
}

/** Every filled entry of a template, keyed the same way the renderer omits them. */
export function entryList(t: TemplateId, f: CardFields): Entry[] {
  const out: Entry[] = [];
  if (t === 'santa') {
    f.santa.loves.forEach((x, i) => x.trim() && out.push({ key: `santa.loves.${i}`, text: x.trim() }));
    f.santa.nos.forEach((x, i) => x.trim() && out.push({ key: `santa.nos.${i}`, text: x.trim() }));
  } else if (t === 'wish') {
    f.wish.wishes.forEach((w, i) => w.trim() && out.push({ key: `wish.${i}`, text: w.trim() }));
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


export interface Box { x: number; y: number; w: number; h: number }
export interface SlotDef {
  id: string; x: number; y: number; w: number; h: number;
  align?: 'center'; maxFont: number; minFont: number; maxLines: number; text?: string; prefix?: string; prompt?: string;
}
export interface Layout {
  images: Record<Version, string>;
  paintedTitles: boolean;
  reserved: { constellation: Box; strip: Box };
  slots: SlotDef[];
}
export const SRC_W = SLOTS.canvas.width;
export const SRC_H = SLOTS.canvas.height;
export const LAYOUTS = SLOTS.templates as unknown as Record<string, Layout>;
export const layoutFor = (t: TemplateId): Layout => LAYOUTS[SLUG[t]];
export const slotsFor = (t: TemplateId) => layoutFor(t).slots;
const slotText = (t: TemplateId, id: string) => slotsFor(t).find((s) => s.id === id)?.text ?? '';

export const isLabelSlot = (id: string) => id === 'title' || id === 'subtitle' || /-(label|heading)$/.test(id);
const isPlainSlot = (id: string) => id === 'footer' || id === 'link' || id === 'opening' || id === 'request';
/** Typed answers (handwriting). */
export const isEntrySlot = (id: string) => !isLabelSlot(id) && !isPlainSlot(id);

const STUMPED_SEND_BACK = /\s*Then send your answers back to me!\s*$/;

export function footerText(appName: string, publicUrl = PUBLIC_CARD_URL) {
  return COPY.footer(appName, publicUrl ? shortLink(publicUrl) : '');
}

/** Maps editor fields + mode + omit list to exact slot ids. Missing ids are not drawn. */
export function slotValues(o: RenderOpts): Record<string, string> {
  const v: Record<string, string> = {};
  const filled = o.mode === 'filled';
  const f = o.fields;
  const pub = validatePublicUrl(o.publicUrl ?? PUBLIC_CARD_URL);
  const keep = (key: string, text: string) => !o.omit.has(key) && text.trim().length > 0;
  const pack = (prefix: string, arr: string[]) =>
    arr.map((t, i) => ({ key: `${prefix}.${i}`, text: t.trim() })).filter((e) => keep(e.key, e.text)).map((e) => e.text);
  const opening = filled && o.purpose ? COPY.opening[`${o.template}_${o.purpose}`] : undefined;
  v.footer = footerText(o.appName, pub);

  if (o.template === 'santa') {
    v.title = slotText('santa', 'title');
    if (opening) v.opening = opening;
    v['loves-label'] = slotText('santa', 'loves-label');
    v['nos-label'] = slotText('santa', 'nos-label');
    if (filled) {
      pack('santa.loves', f.santa.loves).slice(0, 3).forEach((t, i) => (v[`love-${i + 1}`] = t));
      pack('santa.nos', f.santa.nos).slice(0, 3).forEach((t, i) => (v[`no-${i + 1}`] = t));
    }
  } else if (o.template === 'wish') {
    v.title = slotText('wish', 'title');
    v.opening = opening ?? CARD_TEXT.wish.subtitle;
    if (filled) pack('wish', f.wish.wishes).slice(0, 4).forEach((t, i) => (v[`wish-${i + 1}`] = t));
  } else if (o.template === 'stumped') {
    v.title = slotText('stumped', 'title');
    const full = slotText('stumped', 'request');
    // "Then send your answers back to me!" only on the Blank Card export.
    v.request = o.mode === 'blank' ? full : full.replace(STUMPED_SEND_BACK, '');
    (['love', 'no', 'own', 'hint'] as const).forEach((k, i) => {
      v[`q${i + 1}-label`] = slotText('stumped', `q${i + 1}-label`);
      if (filled) {
        const lines = f.stumped[k].split(/\n+/).map((t, j) => ({ key: `stumped.${k}.${j}`, text: t.trim() })).filter((e) => keep(e.key, e.text));
        if (lines.length) v[`q${i + 1}-answer`] = lines.map((e) => e.text).join('\n');
      }
    });
    if (o.mode === 'blank') v.link = NEED('label on blank PNG saying it is for print/manual completion');
    else if (o.mode === 'request' && pub) {
      // One link only: the fill-in link replaces the footer link.
      v.link = `Fill it in at ${shortLink(pub)}/complete`;
      v.footer = COPY.footer(o.appName, '');
    }
  } else {
    (['yes-heading', 'no-heading', 'title', 'subtitle'] as const).forEach((id) => (v[id] = slotText('tot', id)));
    if (opening) v.opening = opening;
    if (filled) {
      pack('tot.yes', f.tot.yes).slice(0, 7).forEach((t, i) => (v[`yes-${i + 1}`] = t));
      pack('tot.no', f.tot.no).slice(0, 7).forEach((t, i) => (v[`no-${i + 1}`] = t));
    }
  }
  if (layoutFor(o.template).paintedTitles) for (const id of Object.keys(v)) if (isLabelSlot(id)) delete v[id];
  return v;
}

export interface SlotDiagnostic {
  slotId: string;
  box: { x: number; y: number; w: number; h: number };
  bounds: { x: number; y: number; w: number; h: number };
  font: string;
  fontPx: number;
  lineCount: number;
  ellipsis: boolean;
  inside: boolean;
}

const graphemes = (s: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment) : Array.from(s);
};
const inkW = (ctx: CanvasRenderingContext2D, s: string) => {
  const m = ctx.measureText(s);
  // Full ink extent incl. negative left bearing and right overhang beyond the advance.
  return Math.max(m.width, m.actualBoundingBoxRight) + Math.max(0, m.actualBoundingBoxLeft);
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (inkW(ctx, t) <= maxW) { cur = t; continue; }
      if (cur) { out.push(cur); cur = ''; }
      if (inkW(ctx, w) <= maxW) { cur = w; continue; }
      for (const g of graphemes(w)) {
        if (cur && inkW(ctx, cur + g) > maxW) { out.push(cur); cur = g; } else cur += g;
      }
    }
    if (cur) out.push(cur);
  }
  return out.length ? out : [''];
}

function ellipsize(ctx: CanvasRenderingContext2D, line: string, maxW: number) {
  const g = graphemes(line.trimEnd());
  while (g.length && inkW(ctx, g.join('').trimEnd() + '…') > maxW) g.pop();
  return g.join('').trimEnd() + '…';
}

export type SlotFont = 'label' | 'entry' | 'plain';
export const slotFont = (id: string): SlotFont => (isLabelSlot(id) ? 'label' : isEntrySlot(id) ? 'entry' : 'plain');

/**
 * Reusable fit: max font -> shrink to min -> wrap to maxLines -> ellipsis. Clipped to the box,
 * so nothing is ever drawn outside the slot. Exported for QA.
 */
export function fitSlot(ctx: CanvasRenderingContext2D, s: SlotDef, text: string, ink: string, kx: number, ky: number, alpha = 1): SlotDiagnostic {
  const box = { x: s.x * kx, y: s.y * ky, w: s.w * kx, h: s.h * ky };
  const kind = slotFont(s.id);
  const family = kind === 'label' ? '"Josefin Sans"' : kind === 'entry' ? '"Caveat"' : '"DM Sans"';
  const weight = kind === 'label' ? (s.id === 'title' ? 300 : 600) : kind === 'entry' ? 600 : 400;
  const LH = 1.18;
  const fontAt = (px: number) => `${weight} ${px}px ${family}`;
  const single = text.replace(/\s*\n\s*/g, ' ');
  const vfit = (px: number, n: number) => {
    ctx.font = fontAt(px);
    const m = ctx.measureText('ÁgjÉ|');
    const lineH = Math.max(px * LH, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
    return lineH * n <= box.h + 0.5 ? lineH : 0;
  };
  // Caveat runs small for its size; scale entries up so they read like the old body text.
  const boost = kind === 'entry' ? 1.22 : 1;
  let px = s.maxFont * kx * boost;
  const minPx = s.minFont * kx * boost;
  let lines: string[] = [];
  let ellipsis = false;
  const hasBreaks = text.includes('\n') && s.maxLines > 1;
  for (; px >= minPx - 0.01; px -= 1) {
    ctx.font = fontAt(px);
    if (!hasBreaks && inkW(ctx, single) <= box.w && vfit(px, 1)) { lines = [single]; break; }
  }
  if (!lines.length) {
    px = minPx;
    ctx.font = fontAt(px);
    let maxL = s.maxLines;
    while (maxL > 1 && !vfit(px, maxL)) maxL--;
    const all = s.maxLines === 1 ? [single] : wrapLines(ctx, text, box.w);
    lines = all.slice(0, maxL);
    if (all.length > maxL || inkW(ctx, lines[lines.length - 1]) > box.w) {
      ellipsis = true;
      lines[lines.length - 1] = ellipsize(ctx, lines[lines.length - 1], box.w);
    }
  }
  ctx.font = fontAt(px);
  const lineH = vfit(px, 1) || px * LH;
  const blockH = lineH * lines.length;
  const top = box.y + Math.max(0, (box.h - blockH) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.fillStyle = ink;
  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = s.align === 'center' ? 'center' : 'left';
  const bx = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
  lines.forEach((l, i) => {
    const m = ctx.measureText(l);
    const asc = m.fontBoundingBoxAscent ?? px * 0.8;
    const desc = m.fontBoundingBoxDescent ?? px * 0.2;
    const baseY = top + i * lineH + (lineH - (asc + desc)) / 2 + asc;
    const x = s.align === 'center'
      ? box.x + box.w / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2
      : box.x + Math.max(0, m.actualBoundingBoxLeft);
    ctx.fillText(l, x, baseY);
    bx.l = Math.min(bx.l, x - m.actualBoundingBoxLeft);
    bx.r = Math.max(bx.r, x + m.actualBoundingBoxRight);
    bx.t = Math.min(bx.t, baseY - m.actualBoundingBoxAscent);
    bx.b = Math.max(bx.b, baseY + m.actualBoundingBoxDescent);
  });
  ctx.restore();
  const bounds = { x: bx.l, y: bx.t, w: bx.r - bx.l, h: bx.b - bx.t };
  const e = 0.5;
  return {
    slotId: s.id, box, bounds, font: fontAt(Math.round(px * 100) / 100), fontPx: px, lineCount: lines.length, ellipsis,
    inside: bounds.x >= box.x - e && bounds.y >= box.y - e && bx.r <= box.x + box.w + e && bx.b <= box.y + box.h + e,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => (img.naturalWidth ? res(img) : rej(new Error('art')));
    img.onerror = () => rej(new Error('art'));
    img.src = src;
  });
}

const FONT_SPECS = ['300 40px "Josefin Sans"', '600 40px "Josefin Sans"', '400 40px "DM Sans"', '600 40px "Caveat"'];
let fontsReady: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      await document.fonts.ready;
      const loaded = await Promise.all(FONT_SPECS.map((f) => document.fonts.load(f)));
      if (loaded.some((l) => l.length === 0)) throw new Error('Card fonts unavailable');
    })();
    fontsReady.catch(() => { fontsReady = null; });
  }
  return fontsReady;
}

function starrySquare(portrait: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1080;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = APP_NAVY;
  ctx.fillRect(0, 0, 1080, 1080);
  let seed = 1793417;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#F4EDE0';
  for (let i = 0; i < 140; i++) {
    const x = rnd() * 1080, y = rnd() * 1080, r = 0.5 + rnd() * 1.4;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // contain: 1080x1350 * 0.8 = 864x1080, centred at x=108. Never cropped or reflowed.
  ctx.drawImage(portrait, 108, 0, 864, 1080);
  return c;
}

export interface RenderResult { canvas: HTMLCanvasElement; neutral: boolean; diagnostics: SlotDiagnostic[] }

function ruledLines(ctx: CanvasRenderingContext2D, s: SlotDef, kx: number, ky: number) {
  const box = { x: s.x * kx, y: s.y * ky, w: s.w * kx, h: s.h * ky };
  const n = Math.max(1, Math.min(s.maxLines, Math.floor(box.h / (34 * ky))));
  ctx.save();
  ctx.strokeStyle = 'rgba(44, 42, 39, 0.22)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= n; i++) {
    const y = Math.round(box.y + (box.h / n) * i - 4 * ky) + 0.5;
    ctx.beginPath(); ctx.moveTo(box.x + 2, y); ctx.lineTo(box.x + box.w - 2, y); ctx.stroke();
  }
  ctx.restore();
}

function outline(ctx: CanvasRenderingContext2D, b: Box, kx: number, ky: number, color: string, label?: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.strokeRect(b.x * kx, b.y * ky, b.w * kx, b.h * ky);
  if (label) { ctx.fillStyle = color; ctx.font = '600 14px "DM Sans"'; ctx.fillText(label, b.x * kx + 3, b.y * ky - 4); }
  ctx.restore();
}

async function renderVersion(o: RenderOpts, version: Version, ink: string): Promise<RenderResult> {
  const [img] = await Promise.all([loadImage(ART_SLOTS[o.template][version]), ensureFonts()]);
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  // Source is 1122x1402; scale per axis (aspect differs < 0.04%) so nothing is cropped.
  ctx.drawImage(img, 0, 0, W, H);
  const kx = W / SRC_W, ky = H / SRC_H;
  const vals = slotValues(o);
  const layout = layoutFor(o.template);
  const qr = { x: layout.reserved.strip.x + layout.reserved.strip.w - 70,
    y: layout.reserved.strip.y, w: 70, h: 70 };
  const publicUrl = validatePublicUrl(o.publicUrl ?? PUBLIC_CARD_URL);
  const showQr = !!o.showQr && !!publicUrl;
  const diagnostics: SlotDiagnostic[] = [];
  for (const s of layout.slots) {
    const t = vals[s.id];
    const bounded = showQr && s.id === 'footer' ? { ...s, w: Math.min(s.w, qr.x - s.x - 16) } : s;
    if (t && t.trim()) diagnostics.push(fitSlot(ctx, bounded, t, ink, kx, ky));
    else if (isEntrySlot(s.id) && s.prompt) {
      if (o.mode === 'blank') ruledLines(ctx, s, kx, ky);
      else if (o.mode === 'filled') fitSlot(ctx, s, s.prompt, ink, kx, ky, 0.3);
    }
  }
  const sky = o.sky;
  if (sky) {
    const c = layout.reserved.constellation;
    const worldArt = WORLDS[sky.world ?? chooseWorld(sky.loves, sky.name)].art;
    const worldImage = worldArt ? await loadImage(worldArt) : undefined;
    drawMiniSky(ctx, { x: c.x * kx, y: c.y * ky, w: c.w * kx, h: c.h * ky },
      { ...sky, worldImage, monochrome: version === 'neutral' });
  }
  if (showQr) {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, o.mode === 'request' ? `${publicUrl}/complete` : publicUrl, {
      width: Math.round(qr.w * kx), margin: 2, color: { dark: '#2C2A27', light: '#FFF8E8' },
    });
    ctx.drawImage(qrCanvas, qr.x * kx, qr.y * ky, qr.w * kx, qr.h * ky);
  }
  if (o.debug) {
    for (const s of layout.slots) outline(ctx, s, kx, ky, isLabelSlot(s.id) ? '#B0306A' : isEntrySlot(s.id) ? '#1F6FB0' : '#2E8B57', s.id);
    outline(ctx, layout.reserved.constellation, kx, ky, '#D07A00', 'constellation');
    outline(ctx, layout.reserved.strip, kx, ky, '#D07A00', 'strip');
    outline(ctx, qr, kx, ky, '#2E8B57', 'QR');
  }
  const out = o.size === 'square' ? starrySquare(canvas) : canvas;
  return { canvas: out, neutral: version === 'neutral', diagnostics };
}

/** Ordinary render: automatic palette check against the hard-no list (throws when no permitted version). */
export async function renderCard(o: RenderOpts): Promise<RenderResult> {
  const { pal, neutral } = choosePalette(o.template, o.refusals);
  // Starry square background is app navy: a blue/navy hard-no fails closed rather than use a forbidden bg.
  if (o.size === 'square' && hits(SQUARE_BG, o.refusals).length) throw new Error('No permitted square background');
  if (!neutral && o.prefer === 'neutral') {
    // Shelf asked for Neutral: allowed unless the no list also hits a neutral-only colour.
    if (hits(NEUTRALS[o.template].families, o.refusals).length === 0) return renderVersion(o, 'neutral', NEUTRALS[o.template].ink);
  }
  return renderVersion(o, neutral ? 'neutral' : 'main', pal.ink);
}

/** QA / dev calibration only: forces main or neutral art, skipping the palette check. */
export function renderReviewCard(o: RenderOpts, version: Version): Promise<RenderResult> {
  return renderVersion(o, version, INK);
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
