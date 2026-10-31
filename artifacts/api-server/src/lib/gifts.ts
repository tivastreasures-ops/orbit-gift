import { z } from "zod";
import { assertClaudeConfigured, createClaudeSession, type ClaudeSession } from "./llm";
import { normal, passesRules, hardNoHits } from "./rules";
import { candidateSchema, KINDS, objectiveIssue, QUALITY_PROMPT, type QualityCandidate } from "./quality";
import { profileExpander, type ProfileExpander } from "./profile-expansion";
import { refusalExpander, type RefusalExpander } from "./refusals";
import { critique, type RankedCandidate } from "./critic";
import type { GiftInput } from "@workspace/api-zod";

type Violation = { title: string; issues: string[]; stage: "objective" | "critic" | "helper" };
interface Dependencies {
  claude?: ClaudeSession; profiles?: ProfileExpander; refusals?: RefusalExpander;
  trace?: (event: { round: number; acceptedKinds: string[]; eligible: number; violations: Violation[] }) => void;
}
export async function generate(input: GiftInput, deps: Dependencies = {}) {
  if (!deps.claude) assertClaudeConfigured();
  const claude = deps.claude ?? createClaudeSession();
  try { return await search(input, claude, deps); }
  finally {
    console.info("Claude search calls:", JSON.stringify({
      total: Object.values(claude.calls).reduce((a, b) => a + b, 0),
      ...claude.calls, model: claude.model, helperModel: claude.helperModel,
    }));
  }
}
async function search(input: GiftInput, claude: ClaudeSession, deps: Dependencies) {
  const [profile, noList] = await Promise.all([
    (deps.profiles ?? profileExpander).get(input, claude),
    (deps.refusals ?? refusalExpander).get(input.refusals, claude),
  ]);
  const accepted: QualityCandidate[] = [];
  const excluded = new Set((input.previousTitles ?? []).map(normal));
  const violations: Violation[] = [];
  let filteredCount = 0, rounds = 0;
  const reject = (title: string, issues: string[], stage: Violation["stage"] = "objective") => {
    if (title) filteredCount++;
    violations.push({ title, issues, stage });
  };
  const trace = (eligible: number) => deps.trace?.({
    round: rounds, acceptedKinds: [...new Set(accepted.map(g => g.kind))], eligible, violations: [...violations],
  });
  const { loves: _loves, entityIds: _ids, matchedLoves: _matches, ...constraints } = input;
  // Kind coverage is a target, never a reason to discard passing ideas.
  for (let round = 0; round < 2 && new Set(accepted.map(g => g.kind)).size < KINDS.length; round++) {
    rounds++;
    try {
    const data = await claude.json("generation",
      `Propose concrete gift IDEAS, not verified listings. Use expanded tastes when available and plain supplied love identities otherwise.
${QUALITY_PROMPT}
Return {"ideas":[...]} fields: title,category,colours (positive actual colours, at least one),brand (empty if unspecified),materials (positive actual materials, at least one),priceMin,priceMax (USD within budget),whereToLook (venue type, never URL),kind,sourceLoves,sourceDetails,contextType,contextValue,contextDetail,maker,namedItem,handmade.
Correct supplied contractViolations, avoid excluded titles and near-duplicates. Prioritise neededKinds but do not invent products to fill them.`,
      { ...constraints, sourceLoves: input.loves, expandedProfile: profile.value, plainLoveFallback: profile.degraded,
        expandedRefusalTerms: noList.terms, excludeTitles: [...excluded],
        neededKinds: KINDS.filter(k => !accepted.some(g => g.kind === k)),
        existing: accepted, contractViolations: violations.slice(-30) });
    const raw = z.object({ ideas: z.array(z.unknown()).max(24) }).parse(data).ideas;
    const eligible: RankedCandidate[] = [];
    for (const [index, value] of raw.entries()) {
      const parsed = candidateSchema.safeParse(value);
      if (!parsed.success) {
        reject("", parsed.error.issues.map(i => `invalid structured field ${i.path.join(".")}: ${i.message}`));
        continue;
      }
      const gift = parsed.data;
      if (excluded.has(normal(gift.title))) { reject(gift.title, ["duplicate/prior title"]); continue; }
      excluded.add(normal(gift.title));
      const issues: string[] = [];
      const merch = objectiveIssue(gift);
      if (merch) issues.push(merch);
      if (gift.priceMax < gift.priceMin || gift.priceMin < input.budgetMin || gift.priceMax > input.budgetMax) issues.push("outside supplied budget");
      const hits = hardNoHits(gift, input.refusals, noList.terms);
      if (hits.length) issues.push(`hard-no terms matched: ${hits.join(", ")}`);
      if (!passesRules(gift, input.refusals, input.owned ?? "", input.rejected ?? [], noList.terms) && !hits.length) {
        issues.push("matches an owned item/category or previously rejected title");
      }
      if (issues.length) { reject(gift.title, issues); continue; }
      eligible.push({ id: `${round}:${index}`, gift });
    }
    if (!eligible.length) { trace(0); continue; }
    // Exactly one critic call per round. Bad helper replies cannot discard
    // earlier passes or expose unreviewed ideas; the remaining round can refill.
    try {
      const verdicts = await critique(claude, eligible, profile.value, input, accepted, noList.terms);
      for (const verdict of verdicts) {
        const gift = eligible.find(c => c.id === verdict.id)!.gift;
        if (!verdict.accepted) { reject(gift.title, verdict.issues, "critic"); continue; }
        const sources = verdict.sourcesUsed.map(source => input.loves.find(l => normal(l) === normal(source)));
        accepted.push({ ...gift, kind: verdict.kind,
          sourceLoves: sources.some(s => !s) ? [] : [...new Set(sources as string[])] });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn("Gift critic failed:", reason);
      reject("", [reason], "helper");
    }
    trace(eligible.length);
    } catch (error) {
      // A later upstream/JSON failure must never erase already reviewed passes.
      if (!accepted.length) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      console.warn("Gift refill failed; retaining reviewed ideas:", reason);
      reject("", [reason], "helper");
      trace(0);
      break;
    }
  }
  return {
    ideas: accepted.map(gift => ({
      id: crypto.randomUUID(), recipientId: input.recipientId, title: gift.title,
      priceRange: `$${gift.priceMin}–$${gift.priceMax}`, whereToLook: gift.whereToLook,
      because: gift.sourceLoves.join(" + "), sourceLoves: gift.sourceLoves, kind: gift.kind,
      passedRules: [...input.refusals, ...(input.owned ? [input.owned] : [])],
      status: "shown" as const, category: gift.category, colours: gift.colours, brand: gift.brand, materials: gift.materials,
    })),
    fallback: true, filteredCount,
    diagnostics: {
      claudeCalls: Object.values(claude.calls).reduce((a, b) => a + b, 0),
      expansionCalls: claude.calls.expansion, refusalCalls: claude.calls.refusals,
      generationCalls: claude.calls.generation, criticCalls: claude.calls.critic,
      rounds, profileCacheHit: profile.hit, model: claude.model, helperModel: claude.helperModel,
    },
  };
}
