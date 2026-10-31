import { CX, CY, hash, loveArcs, lovePoints, onRing } from '@/components/starfield';

export type WorldId = 'ringed' | 'ocean' | 'ember' | 'ice' | 'garden' | 'nebula';

export interface World {
  /** Optional transparent PNG URL from App Storage; absent until approved upload. */
  art?: string;
  id: WorldId;
  name: string;
  /** planet gradient: highlight, mid, shadow */
  core: [string, string, string];
  halo: string;
  ring: string | null;
  band: string | null;
  line: string;
  star: string;
}

export const WORLDS: Record<WorldId, World> = {
  ringed: { id: 'ringed', name: 'Ringed giant', core: ['hsl(40 80% 86%)', 'hsl(30 58% 58%)', 'hsl(250 40% 16%)'], halo: 'hsl(36 80% 60%)', ring: 'hsl(42 80% 72%)', band: 'hsl(26 50% 46%)', line: 'hsl(44 80% 76%)', star: 'hsl(46 90% 86%)' },
  ocean: { id: 'ocean', name: 'Ocean world', core: ['hsl(180 70% 82%)', 'hsl(196 64% 42%)', 'hsl(226 60% 14%)'], halo: 'hsl(190 80% 56%)', ring: null, band: 'hsl(178 50% 70%)', line: 'hsl(184 70% 78%)', star: 'hsl(180 80% 90%)' },
  ember: { id: 'ember', name: 'Ember world', core: ['hsl(40 96% 76%)', 'hsl(12 78% 52%)', 'hsl(340 50% 14%)'], halo: 'hsl(18 90% 56%)', ring: null, band: 'hsl(30 96% 64%)', line: 'hsl(32 92% 74%)', star: 'hsl(40 96% 84%)' },
  ice: { id: 'ice', name: 'Ice world', core: ['hsl(200 60% 96%)', 'hsl(206 36% 72%)', 'hsl(224 40% 22%)'], halo: 'hsl(200 70% 80%)', ring: 'hsl(200 50% 90%)', band: null, line: 'hsl(200 60% 88%)', star: 'hsl(200 80% 96%)' },
  garden: { id: 'garden', name: 'Garden world', core: ['hsl(78 60% 80%)', 'hsl(148 40% 40%)', 'hsl(200 50% 12%)'], halo: 'hsl(110 50% 56%)', ring: null, band: 'hsl(46 60% 66%)', line: 'hsl(70 60% 76%)', star: 'hsl(60 80% 88%)' },
  nebula: { id: 'nebula', name: 'Nebula', core: ['hsl(300 80% 88%)', 'hsl(268 54% 54%)', 'hsl(238 55% 16%)'], halo: 'hsl(290 70% 62%)', ring: 'hsl(320 70% 80%)', band: null, line: 'hsl(282 72% 84%)', star: 'hsl(300 80% 92%)' },
};
export const WORLD_ORDER: WorldId[] = ['ringed', 'ocean', 'ember', 'ice', 'garden', 'nebula'];

const CATEGORIES: Record<WorldId, RegExp> = {
  ringed: /\b(music|band|vinyl|record|concert|jazz|rock|guitar|piano|space|astro|planet|star wars|nasa|science|physics|tech|gadget|synth|album|podcast)/i,
  ocean: /\b(sea|ocean|beach|surf|swim|sail|boat|fish|travel|island|lake|river|water|dive|scuba|whale|shell|kayak|coast)/i,
  ember: /\b(food|cook|bak|spic|chili|hot sauce|coffee|espresso|bbq|grill|fire|candle|whisk|wine|beer|cocktail|chocolate|ramen|taco|pizza|cheese|camp)/i,
  ice: /\b(winter|ski|snow|skate|hockey|tea|minimal|book|read|novel|poetry|writ|journal|stationery|pen|chess|puzzle|design|architect|mountain|cold)/i,
  garden: /\b(plant|garden|flower|herb|hik|trail|nature|forest|bird|dog|cat|pet|horse|yoga|run|bike|cycl|farm|mushroom|succulent|tree|climb)/i,
  nebula: /\b(art|paint|draw|anime|manga|fantasy|magic|witch|tarot|game|gaming|d&d|dungeons|film|movie|cinema|theat|cosplay|comic|sci-fi|crystal|dream|museum|fashion|makeup)/i,
};

/** Deterministic: most-hit love category; ties and no hits fall back to a stable hash of name + loves. */
export function chooseWorld(loves: string[], name = ''): WorldId {
  const score = new Map<WorldId, number>();
  for (const l of loves) for (const w of WORLD_ORDER) if (CATEGORIES[w].test(l)) score.set(w, (score.get(w) ?? 0) + 1);
  const best = Math.max(0, ...score.values());
  const seed = skySeed(name, loves);
  if (best === 0) return WORLD_ORDER[seed % WORLD_ORDER.length];
  const top = WORLD_ORDER.filter((w) => score.get(w) === best);
  return top[seed % top.length];
}

export function skySeed(name: string, loves: string[]): number {
  return hash(`${name.trim().toLowerCase()}|${loves.map((l) => l.trim().toLowerCase()).join('|')}`) || 1;
}

