import { z } from "zod";
import type { GiftInput } from "@workspace/api-zod";
import type { ClaudeSession } from "./llm";
import { cacheKey, TasteCache } from "./taste-cache";
import { resolveLove } from "./wikipedia";
import { normal } from "./rules";

const list = z.array(z.string().min(1).max(160)).max(4);
const expansionSchema = z.object({ loves: z.array(z.object({
  love: z.string().min(1).max(200),
  specifics: list, eras: list, subgenres: list, adjacent: list,
  aesthetics: list, signatureObjects: list, places: list,
})).max(30) });
export type ExpandedProfile = z.infer<typeof expansionSchema>;
export type Resolver = typeof resolveLove;
export class ProfileExpander {
  private cache = new TasteCache<ExpandedProfile>();
  constructor(private resolve: Resolver = resolveLove) {}
  async get(input: GiftInput, claude: ClaudeSession) {
    const selections = input.matchedLoves ?? [];
    const loves = [...new Map(input.loves.map(love => [normal(love), love])).values()];
    const key = cacheKey(["profile-compact", input.recipientId, loves, selections, claude.helperModel]);
    try {
      const result = await this.cache.get(key, async () => {
        const resolved = await Promise.all(loves.map(async love => {
          try { return await this.resolve(love, selections.find(s => normal(s.love) === normal(love))?.entityId); }
          catch (error) {
            console.warn("Wikipedia expansion lookup failed:", error instanceof Error ? error.message : String(error));
            return { love, selected: null, candidates: [] };
          }
        }));
        let last: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const data = expansionSchema.parse(await claude.json("expansion",
              `Return COMPACT gift-relevant taste expansion JSON. Each array has AT MOST FOUR strings; each string is at most 120 characters. Use reliable eras, subgenres, adjacent artists/makers, aesthetics, signature objects and places. Selected Wikipedia meaning wins. Leave ambiguous unknown facts empty; never invent catalogue products or collaborations.
Return {"loves":[{"love":"EXACT original love","specifics":[],"eras":[],"subgenres":[],"adjacent":[],"aesthetics":[],"signatureObjects":[],"places":[]}]}, exactly once per supplied love, all fields present. Preserve exact original names. ${attempt ? `The first reply was invalid: ${last instanceof Error ? last.message : "invalid JSON"}. Correct it and keep arrays short.` : ""}`,
              { resolved }));
            if (data.loves.length !== loves.length ||
                new Set(data.loves.map(x => normal(x.love))).size !== loves.length ||
                loves.some(love => !data.loves.some(e => normal(e.love) === normal(love)))) throw new Error("Expansion source contract failed");
            return { loves: data.loves.map(entry => ({ ...entry, love: loves.find(l => normal(l) === normal(entry.love))! })) };
          } catch (error) {
            last = error;
            console.warn(`Taste expansion attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : String(error));
          }
        }
        throw last;
      });
      return { ...result, degraded: false };
    } catch {
      // Failed replies are not cached. Use genuine chips, not fabricated tastes.
      return { hit: false, degraded: true, value: { loves: loves.map(love => ({
        love, specifics: [], eras: [], subgenres: [], adjacent: [],
        aesthetics: [], signatureObjects: [], places: [],
      })) } };
    }
  }
}
export const profileExpander = new ProfileExpander();
