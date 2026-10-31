import { z } from "zod";
import type { ClaudeSession } from "./llm";
import type { GiftInput } from "@workspace/api-zod";
import { KINDS, type QualityCandidate } from "./quality";
import type { ExpandedProfile } from "./profile-expansion";

const schema = z.object({ verdicts: z.array(z.object({
  id: z.string(), kind: z.enum(KINDS), isSpecific: z.boolean(),
  sourcesUsed: z.array(z.string()).max(2), pass: z.boolean(),
  reason: z.string().min(1).max(600), duplicateOf: z.string().nullable(),
})).max(24) });
export type RankedCandidate = { id: string; gift: QualityCandidate };
export async function critique(claude: ClaudeSession, candidates: RankedCandidate[], profile: ExpandedProfile, input: GiftInput, existing: QualityCandidate[], refusalTerms: string[]) {
  const result = schema.parse(await claude.json("critic",
    `Judge every idea independently by MEANING, not keyword presence. Return its true kind, whether it is specific, exact source love names used, pass/fail and one short precise reason.
Classify kind as object|experience|consumable|maker|collectible|wildcard. Stargazing dates count as experiences without words like ticket/workshop/visit. A named Cosmos hardcover can be a collectible when that is a reasonable reading of the actual idea; do not require the word edition or collectible.
Assess specificity, truthful products/makers, meaningful combination of TWO loves OR ONE love plus the actual occasion/relationship, plausible budget and distinctness. A colour alone is not an idea. Reject generic merch masquerading as a named product. Use expanded details where available; original plain love chips remain legitimate evidence when expansion is absent. Do not assume empty expansion means the love is invalid.
Respect all hard no's, owned items and rejections. Code separately enforces objective exclusions; never override them. Flag near-duplicate concepts using duplicateOf (candidate id); do not reject something just because another gift has the same kind. Target six kinds but a missing kind is not a reason to reject a good idea.
Return {"verdicts":[{"id":"exact id","kind":"object","isSpecific":true,"sourcesUsed":["EXACT supplied love"],"pass":true,"reason":"short reason","duplicateOf":null}]}, exactly once per candidate. Do not rewrite titles or other attributes.`,
    { candidates, expandedProfile: profile, sourceLoves: input.loves,
      occasion: input.occasion, relationship: input.relationship,
      budgetMin: input.budgetMin, budgetMax: input.budgetMax, refusalTerms,
      owned: input.owned, rejected: input.rejected, moreLike: input.moreLike,
      moreLikeSeeds: input.moreLikeSeeds, previousTitles: input.previousTitles, existing }));
  const ids = new Set(candidates.map(c => c.id));
  if (result.verdicts.length !== candidates.length ||
      new Set(result.verdicts.map(v => v.id)).size !== ids.size ||
      result.verdicts.some(v => !ids.has(v.id) || (v.duplicateOf !== null && (!ids.has(v.duplicateOf) || v.duplicateOf === v.id)))) {
    throw new Error("Critic identity contract failed");
  }
  return result.verdicts.map(v => ({
    ...v, accepted: v.pass && v.isSpecific && !v.duplicateOf,
    issues: v.pass && v.isSpecific && !v.duplicateOf ? [] : [v.reason, ...(v.duplicateOf ? [`near-duplicate of ${v.duplicateOf}`] : [])],
  }));
}
