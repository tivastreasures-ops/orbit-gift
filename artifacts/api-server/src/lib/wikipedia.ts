import { z } from "zod";
import { normal } from "./rules";
import { cacheKey, TasteCache } from "./taste-cache";
import { colourMatch } from "./colours";

export interface WikiEntity { id: string; name: string; kind: string; description: string }
const cache = new TasteCache<WikiEntity[]>(400, 24 * 60 * 60 * 1000);
const pagesSchema = z.object({
  query: z.object({ pages: z.array(z.object({
    pageid: z.number(), title: z.string(), index: z.number().optional(), extract: z.string().optional(),
    pageprops: z.record(z.string(), z.unknown()).optional(),
  })) }).optional(),
  error: z.unknown().optional(),
});
export async function searchWikipedia(text: string, transport: typeof fetch = fetch): Promise<WikiEntity[]> {
  const colour = colourMatch(text);
  if (colour) return [{ ...colour, description: colour.name }];
  const result = await cache.get(cacheKey(["wiki-v2", normal(text)]), async () => {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", generator: "search",
      gsrsearch: text, gsrnamespace: "0", gsrlimit: "4",
      prop: "extracts|pageprops", exintro: "1", explaintext: "1", exchars: "700",
      redirects: "1",
    }).toString();
    const response = await transport(url, {
      headers: { "User-Agent": "OrbitGift/1.0 (https://github.com/tivastreasures-ops/orbit-gift)", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Wikipedia unavailable");
    const data = pagesSchema.parse(await response.json());
    if (data.error) throw new Error("Wikipedia search failed");
    return (data.query?.pages ?? []).filter(p => !p.pageprops || !("disambiguation" in p.pageprops)).sort((a, b) => (a.index ?? 100) - (b.index ?? 100)).map(p => {
      const description = (p.extract ?? "").slice(0, 700);
      // Classify the defining predicate, not the proper name: the word "River"
      // in the band's name must not label Okkervil River as the river.
      const definition = description.split(/\b(?:is|are|was|were)\b/i).slice(1).join(" ").split(/[.!?\n]/)[0] ?? "";
      const kind = definition.match(/\b(band|river|musician|tea|food|character|artist|writer|city|novel|game)\b/i)?.[1]?.toLowerCase() ?? "topic";
      return { id: `wiki:${p.pageid}`, name: p.title, kind, description };
    });
  });
  return result.value;
}
export async function resolveLove(love: string, selectedId?: string) {
  const candidates = await searchWikipedia(love);
  // Explicit confirmed selection wins. Without it, only an exact article title
  // resolves automatically; uncertain entities stay unresolved, never guessed.
  const selected = colourMatch(love) ? candidates[0] : selectedId
    ? candidates.find(c => c.id === selectedId)
    : candidates.find(c => normal(c.name) === normal(love));
  return { love, selected: selected ?? null, candidates };
}
