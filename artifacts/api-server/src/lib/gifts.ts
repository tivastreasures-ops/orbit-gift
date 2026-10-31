import { z } from "zod";
import { structured } from "./llm";
import { withTaste } from "./taste-adapter";
import { normal, passesRules } from "./rules";
import type { GiftInput } from "@workspace/api-zod";

const candidateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  colours: z.array(z.string()).min(1),
  brand: z.string(),
  materials: z.array(z.string()).min(1),
  priceMin: z.number().nonnegative(),
  priceMax: z.number().nonnegative(),
  whereToLook: z.string().min(1),
  love: z.string().min(1),
});
export async function generate(input: GiftInput) {
  if (!input.loves.length || input.budgetMin > input.budgetMax) {
    return { ideas: [], fallback: !process.env.QLOO_API_KEY?.trim(), filteredCount: 0 };
  }
  const related = await withTaste(a => a.getRelated(input.entityIds ?? [], ["book", "brand", "place"]));
  const accepted: z.infer<typeof candidateSchema>[] = [];
  const excluded = new Set((input.previousTitles ?? []).map(normal));
  let filteredCount = 0;
  for (let round = 0; round < 3 && accepted.length < 6; round++) {
    const data = await structured(
      `You propose specific purchasable gift IDEAS, not real product listings or endorsements. All refusals are mandatory. Owned items must not recur; broad ownership (every record) rules exclude that category for that artist. Incorporate every rejection reason when finding different suggestions. Never invent URLs, availability, exact prices, or taste facts. Use whereToLook as a kind of shop/search venue, not a product URL. Return {"ideas":[...]} with 10 candidates. Each candidate: title,category,colours (explicit positive actual colours, at least one),brand (empty if unspecified),materials (explicit positive materials, at least one),priceMin,priceMax (USD ballpark within budget),whereToLook,love (EXACT one supplied love string, not a sentence). Never use negated metadata such as "not pink". Be conservative: omit ideas where suitability is uncertain. No user-facing descriptions, marketing, or authored prose; just these structured gift attributes. MoreLike requests expand this direction but never repeat previous titles.`,
      { ...input, related: related.value, excludeTitles: [...excluded], existing: accepted.map(a => a.title) },
    );
    const candidates = z.object({ ideas: z.array(candidateSchema).max(20) }).parse(data).ideas;
    for (const gift of candidates) {
      if (excluded.has(normal(gift.title))) continue;
      excluded.add(normal(gift.title));
      const love = input.loves.find(l => normal(l) === normal(gift.love));
      const pass = love && gift.priceMax >= gift.priceMin && gift.priceMin >= input.budgetMin && gift.priceMax <= input.budgetMax
        && passesRules(gift, input.refusals, input.owned ?? "", input.rejected ?? []);
      if (!pass) { filteredCount++; continue; }
      accepted.push({ ...gift, love });
      if (accepted.length === 6) break;
    }
  }
  // All-or-none: a heading promising six never accompanies a partial set.
  const ideas = accepted.length === 6 ? accepted.map(g => ({
    id: crypto.randomUUID(), recipientId: input.recipientId, title: g.title,
    priceRange: `$${g.priceMin}–$${g.priceMax}`, whereToLook: g.whereToLook,
    because: g.love, passedRules: [...input.refusals, ...(input.owned ? [input.owned] : [])],
    status: "shown" as const, category: g.category, colours: g.colours, brand: g.brand, materials: g.materials,
  })) : [];
  return { ideas, fallback: related.fallback, filteredCount };
}
