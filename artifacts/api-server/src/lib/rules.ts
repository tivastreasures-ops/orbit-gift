export type Candidate = {
  title: string; category: string; colours: string[]; brand: string; materials: string[];
  priceMin: number; priceMax: number; whereToLook: string; love?: string;
};
export function normal(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const aliases: Record<string, string[]> = {
  pink: ["pink", "rose", "rosy", "blush", "magenta", "fuchsia", "salmon", "hot pink"],
  dresses: ["dress", "dresses", "gown", "gowns", "sundress"],
  dress: ["dress", "dresses", "gown", "gowns", "sundress"],
  microsoft: ["microsoft", "windows", "xbox", "surface", "bing", "copilot", "office", "office 365", "office365"],
  windows: ["microsoft", "windows", "xbox", "surface", "bing", "copilot", "office", "office 365", "office365"],
  leather: ["leather", "suede", "hide"],
  wool: ["wool", "cashmere", "merino", "angora"],
  candles: ["candle", "candles"],
};
function contains(haystack: string, needle: string) {
  return (` ${haystack} `).includes(` ${needle} `);
}
export function refusalTerms(rule: string): string[] {
  const clauses = normal(rule).split(/\b(?:or|and)\b/).map(clause =>
    clause.replace(/\b(nothing|anything|no|not|never|the|colour|color|colours|colors|made|of|from|with|a|an|please|whole|category)\b/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  return [...new Set(clauses.flatMap(clean => {
    const parts = clean.split(" ");
    // Preserve multiword meaning: "pop music" is not Funko Pop, and Crunch
    // Fitness is not every fitness activity. Known aliases still expand safely.
    return [clean, ...parts.flatMap(p => aliases[p] ?? (parts.length === 1 ? [p, p.endsWith("s") ? p.slice(0, -1) : `${p}s`] : []))];
  }))].filter(Boolean);
}
export function passesRules(gift: Candidate, refusals: string[], owned: string, rejected: { title: string; reason: string }[], expandedTerms: readonly string[] = []): boolean {
  // Positive-only metadata is required from the model; "not pink" is not accepted as proof.
  const fields = normal([gift.title, gift.category, gift.brand, ...gift.colours, ...gift.materials, gift.whereToLook].join(" "));
  if (hardNoHits(gift, refusals, expandedTerms).length) return false;
  const item = normal(gift.title);
  const ownedItems = owned.split(/[,;\n]+/).map(normal).filter(Boolean);
  if (ownedItems.some(o => contains(item, o) || contains(o, item))) return false;
  // Broad ownership statements (e.g. "every Joy Division record") block that artist's records.
  if (ownedItems.some(o => {
    const words = o.split(" ").filter(w => !["already", "owns", "has", "all", "every", "the", "a", "an"].includes(w));
    return words.length > 1 && words.every(w => contains(fields, w) ||
      contains(fields, w.endsWith("s") ? w.slice(0, -1) : `${w}s`));
  })) return false;
  if (rejected.some(r => normal(r.title) === item)) return false;
  return true;
}
export function hardNoHits(gift: Candidate, refusals: string[], expandedTerms: readonly string[] = []) {
  const fields = normal([gift.title, gift.category, gift.brand, ...gift.colours, ...gift.materials, gift.whereToLook].join(" "));
  return [...new Set([...refusals.flatMap(refusalTerms), ...expandedTerms.map(normal)])].filter(term => term && contains(fields, term));
}
