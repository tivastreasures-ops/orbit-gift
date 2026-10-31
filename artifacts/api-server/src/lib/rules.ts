export type Candidate = {
  title: string; category: string; colours: string[]; brand: string; materials: string[];
  priceMin: number; priceMax: number; whereToLook: string; love: string;
};
export function normal(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
const aliases: Record<string, string[]> = {
  pink: ["pink", "rose", "rosy", "blush", "magenta", "fuchsia", "salmon", "hot pink"],
  dresses: ["dress", "dresses", "gown", "gowns", "sundress"],
  dress: ["dress", "dresses", "gown", "gowns", "sundress"],
  microsoft: ["microsoft", "windows", "xbox", "surface", "bing", "copilot", "office 365"],
  windows: ["microsoft", "windows", "xbox", "surface", "bing", "copilot", "office 365"],
  leather: ["leather", "suede", "hide"],
  wool: ["wool", "cashmere", "merino", "angora"],
  candles: ["candle", "candles"],
};
function contains(haystack: string, needle: string) {
  return (` ${haystack} `).includes(` ${needle} `);
}
function terms(rule: string): string[] {
  const clean = normal(rule).replace(/\b(nothing|anything|no|not|never|the|colour|color|colours|colors|made|of|from|with|a|an|or|and|please|whole|category)\b/g, " ").replace(/\s+/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  return [...new Set([clean, ...parts, ...parts.flatMap(p => aliases[p] ?? [p, p.endsWith("s") ? p.slice(0, -1) : `${p}s`])])].filter(Boolean);
}
export function passesRules(gift: Candidate, refusals: string[], owned: string, rejected: { title: string; reason: string }[]): boolean {
  // Positive-only metadata is required from the model; "not pink" is not accepted as proof.
  const fields = normal([gift.title, gift.category, gift.brand, ...gift.colours, ...gift.materials, gift.whereToLook].join(" "));
  if (refusals.some(rule => terms(rule).some(term => contains(fields, term)))) return false;
  const item = normal(gift.title);
  const ownedItems = owned.split(/[,;\n]+/).map(normal).filter(Boolean);
  if (ownedItems.some(o => item.includes(o) || o.includes(item))) return false;
  // Broad ownership statements (e.g. "every Joy Division record") block that artist's records.
  if (ownedItems.some(o => {
    const words = o.split(" ").filter(w => !["already", "owns", "has", "all", "every", "the", "a", "an"].includes(w));
    return words.length > 1 && words.every(w => fields.includes(w.replace(/s$/, "")));
  })) return false;
  if (rejected.some(r => normal(r.title) === item)) return false;
  return true;
}
