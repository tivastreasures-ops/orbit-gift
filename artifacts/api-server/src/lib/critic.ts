import { z } from "zod";
import type { ClaudeSession } from "./llm";
import type { GiftInput } from "@workspace/api-zod";
import type { QualityCandidate } from "./quality";
import type { ExpandedProfile } from "./profile-expansion";

const score = z.number().min(0).max(5);
const critiqueSchema = z.object({ scores: z.array(z.object({
  id: z.string(), specificity: score, combination: score, budget: score,
  novelty: score, kindFit: score, pass: z.boolean(),
  duplicateOf: z.string().nullable(), issues: z.array(z.string().max(250)).max(10),
})).max(24) });
export type RankedCandidate = { id: string; gift: QualityCandidate };
export async function critique(claude: ClaudeSession, candidates: RankedCandidate[], profile: ExpandedProfile, input: GiftInput, existing: QualityCandidate[], refusalTerms: string[]) {
  const result = critiqueSchema.parse(await claude.json("critic",
    `Be a strict independent gift critic. Score EACH candidate 0-5 on specificity (real meaningful detail, no fake products/collaborations), combination (two genuinely relevant loves, or one love plus the actual occasion/relationship; reject keyword stuffing), budget (plausibility within given USD range), novelty (not duplicated by pool/existing/prior/owned/rejected gifts), kindFit (actually belongs to assigned one of six kinds).
Use the expanded profile to verify connections, not merely repeated love words. Respect ALL expanded refusals, already-owned items, rejection reasons and More like this seeds. Reject false source/context evidence and uncertain hard-no suitability. For near-duplicates mark the weaker one duplicateOf the stronger candidate id. Price fit is a plausibility judgement, not verified stock or pricing.
Return {"scores":[{"id":"exact candidate id","specificity":0,"combination":0,"budget":0,"novelty":0,"kindFit":0,"pass":false,"duplicateOf":null,"issues":["precise rule failures"]}]}. Include every candidate exactly once. Do not rewrite gifts or add candidates.`,
    { candidates, expandedProfile: profile, occasion: input.occasion, relationship: input.relationship,
      budgetMin: input.budgetMin, budgetMax: input.budgetMax, refusalTerms, owned: input.owned,
      rejected: input.rejected, moreLike: input.moreLike, moreLikeSeeds: input.moreLikeSeeds,
      previousTitles: input.previousTitles, existing }));
  const ids = new Set(candidates.map(c => c.id));
  if (result.scores.length !== candidates.length ||
      new Set(result.scores.map(s => s.id)).size !== ids.size ||
      result.scores.some(s => !ids.has(s.id) || (s.duplicateOf !== null && (!ids.has(s.duplicateOf) || s.duplicateOf === s.id)))) {
    throw new Error("Critic identity contract failed");
  }
  return result.scores.map(s => ({
    id: s.id,
    accepted: s.pass && !s.duplicateOf && s.specificity >= 3 && s.combination >= 3 && s.budget >= 4 && s.novelty >= 3 && s.kindFit >= 4,
    score: s.specificity * 2 + s.combination * 2 + s.budget + s.novelty + s.kindFit,
    issues: [...s.issues, ...(!s.pass ? ["critic rejected suitability"] : []),
      ...(s.duplicateOf ? [`near-duplicate of ${s.duplicateOf}`] : []),
      ...(s.specificity < 3 ? ["specificity below 3/5"] : []),
      ...(s.combination < 3 ? ["love/context combination below 3/5"] : []),
      ...(s.budget < 4 ? ["budget plausibility below 4/5"] : []),
      ...(s.novelty < 3 ? ["novelty below 3/5"] : []),
      ...(s.kindFit < 4 ? ["gift-kind fit below 4/5"] : [])],
  }));
}
