import { z } from "zod";
import { normal, refusalTerms } from "./rules";
import type { ClaudeSession } from "./llm";
import { cacheKey, TasteCache } from "./taste-cache";

const resultSchema = z.object({ refusals: z.array(z.object({
  refusal: z.string(), terms: z.array(z.string().min(1).max(100)).min(1).max(40),
})).max(30) });
// One helper call for only uncached refusals; individual entries are reused
// across changed profiles without re-expanding the existing no list.
export class RefusalExpander {
  private values = new TasteCache<string[]>(400);
  private batches = new TasteCache<Map<string, string[]>>(200);
  async get(refusals: string[], claude: ClaudeSession) {
    if (!refusals.length) return { terms: [], hits: 0 };
    let hits = 0;
    const unique = [...new Map(refusals.map(r => [normal(r), r])).values()];
    const termKey = (refusal: string) => cacheKey(["refusal-v1", normal(refusal), claude.helperModel]);
    const missing = unique.filter(refusal => !this.values.has(termKey(refusal)));
    // The single batch promise is created lazily only if an individual term misses.
    const batch = () => this.batches.get(cacheKey(["refusals-v1", missing.map(normal).sort(), claude.helperModel]), async () => {
      const data = resultSchema.parse(await claude.json("refusals",
        `Expand each refusal into closely related exclusion terms: colours into shades (pink -> rose, blush, fuchsia, magenta), companies into brands/products (Microsoft -> Windows, Xbox, Surface, Office). Preserve every original refusal. Use specific names and related materials/products, not broad unrelated nouns, stopwords or extra preferences. Never soften a refusal. Return {"refusals":[{"refusal":"EXACT supplied text","terms":["..."]}]}, exactly once for each refusal.`,
        { refusals: missing }));
      if (data.refusals.length !== missing.length ||
          new Set(data.refusals.map(r => normal(r.refusal))).size !== missing.length ||
          missing.some(r => !data.refusals.some(x => normal(x.refusal) === normal(r)))) throw new Error("Refusal expansion contract failed");
      return new Map(data.refusals.map(r => [normal(r.refusal), r.terms.map(normal).filter(t => t.length >= 2)]));
    });
    const rows = await Promise.all(unique.map(async refusal => {
      const result = await this.values.get(termKey(refusal), async () =>
        (await batch()).value.get(normal(refusal))!);
      if (result.hit) hits++;
      return [...refusalTerms(refusal), ...result.value];
    }));
    return { terms: [...new Set(rows.flat())], hits };
  }
}
export const refusalExpander = new RefusalExpander();
