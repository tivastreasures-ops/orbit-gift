import { z } from "zod";
import { normal } from "./rules";

export const KINDS = ["object", "experience", "consumable", "maker", "collectible", "wildcard"] as const;
export const candidateSchema = z.object({
  title: z.string().min(1).max(200), category: z.string().min(1).max(100),
  colours: z.array(z.string().min(1)).min(1).max(12),
  brand: z.string().max(150), materials: z.array(z.string().min(1)).min(1).max(12),
  priceMin: z.number().nonnegative(), priceMax: z.number().nonnegative(),
  whereToLook: z.string().min(1).max(300), kind: z.enum(KINDS),
  sourceLoves: z.array(z.string().min(1)).max(2),
  sourceDetails: z.array(z.object({ love: z.string(), detail: z.string() })).max(2),
  contextType: z.enum(["occasion", "relationship", "none"]),
  contextValue: z.string(), contextDetail: z.string(),
  maker: z.string().max(150), namedItem: z.string().max(200), handmade: z.boolean(),
});
export type QualityCandidate = z.infer<typeof candidateSchema>;

// This is the ONLY keyword-based quality exclusion: the Director's explicit
// generic-merch blocklist. Kind/specificity/source meaning belong to the critic.
const merch = /\b(t shirts?|tshirts?|tees?(?: shirts?)?|hoodies?|mugs?|posters?|wall art|phone cases?|totes?(?: bags?)?)\b/;
const plainName = /^(t shirts?|tshirts?|tees?(?: shirts?)?|hoodies?|mugs?|posters?|wall art|phone cases?|totes?(?: bags?)?)$/;
export function objectiveIssue(gift: QualityCandidate): string | null {
  const title = normal(gift.title);
  const named = (value: string) => {
    const name = normal(value);
    return !!name && !plainName.test(name) && (` ${title} `).includes(` ${name} `);
  };
  return merch.test(`${title} ${normal(gift.category)}`) && !named(gift.maker) && !named(gift.namedItem)
    ? "generic merch requires a named item or maker in the title" : null;
}

export const QUALITY_PROMPT = `QUALITY TARGET:
Offer two genuinely distinct alternatives per needed kind (about 12 initially).
Target one object, experience, consumable/treat, handmade or small-maker piece, collectible, and wildcard in the final mix. The critic classifies kinds; never invent products to fill a slot.
Each idea combines two supplied loves, OR one love with the actual occasion or relationship. Use meaningful connections, not keyword stuffing or a birthday label on a generic item. A loved colour is a detail on a real idea, never the whole idea.
No plain tee, hoodie, mug, poster, wall art, phone case or tote unless a genuinely known named item or maker is in the title. Do not invent makers or products to bypass this rule.
sourceLoves uses exact supplied names; sourceDetails explains the connection. Context fields describe the real occasion/relationship when used. These are evidence for the critic, not keyword requirements for titles.
maker and namedItem are known names or empty; handmade is true only for an actually handmade/customisable concept. Do not invent official collaborations, stock, URLs or exact prices. Prices are USD ballpark within budget; whereToLook is a shop/search venue type.
Use expanded tastes when available. Plain original love chips remain valid if expansion is missing or ambiguous; do not fabricate facts about unresolved entities.
ALL original/expanded hard no's, already-owned items and prior rejections remain mandatory. More-like seeds never override them.`;
