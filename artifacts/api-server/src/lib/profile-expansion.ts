import { z } from "zod";
import type { GiftInput } from "@workspace/api-zod";
import type { ClaudeSession } from "./llm";
import { cacheKey, TasteCache } from "./taste-cache";
import { resolveLove } from "./wikipedia";
import { normal } from "./rules";

const list = z.array(z.string().min(1).max(160)).max(10);
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
    const key = cacheKey(["profile-v1", input.recipientId, loves, selections, claude.helperModel]);
    return this.cache.get(key, async () => {
      const resolved = await Promise.all(loves.map(love =>
        this.resolve(love, selections.find(s => normal(s.love) === normal(love))?.entityId)));
      const data = expansionSchema.parse(await claude.json("expansion",
        `Expand every supplied love into concrete, reliable gift-relevant cultural specifics: eras, subgenres, adjacent artists/makers, aesthetics, signature objects and places. Use the selected Wikipedia article, not an alternative meaning. Unselected ambiguous/unknown entities must have empty arrays rather than guessed facts; clear generic activities/foods can have cautious specifics based on their literal meaning. Never invent collaborations, catalogue products or named makers. Return {"loves":[{"love":"EXACT original love","specifics":[],"eras":[],"subgenres":[],"adjacent":[],"aesthetics":[],"signatureObjects":[],"places":[]}]}. One entry per original love; preserve source identity even when specifics use adjacent entities.`,
        { resolved }));
      if (data.loves.length !== loves.length ||
          new Set(data.loves.map(x => normal(x.love))).size !== loves.length ||
          loves.some(love => !data.loves.some(e => normal(e.love) === normal(love)))) {
        throw new Error("Expansion source contract failed");
      }
      return { loves: data.loves.map(entry => ({ ...entry, love: input.loves.find(l => normal(l) === normal(entry.love))! })) };
    });
  }
}
export const profileExpander = new ProfileExpander();
