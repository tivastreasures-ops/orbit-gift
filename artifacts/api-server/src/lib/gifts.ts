import { z } from "zod";
import { structured } from "./llm";
import { withTaste } from "./taste-adapter";
import { normal, passesRules } from "./rules";
import { candidateSchema, KINDS, qualityIssue, QUALITY_PROMPT, type QualityCandidate } from "./quality";
import type { GiftInput } from "@workspace/api-zod";

export async function generate(input: GiftInput) {
  if (!input.loves.length || input.budgetMin > input.budgetMax) {
    return { ideas: [], fallback: !process.env.QLOO_API_KEY?.trim(), filteredCount: 0 };
  }
  const related = await withTaste(a => a.getRelated(input.entityIds ?? [], ["book", "brand", "place"]));
  const accepted = new Map<QualityCandidate["kind"], QualityCandidate>();
  const excluded = new Set((input.previousTitles ?? []).map(normal));
  let filteredCount = 0;
  const contractViolations: { title: string; issue: string }[] = [];
  for (let round = 0; round < 3 && accepted.size < KINDS.length; round++) {
    const data = await structured(
      `You propose specific purchasable gift IDEAS, not real listings or endorsements. All refusals are mandatory. Owned items must not recur; broad ownership (every record) excludes that category for that artist. Incorporate every rejection reason. ${QUALITY_PROMPT}
Return {"ideas":[...]} with one candidate per neededKinds. Fields: title,category,colours (explicit positive actual colours, at least one),brand (empty if unspecified),materials (explicit positive materials, at least one),priceMin,priceMax (USD ballpark inside budget),whereToLook (kind of shop/search venue, never URL),kind,sourceLoves,sourceDetails,contextType,contextValue,contextDetail,maker,namedItem,handmade. Never use negated metadata like "not pink". No marketing or other user-facing prose beyond these gift attributes. Never repeat previous/excluded titles.`,
      {
        ...input, related: related.value, excludeTitles: [...excluded],
        neededKinds: KINDS.filter(kind => !accepted.has(kind)),
        existing: [...accepted.values()].map(gift => ({ title: gift.title, kind: gift.kind })),
        contractViolations: contractViolations.slice(-20),
      },
      // Multi-interest quality + six-kind diversity need stronger instruction
      // following than entity lookup; lookup retains the cheaper mini model.
      "gpt-5.4",
    );
    const candidates = z.object({ ideas: z.array(z.unknown()).max(20) }).parse(data).ideas;
    for (const candidate of candidates) {
      const parsed = candidateSchema.safeParse(candidate);
      if (!parsed.success) {
        filteredCount++;
        contractViolations.push({ title: "", issue: `missing/invalid structured fields: ${parsed.error.issues.map(issue => issue.path.join(".")).join(", ")}` });
        continue;
      }
      const gift = parsed.data;
      if (excluded.has(normal(gift.title))) continue;
      excluded.add(normal(gift.title));
      if (accepted.has(gift.kind)) continue;
      const issue = qualityIssue(gift, input);
      const withinBudget = gift.priceMax >= gift.priceMin && gift.priceMin >= input.budgetMin && gift.priceMax <= input.budgetMax;
      const allowed = passesRules(gift, input.refusals, input.owned ?? "", input.rejected ?? []);
      if (issue || !withinBudget || !allowed) {
        filteredCount++;
        contractViolations.push({ title: gift.title, issue: issue ?? (!withinBudget ? "outside supplied budget" : "violates a hard no, owned-category or rejection rule") });
        continue;
      }
      accepted.set(gift.kind, {
        ...gift,
        sourceLoves: gift.sourceLoves.map(source => input.loves.find(love => normal(love) === normal(source))!),
      });
    }
  }
  // Promise six only when every kind passes every constraint; never pad with
  // duplicates, generic merch, or a silently weakened hard-no check.
  const ideas = accepted.size === KINDS.length ? KINDS.map(kind => {
    const gift = accepted.get(kind)!;
    return {
      id: crypto.randomUUID(), recipientId: input.recipientId, title: gift.title,
      priceRange: `$${gift.priceMin}–$${gift.priceMax}`, whereToLook: gift.whereToLook,
      because: gift.sourceLoves.join(" + "), sourceLoves: gift.sourceLoves, kind: gift.kind,
      passedRules: [...input.refusals, ...(input.owned ? [input.owned] : [])],
      status: "shown" as const, category: gift.category, colours: gift.colours, brand: gift.brand, materials: gift.materials,
    };
  }) : [];
  return { ideas, fallback: related.fallback, filteredCount };
}
