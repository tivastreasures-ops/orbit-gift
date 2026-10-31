import type { ClaudeSession } from "./llm";
import type { GiftInput } from "@workspace/api-zod";
import { type QualityCandidate } from "./quality";
import { criticSchema, defineTool, requestTool } from "./tool-contracts";
import type { ExpandedProfile } from "./profile-expansion";

export type RankedCandidate = { id: string; gift: QualityCandidate };
export async function critique(claude: ClaudeSession, candidates: RankedCandidate[], profile: ExpandedProfile, input: GiftInput, existing: QualityCandidate[], refusalTerms: string[]) {
  const ids = new Set(candidates.map(c => c.id));
  const contract = defineTool("submit_gift_verdicts", criticSchema.superRefine((result, ctx) => {
    if (result.verdicts.length !== candidates.length ||
        new Set(result.verdicts.map(v => v.id)).size !== ids.size ||
        result.verdicts.some(v => !ids.has(v.id) || (v.duplicateOf !== null && (!ids.has(v.duplicateOf) || v.duplicateOf === v.id)))) {
      ctx.addIssue({ code: "custom", path: ["verdicts"], message: "Return every supplied candidate id exactly once; duplicateOf must reference a different supplied candidate id or be null." });
    }
  }));
  const result = await requestTool(claude, "critic",
    `Judge every idea independently by MEANING, not keyword presence. Return its true kind, whether it is specific, exact source love names used, pass/fail and one short precise reason.
Classify kind as object|experience|consumable|maker|collectible|wildcard. Stargazing dates count as experiences without words like ticket/workshop/visit. A named Cosmos hardcover can be a collectible when that is a reasonable reading of the actual idea; do not require the word edition or collectible.
Assess specificity, truthful products/makers, meaningful combination of TWO loves OR ONE love plus the actual occasion/relationship, plausible budget and distinctness. A colour alone is not an idea. Reject generic merch masquerading as a named product. Use expanded details where available; original plain love chips remain legitimate evidence when expansion is absent. Do not assume empty expansion means the love is invalid.
Respect all hard no's, owned items and rejections. Code separately enforces objective exclusions; never override them. Flag near-duplicate concepts using duplicateOf (candidate id); do not reject something just because another gift has the same kind. Target six kinds but a missing kind is not a reason to reject a good idea.
Submit one verdict per candidate through the tool. Do not rewrite titles or other attributes.`,
    { candidates, expandedProfile: profile, sourceLoves: input.loves,
      occasion: input.occasion, relationship: input.relationship,
      budgetMin: input.budgetMin, budgetMax: input.budgetMax, refusalTerms,
      owned: input.owned, rejected: input.rejected, moreLike: input.moreLike,
      moreLikeSeeds: input.moreLikeSeeds, previousTitles: input.previousTitles, existing }, contract);
  return result.verdicts.map(v => ({
    ...v, accepted: v.pass && v.isSpecific && !v.duplicateOf,
    issues: v.pass && v.isSpecific && !v.duplicateOf ? [] : [v.reason, ...(v.duplicateOf ? [`near-duplicate of ${v.duplicateOf}`] : [])],
  }));
}
