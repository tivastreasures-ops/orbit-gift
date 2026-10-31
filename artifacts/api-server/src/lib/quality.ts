import { z } from "zod";
import { normal } from "./rules";
import type { GiftInput } from "@workspace/api-zod";

export const KINDS = ["object", "experience", "consumable", "maker", "collectible", "wildcard"] as const;
export const candidateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  colours: z.array(z.string().min(1)).min(1).max(12),
  brand: z.string().max(150),
  materials: z.array(z.string().min(1)).min(1).max(12),
  priceMin: z.number().nonnegative(),
  priceMax: z.number().nonnegative(),
  whereToLook: z.string().min(1).max(300),
  kind: z.enum(KINDS),
  sourceLoves: z.array(z.string().min(1)).min(1).max(2),
  // Internal evidence is checked but never displayed as authored interface copy.
  sourceDetails: z.array(z.object({ love: z.string(), detail: z.string().min(2) })).min(1).max(2),
  contextType: z.enum(["occasion", "relationship", "none"]),
  contextValue: z.string(),
  contextDetail: z.string(),
  maker: z.string().max(150),
  namedItem: z.string().max(200),
  handmade: z.boolean(),
});
export type QualityCandidate = z.infer<typeof candidateSchema>;

const merch = /\b(t shirts?|tshirts?|hoodies?|mugs?|posters?|wall art|art prints?|framed prints?|phone cases?|totes?(?: bags?)?)\b/;
const vague = /\b(custom|personalized|personalised|official|themed|inspired|superhero|graphic|printed|print|canvas|gift|gifts|item|object|piece|set|colour|color|coloured|colored|edition|premium|unique|special|for|a|an|the|and|with|in|of)\b/g;
const colours = /\b(turquoise|pink|rose|blush|magenta|fuchsia|salmon|red|blue|green|purple|violet|lavender|black|white|grey|gray|gold|silver|yellow|orange|brown|cream|teal|navy|beige)\b/g;

function includesPhrase(text: string, phrase: string) {
  return !!phrase && (` ${text} `).includes(` ${phrase} `);
}
function erasePhrase(text: string, phrase: string) {
  return phrase ? (` ${text} `).split(` ${phrase} `).join(" ").trim() : text;
}
function substantive(value: string, loves: string[]) {
  let text = normal(value);
  for (const love of [...loves].sort((a, b) => b.length - a.length)) text = erasePhrase(text, normal(love));
  return text.replace(new RegExp(merch.source, "g"), " ").replace(colours, " ").replace(vague, " ").replace(/\s+/g, " ").trim();
}
function namedMaker(maker: string) {
  const m = normal(maker);
  return m.length >= 3 && !/^(unknown|none|unspecified|generic|etsy|amazon|ebay|local|local maker|local shop|independent|small maker|small business|handmade|custom|artisan|a local maker)$/.test(m);
}

/** Plain-code positive-evidence checks, not a claim to verify a live catalogue. */
export function qualityIssue(gift: QualityCandidate, input: GiftInput): string | null {
  const sourceLoves = gift.sourceLoves.map(source => input.loves.find(love => normal(love) === normal(source)));
  if (sourceLoves.some(love => !love) || new Set(sourceLoves.map(love => normal(love!))).size !== sourceLoves.length) return "sourceLoves must be 1-2 different exact supplied loves";
  const sources = sourceLoves as string[];
  const title = normal(gift.title);
  if (gift.sourceDetails.length !== sources.length) return "sourceDetails must contain exactly one entry for each source love";
  const detailedSources = new Set<string>();
  for (const evidence of gift.sourceDetails) {
    const love = sources.find(source => normal(source) === normal(evidence.love));
    if (!love || detailedSources.has(normal(love)) || !includesPhrase(title, normal(evidence.detail))) return "each sourceDetails.detail must be a phrase actually in the title, tied to its different source love";
    detailedSources.add(normal(love));
  }
  // One love alone is not enough: require an actual supplied occasion/relation
  // and a corresponding concrete detail in the title, not a fabricated context.
  if (sources.length === 1) {
    const context = gift.contextType === "occasion" ? input.occasion : gift.contextType === "relationship" ? input.relationship : undefined;
    if (!context?.trim() || normal(context) !== normal(gift.contextValue) || !includesPhrase(title, normal(gift.contextDetail))) return "one source love requires the supplied occasion or relationship AND contextDetail actually in the title; otherwise combine two different loves";
  }
  const identityWords = [...input.loves, input.occasion ?? "", input.relationship ?? "", gift.contextDetail, ...gift.sourceDetails.map(evidence => evidence.detail)];
  if (!substantive(gift.title, identityWords)) return "title needs a concrete gift beyond love/colour/context labels";
  const item = normal(gift.namedItem);
  const makerIsNamed = namedMaker(gift.maker) && includesPhrase(title, normal(gift.maker));
  const itemIsNamed = item.length >= 5 && includesPhrase(title, item) && substantive(gift.namedItem, input.loves).length >= 4;
  if (merch.test(`${title} ${normal(gift.category)}`) && !makerIsNamed && !itemIsNamed) return "plain merch requires a specific named item or actual named maker IN THE TITLE; do not label a generic category as a namedItem";
  if (gift.kind === "maker" && !gift.handmade && !makerIsNamed) return "maker kind must be actually handmade or have a named maker in the title";
  if (gift.kind === "collectible" && !itemIsNamed) return "collectible kind needs a specific named collectible item or edition in the title";
  if (gift.kind === "experience" && !/\b(experience|tasting|workshop|class|classes|lesson|tour|ticket|concert|visit|session|admission|voucher)\b/.test(normal(`${gift.title} ${gift.category}`))) return "experience kind needs a real activity, workshop, tasting, ticket or visit";
  if (gift.kind === "consumable") {
    const evidence = normal(`${gift.title} ${gift.category} ${gift.materials.join(" ")}`);
    if (!/\b(food|drink|tea|coffee|chocolate|cookies|biscuit|biscuits|shortbread|cake|snack|treat|jam|honey|candy|sweets|spice|spices|beer|wine|cocoa|sauce)\b/.test(evidence)) return "consumable kind needs actual food, drink or a treat";
    if (/\b(infuser|mug|teapot|spoon|strainer|towel)\b/.test(title)) return "tea accessories are objects, not consumable treats";
  }
  return null;
}
export function passesQuality(gift: QualityCandidate, input: GiftInput): boolean {
  return qualityIssue(gift, input) === null;
}