function rnd(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Deterministic background specks for the sky (in 320x240 world units). */
export function skySpecks(seed: number, n = 34) {
  const r = rnd(seed);
  const out: { x: number; y: number; r: number; o: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = -60 + r() * 440, y = -40 + r() * 320;
    if (Math.hypot(x - CX, y - CY) < 60) continue;
    out.push({ x, y, r: 0.4 + r() * 0.9, o: 0.25 + r() * 0.55 });
  }
  return out;
}

export interface MiniSkyInput {
  name: string;
  loves: string[];
  refusals: string[];
  world?: WorldId | null;
  monochrome?: boolean;
  worldImage?: CanvasImageSource;
}

/**
 * Canvas helper: draws the same person's world + pattern into a box (used in the
 * reserved bottom-right share-card corner). Pure canvas, no screenshots, no deps.
 */
export function drawMiniSky(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, input: MiniSkyInput) {
  const loves = input.loves.map((t) => t.trim()).filter(Boolean).slice(0, 30);
  const refusals = input.refusals.map((t) => t.trim()).filter(Boolean).slice(0, 12);
  const seed = skySeed(input.name, loves);
  const base = WORLDS[input.world ?? chooseWorld(loves, input.name)];
  const world = input.monochrome ? { ...base, core: ['#FFF1D5', '#BBA67C', '#302C29'],
    halo: 'hsl(42 38% 56%)', ring: base.ring ? '#CEB778' : null,
    band: base.band ? '#A28E68' : null, line: '#E6D3A6', star: '#FFF1CF' } : base;
  const pts = lovePoints(loves.map((text, i) => ({ id: `l${i}`, text })), seed);
  ctx.save();
  // round plate
  const rad = Math.min(box.w, box.h) * 0.16;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, rad);
  ctx.clip();
  const bg = ctx.createRadialGradient(box.x + box.w / 2, box.y + box.h * 0.45, 2, box.x + box.w / 2, box.y + box.h / 2, box.w * 0.75);
  bg.addColorStop(0, input.monochrome ? '#39342C' : '#1A1D45');
  bg.addColorStop(1, input.monochrome ? '#24211F' : '#0A0C1F');
  ctx.fillStyle = bg;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  // world units: x -70..390, y -50..290 -> fit
  const vb = { x: -70, y: -50, w: 460, h: 340 };
  const k = Math.min(box.w / vb.w, box.h / vb.h);
  const ox = box.x + (box.w - vb.w * k) / 2 - vb.x * k;
  const oy = box.y + (box.h - vb.h * k) / 2 - vb.y * k;
  ctx.translate(ox, oy);
  ctx.scale(k, k);
  for (const s of skySpecks(seed, 40)) {
    ctx.globalAlpha = s.o;
    ctx.fillStyle = '#F4EDE0';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Future approved transparent art replaces the placeholder, not the live sky.
  if (input.worldImage) {
    ctx.save();
    if (input.monochrome) ctx.filter = 'grayscale(1) sepia(0.2)';
    ctx.drawImage(input.worldImage, CX - 84, CY - 84, 168, 168);
    ctx.restore();
  } else {
  // halo + planet
  const halo = ctx.createRadialGradient(CX, CY, 30, CX, CY, 84);
  halo.addColorStop(0, world.halo.replace(')', ' / 0.35)'));
  halo.addColorStop(1, world.halo.replace(')', ' / 0)'));
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(CX, CY, 84, 0, Math.PI * 2); ctx.fill();
  const pg = ctx.createRadialGradient(CX - 16, CY - 16, 4, CX, CY, 52);
  pg.addColorStop(0, world.core[0]); pg.addColorStop(0.5, world.core[1]); pg.addColorStop(1, world.core[2]);
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(CX, CY, 46, 0, Math.PI * 2); ctx.fill();
  if (world.band) {
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, 46, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = world.band; ctx.globalAlpha = 0.45; ctx.lineWidth = 5;
    for (const dy of [-14, 4, 20]) { ctx.beginPath(); ctx.ellipse(CX, CY + dy, 60, 8, -0.24, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  if (world.ring) {
    ctx.strokeStyle = world.ring; ctx.globalAlpha = 0.85; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, CY + 3, 78, 14, -0.244, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  }
  // constellation along the ring (never through the planet)
  ctx.strokeStyle = world.line; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.75;
  for (const a of loveArcs(pts)) ctx.stroke(new Path2D(a.d));
  ctx.globalAlpha = 1;
  for (const p of pts) {
    ctx.fillStyle = world.star;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.7, 0, Math.PI * 2); ctx.fill();
  }
  // knocked-out refusals on the outer belt: dim crossed stars
  refusals.forEach((_, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) / refusals.length) * Math.PI * 2 + (seed % 100) / 160;
    const p = onRing(a, 1.62);
    ctx.strokeStyle = 'hsl(245 20% 70% / 0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 5); ctx.lineTo(p.x + 5, p.y + 5); ctx.moveTo(p.x + 5, p.y - 5); ctx.lineTo(p.x - 5, p.y + 5); ctx.stroke();
  });
  ctx.restore();
}