export const QUALITY_PROMPT = `QUALITY CONTRACT, mandatory in addition to EVERY hard no:
Return exactly one candidate for EACH requested neededKinds, not multiple of one kind. The final six must contain one object, one experience, one consumable/treat, one handmade or small-maker piece, one collectible, and one wildcard. MoreLike may influence these directions but never override diversity.
No plain merch categories (t-shirt, hoodie, mug, poster, wall art, phone case, tote) unless a genuinely specific KNOWN named item or named maker appears in the title. "Superhero graphic hoodie", "wall art canvas", and "turquoise hoodie" FAIL. A character/band name slapped on a category is not a named item. Do not invent named products or makers to pass this rule. If uncertain, choose a different non-merch idea.
Each idea must meaningfully combine TWO DIFFERENT supplied loves, OR ONE supplied love plus the supplied occasion or relationship. Never just attach unrelated tags. sourceLoves contains 1 or 2 EXACT supplied love strings. sourceDetails has exactly one {love,detail} per source; detail is a concrete phrase IN THE TITLE evidencing that source (e.g. Earl Grey -> Earl Grey, German food -> Bavarian). With one source, contextType is occasion or relationship, contextValue is the EXACT supplied context, and contextDetail is a concrete phrase IN THE TITLE evidencing that context. Otherwise contextType none and contextValue/contextDetail empty.
A loved colour is only a detail on a tangible, specific gift or meaningful experience, never the entire suggestion. Prefer non-colour interests for the substance.
kind must be object|experience|consumable|maker|collectible|wildcard. maker is a known maker actually named in title or empty. namedItem is a known named product/edition explicitly in title or empty, NOT a renamed generic category. handmade is true only for an actually handmade/DIY piece, not mass-produced merch. A collectible needs a specific named item/edition, not a vague "collectible".
Never invent URLs, availability, stock, exact prices or factual product claims. These remain ideas and shop/search venue types, not verified listings. Reject uncertain hard-no suitability.
Do not invent official character/band collaborations or fictitious collectible editions by fusing two loves into a nonexistent branded product. Combine difficult interests as a pair of existing items, a genuinely handmade/customisable concept, or use one love plus the actual occasion/relationship instead.
Evidence examples (ONLY if these interests/context were actually supplied):
title "Earl Grey German shortbread baking kit", sourceLoves ["Earl Grey","German food"], sourceDetails [{"love":"Earl Grey","detail":"Earl Grey"},{"love":"German food","detail":"German shortbread"}], contextType none.
title "Earl Grey birthday tea tasting", sourceLoves ["Earl Grey"], sourceDetails [{"love":"Earl Grey","detail":"Earl Grey"}], contextType occasion, contextValue Birthday, contextDetail birthday.
With ONE love and contextType none the candidate ALWAYS FAILS. With contextDetail "birthday gift" but no such phrase in title it ALWAYS FAILS. Correct the actual gift/title, not just its tags.`;
